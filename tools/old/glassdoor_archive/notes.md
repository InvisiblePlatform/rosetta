jq .affiliated[] data/*/overview.json

place=$(( 1 + $(grep -n $(tail -1 glassdoor/data/done_list.csv) glassdoor/company_url_updated.csv | cut -d: -f1) )) && head glassdoor/company_url_updated.csv -n${place} | tee glassdoor/data/done_list.csv

jq -r ". | [.website, .headquarters, .size, .ctype, .revenue] | @csv" data/*/overview.json | sed -e "s/www\.//g" | sort -u > website-hq-size-type-revenue.csv
