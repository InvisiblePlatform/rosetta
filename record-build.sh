#!/bin/bash

printf "Build list of websites\n"
websites=$(mktemp)
cut -d, -f1 mbfc/website_bias.csv > $websites
cut -d, -f1 bcorp/website_stub_bcorp.csv >> $websites
cut -d, -f1 goodonyou/goodforyou_web_brandid.csv >> $websites
cut -d, -f1 glassdoor/website-hq-size-type-revenue.csv >> $websites
cut -d, -f1 wikidata/website_id_list.csv >> $websites

cat $websites | tr '[[:upper:]]' '[[:lower:]]' \
    | sed -e "s/www\.//g;s/#.*//g" \
    | sort -u > websites.list

rm $websites
check_data(){
    local WIKIDATAID=$(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
    if ! [[ $WIKIDATAID ]]; then
        if grep -q "\"$1\"" $2; then
            printf "%s\n" "{{< ${2/\/*/} site=\"$1\" >}}" >> hugo/content/${website//./}.md
        fi
    fi
    while read WIKIDATAID; do
        while read site; do
            if grep -q "\"$site\"" $2; then
                printf "%s\n" "{{< ${2/\/*/} site=\"$site\" >}}" >> hugo/content/${website//./}.md
            fi
        done < <(grep "\"$WIKIDATAID\"" wikidata/website_id_list.csv | cut -d, -f1 | sed -e "s/ //g;s/\"//g"| sort -u)
    done < <(grep "\"$1\"" wikidata/website_id_list.csv | cut -d, -f2 | sed -e "s/ //g;s/\"//g" | egrep "^Q")
}
check_data_header(){
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
check_wikidata(){
    if grep -q "\"$1\"" $2; then
        while read code; do
            printf "%s\n" "{{< ${2/\/*/} code=\"$code\" >}}" >> hugo/content/${website//./}.md
            look_for_wikipedia_page $code
        done< <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g"|egrep "^Q")
    fi
}
check_stub(){
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
pairings=("P127;Owner" "P355;Subsidary" "P123;Publisher" "P749;Parent" \
            "P112;Founder" "P488;Chairperson" "P1037;Director")
associates_via_wikidata(){
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
ENTITY='https://www.wikidata.org/entity'
look_for_wikipedia_page(){
   local code=$1 
   if ! [[ -s "wikidata/wikidatacache/$code.json" ]]; then
        wget -qO wikidata/wikidatacache/$code.json "$ENTITY/$code" 
   fi
   local wikipage=$(jq .entities[].sitelinks.enwiki.url wikidata/wikidatacache/$code.json | cut -d/ -f5- | sed -e 's/"//g' | sed -e's@/@%2F@g')
   if [[ -s "wikipedia/pages/$wikipage.md" ]]; then
        printf "%s\n" "{{< wikipedia page=\"$wikipage\" >}}" >> hugo/content/${website//./}.md
   else
    if [[ $wikipage != 'null' ]]; then
     if ! [[ -s "wikipedia/pages/$wikipage.md" ]]; then
         python3 wikipedia/wikipedia_criticism.py "wikipedia/sorted_counted_list_of_sections.csv" "${wikipage}" > wikipedia/pages/$wikipage.md
         if [[ -s "wikipedia/pages/$wikipage.md" ]]; then
             printf "%s\n" "{{< wikipedia page=\"$wikipage\" >}}" >> hugo/content/${website//./}.md
         fi
     fi
    fi
   fi
}
isin_via_wikidata(){
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
tosdr_via_wikidata(){
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

check_tosdr(){
    if grep -q "\"$1\"" $2; then
        ID=$(grep -m1 "\"$1\"" $2 | cut -d, -f2)
        printf "%s\n" "tosdr: \"$ID\" " >> hugo/content/${website//./}.md
    fi
}
check_trustpilot(){
    if [[ -s trust-pilot/sites/trust_site_${1}.json ]]; then
        printf "%s\n" "{{< trust \"data/trust-pilot/sites/trust_site_${1}.json\" >}}" >> hugo/content/${website//./}.md
    fi
}
# rm hugo/content/ -rf
# mkdir -p hugo/content
LISTOFIMPORTANT=$(mktemp)
DATENOW=$(date +%s)
count=0
do_record(){
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
    check_trustpilot "$website"
    check_wikidata "$website" "wikidata/website_id_list.csv"
    isin_via_wikidata "$website" "wikidata/website_id_list.csv"
    associates_via_wikidata "$website" "wikidata/website_id_list.csv"
    LC_COLLATE=C sort -u hugo/content/${website//./}.md \
        | sed "0,/{/{s/^{/---\n{/}" > $resort
    cp $resort hugo/content/${website//./}.md
    printf "%s\n" "---" >> hugo/content/${website//./}.md
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
done < <(sed -e "/\//d;s/\"//g" websites.list | grep ^v)
rm $pids
wait
exit 0
