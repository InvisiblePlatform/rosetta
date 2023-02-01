#!/bin/bash
echo "count total: $(cat reviews.list cleaned_justneeded.list| wc -l)"
cd data
find . -type f -empty -print -delete
cd -
echo "count done: $(ls -1 data/ | wc -l)"
while read ID; do
    touch data/$ID.yaml
    URL="https://www.glassdoor.co.uk/Overview/-EI_IE${ID}.htm"
    if [[ $? != 0 ]]; then 
        echo $ID
    else
        if ! [[ -s "data/$ID.yaml" ]]; then
            python3 ./glassdoor_scraper.py "$URL" > data/$ID.yaml
            yq . data/$ID.yaml
            sleep 3s
        fi
        if ! [[ -s "data/$ID.yaml" ]]; then
            echo "$line">> dead_lookout
            echo "[FAIL] $line"
        fi
    fi
    if [[ -s "data/$ID.yaml" ]]; then echo "[SUCC] - $ID"; fi

done < fulllist.list.test

