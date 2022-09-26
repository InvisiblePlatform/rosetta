#!/bin/bash
#set -o xtrace
ENTITY='https://www.wikidata.org/entity'

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
    secondorderpatterns=$(mktemp)
    for pairingx in ${secondorder_pairings[@]}; do
        printf '%s\n' "s/^\"${pairingx/;*/}:\\([^@:]*:\\)@/\"${pairingx/;*/}:\\1${pairingx/*;/}/g" >> $secondorderpatterns
    done
}
function ramcache(){
    if ! [[ -d "/mnt/tmpcache" ]]; then 
        sudo mkdir /mnt/tmpcache
        sudo mount -t ramfs -o size=16g ramfs /mnt/tmpcache
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
    local value=$(sort -u $tempfile | tr '\n' ',' | sed -e "s/,$/]/g;s/^/[/g")
    printf "%s\n" "$2: $value" >> $3
    
}
function lines_loop() {
    # Usage: lines_loop "file"
    local count=0
    while IFS= read -r _; do
        ((count++))
    done < "$1"
    printf '%s\n' "$count"
}
function check_data_header(){
    while read code; do
        printf "%s\n" "$3: \"$code\"" >> hugo/content/${website//./}.md
        printf "%s\n" "$3_source: \"$1\"" >> hugo/content/${website//./}.md
    done< <(grep -i "\"$1\"" $2 | sed -e "s/\"//g;s/^[^,]*,//g")
}
function add_values_from_wikidata(){
    local tempfile=$(mktemp)
    while read WIKIDATAID; do
        wikidatagetck $WIKIDATAID
        jq -r .entities[].claims.$4[].mainsnak.datavalue.value $wikidatacachedir/$WIKIDATAID.json 2>/dev/null | sort -u \
            | sed -e "s/^\(.*\)$/\"\1\;$4\;$WIKIDATAID\"/g" >> $tempfile
    done < <(grep -i "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*")

    file_to_array "$tempfile" "$3" "hugo/content/${website//./}.md"
    rm $tempfile
}
function add_values_from_wikidata_id(){
    local tempfile=$(mktemp)
    while read WIKIDATAID; do
        wikidatagetck $WIKIDATAID
        jq -r .entities[].claims.$4[].mainsnak.datavalue.value.id $wikidatacachedir/$WIKIDATAID.json 2>/dev/null | sort -u \
            | sed -e "s/^\(.*\)$/\"\1\;$4\;$WIKIDATAID\"/g" >> $tempfile
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
            2>/dev/null | sed -e "s/^/\"/g;s/$/\"/g">> $tempfile
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
        rg $isin static/*.json | cut -d: -f1 | sed -e "s/$/:$isin\"/g;s/^/\"/g" >> $tempfile
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
        [[ $COUNT == 0 ]] && STRING+="{ \"id\": \"${value//\"/\\\"}\"" 
        [[ $COUNT == 1 ]] && STRING+=",\"label\": \"$value\"" 
        [[ $COUNT == 2 ]] && STRING+=",\"eslabel\": \"$value\"" 
        [[ $COUNT == 3 ]] && STRING+=",\"zhlabel\": \"$value\"" 
        [[ $COUNT == 4 ]] && STRING+=",\"hilabel\": \"$value\"" 
        [[ $COUNT == 5 ]] && STRING+=",\"eolabel\": \"$value\"" 
        [[ $COUNT == 6 ]] && STRING+=",\"arlabel\": \"$value\"" 
        [[ $COUNT == 7 ]] && STRING+=",\"frlabel\": \"$value\"" 
        [[ $COUNT == 8 ]] && STRING+=",\"delabel\": \"$value\"" 
	    [[ $COUNT == 9 ]] && STRING+=",\"enwiki\": \"$value\"" 
	    [[ $COUNT == 10 ]] && STRING+=",\"eswiki\": \"$value\""
	    [[ $COUNT == 11 ]] && STRING+=",\"zhwiki\": \"$value\""
	    [[ $COUNT == 12 ]] && STRING+=",\"hiwiki\": \"$value\""
	    [[ $COUNT == 13 ]] && STRING+=",\"eowiki\": \"$value\""
	    [[ $COUNT == 14 ]] && STRING+=",\"arwiki\": \"$value\""
	    [[ $COUNT == 15 ]] && STRING+=",\"frwiki\": \"$value\""
	    [[ $COUNT == 16 ]] && STRING+=",\"dewiki\": \"$value\"" && GROUP=()
        [[ $COUNT > 16 ]] && GROUP+=("$value")
        : $(( COUNT += 1 ))
    done < <(jq -r ".entities[] | .id \
        .labels.en.value, \
        .labels.es.value, \
        .labels.zh.value, \
        .labels.hi.value, \
        .labels.eo.value, \
        .labels.ar.value, \
        .labels.fr.value, \
        .labels.de.value, \
        .sitelinks.enwiki.url, \
        .sitelinks.eswiki.url, \
        .sitelinks.zhwiki.url, \
        .sitelinks.hiwiki.url, \
        .sitelinks.eowiki.url, \
        .sitelinks.arwiki.url, \
        .sitelinks.frwiki.url, \
        .sitelinks.dewiki.url, \
        .claims.P31[].mainsnak.datavalue.value.id" $wikidatacachedir/$code.json 2>/dev/null)

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

    sed -i 's/http[s]*:\/\/[a-z][a-z]\.wikipedia\.org\/wiki\///g' $templist
    sed -i '$s/[,]*$/]}/' $templist
    cp $templist "$GPD/graph-${code}.json"
    printf '%s\n' '1' > $STATUSF/.status.$2.$3
    rm $temptilesmall $templist >/dev/null
}
function check_associated_for_graph(){
    if ! grep -i -q "\"$1\"" $2; then return; fi
    local code=$(grep -i "\"$1\"" $2 | grep -o "Q[0-9]*"|head -1)
    local templister=$(mktemp)
    local templisterr
    printf '%s\n' "$code" > $templister
    rm $STATUSF/.status.$3.* -rf
    for i in {1..3}; do 
        [[ $DEBUG ]] && printf '%s\n' "$i loop"
	    templisterr=$(sort -u $templister | tr "\n" "@" | sed -e "s/\(Q[0-9]*\)@/${GPD//\//\\\/}\/graph-\1.json /g")
	    local numberOfIDs=$(lines_loop $templister)
        local place="1"
	    for ((j=1;j<=$numberOfIDs;j++)); do
            printf '%s\n' '0' > $STATUSF/.status.$3.$j
        done
        while read id; do 
	        [[ -s "$GPD/graph-${id}.json" ]] && printf '%s\n' '1' > $STATUSF/.status.$3.$place && : $(( place += 1 )) && continue
	        [[ "$id" == '' ]] && printf '%s\n' '1' > $STATUSF/.status.$3.$place && : $(( place += 1 )) && continue
	        [[ "$id" == 'null' ]] && printf '%s\n' '1' > $STATUSF/.status.$3.$place && : $(( place += 1 )) && continue
            wikiassociates "$id" "$3" "$place" "append" & 
            : $(( place += 1))
        done < <(sort -u $templister)

    	if [[ -s "$STATUSF/.status.$3.1" ]]; then
		    while grep -q "0" <(cat $STATUSF/.status.$3.* | tr '\n' ' ' ) ; do sleep 0.1s; done
	    fi
    	jq -r ".links[].target" $templisterr >> $templister
	    sort -u -o $templister{,}
    done
    numberOfIDs=$(lines_loop $templister)
    place="1"
    templisterr=$(sort -u $templister | tr "\n" "@" | sed -e "s/\(Q[0-9]*\)@/${GPD//\//\\\/}\/graph-\1.json /g")
    for ((j=1;j<=$numberOfIDs;j++)); do
        printf '%s\n' '0' > $STATUSF/.status.$3.$j
    done
    while read id; do 
	    [[ -s "$GPD/graph-${id}.json" ]] && printf '%s\n' '1' > $STATUSF/.status.$3.$place && : $(( place += 1 )) && continue
	    [[ "$id" == '' ]] && printf '%s\n' '1' > $STATUSF/.status.$3.$place && : $(( place += 1 )) && continue
	    [[ "$id" == 'null' ]] && printf '%s\n' '1' > $STATUSF/.status.$3.$place && : $(( place += 1 )) && continue
        wikiassociates "$id" "$3" "$place" &
        : $(( place += 1))
    done < <(sort -u $templister)

    if [[ -s "$STATUSF/.status.$3.1" ]]; then
		while grep -q "0" <(cat $STATUSF/.status.$3.* | tr '\n' ' ' ) ; do sleep 0.1s; done
	fi
	sort -u -o $templister{,}
    local tempjson=$(mktemp)
    local tempjson_nodes=$(mktemp)
    jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add | {"links":.links}' ${templisterr[@]} > $tempjson
    jq -r ".links[].target" $templisterr >> $templister

	sort -u -o $templister{,}
    numberOfIDs=$(lines_loop $templister)
    place="1"
    templisterr=$(sort -u $templister | tr "\n" "@" | sed -e "s/\(Q[0-9]*\)@/${GPD//\//\\\/}\/graph-\1.json /g")
    for ((j=1;j<=$numberOfIDs;j++)); do
        printf '%s\n' '0' > $STATUSF/.status.$3.$j
    done
    while read id; do 
	    [[ -s "$GPD/graph-${id}.json" ]] && printf '%s\n' '1' > $STATUSF/.status.$3.$place && : $(( place += 1 )) && continue
	    [[ "$id" == '' ]] && printf '%s\n' '1' > $STATUSF/.status.$3.$place && : $(( place += 1 )) && continue
	    [[ "$id" == 'null' ]] && printf '%s\n' '1' > $STATUSF/.status.$3.$place && : $(( place += 1 )) && continue
        wikiassociates "$id" "$3" "$place" &
        : $(( place += 1))
    done < <(sort -u $templister)

    if [[ -s "$STATUSF/.status.$3.1" ]]; then
		while grep -q "0" <(cat $STATUSF/.status.$3.* | tr '\n' ' ' ) ; do sleep 0.1s; done
	fi
    jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add | {"nodes":.nodes}'  $(tr "\n" "@" < $templister | sed -e "s/\(Q[0-9]*\)@/${GPD//\//\\\/}\/graph-\1.json /g" ) > $tempjson_nodes
    jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add' $tempjson $tempjson_nodes > hugo/static/connections/${website//./}.json

    printf '%s\n' "0" > $STATUSF/.status.$3
    rm $templister $STATUSF/.status.$3.* $STATUSF/.status.$3 $tempjson $tempjson_nodes >/dev/null
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
    printf "%s\n" "---" > hugo/content/${website//./}.md
    printf "%s\n" "title: \"$website\"" >> hugo/content/${website//./}.md
    printf "%s\n" "date: $EPOCHSECONDS" >> hugo/content/${website//./}.md
    printf "%s\n" "---" >> hugo/content/${website//./}.md

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
    local IDLIST_LENGTH=$(wc -l $1 | cut -d' ' -f1 )
    local lineno=$(grep -i -n "^${website}$" $1)
    do_record "${website}" "$1" 
done < $1
}

ramcache
prepare_pairings

rm $STATUSF/.status.* &>/dev/null
rm $STATUSF/.list.* &>/dev/null

rm hugo/content/ -rf
mkdir -p hugo/content
splitnum=$(printf "%.0f" $(bc -l <<<"$(wc -l websites.list | cut -d' ' -f1)/16"))
split -l$splitnum <(grep "^" websites.list) $STATUSF/.list.

for list in $STATUSF/.list.*; do
    do_list $list &
done

wait
rsync -ah --info=progress2 $GPD ./wikidata/
rsync -ah --info=progress2 $wikidatacachedir ./wikidata/
exit 0

