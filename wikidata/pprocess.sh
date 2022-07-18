#!/bin/bash
pushd ./id_split
splitnum=$(bc -l <<<"$(sed -e '/#/d' ../$1| wc -l)/5"|cut -d. -f1)
split -l5000 <(sed -e '/#/d' ../$1 | shuf)
NoE=$(sed -e '/#/d' ../$1 | wc -l)
popd
pids=()

watching(){
    while true; do
        TOTALLINE="$(for i in $(ls -1 process_status/*); do printf "$(cat $i | cut -d: -f2) + " ;done; printf "\n")"
        total=$(echo $TOTALLINE | sed -e "s/+$//g" | bc -l)
        statuses=$(for i in $(ls -1 process_status/*); do printf "$(cat $i | sed -e "s/:.*//g") " ;done;)
        printf "${statuses} ($total/$NoE) @$(date "+%D-%H-%m-%S") \n"
        sleep 10s
    done
}

pids=()
for i in $(ls -1 id_split); do
    #ls ./id_split/$i -l
    ./update_wikidatacache_long.sh "./id_split/$i" &
    #pids+=($!)
done

#watching &
#watchingpid=$!

wait ${pids[@]}
#kill $watchingpid

rm id_split/*
rm process_status/*
echo "Done all, cleaned lists"
sed -i "s/# //g" id.list

