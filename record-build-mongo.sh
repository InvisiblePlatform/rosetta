#!/bin/bash
#set -o xtrace
ENTITY='https://www.wikidata.org/entity'
LC_ALL=C
LC_COLLATE=C

function build_list(){
printf "Build list of websites\n"
WDLOOKUP="wikidata/website_id_list.csv"
MBLOOKUP="mbfc/website_bias.csv"
BCLOOKUP="bcorp/website_stub_bcorp.csv"
GYLOOKUP="goodonyou/goodforyou_web_brandid.csv"
GDLOOKUP="glassdoor/website_glassdoorneo.list"
TSLOOKUP="tosdr/site_id.list"
WPLOOKUP="wikipedia/wikititle_webpage_id_filtered.csv"
ISLOOKUP="static/document_isin.list"
STATUSF="/mnt/tmpcache"

cut -d, -f1 \
    $MBLOOKUP \
    $BCLOOKUP \
    $GDLOOKUP \
    $GYLOOKUP \
    $WDLOOKUP \
    $WPLOOKUP \
    | tr '[:upper:]' '[:lower:]' \
    | sed -e "s/www[0-9]*\.//g;s/?[^/]*$//g" \
    | sed -e "/\//d;s/\"//g;/^$/d" \
    | sort -u > websites.list
}

build_list
sudo mkdir /mnt/tmpcache
function ramcache(){
    if ! [[ -d "/mnt/tmpcache" ]]; then 
        sudo mount -t tmpfs -o size=20g tmpfs /mnt/tmpcache
    fi
    sudo chown orange:orange /mnt/tmpcache
    printf "%s\n" "Ramcache on"

    printf "%s\n" "Copy wikidatacache"
    mkdir -p /mnt/tmpcache/wikidata /mnt/tmpcache/bcorp \
        /mnt/tmpcache/goodonyou /mnt/tmpcache/glassdoor /mnt/tmpcache/mbfc \
        /mnt/tmpcache/tosdr /mnt/tmpcache/graph-parts /mnt/tmpcache/wikipedia \
        /mnt/tmpcache/static
    printf "%s\n" "Copy lookups"
    cp $WDLOOKUP /mnt/tmpcache/$WDLOOKUP
    cp $MBLOOKUP /mnt/tmpcache/$MBLOOKUP
    cp $BCLOOKUP /mnt/tmpcache/$BCLOOKUP
    cp $GYLOOKUP /mnt/tmpcache/$GYLOOKUP
    cp $GDLOOKUP /mnt/tmpcache/$GDLOOKUP
    cp $TSLOOKUP /mnt/tmpcache/$TSLOOKUP
    cp $ISLOOKUP /mnt/tmpcache/$ISLOOKUP
    cat $WPLOOKUP >> /mnt/tmpcache/$WDLOOKUP

    WPLOOKUP="/mnt/tmpcache/wikipedia/wikititle_webpage_id_filtered.csv"
    WDLOOKUP="/mnt/tmpcache/wikidata/website_id_list.csv"
    MBLOOKUP="/mnt/tmpcache/mbfc/website_bias.csv"
    BCLOOKUP="/mnt/tmpcache/bcorp/website_stub_bcorp.csv"
    GYLOOKUP="/mnt/tmpcache/goodonyou/goodforyou_web_brandid.csv"
    GDLOOKUP="/mnt/tmpcache/glassdoor/website_glassdoorneo.list"
    TSLOOKUP="/mnt/tmpcache/tosdr/site_id.list"
    ISLOOKUP="/mnt/tmpcache/static/document_isin.list"
    printf "%s\n" "Ramcache loaded"
}
function file_to_array(){
    # $1 - file in
    # $2 - key
    # $3 - outputfile
    [[ -s $1 ]] || return
    local value
    value=$(sort -u "$tempfile" | tr '\n' ',')
    printf "%s\n" "$2: [${value%,*}]" >> "$3"
    
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
    while read -r code; do
        unset OUT; OUT=${code//\"/}; OUT=${OUT//*,/}
        printf "%s\n" "$3: \"$OUT\"" >> "$4"
        printf "%s\n" "$3_source: \"$1\"" >> "$4"
    done< <(grep -i "\"$1\"" "$2")
}
function add_values_from_wikidata(){
    local tempfile
    tempfile=$(mktemp)
    local tempfile2
    tempfile2=$(mktemp)
    local connection=$3
    local oldids=${WIKIDATAIDS[@]}
    local WIKIDATAIDS=($(printf '"%s" ' ${oldids[@]} | sed -e "s/ /,/g" -e "s/,$/]/g" -e "s/^/[/g"))
    screen -S "$connection" -p 0 -X stuff "file_out=\"${tempfile}\";main_node=${WIKIDATAIDS};load(\"mongoscripts/wikidata_records.js\");^M"
    printf '%s\n' "wikidata_id: $WIKIDATAIDS" >> "$2"
    rm "$tempfile"
    while [ -a "$tempfile2" ]; do
        if [ -a "$tempfile" ]; then
            /snap/bin/yq '.[]? |= "[\""+join("\",\"")+"\"]" ' -P < "$tempfile" 2>/dev/null| sed -e "s/'//g" >> "$2"
            rm "$tempfile2" "$tempfile"
        fi
    done
}
function isin_via_wikidata(){
    local tempfile
    tempfile=$(mktemp)
    while read -r isin; do
        grep "$isin" $ISLOOKUP >> "$tempfile"
    done < <(yq -r ".isin_id[]" "$2" 2>/dev/null)
    file_to_array "$tempfile" "isin" "$2"
    rm "$tempfile"
}

function check_data_bcorp(){
    local code
    code=$(grep -m1 -i "\"$1\"" $BCLOOKUP | sed -e "s/\"//g;s/^[^,]*,//g")
    [[ ! $code ]] && return
    RATING=$(/snap/bin/yq -r .latestVerifiedScore "bcorp/split_files/bcorp_${code}.json")
    { printf "%s\n" "bcorp: \"$code\"";\
    printf "%s\n" "bcorp_source: \"$1\"";\
    printf "%s\n" "bcorp_rating: $RATING";} >> "$2" 
}
function check_data_glassdoor(){
    local code
    code=$(grep -m1 -i "\"$1\"" $GDLOOKUP | sed -e "s/\"//g;s/^[^,]*,//g")
    [[ ! $code ]] && return
    RATING=$(/snap/bin/yq -r .glasroom_rating.ratingValue "glassdoor/data_json/${code}.json")
    {   printf "%s\n" "glassdoor: \"$code\""; \
        printf "%s\n" "glassdoor_source: \"$1\""; \
        printf "%s\n" "glassdoor_rating: $RATING";} >> "$2" 
}
function check_tosdr(){
    ID=$(grep -m1 "\"$1\"" $TSLOOKUP)
    [[ ! $ID ]] && return
    printf "%s\n" "tosdr: \"${ID//*,/}\" " >> "$2" 
}
function check_associated_for_graph(){
    local file_out="hugo/static/connections/${website//./}.json"
    local connection=$2
    # mongosh --quiet localhost:27017/ --file mongoscripts/plain_node.js
    screen -S "$connection" -p 0 -X stuff "file_out=\"${file_out}\";main_node=\"${WIKIDATAIDS[0]}\";load(\"mongoscripts/plain_node.js\");^M"
}
function do_record(){
    local resort
    resort=$(mktemp)
    local website="$1"
    local connection="$3"
    # [[ -s "hugo/content/${website//./}.md" ]] && return
    printf "%s\n" "---" "title: \"$website\"" "date: $EPOCHSECONDS" > "$resort"

    check_data_header "$website" "$MBLOOKUP" "mbfc" "$resort"
    check_data_header "$website" "$GYLOOKUP" "goodonyou" "$resort"

    check_tosdr "$website" "$resort"
    check_data_glassdoor "$website" "$resort"
    check_data_bcorp "$website" "$resort"
    
    local WIKIDATAIDS=($(grep -i "\"$1\"" $WDLOOKUP | grep -o "Q[0-9]*"))
    if [[ "${WIKIDATAIDS[0]}" != "" ]]; then
        add_values_from_wikidata "$website" "$resort" "$connection"
        isin_via_wikidata "$website" "$resort"
        check_associated_for_graph "$website" "$connection"
        [[ -s "hugo/static/connections/${website//./}.json" ]] && \
            printf "%s\n" "connections: \"/connections/${website//./}.json\"" >> "$resort"
    fi

    printf "%s\n" "---" >> "$resort" 
    cp "$resort" "hugo/content/${website//./}.md"

    # jq . hugo/static/connections/${website//./}.json
    # cat hugo/content/${website//./}.md
    printf "\e[$2;0H %*s %*d %s %*d %2d\n" 100 "($website)" 6 "${lineno//:*/}" "of" 6 "$IDLIST_LENGTH" "$2"
    printf "\e[$split_count;0H"
    rm "$resort"
}


function do_list(){
    local IDLIST_LENGTH
    IDLIST_LENGTH=$(wc -l < "$1")
    local lineno
    local connection="$2"
    local listno
    listno=$(ls -1 "$STATUSF"/.list.* | grep -Fn "$1" | cut -d: -f1)
    while read -r website; do 
        : $(( lineno += 1))
        do_record "${website}" "${listno}" "$2"
    done < "$1"
}

get_term_size() {
    shopt -s checkwinsize; (:;:)
}


# rm hugo/content/ -rf 
rm $STATUSF/.status.* $STATUSF/.list.* &>/dev/null

splitnum=$(printf "%.0f" "$(bc -l <<<"$(wc -l < websites.list)/16")")
split -l"$splitnum" <(grep "^" websites.list ) $STATUSF/.list.
#split -l146 <(grep "^fa" websites.list ) $STATUSF/.list.
split_count=$(ls -1 "$STATUSF"/.list.* | wc -l)

ramcache

mkdir -p hugo/content

for list in "$STATUSF"/.list.*; do
    if ! grep -q "sessionIV${list//*./}" <(screen -ls 2>/dev/null); then
        screen -dmS "sessionIV${list//*./}" mongosh --quiet localhost:27017/rop 2>/dev/null
    fi
    do_list "$list" "sessionIV${list//*./}" &
done
clear
wait
while read -r x; do screen -X -S "$x" quit >/dev/null; done < <(screen -ls 2>/dev/null | cut -d. -f2 | sed -e "s/\t.*//g")
exit 0
