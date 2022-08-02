#!/bin/bash

# Still need to clean any single or 0 line files
rm website_glassdoorneo.list
touch website_glassdoorneo.list
for i in $(ls data/ -1); do
    SITE=$(yq -r .website data/$i | sed -e "s@http[s]*://@@g;s@www\.@@g")
    
    if [[ $SITE != "None" && $SITE != "null" && $SITE ]]; then
        printf '%s\n' "\"$SITE\",\"${i/.yaml/}\"" | tee -a website_glassdoorneo.list
        yq . ./data/$i > data_json/${i/.yaml/}.json
    fi
done
