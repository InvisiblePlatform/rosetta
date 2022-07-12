#!/bin/bash

for i in $(ls -1 wikicard/); do
    sed -i "/^None$/d" wikicard/$i
    printf "%s\n" "$i"
done
cd wikicard
find . -type f -empty -print -delete
cd -
