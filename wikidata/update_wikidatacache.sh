#!/bin/bash
# set -euo pipefail 
IFS=$'\n\t'
SCRIPTDIR=$(dirname $0)
# LOOKUP='lookup.list'
LOOKUP="${1:-lookup.list}"
pushd $SCRIPTDIR >/dev/null
NoE=$(cat $LOOKUP | wc -l)
COUNT=0
while read IDsmall; do
      : $(( COUNT += 1 ))
      ID=$(jq -r '.[0]' <<<"$IDsmall")
      #ID=$IDsmall
      PERC=$(bc -l <<<"result = ($COUNT / $NoE) * 100; scale=3; result / 1")
      (( $COUNT % 100 == 0 )) && printf "$LOOKUP: $ID ($COUNT / $NoE) $PERC \n"
      ENTITY='https://www.wikidata.org/entity'
      #if ! [[ -s "../wikidatacache/$ID.json" ]]; then
            wget -qO ./wikidatacache/$ID.json "$ENTITY/$ID" 
      #fi
done < $LOOKUP

popd
