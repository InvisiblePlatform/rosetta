#!/bin/bash
# jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add | {"nodes":.nodes}'

declare -A goodonyou
while IFS=, read -r -a values; do
    goodonyou[${values[0]//./__}]=${values[1]}
done < goodonyou/goodforyou_web_brandid.csv

website="\"ae.com\""
echo ${goodonyou["\"ae__com\""]}
 
