#!/bin/bash 
#set -o xtrace
WDLOOKUP="website_id_list.csv"
wikidatacachedir="./longcache"
ENTITY='https://www.wikidata.org/entity'
GPD="./graph-parts"
STATUSF="/tmp"
# Disable unicode.
LC_ALL=C
LANG=C

function prepare_pairings(){
    secondorder_pairings=("P127;Owned_by;Owner_of" \
                          "P355;Subsidary;Subsidary_of" \
                          "P1830;Owner_of;Owned_by" \
                          "P463;Member_of;Member" \
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
        printf '%s\n' "s/^\"${pairingx/;*/}:\\([^@:]*:\\)@/\"${pairingx/;*/}:\\1${pairingx/*;/}/g" >> $secondorderpatterns
    done
}

function ramcache(){
    if ! [[ -d "/mnt/tmpcache" ]]; then 
        sudo mkdir /mnt/tmpcache
        sudo mount -t ramfs -o size=4g ramfs /mnt/tmpcache
    fi
    printf "%s\n" "Ramcache on"

    printf "%s\n" "Copy wikidatacache"
    mkdir -p /mnt/tmpcache/wikidata
    rsync -ah $wikidatacachedir /mnt/tmpcache
    rsync -ah --info=progress2 $GPD /mnt/tmpcache
    printf "%s\n" "Copy lookups"
    STATUSF="/mnt/tmpcache"
    printf "%s\n" "Ramcache loaded"
    wikidatacachedir="/mnt/tmpcache/longcache"
    GPD="/mnt/tmpcache/graph-parts"
}


function wikiassociates(){
    local code=$1
    local temptilesmall=$(mktemp)
    local continue_going=0
    local templist=$(mktemp)

    [[ -s "$wikidatacachedir/$code.json" ]] || wget -qO $wikidatacachedir/$code.json "$ENTITY/$code" 
    printf '%s\n' "{\"nodes\":[" > $templist

    local STRING=""
    local COUNT=0
    local GROUP=("node")
    while read value; do
        [[ $COUNT == 0 ]] && STRING+="{ \"label\": \"${value//\"/\\\"}\"" 
        [[ $COUNT == 1 ]] && STRING+=",\"id\": \"$value\"" 
	    [[ $COUNT == 2 ]] && STRING+=",\"enwiki\": \"$value\"" && GROUP=()
        [[ $COUNT > 2 ]] && GROUP+=("$value")
        : $(( COUNT += 1 ))
    done < <(jq -r ".entities[] | .labels.en.value, .id, .sitelinks.enwiki.url, .claims.P31[].mainsnak.datavalue.value.id" $wikidatacachedir/$code.json 2>/dev/null)

    STRING+=",\"groups\": [$(sed -e "s/ /\",\"/g" -e "s/^/\"/g" -e "s/$/\"/g" <<<"${GROUP[@]}" )]}],"

    printf '%s\n' "$STRING\"links\":[ " >> $templist

    while read command; do 
        printf "%s\n" ${command/;*/} | sed -e "s/\"\([^:]*\):\([^:]*\):\([^:]*\)\"/{ \"source\": \"$code\", \"target\": \"\2\", \"type\": \"\3\" },/g" >> $templist
    done < <(jq -r ".entities[].claims | $(sed -e "s/ /, /g;s/P/.P/g" <<<"${secondorder_pairings[@]/;*/}") | select( . != null) | .[] | [ .mainsnak.property, .mainsnak.datavalue.value.id ]| @csv" $wikidatacachedir/$code.json \
        | sort -u  \
        | sed -e "s/\"\(P[0-9]*\)\",\"\(Q[0-9]*\)\"/\"\1:\2:@\";${code}/g;s/\"$//g" \
	    | sed -e "s/?/\//g" \
        | sed -f $secondorderpatterns \
	    | grep :)

    sed -i 's/http[s]*:\/\/en\.wikipedia\.org\/wiki\///g' $templist
    sed -i '$s/[,]*$/]}/' $templist
    cp $templist "$GPD/graph-${code}.json"
    printf '%s\n' '1' > $STATUSF/.status.$2.$3
    rm $temptilesmall $templist >/dev/null
}

lines_loop() {
    # Usage: lines_loop "file"
    local count=0
    while IFS= read -r _; do
        ((count++))
    done < "$1"
    printf '%s\n' "$count"
}

do_id(){
    local templister=$(mktemp)
    local templisterr
    printf '%s\n' "$1" > $templister
    rm $STATUSF/.status.$2.* -rf
    for i in {1..3}; do 
        [[ $DEBUG ]] && printf '%s\n' "$i loop"
	    templisterr=$(sort -u $templister | tr "\n" "@" | sed -e "s/\(Q[0-9]*\)@/${GPD//\//\\\/}\/graph-\1.json /g")
	    local numberOfIDs=$(lines_loop $templister)
        local place="1"
	    for ((j=1;j<=$numberOfIDs;j++)); do
            printf '%s\n' '0' > $STATUSF/.status.$2.$j
        done
        while read id; do 
	        [[ -s "$GPD/graph-${id}.json" ]] && printf '%s\n' '1' > $STATUSF/.status.$2.$place && : $(( place += 1 )) && continue
	        [[ $id == 'null' || $id == '' ]] && printf '%s\n' '1' > $STATUSF/.status.$2.$place && : $(( place += 1 )) && continue
            wikiassociates "$id" "$2" "$place" "append" & 
            : $(( place += 1))
        done < <(sort -u $templister)

    	if [[ -s "$STATUSF/.status.$2.1" ]]; then
		    while grep -q "0" <(cat $STATUSF/.status.$2.* | tr '\n' ' ' ) ; do sleep 0.1s; done
	    fi
    	jq -r ".links[].target" $templisterr >> $templister
	    sort -u -o $templister{,}
    done
    numberOfIDs=$(lines_loop $templister)
    place="1"
    templisterr=$(sort -u $templister | tr "\n" "@" | sed -e "s/\(Q[0-9]*\)@/${GPD//\//\\\/}\/graph-\1.json /g")
    for ((j=1;j<=$numberOfIDs;j++)); do
        printf '%s\n' '0' > $STATUSF/.status.$2.$j
    done
    while read id; do 
	    [[ -s "$GPD/graph-${id}.json" ]] && printf '%s\n' '1' > $STATUSF/.status.$2.$place && : $(( place += 1 )) && continue
	    [[ $id == 'null' || $id == '' ]] && printf '%s\n' '1' > $STATUSF/.status.$2.$place && : $(( place += 1 )) && continue
        wikiassociates "$id" "$2" "$place" &
        : $(( place += 1))
    done < <(sort -u $templister)

    if [[ -s "$STATUSF/.status.$2.1" ]]; then
		while grep -q "0" <(cat $STATUSF/.status.$2.* | tr '\n' ' ' ) ; do sleep 0.1s; done
	fi
    # jq -r ".links[].target" $templisterr >> $templister
    # jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add' $(sort -u $templister | tr "\n" "@" | sed -e "s/\(Q[0-9]*\)@/${GPD//\//\\\/}\/graph-\1.json /g" ) >/dev/null
    printf '%s\n' "0" > $STATUSF/.status.$2
    rm $templister >/dev/null
    printf '%s\n' "$2 ${lineno//:*/} of $IDLIST_LENGTH ($entry)"
}

function do_list(){
while read entry; do 
    local IDLIST_LENGTH=$(wc -l $1 | cut -d' ' -f1 )
    local lineno=$(grep -n "^$entry$" $1)
    do_id "${entry}" "$1" 
done < $1
}
DEBUG=
IDLIST=$(mktemp)

grep -o "Q[0-9]*\"" $WDLOOKUP | sort -u | sed -e "s/\"//g;/^Q$/d" > $IDLIST 

ramcache
prepare_pairings
rm $STATUSF/.status.* &>/dev/null
rm $STATUSF/.list.* &>/dev/null

split -l15000 $IDLIST .list.
for list in .list.*; do
    do_list $list &
done

wait
rm $STATUSF/.status.* .list.*
rm $secondorderpatterns >/dev/null

rsync -ah --info=progress2 $GPD .
