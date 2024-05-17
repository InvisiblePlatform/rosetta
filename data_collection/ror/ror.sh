#!/bin/bash
downloadlink=$(curl "https://zenodo.org/api/communities/ror-data/records?q=&sort=newest" | jq -r .hits.hits[0].files[0].links.self)

aria2c ${downloadlink}

unzip *.zip
rm *.zip 

cp *data.json data/combined_data.json
mv *data.json data/
rm *.csv *.json



