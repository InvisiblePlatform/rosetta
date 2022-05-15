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
    lynx -dump https://www.trustpilot.com/review/$1 | grep "•" -A 3 | sed -e "/TrustScore/d" -e "s/ //g" -e "s/•.*//g" -e "/^$/d" | paste - - -d';'
}

count=0
pushd trust-pilot
while read -a site; do
    id=${site[1]//\"/}
    domain=$(echo ${site[0]} | sed -e "s@/.*@@g" -e "s/\"//g" -e "s/,//g" )
    
    if ! $(grep -q "$id;" wikiid_domain_datetaken_reviewcount_score.csv); then
        if [[ $count -gt 100 ]]; then
            sleep 2m
            count=0
        else
            count=$(( count += 1))
            echo $count
        fi
        reviewsandscore=$(do_site $domain)
        echo "$id;$domain;$EPOCHSECONDS;$reviewsandscore" | tee -a wikiid_domain_datetaken_reviewcount_score.csv
        sleep 1s
    fi

done < ../wikidata/website_id_list.csv
popd
