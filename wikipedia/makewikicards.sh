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
done < <(ls pages/*.md | sed -e 's/pages\///g;s/\.md//g')

wait
rm $pids $pids_done
