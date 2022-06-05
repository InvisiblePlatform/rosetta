jq .affiliated[] data/*/overview.json

place=$(( 1 + $(grep -n $(tail -1 glassdoor/data/done_list.csv) glassdoor/company_url_updated.csv | cut -d: -f1) )) && head glassdoor/company_url_updated.csv -n${place} | tee glassdoor/data/done_list.csv


