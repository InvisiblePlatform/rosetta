#!/bin/bash
temp=$(mktemp)
temp2=$(mktemp)
temp3=$(mktemp)
languages=('eo' 'es' 'de' 'ar' 'zh' 'fr' 'hi' 'en')
for lang in ${languages[@]}; do
while read line; do
    if [[ -s $temp3 ]]; then 
        cp $temp3 $temp2
    fi

    top=$(echo $line | cut -d, -f1 | sed -e "s/\"//g" | cut -d. -f1)
    key=$(echo $line | cut -d, -f1 | sed -e "s/\"//g" | cut -d. -f2)
    string=$(echo $line | cut -d, -f2- | sed -e "s/\"//g")
    jq . > $temp <<EOF
    {"$top": {
        "$key": "$string"
    }}
EOF
    if [[ -s $temp2 ]]; then 
        jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add ' $temp $temp2 > $temp3
    else 
        cp $temp $temp2
    fi


done < $lang.csv

jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add ' $temp3 ../static/i18n/$lang.json > $lang.json

jq . $lang.json

rm $temp $temp2 $temp3
done 

