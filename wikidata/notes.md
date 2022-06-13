jq '. | {(.[0]|tostring):{id: .[0], wp:.[1], name: .[2]}}' lookup.list > lookup.list.1
