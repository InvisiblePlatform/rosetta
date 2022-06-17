jq '. | {(.[0]|tostring):{id: .[0], wp:.[1], name: .[2]}}' lookup.list > lookup.list.1

jq ".entities[] | {(.id|tostring):.labels.en.value}" properties_cache/*.json
