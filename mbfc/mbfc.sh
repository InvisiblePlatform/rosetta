#!/bin/bash

categories=('activewear'  'tops'  'bottoms' 'denim' 'dresses' 'knitwear' 'outerwear' 'suits' 'basics' 'sleepwear' 'swimwear' 'maternity' 'plus-size' 'shoes' 'bags' 'accessories')

do_category(){
    wget -nv https://directory.goodonyou.eco/_next/data/nAgaZnRF0uEQ1T4s4MapV/categories/$1.json -O cat_$1.json
}

do_brand(){
    wget -nv "https://directory.goodonyou.eco/_next/data/nAgaZnRF0uEQ1T4s4MapV/brand/$1.json" -O brand_$1.json
}
pushd goodonyou
# pushd categories
# for category in ${categories[@]}; do
#     do_category $category
# done
# jq -r .pageProps.category.brands[].id *.json | sort -u > ../brand_id_list.list
# popd
pushd brands
while read brand; do
    do_brand $brand
done < ../brand_id_list.list
jq -r ".pageProps.brand | [.website, .id.id ] | @csv" *.json  | sed -e "s@?[^\"]*@@g;s@http[s]*://@@g;s@/\"@\"@g" > ../goodforyou_web_brandid.csv
popd
popd
