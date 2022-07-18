#!/bin/bash
for i in $(ls -1 cache/hugo/filecache/getjson); do 
    ID=$(jq -r ".entities|keys[]" cache/hugo/filecache/getjson/$i)
    if ! [[ -s "./data/wikidata/longcache/$ID.json" ]]; then
        printf "%s\n" "$i - $ID"
        cp cache/hugo/filecache/getjson/$i ./data/wikidata/longcache/$ID.json 
        rm cache/hugo/filecache/getjson/$i
    else
        rm cache/hugo/filecache/getjson/$i
    fi
done
