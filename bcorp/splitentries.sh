#!/bin/bash

while read slug; do
jq ".[] | select(.slug| test(\"$slug\")?) " combined_data.json > ./split_files/bcorp_$slug.json
done < <(jq -r .[].slug combined_data.json)
