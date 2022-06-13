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
rm hugo/content/ -rf
mkdir -p hugo/content
while read website; do
    printf "$website\n"
    printf "%s\n" "---" > hugo/content/${website//./}.md
    printf "title: $website\n" >> hugo/content/${website//./}.md
    printf "date: 2019-03-26T08:47:11+01:00\n" >> hugo/content/${website//./}.md
    # printf "type: post\n" >> hugo/content/$website.md
    printf "published: true\n" >> hugo/content/${website//./}.md
    printf "%s\n" "---" >> hugo/content/${website//./}.md
    check_data "$website" "mbfc/website_bias.csv"
    check_stub "$website" "bcorp/website_stub_bcorp.csv"
    check_stub "$website" "goodonyou/goodforyou_web_brandid.csv"
    check_data "$website" "glassdoor/website-hq-size-type-revenue.csv"
    check_wikidata "$website" "wikidata/website_id_list.csv"
done < <(sed -e "/\//d;s/\"//g" websites.list)
exit 0
