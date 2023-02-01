jq '. | {(.[0]|tostring):{id: .[0], wp:.[1], name: .[2]}}' lookup.list > lookup.list.1

jq ".entities[] | {(.id|tostring):.labels.en.value}" properties_cache/*.json

cut -d, -f1,4 query-1301371.csv | awk -F"," '{ print $2,$1}' | sed -e "s@http://www.wikidata.org/entity/@@g;s@http[s]*://@@g" | sed -e "s/\/$//g" | sed -e "s/ /\",\"/g;s/^/\"/g;s/$/\"/g"

jq .entities[].claims.P1630[].mainsnak.datavalue.value properties_cache/P2003.json
