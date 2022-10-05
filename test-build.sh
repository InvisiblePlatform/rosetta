#!/bin/bash
#set -o xtrace

#jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add | {"nodes":.nodes}' wikidata/graph-parts/graph-Q355.json wikidata/graph-parts/graph-Q350.json > $TEMP
#
#
#jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add ' wikidata/graph-parts/graph-Q1336.json $TEMP


#sitehash="fd33606649281874a091e4c1d0243953"
FIELDS=( "bcorp" "emailaddress" "facebookid" "facebookpage" "gabuser" "glassdoor" "goodonyou" "instagramid" "isin" "mastodon" "mbfc" "medium" "officialblog" "parleruser" "patreon" "polalignment" "polideology" "reddituser" "soundcloud" "subreddit" "telegram" "tiktok" "tosdr" "truthsocial" "tumblr" "twitch" "twittername" "yesg" "youtubechannelid" "glassdoor_source" "glassdoor_rating" "glassdoor" "wikidata_id" "mbfc_source" "ticker")

#sitehash=$(grep "^bbc.co.uk," rosetta/site_to_hash.csv | cut -d"," -f2 )
update_with_hash(){
    local sitehash=$1
    local shouldwego=

    while read site; do 
        if [ -s $site ]; then
            shouldwego=0
            printf "%s\n" $site-$1
            break
        fi
    done < <(grep $sitehash rosetta/site_to_hash.csv \
            | cut -d, -f1| sed -e "s/\.//g;s/$/.md/g;s/^/hugo\/content\//g")
    
    [ $shouldwego ] || return
    
    local TEMP=$(mktemp)
    local TEMP2=$(mktemp)
    local TEMP3=$(mktemp)
    grep $sitehash rosetta/site_to_hash.csv \
        | cut -d, -f1| sed -e "s/\.//g;s/$/.md/g;s/^/hugo\/content\//g" \
        | xargs cat 2>/dev/null | sort -u | sed -e "/^date:/d;/^title:/d" > $TEMP

   for field in ${FIELDS[@]}; do
   if grep -q "^$field:" $TEMP; then
       local tempval=$(grep "^$field:" $TEMP | head -1)
       sed -i "/^$field:/d" $TEMP
       printf '%s\n' "$tempval" >> $TEMP
   fi
   done
    
    local dblist=()
    while read db; do 
        [[ -s "$db" ]] && dblist+=("$db")
        done < <(grep $sitehash rosetta/site_to_hash.csv \
            | cut -d, -f1| sed -e "s/\.//g;s/$/.json/g;s/^/hugo\/static\/connections\//g" )
    
    jq -s 'map(to_entries)|flatten|group_by(.key)|map({(.[0].key):map(.value)|add})|add' ${dblist[@]} \
        | jq -r ".links |= unique_by(.source,.target) | .nodes|= unique_by(.id)" \
        > hugo/static/connections/graph_$sitehash.json
    
    sed -i "/^connections:/d" $TEMP
    printf "%s\n" "connections: \"/connections/graph_$sitehash.json\"" >> $TEMP
    
    while read site; do 
    if [ -s $site ]; then
        cp $TEMP $TEMP3
        for field in ${FIELDS[@]}; do
        if grep -q "^$field:" $site; then
            sed -i "/^$field:/d" $TEMP3
        fi
        done
        sed -e "/^connections:/d" $site | cat - $TEMP3 | sort -u \
            | sed "0,/{/{s/^{/---\n{/}" | cat - <(printf "%s\n" "---") \
            | sed -e '/^---/{x;s/^/n/;/^n\{3\}$/{x;d};x}' > $TEMP2

        cp $TEMP2 $site
    fi

    done < <(grep $sitehash rosetta/site_to_hash.csv \
        | cut -d, -f1| sed -e "s/\.//g;s/$/.md/g;s/^/hugo\/content\//g")
rm $TEMP $TEMP2 $TEMP3
}

while read hash; do 
    update_with_hash $hash
done < <(cut -d, -f2 rosetta/site_to_hash.csv | sort | uniq -d )
