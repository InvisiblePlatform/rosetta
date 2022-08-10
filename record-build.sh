#!/bin/bash
#set -o xtrace
ENTITY='https://www.wikidata.org/entity'

function build_list(){
printf "Build list of websites\n"
websites=$(mktemp)
WDLOOKUP="wikidata/website_id_list.csv"
MBLOOKUP="mbfc/website_bias.csv"
BCLOOKUP="bcorp/website_stub_bcorp.csv"
GYLOOKUP="goodonyou/goodforyou_web_brandid.csv"
GDLOOKUP="glassdoor/website_glassdoorneo.list"
TSLOOKUP="tosdr/site_id.list"
wikidatacachedir="./wikidata/longcache"

cut -d, -f1 \
    $MBLOOKUP \
    $BCLOOKUP \
    $GDLOOKUP \
    $GYLOOKUP \
    $WDLOOKUP \
    > $websites

cat $websites | tr '[[:upper:]]' '[[:lower:]]' \
    | sed -e "s/www[0-9]*\.//g;s/?[^/]*$//g" \
    | sed -e "/\//d;s/\"//g;/^$/d" \
    | sort -u > websites.list
    rm $websites
}
build_list
function prepare_pairings(){
    pairings=("P127;Owned_by" \
              "P355;Subsidary" \
              "P170;Created_by" \
              "P50;Authored_by" \
              "P1037;Directed_By" \
              "P3320;Board_Member" \
              "P98;Edited_By" \
              "P5769;Editor-in-chief" \
              "P286;Head_coach" \
              "P488;Chaired_by" \
              "P112;Founded_by" \
              "P1431;Executive_Producer" \
              "P162;Produced_by" \
              "P1040;Film_Editor" \
              "P2554;Production_Designer" \
              "P1951;Invested_in_by" \
              "P371;Presented_by" \
              "P8324;Funded_by" \
              "P2652;Partnered_with" \
              "P749;Parent_organisation_of" \
              "P2652;Division" \
              "P123;Published_by" \
              "P749;Parent_Company" \
              "P1037;Directed_by")
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
    third_order_pairings=("P127;Owned_by;Owner_of" \
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
    
    firstorderpatterns=$(mktemp)
    secondorderpatterns=$(mktemp)
    thirdorderpatterns=$(mktemp)
    for pairingx in ${pairings[@]}; do
        echo s/^\"${pairingx/;*/}:\\\([^@:]*:\\\)@/\"${pairingx/;*/}:\\\1${pairingx/*;/}/g >> $firstorderpatterns
    done
    for pairingx in ${secondorder_pairings[@]}; do
        echo s/^\"${pairingx/;*/}:\\\([^@:]*:\\\)@/\"${pairingx/;*/}:\\\1${pairingx/*;/}/g >> $secondorderpatterns
    done
    for pairingx in ${third_order_pairings[@]}; do
        echo s/^\"${pairingx/;*/}:\\\([^@:]*:\\\)@/\"${pairingx/;*/}:\\\1${pairingx/*;/}/g >> $thirdorderpatterns
    done
}
function ramcache(){
    if ! [[ -d "/mnt/tmpcache" ]]; then 
        sudo mkdir /mnt/tmpcache
        sudo mount -t tmpfs -o size=8g tmpfs /mnt/tmpcache
    fi
    printf "%s\n" "Ramcache on"

    printf "%s\n" "Copy wikidatacache"
    cp -r $wikidatacachedir /mnt/tmpcache
    mkdir -p /mnt/tmpcache/wikidata /mnt/tmpcache/bcorp \
        /mnt/tmpcache/goodonyou /mnt/tmpcache/glassdoor /mnt/tmpcache/mbfc \
        /mnt/tmpcache/tosdr
    printf "%s\n" "Copy lookups"
    cp $WDLOOKUP /mnt/tmpcache/$WDLOOKUP
    cp $MBLOOKUP /mnt/tmpcache/$MBLOOKUP
    cp $BCLOOKUP /mnt/tmpcache/$BCLOOKUP
    cp $GYLOOKUP /mnt/tmpcache/$GYLOOKUP
    cp $GDLOOKUP /mnt/tmpcache/$GDLOOKUP
    cp $TSLOOKUP /mnt/tmpcache/$TSLOOKUP

    WDLOOKUP="/mnt/tmpcache/wikidata/website_id_list.csv"
    MBLOOKUP="/mnt/tmpcache/mbfc/website_bias.csv"
    BCLOOKUP="/mnt/tmpcache/bcorp/website_stub_bcorp.csv"
    GYLOOKUP="/mnt/tmpcache/goodonyou/goodforyou_web_brandid.csv"
    GDLOOKUP="/mnt/tmpcache/glassdoor/website-hq-size-type-revenue.csv"
    TSLOOKUP="/mnt/tmpcache/tosdr/site_id.list"
    printf "%s\n" "Ramcache loaded"
    wikidatacachedir="/mnt/tmpcache/longcache"
}
function check_data_header(){
    # needs to look up against wikidata to resolve other domains before commiting to the 
    # page
    local WIKIDATAID=$(grep "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")
    if ! [[ $WIKIDATAID ]]; then 
        while read code; do
            printf "%s\n" "$3: \"$code\"" >> hugo/content/${website//./}.md
        done< <(grep "\"$1\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
    fi
    for ID in ${WIKIDATAID}; do
        while read site; do
            if grep -q "\"$site\"" $2; then
                while read code; do
                    printf "%s\n" "$3: \"$code\"" >> hugo/content/${website//./}.md
                done< <(grep "\"$site\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
            fi
        done < <(grep "\"$ID\"" $WDLOOKUP | cut -d, -f1 | sed -e "s/ //g;s/\"//g" | sort -u)
    done
}
function check_stub(){
    if ! grep -q "\"$1\"" $2; then return; fi
    # needs to look up against wikidata to resolve other domains before commiting to the 
    # page
    local WIKIDATAID=$(grep "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")
    if ! [[ $WIKIDATAID ]]; then 
        while read code; do
            printf "%s\n" "{{< $3 gid=\"$code\" >}}" >> hugo/content/${website//./}.md
        done< <(grep "\"$1\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
    fi
    for ID in ${WIKIDATAID}; do
        while read site; do
            if grep -q "\"$site\"" $2; then
                while read code; do
                    printf "%s\n" "{{< $3 gid=\"${code}\" >}}" >> hugo/content/${website//./}.md
                done< <(grep "\"$site\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
            fi
        done < <(grep "\"$ID\"" $WDLOOKUP | cut -d, -f1 | sed -e "s/ //g;s/\"//g" | sort -u)
    done
}
function check_wikidata(){
    if ! grep -q "\"$1\"" $2; then return; fi
    while read code; do
        printf "%s\n" "{{< wikidata $(cut -d/ -f4 <<< "$2") code=\"$code\" >}}" >> hugo/content/${website//./}.md
        # look_for_wikipedia_page $code
    done< <(grep "\"$1\"" $2 | grep -o "Q[0-9]*")
}
function add_values_from_wikidata(){
    local tempfile=$(mktemp)
    while read WIKIDATAID; do
        if ! [[ -s "$wikidatacachedir/$code.json" ]]; then
             wget -qO $wikidatacachedir/$code.json "$ENTITY/$code" 
        fi
        while read site; do
            if grep -q "\"$site\"" $2; then
               jq -r .entities[].claims.$4[].mainsnak.datavalue.value.id $wikidatacachedir/$site.json 2>/dev/null | sort -u \
                   | sed -e "s/^\(.*\)$/\"\1\;$4\;$site\"/g" >> $tempfile
            fi
        done < <(grep "\"$WIKIDATAID\"" $WDLOOKUP | grep -o "Q[0-9]*")
    done < <(grep "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")
    if [[ -s $tempfile ]]; then 
        local value=$(sort -u $tempfile | tr '\n' ',' | sed -e "s/,$/]/g;s/^/[/g")
        printf "%s\n" "$3: $value" >> hugo/content/${website//./}.md
    fi
    rm $tempfile
}
function esg_via_yahoo_via_wikidata(){
    local tempfile=$(mktemp)
    # https://query2.finance.yahoo.com/v10/finance/quoteSummary/NFLX?modules=esgScores
    #     jq -r .entities[].claims.P414[].qualifiers.P249[].datavalue.value ../../wikidata/longcache/$file 2>/dev/null| head -1 >> ../tickerlist
    while read WIKIDATAID; do
        if ! [[ -s "$wikidatacachedir/$code.json" ]]; then
             wget -qO $wikidatacachedir/$code.json "$ENTITY/$code" 
        fi
        while read site; do
            if grep -q "\"$site\"" $2; then
                jq -r .entities[].claims.P414[].qualifiers.P249[].datavalue.value \
                $(grep "\"$site\"" $2 | grep -o "Q[0-9]*" | sort -u | sed -e "s@\(Q[0-9]*\)@$wikidatacachedir/\1.json @g") \
                    2>/dev/null | sed -e "s/^/\"/g;s/$/\"/g">> $tempfile
            fi
        done < <(grep "\"$WIKIDATAID\"" $WDLOOKUP | grep -o "Q[0-9]*")
    done < <(grep "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")
    if [[ -s $tempfile ]]; then 
        local value=$(sort -u $tempfile | tr '\n' ',' | sed -e "s/,$/]/g;s/^/[/g")
        printf "%s\n" "ticker: $value" >> hugo/content/${website//./}.md
    fi
    rm $tempfile
}
function isin_via_wikidata(){
    local tempfile=$(mktemp)
    while read WIKIDATAID; do
        if ! [[ -s "$wikidatacachedir/$code.json" ]]; then
             wget -qO $wikidatacachedir/$code.json "$ENTITY/$code" 
        fi
        while read site; do
            if grep -q "\"$site\"" $2; then
                jq -r .entities[].claims.P946[].mainsnak.datavalue.value \
                $(grep "\"$site\"" $2 | grep -o "Q[0-9]*" | sort -u | sed -e "s@\(Q[0-9]*\)@$wikidatacachedir/\1.json @g") \
                    2>/dev/null >> $tempfile
                while read isin; do
                    while read file; do
                        printf "%s\n" "{{< isin file=\"$file\" id=\"$isin\" >}}" >> hugo/content/${website//./}.md
                    done < <(rg $isin static/*.json | cut -d: -f1)
                done < <(sort -u $tempfile | sed -e "s/null//g")
            fi
        done < <(grep "\"$WIKIDATAID\"" $WDLOOKUP | grep -o "Q[0-9]*")
    done < <(grep "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")
    rm $tempfile
}
function check_data_bcorp(){
    if ! grep -q "\"$1\"" $2; then return; fi
    # needs to look up against wikidata to resolve other domains before commiting to the 
    # page
    local WIKIDATAID=$(grep "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")
    if ! [[ $WIKIDATAID ]]; then 
        while read code; do
             RATING=$(yq -r .latestVerifiedScore bcorp/split_files/bcorp_${code}.json)
             printf "%s\n" "bcorp_rating: $RATING" >> hugo/content/${website//./}.md
        done < <(grep "\"$1\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
    fi
    for ID in ${WIKIDATAID}; do
        while read site; do
            if grep -q "\"$site\"" $2; then
                while read code; do
                    RATING=$(yq -r .latestVerifiedScore bcorp/split_files/bcorp_${code}.json)
                    printf "%s\n" "bcorp_rating: $RATING" >> hugo/content/${website//./}.md
                done< <(grep "\"$site\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
            fi
        done < <(grep "\"$ID\"" $WDLOOKUP | cut -d, -f1 | sed -e "s/ //g;s/\"//g" | sort -u)
    done
}
function check_data_glassdoor(){
    if ! grep -q "\"$1\"" $2; then return; fi
    # needs to look up against wikidata to resolve other domains before commiting to the 
    # page
    local WIKIDATAID=$(grep "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")
    if ! [[ $WIKIDATAID ]]; then 
        while read code; do
            RATING=$(yq -r .glasroom_rating.ratingValue glassdoor/data_json/${code}.json)
            printf "%s\n" "glassdoor_rating: $RATING" >> hugo/content/${website//./}.md
        done < <(grep "\"$1\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
    fi
    for ID in ${WIKIDATAID}; do
        while read site; do
            if grep -q "\"$site\"" $2; then
                while read code; do
                    RATING=$(yq -r .glasroom_rating.ratingValue glassdoor/data_json/${code}.json)
                    printf "%s\n" "glassdoor_rating: $RATING" >> hugo/content/${website//./}.md
                done< <(grep "\"$site\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
            fi
        done < <(grep "\"$ID\"" $WDLOOKUP | cut -d, -f1 | sed -e "s/ //g;s/\"//g" | sort -u)
    done
}
function look_for_wikipedia_page(){
   local code=$1 
   if ! [[ $code ]]; then return; fi
   if [[ $code == "null" ]]; then return; fi
   if ! [[ -s "$wikidatacachedir/$code.json" ]]; then
        wget -qO $wikidatacachedir/$code.json "$ENTITY/$code" 
   fi
   local wikipage=$(jq .entities[].sitelinks.enwiki.url $wikidatacachedir/$code.json | cut -d/ -f5- | sed -e 's/"//g' | sed -e's@/@%2F@g')

   if [[ $wikipage == "null" ]]; then return; fi
   if egrep -q "^$wikipage$" nowikipage.list; then return; fi

   if [[ -s "wikipedia/pages/$wikipage.md" ]]; then
        #printf "%s\n" "$wikipage" >> wikipage.list
        printf "%s\n" "{{< wikipedia \"$wikipage\" "$1" "$2" ${3//@/ }>}}" >> hugo/content/${website//./}.md
   else
    if [[ $wikipage && $wikipage != 'null' ]]; then
     if ! [[ -s "wikipedia/pages/$wikipage.md" ]]; then
         python3 wikipedia/wikipedia_criticism.py "wikipedia/sorted_counted_list_of_sections.csv" "${wikipage}" > wikipedia/pages/$wikipage.md
         #printf "%s\n" "$wikipage" >> wikipage.list
         if [[ -s "wikipedia/pages/$wikipage.md" ]]; then
             printf "%s\n" "{{< wikipedia \"$wikipage\" "$1" "$2" ${3//@/ }>}}" >> hugo/content/${website//./}.md
         else
             printf "%s\n" "$wikipage" >> nowikipage.list
         fi
     fi
    fi
   fi
}
function check_tosdr(){
    if ! grep -q "\"$1\"" $2; then return; fi
    ID=$(grep -m1 "\"$1\"" $2 | cut -d, -f2)
    printf "%s\n" "tosdr: \"$ID\" " >> hugo/content/${website//./}.md
}
function owned_wikiassociates(){
    if ! grep -q "\"$1\"" $2; then return; fi
    local temptilesmall=$(mktemp)
    local templist=$(mktemp)

    local continue_going=0
    while read code; do # Main Company
        if ! [[ -s "$wikidatacachedir/$code.json" ]]; then
             wget -qO $wikidatacachedir/$code.json "$ENTITY/$code" 
        fi
        while read command; do 
            printf "%s\n" ${command/;*/} >> ${command/*;/}
            [[ $continue_going == 0 ]] && continue_going=1
        done < <(jq -r ".entities[].claims | $(sed -e "s/ /, /g;s/P/.P/g" <<<"${pairings[@]/;*/}") | select( . != null) | .[] | [.mainsnak.property, .mainsnak.datavalue.value.id ]| @csv" $wikidatacachedir/$code.json | sort -u  | sed -e "s/\"\(P[0-9]*\)\",\"\(Q[0-9]*\)\"/\"\1:\2:@:1\";${temptilesmall//\//?}_${code}/g;s/\"$//g" | sed -e "s/?/\//g" | sed -f $firstorderpatterns| grep ":"| sed -e "s/\"//g")
    done< <(grep "\"$1\"" $2 | grep -o "Q[0-9]*")

    [[ $continue_going == 0 ]] && rm $temptilesmall && return 

    while read line; do # important companies to main
        if ! [[ -s "$wikidatacachedir/$line.json" ]]; then
             wget -qO $wikidatacachedir/$line.json "$ENTITY/$line" 
        fi
        while read command; do 
            printf "%s\n" ${command/;*/} >> ${command/*;/}
        done < <(jq -r ".entities[].claims | $(sed -e "s/ /, /g;s/P/.P/g" <<<"${secondorder_pairings[@]/;*/}") | select( . != null) | .[] | [.mainsnak.property, .mainsnak.datavalue.value.id ]| @csv" $wikidatacachedir/$line.json | sort -u  | sed -e "s/\",\"/:$line:@:2\";${temptilesmall//\//?}_/g;s/\"$//g" | sed -e "s/?/\//g" | sed -f $secondorderpatterns | grep ":"| sed -e "s/\"//g")
    done < <(egrep ":1" ${temptilesmall}_* | sed -e "s/^.*:\(Q[0-9]*\):.*/\1/g")

    while read relation; do # important companies to main
        if ! [[ -s "$wikidatacachedir/$relation.json" ]]; then
             wget -qO $wikidatacachedir/$relation.json "$ENTITY/$relation" 
        fi
        while read command; do 
            printf "%s\n" ${command/;*/} >> ${command/*;/}
    done < <(jq -r ".entities[].claims | $(sed -e "s/ /, /g;s/P/.P/g" <<<"${third_order_pairings[@]/;*/}") | select( . != null) | .[] | [.mainsnak.property, .mainsnak.datavalue.value.id ]| @csv" $wikidatacachedir/$relation.json | sort -u  | sed -e "s/\",\"/:$relation:@:2\";${temptilesmall//\//?}_/g;s/\"$//g" | sed -e "s/?/\//g" | sed -f $thirdorderpatterns | grep ":"| sed -e "s/\"//g")
    done < <(egrep ":2" ${temptilesmall}_* | sed -e "s/^.*\(Q[0-9]*\):.*/\1/g")

    printf '%s\n' "{\"links\":[" > $templist
    while read relation; do 
        : $(( relationco -= 1))
        local RELATION_ID=$(sed -e 's/[^_]*_//g' <<< "$relation")
        local oneline=$(sort -u $relation | sed -e "s/$/\"/g;s/^/\"/g" -e "s/P[0-9]*://g" -e "s/:[12]//g" | sed -e "s/:/,type:/g")
        if grep -q ":1" "$relation"; then
            look_for_wikipedia_page "${RELATION_ID}" "1" 
        else 
            look_for_wikipedia_page "${RELATION_ID}" "2" 
        fi
        for i in $oneline; do echo $i | xargs -I@ printf '%s\n' "{ \"source\":\"$RELATION_ID\", \"target\":\"@\" }," | sed -e "s/,type:/\", \"type\":\"/g" >> $templist; done
    done < <(ls -1 ${temptilesmall}_* 2>/dev/null| sed -e "/_null/d")
    sed -i '$s/,$//' $templist
    printf '%s\n' "],\"nodes\":[" >> $templist

    grep -o "Q[0-9]*" $templist > $temptilesmall
    while read code; do 
        if ! [[ -s "$wikidatacachedir/$code.json" ]]; then
             wget -qO $wikidatacachedir/$code.json "$ENTITY/$code" 
        fi
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
        if [[ $GROUP != "null" ]]; then
            STRING+=",\"groups\": [$(echo ${GROUP[@]} | sed -e "s/ /\",\"/g" -e "s/^/\"/g" -e "s/$/\"/g")]},"
        else
            STRING+=",\"groups\": [\"node\"]},"
        fi
        printf '%s\n' "$STRING" >> $templist
    done < <(sort -u $temptilesmall)
    sed -i '$s/,$//' $templist
    sed -i 's/http[s]*:\/\/en\.wikipedia\.org\/wiki\///g' $templist
    printf '%s\n' "]}" >> $templist

    cp $templist hugo/static/connections/${website//\./}.json
    rm ${temptilesmall}_* ${temptilesmall} ${templist} 2>/dev/null
}
function reorder_wikipedia(){
    local page="$1"
    local wikipedia_tempfile=$(mktemp)
    grep -e "^{{< wikipedia" $page | sort -k 5 > $wikipedia_tempfile
    sed -i "/^{{< wikipedia/d" $page
    cat $wikipedia_tempfile >> $page
    rm $wikipedia_tempfile
}
function do_record(){
    local resort=$(mktemp)
    local website="$1"
    printf "%s\n" "---" > hugo/content/${website//./}.md
    printf "%s\n" "title: \"$website\"" >> hugo/content/${website//./}.md
    printf "%s\n" "date: $DATENOW" >> hugo/content/${website//./}.md
    printf "%s\n" "---" >> hugo/content/${website//./}.md

    check_tosdr "$website" "$TSLOOKUP" "tosdr"
    check_data_header "$website" "$MBLOOKUP" "mbfc"
    check_data_header "$website" "$BCLOOKUP" "bcorp"
    check_data_header "$website" "$GYLOOKUP" "goodonyou"
    check_data_header "$website" "$GDLOOKUP" "glassdoor"
    isin_via_wikidata "$website" "$WDLOOKUP" "isin"
    esg_via_yahoo_via_wikidata "$website" "$WDLOOKUP" "yesg"
    # check_wikidata "$website" "$WDLOOKUP" "w"
    owned_wikiassociates "$website" "$WDLOOKUP"

    add_values_from_wikidata "$website" "$WDLOOKUP" "polalignment" "P1387"
    add_values_from_wikidata "$website" "$WDLOOKUP" "polideology" "P1142"
    check_data_glassdoor "$website" "$GDLOOKUP"
    check_data_bcorp "$website" "$BCLOOKUP"
    if [[ -s "hugo/static/connections/${website//./}.json" ]]; then
        printf "%s\n" "connections: \"/connections/${website//./}.json\"" >> hugo/content/${website//./}.md
    fi

    LC_COLLATE=C sort -u hugo/content/${website//./}.md \
        | sed "0,/{/{s/^{/---\n{/}" > $resort
    cp $resort hugo/content/${website//./}.md

    printf "%s\n" "---" >> hugo/content/${website//./}.md
    sed -i '/^---/{x;s/^/n/;/^n\{3\}$/{x;d};x}' hugo/content/${website//./}.md

    reorder_wikipedia "hugo/content/${website//./}.md"

    # jq . hugo/static/connections/${website//./}.json
    # cat hugo/content/${website//./}.md
    printf "%s\n" "$website"
    printf "%s\n" "$BASHPID" >> $pids_done
}

rm hugo/content/ -rf
mkdir -p hugo/content
DATENOW=$(date +%s)
count=0
# ramcache
prepare_pairings

# Make a stack of 8 procs that we count and add too if lower than that amount
# each coproc removes inself from the stack when it finishes
pids=$(mktemp -t pidslistrecord.XXXXXXX)
pids_done=$(mktemp -t pids_donelistrecord.XXXXXXX)
while read website; do
    do_record "${website}" &
    lastpid=$!
    printf "%s\n" "$lastpid" >> $pids
    until [[ "$(sort $pids $pids_done | uniq -u | wc -l)" -lt "25" ]]; do
        printf "%s\n" "######################## waiting $count"
        if [[ "$count" -gt "10" ]]; then
            sleep 5s
            sort $pids $pids_done | uniq -u
            printf "%s\n" "" > $pids
            printf "%s\n" "" > $pids_done
        fi
        : $(( count += 1))
        sleep 1
    done
    count=0
done < <(grep "^" websites.list )
rm $pids
wait
exit 0

