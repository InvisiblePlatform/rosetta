#!/bin/bash

touch wikititle_id.csv
while read line; do 
    wikititle=$(cut -d, -f2 <<<${line} | sed -e "s/\"//g")
    website=$(cut -d, -f1 <<<${line} | sed -e "s/\"//g")
    if ! grep -q "\"$wikititle\"" wikititle_id.csv; then
        ID=$(wget -qO- "https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&format=json&titles=${wikititle}" | jq -r .query.pages[].pageprops.wikibase_item)
        printf "%s\n" "\"${wikititle}\",\"${website}\",\"$ID\"" | tee -a wikititle_id.csv
        sleep 0.5s
    fi
done < website_wikipage.csv
