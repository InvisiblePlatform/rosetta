#!/bin/bash

categories=('activewear'  'tops'  'bottoms' 'denim' 'dresses' 'knitwear' 
    'outerwear' 'suits' 'basics' 'sleepwear' 'swimwear' 'maternity' 
    'plus-size' 'shoes' 'bags' 'accessories')

ID="9VqYtZr1dexu3v_ffjZSA"
do_category(){
  wget -nv https://directory.goodonyou.eco/_next/data/$ID/categories/$1.json -O cat_$1.json
}

do_brand(){
  wget -nv "https://directory.goodonyou.eco/_next/data/$ID/brand/$1.json" -O brand_$1.json
}

pushd goodonyou
  pushd categories
    for category in ${categories[@]}; do
      do_category $category
    done
    jq -r .pageProps.category.brands[].id *.json | sort -u > ../brand_id_list.list
  popd
  pushd brands
    while read brand; do
      do_brand $brand
    done < ../brand_id_list.list
    jq -r ".pageProps.brand | [.website, .id.id ] | @csv" *.json  \
        | sed -e "s@?[^\"]*@@g;s@http[s]*://@@g;s/www[0-9]*\.//g;s@\/[a-z][a-z][_-][a-z][a-z][/]*@/@gi;s@/index\.htm[l]*@@g;s@\([^/]\)\",@\1/\",@g;s@/[a-z][a-z][/\"]@/@ig" \
        | sed -e "s@/\"@\"@g" \
        | sed -e "s@/home\"@\"@g;s@/shop\"@\"@g;s@/men\"@\"@g;s@/women\"@\"@g;s@/store\"@\"@g;s@/homepage\"@\"@g;s@/global\"@\"@g;s@/[a-z][a-z]\"@\"@g;s@/online\"@\"@g;s@/all\"@\"@g;s@/collections\"@\"@g;s@/row\"@\"@g;s@/[a-z][a-z][a-z]\"@\"@gi;s@/about\"@\"@g;s@/retail\"@\"@g;s@/eshop\"@\"@g;s@/home\.jsp\"@\"@g;s@/jeans\.html\"@\"@g;s@/home\.html\"@\"@g;s@/ \"@\"@g" \
        > ../goodforyou_web_brandid.csv

  popd
popd
