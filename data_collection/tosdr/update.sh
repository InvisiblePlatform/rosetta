#!/bin/bash
wget https://tosdr.org/api/1/all.json -O all.json

jq -r 'map(select(type == "object")) |  del(.[].documents) | del(.[].logo) | del(.[].slug) | del(.[].points)| del(.[].name) | . | map({(.id|tostring):.}) | add' all.json > rated.json
python ./clean_entities.py

  #"tosdr/data/version": 1698077405,
