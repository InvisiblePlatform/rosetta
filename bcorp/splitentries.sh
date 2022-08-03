#!/bin/bash

while read slug; do
jq ".[] | select(.slug==\"$slug\") " combined_data.json > ./split_files/bcorp_$slug.json
done < <(jq -r .[].slug $1)
