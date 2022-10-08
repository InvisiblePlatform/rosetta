#!/bin/bash

rg -o 'data-i18n="[^"]*"' public/ | cut -d: -f2 | sort -u | cut -d'=' -f2 > translatables

exit 
languages=('eo' 'es' 'de' 'ar' 'zh' 'fr' 'hi')
while read line; do
    string=$(echo $line | cut -d, -f2-)
    id=$(echo $line | cut -d, -f1)

    for language in ${languages[@]}; do
        translated_string=$(trans -b en:$language "$string")
        echo "$id,$translated_string" | tee -a testDir/$language.csv
    done
done < ./translatables


