#!/bin/bash

source ./trust-categories.sh

do_category(){
    curl "https://www.trustpilot.com/_next/data/categoriespages-consumersite-1721/categories/${1}.json?page=${2}&categoryId=${1}" \
  -H 'authority: www.trustpilot.com' \
  -H 'accept: */*' \
  -H 'accept-language: en-GB,en;q=0.9,en-US;q=0.8' \
  -H 'sec-ch-ua: " Not A;Brand";v="99", "Chromium";v="102", "Microsoft Edge";v="102"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.4972.0 Safari/537.36 Edg/102.0.1224.0' \
    --compressed  -o trust_page_${1}_${2}.json
}

do_site(){
    curl -s "https://api.trustpilot.com/v1/business-units/find?name=${1}" \
  -H 'Accept: */*' \
  -H 'Accept-Language: en-GB,en;q=0.9,en-US;q=0.8' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: cross-site' \
  -H 'apikey: FuH31qwqA19HaAeAiGCD2iBC4HS9dKZQ' \
  --compressed -o sites/trust_site_${1}.json
}

count=0
pushd trust-pilot
mkdir sites
while read -a site; do
    if ! [[ -s "sites/trust_site_${site}.json" ]]; then
        do_site "$site"    
        jq .name sites/trust_site_$site.json
        sleep 1s
    fi
done < <( cut -d, -f1 ../wikidata/website_id_list.csv | sort -u | sed -e "s/\"//g" -e "s/\/[^\"]*\"//g" | sort -u)
popd
