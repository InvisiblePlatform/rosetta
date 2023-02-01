#!/bin/bash 
#set -o xtrace
WDLOOKUP="website_id_list.csv"
wikidatacachedir="./longcache"
ENTITY='https://www.wikidata.org/entity'
GPD="./graph-parts"
function prepare_pairings(){
    secondorder_pairings=("P127;Owned_by;Owner_of" \
                          "P355;Subsidary;Subsidary_of" \
                          "P170;Created_by;Creator_of" \
                          "P50;Authored_by;Author_of" \
                          "P1037;Directed_By;Director_of" \
                          "P3320;Board_Member;Board_Member_of" \
                          "P98;Edited_By;Editor_of" \
                          "P5769;Editor-in-chief;Editor-in-chief_of" \
                          "P286;Head_coach;Head_coach_of" \
                          "P488;Chaired_by;Chairperson_of" \
                          "P112;Founded_by;Founder_of" \
                          "P1431;Executive_Producer;Executive_Producer_of" \
                          "P162;Produced_by;Producer_of" \
                          "P1040;Film_Editor;Film_Editor_of" \
                          "P2554;Production_Designer;Production_Designer_of" \
                          "P1951;Invested_in_by;Invested_in" \
                          "P371;Presented_by;Presentor_of" \
                          "P8324;Funded_by;Funder_of" \
                          "P2652;Partnered_with;Partnered_with" \
                          "P749;Parent_organisation_of;Parent_organisation" \
                          "P2652;Division;Division_of" \
                          "P123;Published_by;Publisher_of" \
                          "P749;Parent_Company;Parent_Company_of" \
                          "P1037;Directed_by;Director_of")
    secondorderpatterns=$(mktemp)
    for pairingx in ${secondorder_pairings[@]}; do
        echo s/^\"${pairingx/;*/}:\\\([^@:]*:\\\)@/\"${pairingx/;*/}:\\\1${pairingx/*;/}/g >> $secondorderpatterns
    done
}

function ramcache(){
    if ! [[ -d "/mnt/tmpcache" ]]; then 
        sudo mkdir /mnt/tmpcache
        sudo mount -t tmpfs -o size=8g tmpfs /mnt/tmpcache
    fi
    printf "%s\n" "Ramcache on"

    printf "%s\n" "Copy wikidatacache"
    mkdir -p /mnt/tmpcache/wikidata
    rsync -ah $wikidatacachedir /mnt/tmpcache
    rsync -ah --info=progress2 $GPD /mnt/tmpcache
    printf "%s\n" "Copy lookups"
    cp $WDLOOKUP /mnt/tmpcache/$WDLOOKUP

    WDLOOKUP="/mnt/tmpcache/wikidata/website_id_list.csv"
    printf "%s\n" "Ramcache loaded"
    wikidatacachedir="/mnt/tmpcache/longcache"
    GPD="/mnt/tmpcache/graph-parts"
}


function wikiassociates(){
    #if ! grep -q "\"$1\"" $WDLOOKUP; then return; fi

    local code=$1
    local temptilesmall=$(mktemp)
    local continue_going=0
    local templist=$(mktemp)

    if ! [[ -s "$wikidatacachedir/$code.json" ]]; then
         wget -qO $wikidatacachedir/$code.json "$ENTITY/$code" 
    fi
    printf '%s\n' "{\"nodes\":[" >$templist
    # { "label": "Marui Group","id": "Q11368019","enwiki": "null","groups": ["Q4830453"]},
    local STRING=""
    local COUNT=0
    local GROUP=()
    while read value; do
        [[ $COUNT == 0 ]] && STRING+="{ \"label\": \"$value\"" 
        [[ $COUNT == 1 ]] && STRING+=",\"id\": \"$value\"" 
        [[ $COUNT == 2 ]] && STRING+=",\"enwiki\": \"$value\"" 
        [[ $COUNT > 2 ]] && GROUP+=("$value")
        : $(( COUNT += 1 ))
    done < <(jq -r ".entities[] | .labels.en.value, .id, .sitelinks.enwiki.url, .claims.P31[].mainsnak.datavalue.value.id" $wikidatacachedir/$code.json 2>/dev/null)

    if [[ $GROUP != "" ]]; then
        STRING+=",\"groups\": [$(printf '%s\n' "${GROUP[@]}" | sed -e "s/ /\",\"/g" -e "s/^/\"/g" -e "s/$/\"/g")]}]," >> $templist
    else
        STRING+=",\"groups\": [\"node\"]}]," >> $templist
    fi
    printf '%s\n' "$STRING">> $templist
    printf '%s\n' "\"links\":[ " >> $templist

    # { "source":"Q6777917", "target":"Q11368019", "type":"Parent_organisation_of" }
    while read command; do 
        printf "%s\n" ${command/;*/} | sed -e 's/\([^:]*\):\([^:]*\):\([^:]*\):\([^:]*\)/{ "source":"\1", "target":"\3", "type":"\4" },/g' >>$templist
    done < <(jq -r ".entities[].claims | $(sed -e "s/ /, /g;s/P/.P/g" <<<"${secondorder_pairings[@]/;*/}") | select( . != null) | .[] | [ .mainsnak.property, .mainsnak.datavalue.value.id ]| @csv" $wikidatacachedir/$code.json \
        | sort -u  \
        | sed -e "s/\"\(P[0-9]*\)\",\"\(Q[0-9]*\)\"/\"\1:\2:@\";${temptilesmall//\//?}_${code}/g;s/\"$//g" \
        | sed -e "s/?/\//g" \
        | sed -f $secondorderpatterns \
        | grep ":" \
        | sed -e "s/\"//g;s/^/${code}:/g")

    sed -i '$s/,$//' $templist
    printf '%s\n' "]}" >> $templist

    sed -i 's/http[s]*:\/\/en\.wikipedia\.org\/wiki\///g' $templist
    cp $templist $GPD/graph-$code.json
    [[ $4 == "append" ]] && jq -r .links[].target $GPD/graph-${code}.json >> $templister
    printf '%s\n' '1' > /tmp/.status.$2.$3
rm $temptilesmall $templist
return
}

do_id(){
    local templister=$(mktemp)
    local complete 
    printf '%s\n' "$1" > $templister
    local keepgoing="keep on it"
    for i in $(seq 1 3); do 
        [[ $DEBUG ]] && printf '%s\n' "$i loop"
        local numberOfIDs=$(sort -u $templister | sed -e "/^$/d" | wc -l | cut -d' ' -f1)
        local place="1"
        for j in $(seq 1 $numberOfIDs ); do
            printf '%s\n' '0' > /tmp/.status.$2.$j
        done
        while read id; do 
            if ! [[ -s $GPD/graph-${id}.json ]]; then 
                [[ $DEBUG ]] && printf '%s\n' "building $id"
                wikiassociates "$id" "$2" "$place" "append" &
            else 
                [[ $DEBUG ]] && printf '%s\n' "printing $id"
                jq -r .links[].target $GPD/graph-${id}.json >> $templister
                printf '%s\n' '1' > /tmp/.status.$2.$place

            fi
            : $(( place += 1))
        done < <(sort -u $templister | sed -e "/^$/d")
        keepgoing="keep on it"
        while [[ "$keepgoing" = "keep on it" ]]; do
            keepgoing="can we go"
            for j in $(seq 1 $numberOfIDs ); do
                if [[ $(cat /tmp/.status.$2.$j) = 0 ]]; then
                    keepgoing="keep on it"
                fi
            done
            sleep .1s
        done
    done
    numberOfIDs=$(sort -u $templister | sed -e "/^$/d" | wc -l | cut -d' ' -f1)
    place="1"
    for j in $(seq 1 $numberOfIDs ); do
        printf '%s\n' '0' > /tmp/.status.$2.$j
    done
    while read id; do 
        if ! [[ -s $GPD/graph-${id}.json ]]; then 
            [[ $DEBUG ]] && printf '%s\n' "building $id"
            wikiassociates "$id" "$2" "$place" &
        else 
            printf '%s\n' '1' > /tmp/.status.$2.$place
        fi
        : $(( place += 1))
    done < <(sort -u $templister | sed -e "/^$/d")

    keepgoing="keep on it"
    while [[ "$keepgoing" = "keep on it" ]]; do
        keepgoing="can we go"
        for j in $(seq 1 $numberOfIDs ); do
            if [[ $(cat /tmp/.status.$2.$j) = 0 ]]; then
                keepgoing="keep on it"
            fi
        done
        sleep .1s
    done
    #jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add' \
    #    $(sort -u $templister | tr "\n" "@" | sed -e "s/\(Q[0-9]*\)@/${GPD}\/graph-\1.json /g" ) >/dev/null
    printf '%s\n' "0" > /tmp/.status.$2
    rm $templister $complete $completing
}

DEBUG=
IDLIST=$(mktemp)

grep -o "Q[0-9]*\"" $WDLOOKUP | sort -u | sed -e "s/\"//g;/^Q$/d" > $IDLIST 
IDLIST_LENGTH=$(cat $IDLIST | wc -l | cut -d' ' -f1 )

ramcache
prepare_pairings
let concurrent
for i in $(seq 0 10); do 
    printf '%s\n' "0" > /tmp/.status.$i
done
while read entry; do 
    concurrentVal="bob"
    while [[ "$concurrentVal" = "bob" ]]; do 
    for i in $(seq 0 10); do 
        if [[ $(cat /tmp/.status.$i) == 0 ]]; then
            printf '%s\n' "1" > /tmp/.status.$i
            concurrentVal=$i
            break
        fi
    done
    done
    lineno=$(grep -n "^$entry$" $IDLIST | cut -d: -f1) 
    printf '%s\n' "$lineno of $IDLIST_LENGTH $(( (lineno / IDLIST_LENGTH) * 100 ))% ($entry) ($concurrentVal)"
    do_id "${entry}" "$concurrentVal" & 
done < $IDLIST
for i in $(seq 0 10); do 
    rm /tmp/.status.$i
done


rm $secondorderpatterns 

