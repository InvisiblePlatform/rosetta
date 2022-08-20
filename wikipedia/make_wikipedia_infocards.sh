#!/bin/bash

pids=$(mktemp)
pids_done=$(mktemp)
do_wikicard(){
    local page="$1"
    python3 ./wikipedia_infocard.py "https://en.wikipedia.org/wiki/$page" > wikicard/wc_$page.html
    if [[ -s "wikicard/wc_$page.html" ]]; then
        printf "%s\n" "$page"
    else
        printf "%s\n" "# $page"
    fi
    printf "%s\n" "$BASHPID" >> $pids_done
}

while read page; do
    if ! [[ -s "wikicard/wc_$page.html" ]]; then
    do_wikicard "$page" &
    lastpid=$!
    printf "%s\n" "$lastpid" >> $pids
    until [[ "$(sort $pids $pids_done | uniq -u | wc -l)" -lt "25" ]]; do
        echo "######################## waiting $count"
        if [[ "$count" -gt "10" ]]; then
            sleep 5s
            sort $pids $pids_done | uniq -u
            echo "" > $pids
            echo "" > $pids_done
        fi
        : $(( count += 1))
        sleep 1
    done
    count=0
    fi
done < <(ls -1 pages/ | sed -e 's/pages\///g;s/\.md//g')

wait
rm $pids $pids_done

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

