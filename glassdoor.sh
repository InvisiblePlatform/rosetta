#!/bin/bash

while read folder; do
    cat "./glassdoor/data/${folder}/overview.json" 1>/dev/null

done < <(ls -1 glassdoor/data/)
# jq -r ". | [.website, .headquarters, .size, .ctype, .revenue] | @csv" data/*/overview.json | sed -e "s/www\.//g" | sort -u > website-hq-size-type-revenue.csv
