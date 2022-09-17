#!/bin/bash
ourdir="longcache"
do_line(){
    local i=$1
    if jq .entities[].claims.P856[].mainsnak.datavalue.value $ourdir/$i 2>/dev/null >/dev/null; then
        for j in $(jq .entities[].claims.P856[].mainsnak.datavalue.value $ourdir/$i 2>/dev/null| sed -e "s@http[s]*://@@g;s@/\"@\"@g"); do
            printf "%s\n" "$j,\"${i//.json/}\"" | tee -a website_id_list_new.csv
        done
    fi
    printf "%s\n" "$BASHPID" >> $pids_done
}
pids=$(mktemp)
pids_done=$(mktemp)
#for i in $(ls -1 $ourdir/); do
for i in $(cat wikidataidsfromtitles.list); do
    do_line "$i" &
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
done
rm $pids
wait
exit 0
