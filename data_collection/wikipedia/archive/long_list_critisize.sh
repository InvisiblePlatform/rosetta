#!/bin/bash

do_page(){
    local line="${1//\//%26}"
    if ! [[ -s "pages/${line}.md" ]]; then
        if ! grep -q "${line}" adone.list; then
            printf "%s\n" "${line}" | tee -a adone.list
                python3 ./wikipedia_criticism.py \
                    "sorted_counted_list_of_sections.csv" "${line}" \
                    > pages/${line}.md
            sleep 0.5s
        fi
    fi
    printf "%s\n" "$BASHPID" >> $pids_done
}

pids=$(mktemp)
pids_done=$(mktemp)
while read line; do
    do_page "${line}" &
    lastpid=$!
    printf "%s\n" "$lastpid" >> $pids
    until [[ "$(sort $pids $pids_done | uniq -u | wc -l)" -lt "20" ]]; do
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
done < <( cut -d, -f2- ./clean-noslash.csv \
    | sort -u | sed -e "s/\"//g" )

wait
rm $pids $pids_done

