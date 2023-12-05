#!/bin/bash
# https://static1.squarespace.com/static/5b1a6e5daa49a1ac7a0b7513/t/5d2c3d0c9d58c40001d3b404/1563180310751/Complete_Guide_to_B_Corp_Certification_for_SME.pdf
#set -eo xtrace
count=200
timestamps=(\
"companies-production-en-us-latest-certification-asc"
"companies-production-en-us-latest-certification-desc"
#"companies-production-en-us-alphabetical-name-asc"
#"companies-production-en-us-alphabetical-name-desc"
#"companies-production-en-us"
)
countries=(\
"%5B%5B%22industry%3AFood%20products%22%5D%5D"
"%5B%5B%22industry%3AManagement%20%20consultant%20-%20for-profits%22%5D%5D"
"%5B%5B%22industry%3AAdvertising%20%26%20market%20research%22%5D%5D"
"%5B%5B%22industry%3AOther%20professional%2C%20scientific%20%26%20tech%22%5D%5D"
"%5B%5B%22industry%3AApparel%22%5D%5D"
"%5B%5B%22industry%3ABeverages%22%5D%5D"
"%5B%5B%22industry%3APersonal%20care%20products%22%2C%22industry%3AEnvironmental%20consulting%22%5D%5D"
"%5B%5B%22industry%3AOther%20info%20service%20activities%22%2C%22industry%3ASoftware%20publishing%20and%20SaaS%20platforms%22%5D%5D"
"%5B%5B%22industry%3AInvestment%20advising%22%2C%22industry%3AOther%20personal%20services%22%5D%5D"
"%5B%5B%22industry%3AEquity%20investing%20-%20Developed%20Markets%22%2C%22industry%3AManagement%20consultant%20-%20nonprofits%22%2C%22industry%3AAgricultural%20Processing%22%2C%22industry%3AArchitecture%20design%20%26%20planning%22%5D%5D"
"%5B%5B%22industry%3AComputer%20programming%20services%22%2C%22industry%3ATextiles%22%2C%22industry%3AOther%20financial%20services%22%2C%22industry%3AOther%20manufacturing%22%2C%22industry%3AOther%20retail%20sale%22%5D%5D"
"%5B%5B%22industry%3AOther/general%20wholesale%20trade%22%2C%22industry%3AOther%20education%22%2C%22industry%3ALegal%20activities%22%2C%22industry%3AReal%20estate%20development%22%2C%22industry%3AFurniture%22%2C%22industry%3AOther%20business%20support%22%5D%5D"
"%5B%5B%22industry%3ASolar%20panel%20installation%22%2C%22industry%3ASocial%20networks%20%26%20info%20sharing%22%2C%22industry%3APaper%20%26%20paper%20products%22%2C%22industry%3AEmployment%20placement%20%26%20HR%22%2C%22industry%3AGeneral%20retail%20via%20Internet%22%2C%22industry%3AFilm%2C%20TV%20%26%20music%20production%22%2C%22industry%3AAccommodation%22%2C%22industry%3ACleaning%20products%22%5D%5D"
"%5B%5B%22industry%3ADeposit%20bank%20-%20Developed%20Markets%22%2C%22industry%3AWeb%20portals%22%2C%22industry%3AOther%20renewable%20energy%20installation%22%2C%22industry%3AMobile%20applications%22%2C%22industry%3AEducation%20%26%20training%20services%22%2C%22industry%3AAccounting%20%26%20auditing%22%2C%22industry%3ASports%20goods%22%2C%22industry%3AAgicultural%20support/post-harvest%22%2C%22industry%3AOther%20human%20health%22%2C%22industry%3ATravel%20agency%20%26%20related%22%5D%5D"
"%5B%5B%22industry%3ARestaurants%20%26%20food%20service%22%2C%22industry%3AJewelry%20%26%20related%20articles%22%2C%22industry%3ARubber%20%26%20plastics%20products%22%2C%22industry%3AEngineering%22%2C%22industry%3AOther%20recreation%22%2C%22industry%3AArts%20%26%20entertainment%22%2C%22industry%3AMembership%20organizations%22%2C%22industry%3APharmaceutical%20products%22%2C%22industry%3AEquity%20investing%20-%20Emerging%20Markets%22%2C%22industry%3AMaterials%20recovery%20%26%20recycling%22%2C%22industry%3AData%20processing%20%26%20hosting%22%2C%22industry%3AElectrical%20equipment%22%2C%22industry%3AGrowing%20perennial%20crops%22%2C%22industry%3ALeather%20%26%20related%20products%22%2C%22industry%3AChemicals%20%26%20chemical%20products%22%5D%5D"
"%5B%5B%22industry%3ADesign%20%26%20building%22%2C%22industry%3ATechnology-based%20support%20services%22%2C%22industry%3AMixed%20Farming%22%2C%22industry%3AGrowing%20non-perennial%20crops%22%2C%22industry%3AMachinery%20%26%20equipment%22%2C%22industry%3AMedical%20%26%20dental%20supplies%22%2C%22industry%3ASpec%20design%20%28non-building%29%22%2C%22industry%3AReal%20estate%20-%20leased%20property%22%2C%22industry%3ATelecommunications%22%2C%22industry%3ABooks%20or%20other%20media%22%2C%22industry%3AConstruction%22%2C%22industry%3AFacilities%20%26%20cleaning%20services%22%2C%22industry%3AWood%20%26%20wood%20products%22%2C%22industry%3AComputers%20%26%20electronics%22%2C%22industry%3AContracting%20%26%20building%22%2C%22industry%3AFinancial%20transaction%20processing%22%2C%22industry%3ATransportation%20support%22%2C%22industry%3AFabricated%20metal%20products%22%2C%22industry%3AMedical%20%26%20dental%20practice%22%2C%22industry%3AOther%20credit%20-%20Developed%20Markets%22%2C%22industry%3AOther%20credit%20-%20Emerging%20Markets%22%2C%22industry%3APrinting%20%26%20recorded%20media%22%2C%22industry%3AScientific%20R%26D%22%2C%22industry%3AOther%20install%20%26%20construction%22%2C%22industry%3AOther%20transport%20equipment%22%2C%22industry%3AEvent%20catering%20%26%20related%22%2C%22industry%3AHairdressing%20%26%20other%20beauty%20services%22%5D%5D"
"%5B%5B%22industry%3AHigher%20education%22%2C%22industry%3AAnimal%20Production%22%2C%22industry%3AEducational%20support%22%2C%22industry%3AGames%20%26%20toys%22%2C%22industry%3APre-%20%26%20primary%20education%22%2C%22industry%3ARent/lease%3A%20other%20goods%22%2C%22industry%3ANon-life%20insurance%22%2C%22industry%3AOther%20insurance%20services%22%2C%22industry%3APostal%20%26%20courier%20activities%22%2C%22industry%3AAthletic%20%26%20fitness%20centers%22%2C%22industry%3AHealth%20insurance%22%2C%22industry%3AReal%20estate-%20fee/contract%22%2C%22industry%3APhotography%22%2C%22industry%3ASolar%20power%20generation%22%2C%22industry%3AHome%20health%20care%22%2C%22industry%3ALandscape%20services%22%2C%22industry%3AMicrofinance%20-%20Emerging%20Markets%22%2C%22industry%3AOther%20sports%22%2C%22industry%3AGeneral%20stores%22%2C%22industry%3ALife%20insurance%22%2C%22industry%3ANon-residential%20social%20work%22%2C%22industry%3APublishing%20-%20newspapers%20%26%20magazines%22%2C%22industry%3AComputer%20%26%20electronic%20products%22%2C%22industry%3AFishing%20%26%20aquaculture%22%2C%22industry%3AForestry%20%26%20logging%22%2C%22industry%3AOther%20recycling%22%2C%22industry%3ADiagnostic%20services%22%2C%22industry%3AMortgage%20advice%20%26%20brokerage%22%2C%22industry%3AOther%20publishing%20activities%22%2C%22industry%3AWater%20supply%20%26%20treatment%22%2C%22industry%3ACall%20centers%22%2C%22industry%3ACivil%20engineering%22%2C%22industry%3AGeneral%20secondary%20education%22%2C%22industry%3ALaundry%20%26%20dry-cleaning%22%2C%22industry%3ARent/lease%3A%20motor%20vehicles%22%2C%22industry%3AVeterinary%20activities%22%2C%22industry%3AWaste%20collection%22%2C%22industry%3AWaste%20treatment%20%26%20disposal%22%2C%22industry%3ABook%20publishing%22%2C%22industry%3ADeposit%20bank%20-%20Emerging%20Markets%22%2C%22industry%3AFinancial%20markets%20exchanges%22%2C%22industry%3AFuneral%20%26%20related%20services%22%2C%22industry%3AGeneral%20second-hand%20goods%22%2C%22industry%3AHospital%22%2C%22industry%3ALibraries%2C%20museums%20%26%20culture%22%2C%22industry%3AOther%20power%20generation%22%2C%22industry%3AOther%20residential%20care%22%2C%22industry%3APension/retirement%20plans%22%2C%22industry%3APlant%20propagation%22%2C%22industry%3AProgramming%20%26%20broadcasting%22%2C%22industry%3ABeverage%20serving%20%26%20bars%22%2C%22industry%3AOther%20land%20transport%22%2C%22industry%3ARemediation%20%26%20other%20waste%20management%22%2C%22industry%3ARepair%3A%20Computer%20%26%20home%20goods%22%2C%22industry%3AResidential%20elderly%20%26%20disabled%20care%22%2C%22industry%3AResidential%20mental%20health%20care%22%2C%22industry%3ASecurities%20brokerage%22%2C%22industry%3AAdmin%2C%20photocopying%20%26%20mail%20services%22%2C%22industry%3AAg%20raw%20materials/live%20animals%22%2C%22industry%3AAir%20transport%22%2C%22industry%3ABasic%20metals%22%2C%22industry%3ABasic%20metals%20%26%20products%22%2C%22industry%3AEmergency%20services%22%2C%22industry%3AMotorized%20vehicles%22%2C%22industry%3AOther%20non-metallic%20minerals%22%2C%22industry%3ARepair%3A%20automotive%22%2C%22industry%3AResidential%20nursing%20care%22%2C%22industry%3ASecurity%20%26%20investigation%22%2C%22industry%3ASewerage%22%2C%22industry%3ASteam%20%26%20air%20conditioning%22%2C%22industry%3ATechnical%20%26%20vocational%20educ%22%2C%22industry%3AWater%20transport%22%2C%22industry%3AWind%20power%20generation%22%5D%5D"
)

urlencode() {
  python -c 'import urllib, sys; print urllib.quote(sys.argv[1], sys.argv[2])' \
    "$1" "$urlencode_safe"
}

#countries=( "United%20States" "Australia" "Brazil" "Canada" "France" "Germany" "Italy" "Netherlands%20The" "United%20Kingdom" "Spain" ) 
#apikey=$(python ./SeleniumGetKey.py)

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
    --data-raw "{\"requests\":[{\"indexName\":\"$3\",\"params\":\"hitsPerPage=$count&query=&page=$1&maxValuesPerFacet=200&facets=%5B%22industry%22%5D&tagFilters=&facetFilters=$2\"},{\"indexName\":\"$3\",\"params\":\"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&hitsPerPage=$count&query=&maxValuesPerFacet=$count&page=$1&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=countries\"}]}"\
    --compressed  -o pages/bcorp_page_${4}_${3}_${1}.json 2>/dev/null
}
do_brand(){
    wget -nv "www.bcorperation.net/page-data/en-us/find-a-b-corp/company/$1/page-data.json" -O bcorp_$1.json
}

#query_number=0
#for i in ${countries[@]}; do
#    for j in ${timestamps[@]}; do
#        for e in $(seq 0 10); do
#            do_category $e $i $j $query_number
#            num=$(jq .results[].hits[].slug pages/bcorp_page_${query_number}_${j}_${e}.json | wc -l)
#            printf '%s\n' "$num,$i,$j,$e"
#            [[ "$num" == "0" ]] && break
#        done
#    done
#    query_number+=1
#done

jq .results[].hits[].slug pages/bcorp_page_* | sort -u | wc -l
jq .results[].hits[].slug pages/bcorp_page_* | wc -l

DATETODAY=$(date +%Y-%m-%d)
jq -s "map(.results[].hits[]) | unique_by(.id) " pages/*.json > combined_data_${DATETODAY}.json
