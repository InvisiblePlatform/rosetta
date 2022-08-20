#!/bin/bash
# https://static1.squarespace.com/static/5b1a6e5daa49a1ac7a0b7513/t/5d2c3d0c9d58c40001d3b404/1563180310751/Complete_Guide_to_B_Corp_Certification_for_SME.pdf
count=200
timestamps=(\
"companies-production-en-us-latest-certification-asc"
"companies-production-en-us-latest-certification-desc"
"companies-production-en-us-alphabetical-name-asc"
"companies-production-en-us-alphabetical-name-desc"
"companies-production-en-us"
)

countries=( "United%20States" "Australia" "Brazil" "Canada" "France" "Germany" "Italy" "Netherlands%20The" "United%20Kingdom" "Spain" ) 
apikey="89136e22c1533bc1eec65267bcdfba5e"

do_category(){
  curl "https://bx1p6tr71m-dsn.algolia.net/1/indexes/*/queries?x-algolia-api-key=${apikey}&x-algolia-application-id=BX1P6TR71M"   \
    -H 'Accept: */*'  \
    -H 'Accept-Language: en-GB,en;q=0.9,en-US;q=0.8'   \
    -H 'Connection: keep-alive'   \
    -H 'Origin: https://www.bcorporation.net'   \
    -H 'Sec-Fetch-Dest: empty'   \
    -H 'Sec-Fetch-Mode: cors'   \
    -H 'Sec-Fetch-Site: cross-site'   \
    -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.4972.0 Safari/537.36 Edg/102.0.1224.0'   \
    -H 'content-type: application/x-www-form-urlencoded'   \
    -H 'sec-ch-ua: " Not A;Brand";v="99", "Chromium";v="102", "Microsoft Edge";v="102"'   \
    -H 'sec-ch-ua-mobile: ?0'   \
    -H 'sec-ch-ua-platform: "Linux"'   \
    --data-raw "{\"requests\":[{\"indexName\":\"$3\",\"params\":\"hitsPerPage=$count&query=&page=$1&maxValuesPerFacet=200&facets=%5B%22countries%22%5D&tagFilters=&facetFilters=%5B%5B%22countries%3A$2%22%5D%5D\"},{\"indexName\":\"$3\",\"params\":\"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&hitsPerPage=$count&query=&maxValuesPerFacet=$count&page=$1&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=countries\"}]}"\
    --compressed  -o bcorp_page_${2}_${3}_${1}.json
}
do_brand(){
    wget -nv "www.bcorperation.net/page-data/en-us/find-a-b-corp/company/$1/page-data.json" -O bcorp_$1.json
}

#do_category $1

for i in ${countries[@]}; do
    for j in ${timestamps[@]}; do
    for e in $(seq 0 5); do
        do_category $e $i $j
        jq .results[].hits[].slug bcorp_page_${i}_${j}_${e}.json | wc -l
    done
done
done

jq .results[].hits[].slug bcorp_page_* | sort -u | wc -l
jq .results[].hits[].slug bcorp_page_* | wc -l

DATETODAY=$(date +%Y-%m-%d)

jq -s "map(.results[].hits[]) | unique_by(.id) " bcorp/raw_data/*.json > bcorp/combined_data_$DATETODAY.json
