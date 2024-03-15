#!/bin/bash
#set -x
temp=$(mktemp)
temp2=$(mktemp)
temp3=$(mktemp)
languages=('eo' 'es' 'de' 'ar' 'zh' 'fr' 'hi' 'en' 'ca')
#languages=('en')
for lang in ${languages[@]}; do
while read line; do
    if [[ -s $temp3 ]]; then 
        cp $temp3 $temp2
    fi

    top=$(echo $line | cut -d, -f1 | sed -e "s/\"//g" | cut -d. -f1)
    key=$(echo $line | cut -d, -f1 | sed -e "s/\"//g" | cut -d. -f2)
    string=$(printf '%s' "${line}" | cut -d, -f2- | sed -e "s/\"//g")

    obj="{\"${top}\": {\"${key}\": \"${string}\"}}" 

    echo "$obj" | jq . > $temp


    if [[ -s $temp2 ]]; then 
        jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add ' $temp $temp2 > $temp3
    else 
        cp $temp $temp2
    fi


done < $lang.csv

jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add ' ../static/i18n/$lang.json $temp3 > $lang.json

jq . $lang.json

rm $temp $temp2 $temp3
done 

