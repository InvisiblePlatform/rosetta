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
    if grep -q "$1" $2; then
        printf "${2/\/*/}: true\n" >> hugo/content/$website.md
    fi
}
while read website; do
    printf "$website\n"
    printf "\s" "---\n" > hugo/content/$website.md
    printf "title: $website\n" >> hugo/content/$website.md
    check_data "$website" "mbfc/website_bias.csv"
    check_data "$website" "bcorp/website_stub_bcorp.csv"
    check_data "$website" "goodonyou/goodforyou_web_brandid.csv"
    check_data "$website" "glassdoor/website-hq-size-type-revenue.csv"
    check_data "$website" "wikidata/website_id_list.csv"
    printf "\s" "---\n" >> hugo/content/$website.md
done < <(sed -e "/\//d;s/\"//g" websites.list)
exit 0
