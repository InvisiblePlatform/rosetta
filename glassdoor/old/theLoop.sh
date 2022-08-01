#!/bin/bash
echo "count total: $(cat reviews.list cleaned_justneeded.list| wc -l)"
cd data
find . -type f -empty -print -delete
cd -
echo "count done: $(ls -1 data/ | wc -l)"
while read line; do
    ID=$(echo $line \
        | sed -e "s@https://www\.glassdoor\.com/@@g;s@https://www.glassdoor\.co\.uk/@@g" \
        | sed -e "s@Reviews/@@g;s@Overview/@@g;s@Working-at-@@g;s@\..*\$@@g")
    touch data/$ID.yaml
    if [[ $? != 0 ]]; then 
        echo $line
    else
        if ! [[ -s "data/$ID.yaml" ]]; then
            python3 ./glassdoor_scraper.py "$line" > data/$ID.yaml
        fi
        if ! [[ -s "data/$ID.yaml" ]]; then
            echo "$line">> dead_lookout
            echo "[FAIL] $line"
        fi
    fi
    if [[ -s "data/$ID.yaml" ]]; then echo "[SUCC] - $line"; fi

done < <(shuf fulllist.list)
