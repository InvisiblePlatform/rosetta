#!/bin/bash

# wget -O master.zip https://github.com/EFForg/https-everywhere/archive/refs/heads/master.zip
# 
# unzip master.zip 
# mv https-everywhere-master/src/chrome/content/rules/ .
# rm https-everywhere-master/ -rf 
# rm rules/00README

mkdir lists
rm masterlist.csv 2>/dev/null
while read item; do 
    xq -r '.ruleset.target[]["@host"]' rules/$item.xml > lists/$item.list
    MD5=$(head -1 lists/$item.list | md5sum | cut -d' ' -f1)
    sed -i "s/$/,$MD5/g" lists/$item.list
    cat lists/$item.list >> masterlist.csv
    printf '%s\n' "$item"
done < <(ls -1 rules/ | sed -e "s/\.xml$//g")

sed -i "s/^www\.//g" masterlist.csv
