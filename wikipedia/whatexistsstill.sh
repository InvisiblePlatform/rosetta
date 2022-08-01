#!/bin/bash

while read entry; do 
    page=$(cut -d, -f2 <<< "$entry" | sed -e "s/\"//g")
    if [[ -s "pages/${page}.md" ]]; then
        echo "$entry" | tee -a website_wikipage.csv
    fi
done < ./clean-noslash.csv
