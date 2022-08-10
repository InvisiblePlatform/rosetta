#!/bin/bash

# Universal hash list
function universal_hash_list(){
    tempfile=$(mktemp)
    tempfilehashes=$(mktemp)
    translationlayer=$(mktemp)
    cp ../https-everywhere/masterlist.csv $tempfile
    cut -d, -f 2 $tempfile | sort -u > $tempfilehashes
    while read line; do 
        while read url; do 
            if grep -q "^${url//\./\\\.}" ../entity-radar/website_hash.csv; then
                value=$(grep "^${url//\./\\\.}," ../entity-radar/website_hash.csv)
                [[ $value != '' ]] && printf '%s\n' "$line,$value" | tee -a $translationlayer
                [[ $value != '' ]] && break
            fi
        done < <(grep "$line" $tempfile | cut -d, -f1)
    done < $tempfilehashes
    
    while read line; do
        OLDHASH=$(cut -d, -f1<<<"$line")
        NEWHASH=$(cut -d, -f3<<<"$line")
        sed -i "s/$OLDHASH/$NEWHASH/g" $tempfile
        printf '%s\n' "$OLDHASH -> $NEWHASH"
    done < <(sort -u $translationlayer)
    cat ../entity-radar/website_hash.csv >> $tempfile
    sort -u $tempfile > site_to_hash.csv
    sed -i "s/\r$//g" site_to_hash.csv
    rm $tempfile $tempfilehashes $translationlayer
}

# missing pages
function missing_pages(){
    tempfile=$(mktemp)
    tempfilehashes=$(mktemp)
    translationlayer=$(mktemp)
    cp ../websites.list $tempfile
    cp site_to_hash.csv $tempfilehashes

    while read line; do
        # Skip if we have target for that hash
        if grep -q "^${line//\./\\\.}," $tempfilehashes; then
           hashval=$(grep "^$line," $tempfilehashes | head -1 | cut -d, -f2)
           grep -q "$hashval" $translationlayer && continue
           printf '%s\n' "$hashval,/${line//\./}/" | tee -a $translationlayer
           continue
        fi
    done < $tempfile 

    echo "{" > $tempfile
    while read line; do
        hashval=$(cut -d, -f2 <<<"$line")
        urlval=$(cut -d, -f1 <<<"$line"| sed -e "s/\.//g")
        if grep -q "$hashval" $translationlayer; then
            target=$(grep "$hashval" $translationlayer | head -1| cut -d, -f2 )
            printf '%s\n' "\"/${urlval}/\":{\"t\":\"${target}\"}," | tee -a $tempfile
        fi
    done < $tempfilehashes
    sed -i '$s/,$//g' $tempfile
    echo "}" >> $tempfile
    cp $tempfile replacements.json
    rm $tempfile $tempfilehashes $translationlayer
}

# universal_hash_list
missing_pages

exit 0
# BCorp
../bcorp/website_stub_bcorp.csv
# Glassdoor
../glassdoor/website_glassdoorneo.list
# Goodonyou
../goodonyou/goodforyou_web_brandid.csv
# MBFC
../mbfc/website_bias.csv
# Tosdr
../tosdr/site_id.list
# Wikidata
../wikidata/website_id_list.csv
