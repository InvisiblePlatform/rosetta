#!/bin/bash
#set -eo xtrace
LC_ALL=C; LC_COLLATE=C
STATUSOUT=1; SKIPGEN=1; CONNECTIONOUT=; RECORDOUT=
rootdir="data_collection"
# TODO: 20230416
# There was some update to yq to change how the output works 
# It's not script breaking but made an extra object on the output of some 
# section, that should be found and fixed.
function build_list(){
    printf "Build list of websites\n"
    WDLOOKUP="${rootdir}/wikidata/website_id_list.csv"
    MBLOOKUP="${rootdir}/mbfc/website_bias.csv"
    BCLOOKUP="${rootdir}/bcorp/website_stub_bcorp.csv"
    GYLOOKUP="${rootdir}/goodonyou/goodforyou_web_brandid.csv"
    GDLOOKUP="${rootdir}/glassdoor/website_glassdoorneo.list"
    TSLOOKUP="${rootdir}/tosdr/site_id.list"
    WPLOOKUP="${rootdir}/wikipedia/wikititle_webpage_id_filtered.csv"
    ISLOOKUP="${rootdir}/static/document_isin.list"
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
        | sed -e "s/:[0-9]*//g" \
        | sort -u > websites.list
}

build_list
# sudo mkdir /mnt/tmpcache
sudo chown orange:orange /mnt/tmpcache

# Premake associative arrays for various tables
declare -A goodonyou
while IFS=, read -r -a values; do                                               
    goodonyou[${values[0]//./__}]=${values[1]}                                  
done < $GYLOOKUP
declare -A mediabias
while IFS=, read -r -a values; do                                               
    mediabias[${values[0]//./__}]=${values[1]}
done < <(sed -e "s@/[^\"]*\"@\"@g;/^,/d" $MBLOOKUP)
declare -A bcorp
while IFS=, read -r -a values; do                                               
    bcorp[${values[0]//./__}]=${values[1]}                                  
done < $BCLOOKUP
declare -A glassdoor
while IFS=, read -r -a values; do                                               
    glassdoor[${values[0]//./__}]=${values[1]}                                  
done < $GDLOOKUP
declare -A tosdr
while IFS=, read -r -a values; do                                               
    tosdr[${values[0]//./__}]=${values[1]}                                  
done < $TSLOOKUP
declare -A wdata
while IFS=, read -r -a values; do                                               
   if [[ ${wdata[${values[0]//./__}]} ]]; then
       temp=${wdata[${values[0]//./__}]}
       wdata[${values[0]//./__}]=$temp@${values[1]}
   else
        wdata[${values[0]//./__}]=${values[1]}
   fi
done < <(sed -e "s/www[0-9]*\.//g;s/?[^/]*$//g" $WDLOOKUP  | sed -e "/\//d;/^$/d;/^$/d" | sort -u )

# function ramcache(){
#     if ! [[ -d "/mnt/tmpcache" ]]; then 
#         sudo mount -t tmpfs -o size=20g tmpfs /mnt/tmpcache
#     fi
#     printf "%s\n" "Ramcache on"
# 
#     printf "%s\n" "Copy wikidatacache"
#     mkdir -p /mnt/tmpcache/wikidata /mnt/tmpcache/bcorp \
#         /mnt/tmpcache/goodonyou /mnt/tmpcache/glassdoor /mnt/tmpcache/mbfc \
#         /mnt/tmpcache/tosdr /mnt/tmpcache/wikipedia /mnt/tmpcache/static
#     printf "%s\n" "Copy lookups"
#     cp $WDLOOKUP /mnt/tmpcache/$WDLOOKUP
#     cp $MBLOOKUP /mnt/tmpcache/$MBLOOKUP
#     cp $BCLOOKUP /mnt/tmpcache/$BCLOOKUP
#     cp $GYLOOKUP /mnt/tmpcache/$GYLOOKUP
#     cp $GDLOOKUP /mnt/tmpcache/$GDLOOKUP
#     cp $TSLOOKUP /mnt/tmpcache/$TSLOOKUP
#     cp $ISLOOKUP /mnt/tmpcache/$ISLOOKUP
#     cat $WPLOOKUP >> /mnt/tmpcache/$WDLOOKUP
# 
#     WPLOOKUP="/mnt/tmpcache/wikipedia/wikititle_webpage_id_filtered.csv"
#     WDLOOKUP="/mnt/tmpcache/wikidata/website_id_list.csv"
#     MBLOOKUP="/mnt/tmpcache/mbfc/website_bias.csv"
#     BCLOOKUP="/mnt/tmpcache/bcorp/website_stub_bcorp.csv"
#     GYLOOKUP="/mnt/tmpcache/goodonyou/goodforyou_web_brandid.csv"
#     GDLOOKUP="/mnt/tmpcache/glassdoor/website_glassdoorneo.list"
#     TSLOOKUP="/mnt/tmpcache/tosdr/site_id.list"
#     ISLOOKUP="/mnt/tmpcache/static/document_isin.list"
#     printf "%s\n" "Ramcache loaded"
# }
function file_to_array(){
    # $1 - file in
    # $2 - key
    [[ -s $1 ]] || return
    local value
    value=$(sort -u "$tempfile" | tr '\n' ',')
    printf "%s\n" "$2: [${value%,*}]" >> "$resort"
    
}
function add_values_from_wikidata(){
    local hold=1
    local WIKIDS
    WIKIDS=$(printf "%s\n" ${WIKIDATAIDS[*]//\"/} | /snap/bin/yq 'split(" ")' -o j -I0)
    rm "$tempfile" 2>/dev/null
    screen -S "$connection" -p 0 -X stuff "file_out=\"${tempfile}\";main_node=${WIKIDS};load(\"tools/mongoscripts/wikidata_records.js\");^M"
    printf '%s\n' "wikidata_id: $WIKIDS" >> "$resort"
    while [ $hold == "1" ]; do
        if [ -a "$tempfile" ]; then
            /snap/bin/yq -oy '.[]? |= "[\""+join("\",\"")+"\"]" ' -P < "$tempfile" 2>/dev/null| sed -e "s/'//g" >> "$resort"
            hold=2
            rm "$tempfile" 2>/dev/null
        fi
    done
    isin_via_wikidata 
}
function isin_via_wikidata(){
    rm "$tempfile" 2>/dev/null
    while read -r isin; do
        grep "$isin" $ISLOOKUP >> "$tempfile"
    done < <(yq -r ".isin_id[]" "$resort" 2>/dev/null)
    if [[ -s "$tempfile" ]]; then
        file_to_array "$tempfile" "isin"
        rm "$tempfile" 2>/dev/null 
    fi
}

function check_data_bcorp(){
    if [[ ${bcorp["\"${website//./__}\""]} ]]; then
        local id="${bcorp["\"${website//./__}\""]}"
        RATING=$(/snap/bin/yq -r .latestVerifiedScore "${rootdir}/bcorp/split_files/bcorp_${id//\"/}.json")
        printf "%s\n" "bcorp: ${id}" \
                      "bcorp_source: \"$website\"" \
                      "bcorp_rating: $RATING" \
                      >> "$resort"
    fi
}
function check_data_glassdoor(){
    if [[ ${glassdoor["\"${website//./__}\""]} ]]; then
        local id="${glassdoor["\"${website//./__}\""]}"
        RATING=$(/snap/bin/yq -r -oy .glasroom_rating.ratingValue "${rootdir}/glassdoor/data_json/${id//\"/}.json")
        printf "%s\n" "glassdoor: ${id}" \
                      "glassdoor_source: \"$website\"" \
                      "glassdoor_rating: $RATING" \
                      >> "$resort"
    fi
}

function check_associated_for_graph(){
    screen -S "$connection" -p 0 -X stuff "file_out=\"${graphfile}\";main_node=\"${WIKIDATAIDS[0]}\";load(\"tools/mongoscripts/plain_node.js\");^M"
}
function do_record(){
    local website="$1"; local connection="$3"
    local outfile="hugo/content/db/${website//./}.md"
    [[ -s "$outfile" && $SKIPGEN ]] && return
    local resort="${STATUSF}/.resort$2"
    local tempfile="${STATUSF}/.temp$2"
    local timestart="$EPOCHSECONDS"
    local graphfile="hugo/static/connections/${website//./}.json"

    { printf "%s\n" "title: \"$website\"" "date: $EPOCHSECONDS";
    [[ ${tosdr["\"${website//./__}\""]} ]] && \
         printf "%s\n" "tosdr: [\"${tosdr["\"${website//./__}\""]}\"]";
    [[ ${goodonyou["\"${website//./__}\""]} ]] && \
        printf "%s\n" "goodonyou: ${goodonyou["\"${website//./__}\""]}" "goodonyou_source: \"$website\"";
    [[ ${mediabias["\"${website//./__}\""]} ]] && \
        printf "%s\n" "mbfc: ${mediabias["\"${website//./__}\""]}" "mbfc_source: \"$website\"";} > "$resort"

    check_data_glassdoor
    check_data_bcorp 
    
    if [[ ${wdata["\"${website//./__}\""]} ]]; then
        local WIKIDATAIDS=($(sed -e "s/@/ /g" <<< ${wdata["\"${website//./__}\""]} ))
        add_values_from_wikidata 
        check_associated_for_graph 
        [[ -s "$graphfile" ]] && \
            printf "%s\n" "connections: \"/connections/${website//./}.json\"" >> "$resort"
    fi

    printf "%s\n" "buildtime: $(( EPOCHSECONDS - timestart ))" >> "$resort" 
    sed -i "/^{}$/d" "$resort"
    printf "%s\n" "---" > "$outfile"
    sort -u "$resort" >> "$outfile"
    printf "%s\n" "---" >> "$outfile"
    [[ $CONNECTIONOUT ]] && /snap/bin/yq -o j . "$graphfile"
    [[ $RECORDOUT ]] && cat "$outfile"
    [[ $STATUSOUT ]] && { \
        printf "\e[$2;0H %*s %*d %s %*d %2d\n" 100 "($website)" 6 "${lineno//:*/}" "of" 6 "$IDLIST_LENGTH" "$2";
        printf "\e[$split_count;0H"; }
    rm "$resort" 2>/dev/null
}


function do_list(){
    local IDLIST_LENGTH; local lineno; local listno
    local connection="$2"
    IDLIST_LENGTH=$(wc -l < "$1")
    listno=$(find "$STATUSF"/.list.* -maxdepth 1 | grep -Fn "$1" | cut -d: -f1)
    while read -r website; do 
        : $(( lineno += 1))
        do_record "${website}" "${listno}" "$2"
    done < "$1"
}

# rm hugo/content/ -rf 
rm $STATUSF/.list.* &>/dev/null
mode=1
divisor=2
pattern="^"
splitnum=$(printf "%.0f" "$(bc -l <<<"$(wc -l < <(grep "$pattern" websites.list))/$divisor")")
[[ "$mode" == 1 ]] && split -l"$splitnum" <(grep "$pattern" websites.list | shuf) $STATUSF/.list.
[[ "$mode" != 1 ]] && split -l1440 <(grep "$pattern" websites.list ) $STATUSF/.list.
split_count=$(find "$STATUSF"/.list.* -maxdepth 1| wc -l)

#ramcache
mkdir -p hugo/content/db
for list in "$STATUSF"/.list.*; do
    if ! grep -q "sessionIV${list//*./}" <(screen -ls 2>/dev/null); then
        screen -dmS "sessionIV${list//*./}" mongosh --quiet localhost:27017/rop 2>/dev/null
    fi
    do_list "$list" "sessionIV${list//*./}" &
done
[[ $STATUSOUT ]] && clear
wait
while read -r x; do screen -X -S "$x" quit >/dev/null; done < <(screen -ls 2>/dev/null | cut -d. -f2 | sed -e "s/\t.*//g")
~/notification.sh "record_build"
exit 0
