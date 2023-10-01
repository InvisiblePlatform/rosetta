#!/bin/bash


# https://query2.finance.yahoo.com/v10/finance/quoteSummary/NFLX?modules=esgScores

mkdir ticker 2>/dev/null
pushd ticker
# while read file; do 
#     jq -r .entities[].claims.P414[].qualifiers.P249[].datavalue.value ../../wikidata/longcache/$file 2>/dev/null| head -1 >> ../tickerlist
# done < <(ls -1 ../../wikidata/longcache/)
# 
# sort -u ../tickerlist > .tickerlisttemp
# mv .tickerlisttemp ../tickerlist
# wc -l ../tickerlist
while read ticker; do 
    if ! [[ -s $ticker.json ]]; then
    curl -s -q --compressed "https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=esgScores" \
        -o $ticker.json
    if [[ -s $ticker.json ]]; then
        jq . $ticker.json
    fi
    sleep 0.5s
    fi
done < ../tickerlist

popd 
