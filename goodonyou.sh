#!/bin/bash

categories=('activewear'  'tops'  'bottoms' 'denim' 'dresses' 'knitwear' 
    'outerwear' 'suits' 'basics' 'sleepwear' 'swimwear' 'maternity' 
    'plus-size' 'shoes' 'bags' 'accessories')

ID=$(python3 ./goodonyou/SeleniumGetKey.py)
do_category(){
  wget -nv "https://directory.goodonyou.eco/_next/data/$ID/categories/$1.json" -O "cat_$1.json"
}

do_brand(){
  wget -nv "https://directory.goodonyou.eco/_next/data/$ID/brand/$1.json" -O "brand_$1.json"
}

pushd goodonyou || exit
  pushd categories || exit
    for category in "${categories[@]}"; do
      do_category "$category"
    done
    jq -r .pageProps.category.brands[].id ./*.json | sort -u > ../brand_id_list.list
  popd || exit
  pushd brands || exit
    while read -r brand; do
      do_brand "$brand"
    done < ../brand_id_list.list
        
      jq -r '.pageProps.brand | .website |= sub("http[s]*://(www.)*" ; "") | .website |= sub("[/]*\\?.*";"") | .website |= sub("/.*";"") | [ .website, .id.id ] | @csv ' "*.json" 2>/dev/null > ../goodforyou_web_brandid.csv

      while read -r entry; do
          sed -i "/${entry}/d" ../goodforyou_web_brandid.csv
      done < ../removeables.list
      cat ../hardcoded.csv >> ../goodforyou_web_brandid.csv

  popd || exit
popd || exit
