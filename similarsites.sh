#!/bin/bash

do_site(){
    curl -s --request GET \
  --url https://www.similarsites.com/api/site/${1} \
  --header 'accept: */*' \
  --header 'accept-language: en-GB,en;q=0.9,en-US;q=0.8' \
  --header 'authority: www.similarsites.com' \
  --header 'referer: https://www.similarsites.com/' \
  --header 'sec-ch-ua: " Not;A Brand";v="99", "Microsoft Edge";v="103", "Chromium";v="103"' \
  --header 'sec-fetch-mode: cors' \
  --header 'sec-fetch-site: same-origin' \
  --header 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36 Edg/103.0.1264.44' \
  --compressed -o sites/similar_site_${1}.json
}

count=0
pushd similar-sites
mkdir sites
while read -a site; do
    if ! [[ -s "sites/similar_site_${site}.json" ]]; then
        do_site "$site"    
        jq .SimilarSites[0].Site sites/similar_site_$site.json
        sleep 1s
    fi
done < <( cut -d, -f1 ../wikidata/website_id_list.csv | sort -u | sed -e "s/\"//g" -e "s/\/[^\"]*\"//g" | sed -e "/\//d" | sort -u)
popd
