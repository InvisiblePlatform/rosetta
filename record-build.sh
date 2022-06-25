#!/bin/bash

printf "Build list of websites\n"
websites=$(mktemp)
cut -d, -f1 mbfc/website_bias.csv > $websites
cut -d, -f1 bcorp/website_stub_bcorp.csv >> $websites
cut -d, -f1 goodonyou/goodforyou_web_brandid.csv >> $websites
cut -d, -f1 glassdoor/website-hq-size-type-revenue.csv >> $websites
cut -d, -f1 wikidata/website_id_list.csv >> $websites

sort -u $websites > websites.list
rm $websites
check_data(){
    if grep -q "\"$1\"" $2; then
        printf "{{< ${2/\/*/} site=\"$1\" >}}\n" >> hugo/content/${website//./}.md
    fi
}
check_wikidata(){
    if grep -q "\"$1\"" $2; then
        while read code; do
            printf "{{< ${2/\/*/} code=\"$code\" >}}\n" >> hugo/content/${website//./}.md
            look_for_wikipedia_page $code
        done< <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g"|egrep "^Q")
    fi
}
check_stub(){
    if grep -q "\"$1\"" $2; then
        while read code; do
            printf "{{< ${2/\/*/} gid=\"$code\" >}}\n" >> hugo/content/${website//./}.md
        done< <(grep "\"$1\"" $2 | cut -d, -f2|sed -e "s/ //g;s/\"//g")
    fi
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
            look_for_wikipedia_page $id
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
   if [[ $wikipage != 'null' ]]; then
    if ! [[ -s "wikipedia/pages/$wikipage.md" ]]; then
        python3 wikipedia/wikipedia_criticism.py "wikipedia/sorted_counted_list_of_sections.csv" "${wikipage}" > wikipedia/pages/$wikipage.md
        printf "%s\n" "{{< wikipedia page=\"$wikipage\" >}}" >> hugo/content/${website//./}.md
    else
        printf "%s\n" "{{< wikipedia page=\"$wikipage\" >}}" >> hugo/content/${website//./}.md
    fi
   fi
}
rm hugo/content/ -rf
mkdir -p hugo/content
LISTOFIMPORTANT=$(mktemp)
DATENOW=$(date +%s)
count=0
do_record(){
    local website="$1"
    printf "%s\n" "---" > hugo/content/${website//./}.md
    printf "title: \"$website\"\n" >> hugo/content/${website//./}.md
    printf "date: $DATENOW\n" >> hugo/content/${website//./}.md
    printf "published: true\n" >> hugo/content/${website//./}.md
    printf "%s\n" "---" >> hugo/content/${website//./}.md
    check_data "$website" "mbfc/website_bias.csv"
    check_stub "$website" "bcorp/website_stub_bcorp.csv"
    check_stub "$website" "goodonyou/goodforyou_web_brandid.csv"
    check_stub "$website" "glassdoor/glassdoor_index.csv"
    check_wikidata "$website" "wikidata/website_id_list.csv"
    associates_via_wikidata "$website" "wikidata/website_id_list.csv"
    printf "$website\n"
}
while read website; do
    do_record "$website" &
    if [ $count -gt 50 ]; then
        sleep 5s
        count=0
    fi
    : $(( count += 1))
done < <(sed -e "/\//d;s/\"//g" websites.list)
wait
exit 0
