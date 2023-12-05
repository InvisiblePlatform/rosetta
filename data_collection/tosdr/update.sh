#!/bin/bash
wget https://tosdr.org/api/1/all.json -O all.json

# jq -r ' to_entries[] | select(.key | strings | test("review")) | [.key, .value.id] | @csv' all.json \
#     | sed -e "s@tosdr/review/@@g" \
#     | sed -e "s@http[s]*://@@g" -e "s@www\.@@g"\
#     > site_id.list

jq -r 'map(select(type == "object")) |  del(.[].documents) | del(.[].logo) | del(.[].slug) | del(.[].points)| del(.[].name) | . | map({(.id|tostring):.}) | add' all.json > rated.json
python ./clean_entities.py

  #"tosdr/data/version": 1698077405,
