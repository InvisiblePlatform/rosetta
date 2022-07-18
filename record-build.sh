#!/bin/bash

printf "Build list of websites\n"
websites=$(mktemp)
cut -d, -f1 \
    mbfc/website_bias.csv \
    bcorp/website_stub_bcorp.csv \
    goodonyou/goodforyou_web_brandid.csv \
    glassdoor/website-hq-size-type-revenue.csv \
    wikidata/website_id_list.csv \
    > $websites

ENTITY='https://www.wikidata.org/entity'
pairings=("P355;Subsidary;Subsidary_of" \
          "P127;Owned_by;Owner_of" \
          "P123;Published_by;Publisher_of" \
          "P749;Parent_Company;Parent_Company_of" \
          "P112;Founded_by;Founder_of" \
          "P488;Chaired_by;Chairperson_of" \
          "P1037;Directed_by;Director_of")
secondorder_pairings=("P355;Subsidary;Subsidary_of" \
                      "P127;Owned_by;Owner_of" \
                      "P123;Published_by;Publisher_of" \
                      "P749;Parent_Company;Parent_Company_of" \
                      "P112;Founded_by;Founder_of" \
                      "P488;Chaired_by;Chairperson_of" \
                      "P1037;Directed_by;Director_of")
third_order_pairings=("P127;Owned_by;Owner_of" \
                      "P123;Published_by;Publisher_of" \
                      "P749;Parent_Company;Parent_Company_of" \
                      "P112;Founded_by;Founder_of" \
                      "P488;Chaired_by;Chairperson_of" \
                      "P1037;Directed_by;Director_of")

cat $websites | tr '[[:upper:]]' '[[:lower:]]' \
    | sed -e "s/www[0-9]*\.//g;s/?[^/]*$//g" \
    | sed -e "/\//d;s/\"//g;/^$/d" \
    | sort -u > websites.list
rm $websites

function check_data(){
    local WIKIDATAID=$(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
    if ! [[ $WIKIDATAID ]]; then
        if grep -q "\"$1\"" $2; then
            printf "%s\n" "{{< a${2/\/*/} site=\"$1\" >}}" >> hugo/content/${website//./}.md
        fi
    fi
    while read WIKIDATAID; do
        while read site; do
            if grep -q "\"$site\"" $2; then
                printf "%s\n" "{{< a${2/\/*/} site=\"$site\" >}}" >> hugo/content/${website//./}.md
            fi
        done < <(grep "\"$WIKIDATAID\"" wikidata/website_id_list.csv | cut -d, -f1 | sed -e "s/ //g;s/\"//g"| sort -u)
    done < <(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
}
function check_data_header(){
    local WIKIDATAID=$(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
    if ! [[ $WIKIDATAID ]]; then
        if grep -q "\"$1\"" $2; then
            printf "%s\n" "${2/\/*/}: \"$1\"" >> hugo/content/${website//./}.md
        fi
    fi
    while read WIKIDATAID; do
        while read site; do
            if grep -q "\"$site\"" $2; then
                printf "%s\n" "${2/\/*/}: \"$site\"" >> hugo/content/${website//./}.md
            fi
        done < <(grep "\"$WIKIDATAID\"" wikidata/website_id_list.csv | cut -d, -f1 | sed -e "s/ //g;s/\"//g"| sort -u)
    done < <(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
}
function check_wikidata(){
    if grep -q "\"$1\"" $2; then
        while read code; do
            printf "%s\n" "{{< a${2/\/*/} code=\"$code\" >}}" >> hugo/content/${website//./}.md
            # look_for_wikipedia_page $code
        done< <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g"|egrep "^Q")
    fi
}
function check_stub(){
    # needs to look up against wikidata to resolve other domains before commiting to the 
    # page
    local WIKIDATAID=$(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
    if ! [[ $WIKIDATAID ]]; then 
        if grep -q "\"$1\"" $2; then
            while read code; do
                printf "%s\n" "{{< ${2/\/*/} gid=\"$code\" >}}" >> hugo/content/${website//./}.md
            done< <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g")
        fi
    fi
    while read WIKIDATAID; do
        while read site; do
            if grep -q "\"$site\"" $2; then
                while read code; do
                    printf "%s\n" "{{< ${2/\/*/} gid=\"$code\" >}}" >> hugo/content/${website//./}.md
                done< <(grep "\"$site\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g")
            fi
        done < <(grep "\"$WIKIDATAID\"" wikidata/website_id_list.csv | cut -d, -f1 | sed -e "s/ //g;s/\"//g" | sort -u)
    done < <(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")

}
function associates_via_wikidata(){
    local tempfile=$(mktemp)
    if grep -q "\"$1\"" $2; then
        while read code; do
            for pairing in ${pairings[*]}; do
                IFS=';' read -a var <<<"$pairing"
                jq -r .entities[].claims.${var[0]}[].mainsnak.datavalue.value.id wikidata/wikidatacache/$code.json 2>/dev/null >> $tempfile
            done
        done< <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g"|egrep "^Q")
        while read id; do
            if ! grep -q "^$id$" <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g"|egrep "^Q"); then
                look_for_wikipedia_page $id
            fi
        done < <(sort -u $tempfile)
    fi
    rm $tempfile
}
function look_for_wikipedia_page(){
   local code=$1 
   if ! [[ -s "wikidata/wikidatacache/$code.json" ]]; then
        wget -qO wikidata/wikidatacache/$code.json "$ENTITY/$code" 
   fi
   local wikipage=$(jq .entities[].sitelinks.enwiki.url wikidata/wikidatacache/$code.json | cut -d/ -f5- | sed -e 's/"//g' | sed -e's@/@%2F@g')
   if [[ -s "wikipedia/pages/$wikipage.md" ]]; then
        printf "%s\n" "$wikipage" >> wikipage.list
        printf "%s\n" "{{< wikipedia \"$wikipage\" "$1" "$2" ${3//@/ }>}}" >> hugo/content/${website//./}.md
   else
    if [[ $wikipage && $wikipage != 'null' ]]; then
     if ! [[ -s "wikipedia/pages/$wikipage.md" ]]; then
         python3 wikipedia/wikipedia_criticism.py "wikipedia/sorted_counted_list_of_sections.csv" "${wikipage}" > wikipedia/pages/$wikipage.md
         printf "%s\n" "$wikipage" >> wikipage.list
         if [[ -s "wikipedia/pages/$wikipage.md" ]]; then
             printf "%s\n" "{{< wikipedia \"$wikipage\" "$1" "$2" ${3//@/ }>}}" >> hugo/content/${website//./}.md
         fi
     fi
    fi
   fi
   # if [[ -s "wikipedia/wikicard/$wikipage.html" ]]; then
   #      printf "%s\n" "{{< wikipedia \"$wikipage\" ${2//@/ }>}}" >> hugo/content/${website//./}.md
   # else
   #  if [[ $wikipage != 'null' ]]; then
   #   if ! [[ -s "wikipedia/pages/$wikipage.md" ]]; then
   #       python3 wikipedia/wikipedia_criticism.py "wikipedia/sorted_counted_list_of_sections.csv" "${wikipage}" > wikipedia/pages/$wikipage.md
   #       if [[ -s "wikipedia/pages/$wikipage.md" ]]; then
   #           printf "%s\n" "{{< wikipedia \"$wikipage\" ${2//@/ }>}}" >> hugo/content/${website//./}.md
   #       fi
   #   fi
   #  fi
   # fi
}
function isin_via_wikidata(){
    local tempfile=$(mktemp)
    # local WIKIDATAID=$(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
    while read WIKIDATAID; do
    while read site; do
    if grep -q "\"$site\"" $2; then
        while read code; do
            jq -r .entities[].claims.P946[].mainsnak.datavalue.value wikidata/wikidatacache/$code.json 2>/dev/null >> $tempfile
        done< <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g"|egrep "^Q")
        while read isin; do
            while read file; do
                printf "%s\n" "{{< isin file=\"$file\" id=\"$isin\" >}}" >> hugo/content/${website//./}.md
            done < <(rg $isin static/*.json | cut -d: -f1)
        done < <(sort -u $tempfile | sed -e "s/null//g")
    fi
    done < <(grep "\"$WIKIDATAID\"" wikidata/website_id_list.csv | cut -d, -f1 | sed -e "s/ //g;s/\"//g" | sort -u)
    done < <(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
    rm $tempfile
}
function tosdr_via_wikidata(){
    local tempfile=$(mktemp)
    # local WIKIDATAID=$(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
    while read WIKIDATAID; do
    while read site; do
    if grep -q "\"$site\"" $2; then
        while read code; do
            for pairing in ${pairings[*]}; do
                IFS=';' read -a var <<<"$pairing"
                jq -r .entities[].claims.P8525[].mainsnak.datavalue.value wikidata/wikidatacache/$code.json 2>/dev/null >> $tempfile
            done
        done< <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g"|egrep "^Q")
        while read isin; do
            printf "%s\n" "tosdr: \"$isin\" " >> hugo/content/${website//./}.md
        done < <(sort -u $tempfile)
    fi
    done < <(grep "\"$WIKIDATAID\"" wikidata/website_id_list.csv | cut -d, -f1 | sed -e "s/ //g;s/\"//g" | sort -u)
    done < <(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
    rm $tempfile
}
function check_tosdr(){
    if grep -q "\"$1\"" $2; then
        ID=$(grep -m1 "\"$1\"" $2 | cut -d, -f2)
        printf "%s\n" "tosdr: \"$ID\" " >> hugo/content/${website//./}.md
    fi
}
function check_trustpilot(){
    if [[ -s trust-pilot/sites/trust_site_${1}.json ]]; then
        printf "%s\n" "{{< trust \"data/trust-pilot/sites/trust_site_${1}.json\" >}}" >> hugo/content/${website//./}.md
    fi
}
function owned_wikiassociates(){
    local tempfile=$(mktemp)
    local temptilesmall=$(mktemp)
    if grep -q "\"$1\"" $2; then
        while read code; do # Main Company
            # echo "TOP: $code"
            for pairing in ${pairings[@]}; do # Categories
                IFS=';' read -a var <<<"${pairing}"
                while read line ; do # Important Companies to Main
                echo "\"${var[0]}:$line:${var[1]}:1\"" >> ${temptilesmall}_$code
                    for pairinga in ${secondorder_pairings[@]}; do # Categories
                        IFS=';' read -a varx <<<"${pairinga}"
                        while read relation; do # Important Companies to Important Companies to Main
                            echo "\"${varx[0]}:$line:${varx[2]}:2\"" >> ${temptilesmall}_$relation
                            for pairingx in ${third_order_pairings[@]}; do # Categories
                                IFS=';' read -a vary <<<"${pairingx}"
                                while read deeper; do # Owning to the Important Companies to Important Companies to Main
                                    echo "\"${vary[0]}:$relation:${vary[2]}:3\"" >> ${temptilesmall}_$deeper
                                done < <(jq -r .entities[].claims.${vary[0]}[].mainsnak.datavalue.value.id wikidata/wikidatacache/$relation.json 2>/dev/null)
                            done
                        done < <(jq -r .entities[].claims.${varx[0]}[].mainsnak.datavalue.value.id wikidata/wikidatacache/$line.json 2>/dev/null)
                    done
                done < <(jq -r .entities[].claims.${var[0]}[].mainsnak.datavalue.value.id wikidata/wikidatacache/$code.json 2>/dev/null)
            done
        done< <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g"|egrep "^Q")

        while read relation; do 
            : $(( relationco -= 1))
            local RELATION_ID=$(sed -e 's/[^_]*_//g' <<< "$relation")
            # local linco=$(sort -u $relation | wc -l | cut -d' ' -f1)
            local oneline=$(sort -u $relation | tr '\n' '@')
            if grep -q ":1" "$relation"; then
                look_for_wikipedia_page "${RELATION_ID}" "1" $oneline
            else 
                look_for_wikipedia_page "${RELATION_ID}" "2" $oneline
            fi
        done < <(ls -1 ${temptilesmall}_* 2>/dev/null)

        # while read id; do
        #     if ! grep -q "^$id$" <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g"|egrep "^Q"); then
        #         look_for_wikipedia_page $id
        #     fi
        # done < <(sort -u $tempfile)
    fi
    
    rm $tempfile ${temptilesmall}_* 2>/dev/null
}
rm hugo/content/ -rf
mkdir -p hugo/content
LISTOFIMPORTANT=$(mktemp)
DATENOW=$(date +%s)
count=0
function do_record(){
    local resort=$(mktemp)
    local website="$1"
    printf "%s\n" "---" > hugo/content/${website//./}.md
    printf "%s\n" "title: \"$website\"" >> hugo/content/${website//./}.md
    printf "%s\n" "date: $DATENOW" >> hugo/content/${website//./}.md
    # tosdr_via_wikidata "$website" "wikidata/website_id_list.csv"
    check_tosdr "$website" "tosdr/site_id.list"
    check_data_header "$website" "mbfc/website_bias.csv"
    printf "%s\n" "published: true" >> hugo/content/${website//./}.md
    printf "%s\n" "---" >> hugo/content/${website//./}.md
    check_stub "$website" "bcorp/website_stub_bcorp.csv"
    check_stub "$website" "goodonyou/goodforyou_web_brandid.csv"
    check_stub "$website" "glassdoor/glassdoor_index.csv"
    check_wikidata "$website" "wikidata/website_id_list.csv"
    isin_via_wikidata "$website" "wikidata/website_id_list.csv"
    # associates_via_wikidata "$website" "wikidata/website_id_list.csv"
    owned_wikiassociates "$website" "wikidata/website_id_list.csv"
    LC_COLLATE=C sort -u hugo/content/${website//./}.md \
        | sed "0,/{/{s/^{/---\n{/}" > $resort
    cp $resort hugo/content/${website//./}.md
    printf "%s\n" "---" >> hugo/content/${website//./}.md
    sed -i '/^---/{x;s/^/n/;/^n\{3\}$/{x;d};x}' hugo/content/${website//./}.md
    printf "%s\n" "$website"
    printf "%s\n" "$BASHPID" >> $pids_done
}
# Make a stack of 8 procs that we count and add too if lower than that amount
# each coproc removes inself from the stack when it finishes
pids=$(mktemp)
pids_done=$(mktemp)
while read website; do
    do_record "$website" &
    lastpid=$!
    printf "%s\n" "$lastpid" >> $pids
    until [[ "$(sort $pids $pids_done | uniq -u | wc -l)" -lt "25" ]]; do
        echo "######################## waiting $count"
        if [[ "$count" -gt "10" ]]; then
            sleep 5s
            sort $pids $pids_done | uniq -u
            echo "" > $pids
            echo "" > $pids_done
        fi
        : $(( count += 1))
        sleep 1
    done
    count=0
done < <(grep "^" websites.list )
rm $pids
wait
exit 0
