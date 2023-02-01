#!/bin/bash

while read slug; do
jq ".[] | select(.domain==\"$slug\") " $1 > ./split_files/${slug//\./}.json
done < <(jq -r .[].domain $1)
