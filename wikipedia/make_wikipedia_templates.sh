#!/bin/bash

rm ./wikipedia_templates -rf
mkdir wikipedia_templates
while read line; do 
if [[ -s "./wikipedia_templates/`cut -d, -f1 <<<"$line" | sed -e 's/\"//g;s/\.//g'`.md" ]]; then
    printf '%s\n' "{{< wikipedia `cut -d, -f2 <<<"$line"` >}}" >> ./wikipedia_templates/$(cut -d, -f1 <<<"$line" | sed -e "s/\"//g;s/\.//g").md
    printf "%s\n" "$line"
    continue
fi
cat <<EOF > ./wikipedia_templates/$(cut -d, -f1 <<<"$line" | sed -e "s/\"//g;s/\.//g").md
---
title: $(cut -d, -f1 <<<"$line")
date: 1659323074
---
{{< wikipedia $(cut -d, -f2 <<<"$line") >}}
EOF

printf "%s\n" "$line"
done < ./website_wikipage.csv
