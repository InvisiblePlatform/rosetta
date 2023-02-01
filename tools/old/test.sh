#!/bin/bash
pairings=("P127;Owner" "P355;Subsidary" "P123;Publisher" "P749;Parent" \
            "P112;Founder" "P488;Chairperson" "P1037;Director")
for i in ${pairings[*]}; do
    IFS=';' read -a var <<<"$i"
    jq -r .entities[].claims.${var[0]}[].mainsnak.datavalue.value.id wikidata/wikidatacache/Q355.json 2>/dev/null
done
