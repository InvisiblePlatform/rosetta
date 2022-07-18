#!/bin/bash

for i in $(ls -1 wikicard/); do
    sed -i "/^None$/d" wikicard/$i
    printf "%s\n" "$i"
done
cd wikicard
ls -1 | wc -l
find . -type f -empty -print -delete
ls -1 | wc -l
cd -
for i in $(ls -1 wikicard/); do
    sed -i "s/<\/sup>/�/g" wikicard/$i
    sed -i "s/<sup [^>]*>[^�]*�//g;" wikicard/$i
    sed -i "s/\"\/\//\"https:\/\//g" wikicard/$i
    sed -i "s/href=\"\//href=\"https:\/\/en.wikipedia.org\//g" wikicard/$i
    printf "%s\n" "$i"
done
