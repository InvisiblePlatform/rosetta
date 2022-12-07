#!/bin/bash
#set -o xtrace
ENTITY='https://www.wikidata.org/entity'
export LC_ALL=C

function build_list(){
printf "Build list of websites\n"
WDLOOKUP="wikidata/website_id_list.csv"
MBLOOKUP="mbfc/website_bias.csv"
BCLOOKUP="bcorp/website_stub_bcorp.csv"
GYLOOKUP="goodonyou/goodforyou_web_brandid.csv"
GDLOOKUP="glassdoor/website_glassdoorneo.list"
TSLOOKUP="tosdr/site_id.list"
WPLOOKUP="wikipedia/wikititle_webpage_id_filtered.csv"
wikidatacachedir="./wikidata/longcache"
GPD="wikidata/graph-parts"
STATUSF="/mnt/tmpcache"

cut -d, -f1 \
    $MBLOOKUP \
    $BCLOOKUP \
    $GDLOOKUP \
    $GYLOOKUP \
    $WDLOOKUP \
    $WPLOOKUP \
    | tr '[[:upper:]]' '[[:lower:]]' \
    | sed -e "s/www[0-9]*\.//g;s/?[^/]*$//g" \
    | sed -e "/\//d;s/\"//g;/^$/d" \
    | sort -u > websites.list
}

ISINFILES=( 
"static/2022-January_Just-Transition-Assessment_Datasheet_JustTransitionData.json"
"static/2022-January_Just-Transition-Assessment_Datasheet_SocialData.json"
"static/Food-and-Agriculture-Benchmark-detailed-scoring-sheet-2021-2.json"
"static/imbc_chartdata.json"
"static/WBA_Social_Transformation_Baseline_Data_JAN_2022_overall_scores.json"
)

build_list
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

    secondorderpatterns=""
    for pairingx in ${secondorder_pairings[@]}; do
        secondorderpatterns+="s/^\"${pairingx/;*/}:\\([^@:]*:\\)@/\"${pairingx/;*/}:\\1${pairingx/*;/}/g;"
    done
    secondorderpatterns+="s/?/\//g"
    precomp2ndorder=$(sed -e "s/ /, /g;s/P/.P/g" <<<"${secondorder_pairings[@]/;*/}") 
}
function ramcache(){
    if ! [[ -d "/mnt/tmpcache" ]]; then 
        sudo mkdir /mnt/tmpcache
        sudo mount -t tmpfs -o size=20g tmpfs /mnt/tmpcache
    fi
    sudo chown orange:orange /mnt/tmpcache
    printf "%s\n" "Ramcache on"

    printf "%s\n" "Copy wikidatacache"
    rsync --info=progress2 -ah $wikidatacachedir /mnt/tmpcache
    rsync -ah --info=progress2 $GPD /mnt/tmpcache
    mkdir -p /mnt/tmpcache/wikidata /mnt/tmpcache/bcorp \
        /mnt/tmpcache/goodonyou /mnt/tmpcache/glassdoor /mnt/tmpcache/mbfc \
        /mnt/tmpcache/tosdr /mnt/tmpcache/graph-parts /mnt/tmpcache/wikipedia
    printf "%s\n" "Copy lookups"
    cp $WDLOOKUP /mnt/tmpcache/$WDLOOKUP
    cp $MBLOOKUP /mnt/tmpcache/$MBLOOKUP
    cp $BCLOOKUP /mnt/tmpcache/$BCLOOKUP
    cp $GYLOOKUP /mnt/tmpcache/$GYLOOKUP
    cp $GDLOOKUP /mnt/tmpcache/$GDLOOKUP
    cp $TSLOOKUP /mnt/tmpcache/$TSLOOKUP
    cat $WPLOOKUP >> /mnt/tmpcache/$WDLOOKUP

    WPLOOKUP="/mnt/tmpcache/wikipedia/wikititle_webpage_id_filtered.csv"
    WDLOOKUP="/mnt/tmpcache/wikidata/website_id_list.csv"
    MBLOOKUP="/mnt/tmpcache/mbfc/website_bias.csv"
    BCLOOKUP="/mnt/tmpcache/bcorp/website_stub_bcorp.csv"
    GYLOOKUP="/mnt/tmpcache/goodonyou/goodforyou_web_brandid.csv"
    GDLOOKUP="/mnt/tmpcache/glassdoor/website_glassdoorneo.list"
    TSLOOKUP="/mnt/tmpcache/tosdr/site_id.list"
    printf "%s\n" "Ramcache loaded"
    wikidatacachedir="/mnt/tmpcache/longcache"
    GPD="/mnt/tmpcache/graph-parts"
}
function wikidatagetck(){
    [[ -s "$wikidatacachedir/$1.json" ]] && return
    wget -qO $wikidatacachedir/$1.json "$ENTITY/$1" 
}
function file_to_array(){
    # $1 - file in
    # $2 - key
    # $3 - outputfile
    [[ -s $1 ]] || return
    local value=$(sort -u $tempfile | tr '\n' ',')
    printf "%s\n" "$2: [${value%,*}]" >> $3
    
}
function lines_loop() {
    # Usage: lines_loop "file"
    local count=0
    while IFS= read -r _; do
        ((count++))
    done < "$1"
    printf '%s\n' "$count"
}
function remove_array_dups() {
    # Usage: remove_array_dups "array"
    declare -A tmp_array

    for i in "$@"; do
        [[ $i ]] && IFS=" " tmp_array["${i:- }"]=1
    done

    printf '%s ' "${!tmp_array[@]}"
}
function check_data_header(){
    local OUT=""
    while read code; do
        unset OUT; OUT=${code//\"/}; OUT=${OUT//*,/}
        printf "%s\n" "$3: \"$OUT\"" >> hugo/content/${website//./}.md
        printf "%s\n" "$3_source: \"$1\"" >> hugo/content/${website//./}.md
    done< <(grep -i "\"$1\"" $2)
    # done< <(grep -i "\"$1\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
}
function add_values_from_wikidata(){
    local tempfile=$(mktemp)
    while read WIKIDATAID; do
        wikidatagetck $WIKIDATAID
        jq ".entities[].claims.$4[].mainsnak.datavalue.value | \"\(.);$4;$WIKIDATAID\"" \
            $wikidatacachedir/$WIKIDATAID.json 2>/dev/null >> $tempfile
    done < <(grep -i "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")

    file_to_array "$tempfile" "$3" "hugo/content/${website//./}.md"
    rm $tempfile
}
function add_values_from_wikidata_id(){
    local tempfile=$(mktemp)
    while read WIKIDATAID; do
        wikidatagetck $WIKIDATAID
        jq ".entities[].claims.$4[].mainsnak.datavalue.value.id | \"\(.);$4;$WIKIDATAID\"" \
            $wikidatacachedir/$WIKIDATAID.json 2>/dev/null >> $tempfile
    done < <(grep -i "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")

    file_to_array "$tempfile" "$3" "hugo/content/${website//./}.md"
    rm $tempfile
}
function esg_via_yahoo_via_wikidata(){
    local tempfile=$(mktemp)
    # https://query2.finance.yahoo.com/v10/finance/quoteSummary/NFLX?modules=esgScores
    #     jq -r .entities[].claims.P414[].qualifiers.P249[].datavalue.value ../../wikidata/longcache/$file 2>/dev/null| head -1 >> ../tickerlist

    while read WIKIDATAID; do
        wikidatagetck $WIKIDATAID
        jq -r .entities[].claims.P414[].qualifiers.P249[].datavalue.value \
        $(grep "\"$WIKIDATAID\"" $2 | grep -o "Q[0-9]*" | sort -u | sed -e "s@\(Q[0-9]*\)@$wikidatacachedir/\1.json @g") \
            2>/dev/null >> $tempfile
    done < <(grep -i "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")

    file_to_array "$tempfile" "ticker" "hugo/content/${website//./}.md"
    rm $tempfile
}
function wikidata_id(){
    if ! grep -i -q "\"$1\"" $2; then return; fi
    local tempfile=$(mktemp)
    while read WIKIDATAID; do
        wikidatagetck $WIKIDATAID
        printf '%s\n' "\"$WIKIDATAID\"" >> $tempfile
    done < <(grep -i "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")
    file_to_array "$tempfile" "wikidata_id" "hugo/content/${website//./}.md"
    rm $tempfile
}
function isin_via_wikidata(){
    if ! grep -i -q "\"$1\"" $2; then return; fi
    local tempfile=$(mktemp)
    while read WIKIDATAID; do
        isin=$(jq -r .entities[].claims.P946[].mainsnak.datavalue.value $wikidatacachedir/$WIKIDATAID.json 2>/dev/null)
        wikidatagetck $WIKIDATAID
        grep -o $isin ${ISINFILES[@]} | sed -e "s/$/\"/g;s/^/\"/g" >> $tempfile
    done < <(grep -i "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")
    file_to_array "$tempfile" "isin" "hugo/content/${website//./}.md"
    rm $tempfile
}

function check_data_bcorp(){
    if ! grep -i -q "\"$1\"" $2; then return; fi
    while read code; do
         RATING=$(yq -r .latestVerifiedScore bcorp/split_files/bcorp_${code}.json)
         printf "%s\n" "bcorp_rating: $RATING" >> hugo/content/${website//./}.md
    done < <(grep -i "\"$1\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
}
function check_data_glassdoor(){
    if ! grep -i -q "\"$1\"" $2; then return; fi
    while read code; do
        RATING=$(yq -r .glasroom_rating.ratingValue glassdoor/data_json/${code}.json)
        printf "%s\n" "glassdoor_rating: $RATING" >> hugo/content/${website//./}.md
    done < <(grep -i "\"$1\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
}
function look_for_wikipedia_page(){
   local code=$1 
   if ! [[ $code ]]; then return; fi
   if [[ $code == "null" ]]; then return; fi
   wikidatagetck $code
   local wikipage=$(jq .entities[].sitelinks.enwiki.url $wikidatacachedir/$code.json | cut -d/ -f5- | sed -e 's/"//g' | sed -e's@/@%2F@g')

   if [[ $wikipage == "null" ]]; then return; fi
   if egrep -q "^$wikipage$" nowikipage.list; then return; fi

   if [[ -s "wikipedia/pages/$wikipage.md" ]]; then
        #printf "%s\n" "$wikipage" >> wikipage.list
        printf "%s\n" "{{< wikipedia \"$wikipage\" "$1" "$2" ${3//@/ }>}}" >> hugo/content/${website//./}.md
        return
   else
    if [[ $wikipage && $wikipage != 'null' ]]; then
     if ! [[ -s "wikipedia/pages/$wikipage.md" ]]; then
         python3 wikipedia/wikipedia_criticism.py "wikipedia/sorted_counted_list_of_sections.csv" "${wikipage}" > wikipedia/pages/$wikipage.md
         if [[ -s "wikipedia/pages/$wikipage.md" ]]; then
             printf "%s\n" "{{< wikipedia \"$wikipage\" "$1" "$2" ${3//@/ }>}}" >> hugo/content/${website//./}.md
             return
         else
             printf "%s\n" "$wikipage" >> nowikipage.list
         fi
     fi
    fi
   fi
}
function check_tosdr(){
    if ! grep -i -q "\"$1\"" $2; then return; fi
    ID=$(grep -m1 "\"$1\"" $2 | cut -d, -f2)
    printf "%s\n" "tosdr: \"$ID\" " >> hugo/content/${website//./}.md
}
function wikiassociates(){
    local code=$1
    local temptilesmall=$(mktemp)
    local continue_going=0
    local templist=$(mktemp)

    wikidatagetck $code
    printf '%s\n' "{\"nodes\":[" > $templist

    local STRING=""
    local COUNT=0
    local GROUP=("node")
    while read value; do
        case $COUNT in
                0 ) STRING+="{ \"id\": \"${value//\"/\\\"}\"" ;;
                1 ) STRING+=",\"label\": \"$value\"" ;;
                2 ) STRING+=",\"eslabel\": \"$value\"" ;;
                3 ) STRING+=",\"zhlabel\": \"$value\"" ;;
                4 ) STRING+=",\"hilabel\": \"$value\"" ;;
                5 ) STRING+=",\"eolabel\": \"$value\"" ;;
                6 ) STRING+=",\"arlabel\": \"$value\"" ;;
                7 ) STRING+=",\"frlabel\": \"$value\"" ;;
                8 ) STRING+=",\"delabel\": \"$value\"" ;;
                9 ) STRING+=",\"enwiki\": \"$value\"" ;;
                10) STRING+=",\"eswiki\": \"$value\"" ;;
                11) STRING+=",\"zhwiki\": \"$value\"" ;;
                12) STRING+=",\"hiwiki\": \"$value\"" ;;
                13) STRING+=",\"eowiki\": \"$value\"" ;;
                14) STRING+=",\"arwiki\": \"$value\"" ;;
                15) STRING+=",\"frwiki\": \"$value\"" ;;
                16) STRING+=",\"dewiki\": \"$value\"" && GROUP=() ;;
                *) GROUP+=("$value") ;;
        esac
        : $(( COUNT += 1 ))
    done < <(jq -r ".entities[] | .id, .labels.en.value, .labels.es.value, .labels.zh.value, .labels.hi.value, .labels.eo.value, .labels.ar.value, .labels.fr.value, .labels.de.value, .sitelinks.enwiki.url, .sitelinks.eswiki.url, .sitelinks.zhwiki.url, .sitelinks.hiwiki.url, .sitelinks.eowiki.url, .sitelinks.arwiki.url, .sitelinks.frwiki.url, .sitelinks.dewiki.url, .claims.P31[].mainsnak.datavalue.value.id" $wikidatacachedir/$code.json 2>/dev/null)
    #STRING+=",\"groups\": [$(sed -e "s/ /\",\"/g" -e "s/^/\"/g" -e "s/$/\"/g" <<<"${GROUP[@]}" )]}],"
    local GROUPL2=${GROUP[@]}
    STRING+=",\"groups\": [\"${GROUPL2// /\",\"}\"]}],"

    printf '%s\n' "$STRING\"links\":[ " >> $templist

    jq -r ".entities[].claims | $precomp2ndorder | select( . != null) | .[] | [ .mainsnak.property, .mainsnak.datavalue.value.id ]| @csv" $wikidatacachedir/$code.json > $temptilesmall
	sort -u -o $temptilesmall{,}
    sed -i "s/\"\(P[0-9]*\)\",\"\(Q[0-9]*\)\"/\"\1:\2:@\";${code}/g;s/\"$//g" $temptilesmall
    sed -i "$secondorderpatterns" $temptilesmall
    sed -i '/,$/d' $temptilesmall

    while read command; do 
        printf "%s\n" ${command/;*/} | sed -e "s/\"\([^:]*\):\([^:]*\):\([^:]*\)\"/{ \"source\": \"$code\", \"target\": \"\2\", \"type\": \"\3\" },/g" >> $templist
    done < $temptilesmall

    sed -i 's/http[s]*:\/\/[a-z][a-z]\.wikipedia\.org\/wiki\///g;$s/[,]*$/]}/' $templist
    cp $templist "$GPD/graph-${code}.json"
    rm $STATUSF/.status.$2.$3 $temptilesmall $templist >/dev/null
}
function check_associated_for_graph(){
    local code=($(grep -i "\"$1\"" $2))
    [[ ! $code ]] && return
    local templisterr
    local templister=($(printf '%s\n' "${code[@]//*\"Q/\"Q}" | sort -n -k1.3 ))
    for i in {1..3}; do 
        templister=$(remove_array_dups ${templister//\"/}); temparr=($templister)
        unset templisterr
        local place="1"
        for id in ${temparr[@]}; do 
            templisterr+="${GPD}/graph-$id.json "
            :> $STATUSF/.status.$3.$place
	        [[ -s "$GPD/graph-${id}.json"  || "$id" == '' || "$id" == 'null' ]] \
                && rm $STATUSF/.status.$3.$place \
                && : $(( place += 1 )) \
                && continue
            wikiassociates "$id" "$3" "$place" "append" & 
            : $(( place += 1))
        done 
		while compgen -G "$STATUSF/.status.$3.*"; do sleep 0.1s; done
        templister+=$(jq -jr '.links[].target | " ", .' $templisterr )
    done
    place="1"
    templister=$(remove_array_dups $templister); temparr=($templister)
    unset templisterr
    for id in ${temparr[@]}; do 
        templisterr+="${GPD}/graph-$id.json "
        :> $STATUSF/.status.$3.$place
	    [[ -s "$GPD/graph-${id}.json"  || "$id" == '' || "$id" == 'null' ]] \
            && rm $STATUSF/.status.$3.$place \
            && : $(( place += 1 )) \
            && continue
        wikiassociates "$id" "$3" "$place" &
        : $(( place += 1))
    done 

	while compgen -G "$STATUSF/.status.$3.*"; do sleep 0.1s; done
    local tempjson=$(mktemp)
    local tempjson_nodes=$(mktemp)
    jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add | {"links":.links}' ${templisterr[@]} > $tempjson
    templister+=$(jq -jr '.links[].target | " ", .' $templisterr )

    place="1"
    templister=$(remove_array_dups $templister); temparr=($templister)
    unset templisterr
    for id in ${temparr[@]}; do 
        templisterr+="${GPD}/graph-$id.json "
        unset M5S; M5S=$(md5sum $GPD/graph-${id}.json); M5S=${M5S// */}
        if [[ "$M5S" == 225bbe98cd7a533ad66bbbdce305c368 ]]; then 
            rm $GPD/graph-${id}.json $wikidatacachedir/${id}.json 
            :> $GPD/graph-${id}.json
        else 
            templisterr+="${GPD}/graph-$id.json "
        fi

        :> $STATUSF/.status.$3.$place

	    [[ -s "$GPD/graph-${id}.json"  || "$id" == '' || "$id" == 'null' ]] \
            && rm $STATUSF/.status.$3.$place \
            && : $(( place += 1 )) \
            && continue

        wikiassociates "$id" "$3" "$place" &
        : $(( place += 1))
    done 

	while compgen -G "$STATUSF/.status.$3.*"; do sleep 0.1s; done

    unset templisterr
    for id in ${temparr[@]}; do 
        unset M5S; M5S=$(md5sum $GPD/graph-${id}.json); M5S=${M5S// */}
        if [[ "$M5S" == 225bbe98cd7a533ad66bbbdce305c368 ]]; then 
            rm $GPD/graph-${id}.json $wikidatacachedir/${id}.json 
            touch $GPD/graph-${id}.json
        else 
            templisterr+="${GPD}/graph-$id.json "
        fi
    done 

    jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add | {"nodes":.nodes}' $templisterr > $tempjson_nodes
    jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add' $tempjson $tempjson_nodes > hugo/static/connections/${website//./}.json

    rm $tempjson $tempjson_nodes >/dev/null
    # printf '%s\n' "$3 ${lineno//:*/} of $IDLIST_LENGTH ($entry)"
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
    # [[ -s "hugo/content/${website//./}.md" ]] && return
    printf "%s\n" "---" "title: \"$website\"" "date: $EPOCHSECONDS" "---" > hugo/content/${website//./}.md

    check_tosdr "$website" "$TSLOOKUP" "tosdr"
    check_data_header "$website" "$MBLOOKUP" "mbfc"
    check_data_header "$website" "$BCLOOKUP" "bcorp"
    check_data_header "$website" "$GYLOOKUP" "goodonyou"
    check_data_header "$website" "$GDLOOKUP" "glassdoor"
    isin_via_wikidata "$website" "$WDLOOKUP" "isin"
    wikidata_id "$website" "$WDLOOKUP" "wikidata_id"
    esg_via_yahoo_via_wikidata "$website" "$WDLOOKUP" "yesg"

    add_values_from_wikidata_id "$website" "$WDLOOKUP" "polalignment" "P1387"
    add_values_from_wikidata_id "$website" "$WDLOOKUP" "polideology" "P1142"
    add_values_from_wikidata "$website" "$WDLOOKUP" "twittername" "P2002"
    add_values_from_wikidata "$website" "$WDLOOKUP" "officialblog" "P1581"
    add_values_from_wikidata "$website" "$WDLOOKUP" "subreddit" "P3984"
    add_values_from_wikidata "$website" "$WDLOOKUP" "facebookid" "P2013"
    add_values_from_wikidata "$website" "$WDLOOKUP" "facebookpage" "P4003"
    add_values_from_wikidata "$website" "$WDLOOKUP" "instagramid" "P2003"
    add_values_from_wikidata "$website" "$WDLOOKUP" "youtubechannelid" "P2397"
    add_values_from_wikidata "$website" "$WDLOOKUP" "emailaddress" "P968"
    add_values_from_wikidata "$website" "$WDLOOKUP" "truthsocial" "P10858"
    add_values_from_wikidata "$website" "$WDLOOKUP" "parleruser" "P8904"
    add_values_from_wikidata "$website" "$WDLOOKUP" "gabuser" "P8919"
    add_values_from_wikidata "$website" "$WDLOOKUP" "soundcloud" "P3040"
    add_values_from_wikidata "$website" "$WDLOOKUP" "tumblr" "P3943"
    add_values_from_wikidata "$website" "$WDLOOKUP" "medium" "P3899"
    add_values_from_wikidata "$website" "$WDLOOKUP" "telegram" "P3789"
    add_values_from_wikidata "$website" "$WDLOOKUP" "mastodon" "P4033"
    add_values_from_wikidata "$website" "$WDLOOKUP" "patreon" "P4175"
    add_values_from_wikidata "$website" "$WDLOOKUP" "reddituser" "P4265"
    add_values_from_wikidata "$website" "$WDLOOKUP" "twitch" "P5797"
    add_values_from_wikidata "$website" "$WDLOOKUP" "tiktok" "P7085"

    check_data_glassdoor "$website" "$GDLOOKUP"
    check_data_bcorp "$website" "$BCLOOKUP"
    check_associated_for_graph "$website" "$WDLOOKUP" "$BASHPID"
    [[ -s "hugo/static/connections/${website//./}.json" ]] && \
        printf "%s\n" "connections: \"/connections/${website//./}.json\"" >> hugo/content/${website//./}.md

    LC_COLLATE=C sort -u hugo/content/${website//./}.md \
        | sed "0,/{/{s/^{/---\n{/}" > $resort
    cp $resort hugo/content/${website//./}.md

    printf "%s\n" "---" >> hugo/content/${website//./}.md
    sed -i '/^---/{x;s/^/n/;/^n\{3\}$/{x;d};x}' hugo/content/${website//./}.md

    # reorder_wikipedia "hugo/content/${website//./}.md"

    # jq . hugo/static/connections/${website//./}.json
    # cat hugo/content/${website//./}.md
    printf '%s\n' "$2 ${lineno//:*/} of $IDLIST_LENGTH ($website)"
    rm $resort
}


function do_list(){
while read website; do 
    local IDLIST_LENGTH=$(wc -l < $1)
    local lineno=$(grep -i -n "^${website}$" $1)
    do_record "${website}" "$1" 
done < $1
}

ramcache
prepare_pairings

rm $STATUSF/.status.* &>/dev/null
rm $STATUSF/.list.* &>/dev/null

# rm hugo/content/ -rf
# mkdir -p hugo/content
splitnum=$(printf "%.0f" $(bc -l <<<"$(wc -l < websites.list)/16"))
split -l$splitnum <(grep "^" websites.list) $STATUSF/.list.

for list in $STATUSF/.list.*; do
    do_list $list &
done

wait
rsync -ah --info=progress2 $GPD ./wikidata/
rsync -ah --info=progress2 $wikidatacachedir ./wikidata/
exit 0

