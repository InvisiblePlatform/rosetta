#!/bin/bash

for i in $(ls data/ -1); do
    SITE=$(yq -r .website data/$i | sed -e "s@http[s]*://@@g;s@www\.@@g")
    if [[ $SITE != "None" && $SITE != "null" && $SITE ]]; then
        yq . ./data/$i | tee data_json/${i/.yaml/}.json
    fi
done

jq -r .website data_json/* \
    | uniq -d \
    > duplicates

rm duplicates_list 2>/dev/null

while read entry; do 
    rg $entry data_json/* \
        | tail -n+2 \
        | tee -a duplicates_list
done < duplicates

sed -i "s/:.*//g;s/data_json\///g;s/\.json//g" duplicates_list 

while read entry; do
    rm "data_json/${entry}.json" "data/${entry}.yaml"
done < duplicates_list

rm duplicates_list duplicates

rm website_glassdoorneo.list
touch website_glassdoorneo.list
for i in $(ls data/ -1); do
    SITE=$(yq -r .website data/$i | sed -e "s@http[s]*://@@g;s@www\.@@g")
    
    if [[ $SITE != "None" && $SITE != "null" && $SITE ]]; then
        printf '%s\n' "\"$SITE\",\"${i/.yaml/}\"" | tee -a website_glassdoorneo.list
    fi
done
