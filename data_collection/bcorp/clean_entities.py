from pprint import pprint
from urllib.parse import urlparse
from tld import get_tld
import json
import re
import os
import sys
import datetime
import requests
from typing import Any

sys.path.append("..")
from common import (
    get_key,
    print_status,
    send_notification,
    calculate_average_ratings,
)


timestamps = [
    "companies-production-en-us-latest-certification-asc",
    "companies-production-en-us-latest-certification-desc",
]

countries = [
    "%5B%5B%22industry%3AFood%20products%22%5D%5D",
    "%5B%5B%22industry%3AManagement%20%20consultant%20-%20for-profits%22%5D%5D",
    "%5B%5B%22industry%3AAdvertising%20%26%20market%20research%22%5D%5D",
    "%5B%5B%22industry%3AOther%20professional%2C%20scientific%20%26%20tech%22%5D%5D",
    "%5B%5B%22industry%3AApparel%22%5D%5D",
    "%5B%5B%22industry%3ABeverages%22%5D%5D",
    "%5B%5B%22industry%3APersonal%20care%20products%22%2C%22industry%3AEnvironmental%20consulting%22%5D%5D",
    "%5B%5B%22industry%3AOther%20info%20service%20activities%22%2C%22industry%3ASoftware%20publishing%20and%20SaaS%20platforms%22%5D%5D",
    "%5B%5B%22industry%3AInvestment%20advising%22%2C%22industry%3AOther%20personal%20services%22%5D%5D",
    "%5B%5B%22industry%3AEquity%20investing%20-%20Developed%20Markets%22%2C%22industry%3AManagement%20consultant%20-%20nonprofits%22%2C%22industry%3AAgricultural%20Processing%22%2C%22industry%3AArchitecture%20design%20%26%20planning%22%5D%5D",
    "%5B%5B%22industry%3AComputer%20programming%20services%22%2C%22industry%3ATextiles%22%2C%22industry%3AOther%20financial%20services%22%2C%22industry%3AOther%20manufacturing%22%2C%22industry%3AOther%20retail%20sale%22%5D%5D",
    "%5B%5B%22industry%3AOther/general%20wholesale%20trade%22%2C%22industry%3AOther%20education%22%2C%22industry%3ALegal%20activities%22%2C%22industry%3AReal%20estate%20development%22%2C%22industry%3AFurniture%22%2C%22industry%3AOther%20business%20support%22%5D%5D",
    "%5B%5B%22industry%3ASolar%20panel%20installation%22%2C%22industry%3ASocial%20networks%20%26%20info%20sharing%22%2C%22industry%3APaper%20%26%20paper%20products%22%2C%22industry%3AEmployment%20placement%20%26%20HR%22%2C%22industry%3AGeneral%20retail%20via%20Internet%22%2C%22industry%3AFilm%2C%20TV%20%26%20music%20production%22%2C%22industry%3AAccommodation%22%2C%22industry%3ACleaning%20products%22%5D%5D",
    "%5B%5B%22industry%3ADeposit%20bank%20-%20Developed%20Markets%22%2C%22industry%3AWeb%20portals%22%2C%22industry%3AOther%20renewable%20energy%20installation%22%2C%22industry%3AMobile%20applications%22%2C%22industry%3AEducation%20%26%20training%20services%22%2C%22industry%3AAccounting%20%26%20auditing%22%2C%22industry%3ASports%20goods%22%2C%22industry%3AAgicultural%20support/post-harvest%22%2C%22industry%3AOther%20human%20health%22%2C%22industry%3ATravel%20agency%20%26%20related%22%5D%5D",
    "%5B%5B%22industry%3ARestaurants%20%26%20food%20service%22%2C%22industry%3AJewelry%20%26%20related%20articles%22%2C%22industry%3ARubber%20%26%20plastics%20products%22%2C%22industry%3AEngineering%22%2C%22industry%3AOther%20recreation%22%2C%22industry%3AArts%20%26%20entertainment%22%2C%22industry%3AMembership%20organizations%22%2C%22industry%3APharmaceutical%20products%22%2C%22industry%3AEquity%20investing%20-%20Emerging%20Markets%22%2C%22industry%3AMaterials%20recovery%20%26%20recycling%22%2C%22industry%3AData%20processing%20%26%20hosting%22%2C%22industry%3AElectrical%20equipment%22%2C%22industry%3AGrowing%20perennial%20crops%22%2C%22industry%3ALeather%20%26%20related%20products%22%2C%22industry%3AChemicals%20%26%20chemical%20products%22%5D%5D",
    "%5B%5B%22industry%3ADesign%20%26%20building%22%2C%22industry%3ATechnology-based%20support%20services%22%2C%22industry%3AMixed%20Farming%22%2C%22industry%3AGrowing%20non-perennial%20crops%22%2C%22industry%3AMachinery%20%26%20equipment%22%2C%22industry%3AMedical%20%26%20dental%20supplies%22%2C%22industry%3ASpec%20design%20%28non-building%29%22%2C%22industry%3AReal%20estate%20-%20leased%20property%22%2C%22industry%3ATelecommunications%22%2C%22industry%3ABooks%20or%20other%20media%22%2C%22industry%3AConstruction%22%2C%22industry%3AFacilities%20%26%20cleaning%20services%22%2C%22industry%3AWood%20%26%20wood%20products%22%2C%22industry%3AComputers%20%26%20electronics%22%2C%22industry%3AContracting%20%26%20building%22%2C%22industry%3AFinancial%20transaction%20processing%22%2C%22industry%3ATransportation%20support%22%2C%22industry%3AFabricated%20metal%20products%22%2C%22industry%3AMedical%20%26%20dental%20practice%22%2C%22industry%3AOther%20credit%20-%20Developed%20Markets%22%2C%22industry%3AOther%20credit%20-%20Emerging%20Markets%22%2C%22industry%3APrinting%20%26%20recorded%20media%22%2C%22industry%3AScientific%20R%26D%22%2C%22industry%3AOther%20install%20%26%20construction%22%2C%22industry%3AOther%20transport%20equipment%22%2C%22industry%3AEvent%20catering%20%26%20related%22%2C%22industry%3AHairdressing%20%26%20other%20beauty%20services%22%5D%5D",
    "%5B%5B%22industry%3AHigher%20education%22%2C%22industry%3AAnimal%20Production%22%2C%22industry%3AEducational%20support%22%2C%22industry%3AGames%20%26%20toys%22%2C%22industry%3APre-%20%26%20primary%20education%22%2C%22industry%3ARent/lease%3A%20other%20goods%22%2C%22industry%3ANon-life%20insurance%22%2C%22industry%3AOther%20insurance%20services%22%2C%22industry%3APostal%20%26%20courier%20activities%22%2C%22industry%3AAthletic%20%26%20fitness%20centers%22%2C%22industry%3AHealth%20insurance%22%2C%22industry%3AReal%20estate-%20fee/contract%22%2C%22industry%3APhotography%22%2C%22industry%3ASolar%20power%20generation%22%2C%22industry%3AHome%20health%20care%22%2C%22industry%3ALandscape%20services%22%2C%22industry%3AMicrofinance%20-%20Emerging%20Markets%22%2C%22industry%3AOther%20sports%22%2C%22industry%3AGeneral%20stores%22%2C%22industry%3ALife%20insurance%22%2C%22industry%3ANon-residential%20social%20work%22%2C%22industry%3APublishing%20-%20newspapers%20%26%20magazines%22%2C%22industry%3AComputer%20%26%20electronic%20products%22%2C%22industry%3AFishing%20%26%20aquaculture%22%2C%22industry%3AForestry%20%26%20logging%22%2C%22industry%3AOther%20recycling%22%2C%22industry%3ADiagnostic%20services%22%2C%22industry%3AMortgage%20advice%20%26%20brokerage%22%2C%22industry%3AOther%20publishing%20activities%22%2C%22industry%3AWater%20supply%20%26%20treatment%22%2C%22industry%3ACall%20centers%22%2C%22industry%3ACivil%20engineering%22%2C%22industry%3AGeneral%20secondary%20education%22%2C%22industry%3ALaundry%20%26%20dry-cleaning%22%2C%22industry%3ARent/lease%3A%20motor%20vehicles%22%2C%22industry%3AVeterinary%20activities%22%2C%22industry%3AWaste%20collection%22%2C%22industry%3AWaste%20treatment%20%26%20disposal%22%2C%22industry%3ABook%20publishing%22%2C%22industry%3ADeposit%20bank%20-%20Emerging%20Markets%22%2C%22industry%3AFinancial%20markets%20exchanges%22%2C%22industry%3AFuneral%20%26%20related%20services%22%2C%22industry%3AGeneral%20second-hand%20goods%22%2C%22industry%3AHospital%22%2C%22industry%3ALibraries%2C%20museums%20%26%20culture%22%2C%22industry%3AOther%20power%20generation%22%2C%22industry%3AOther%20residential%20care%22%2C%22industry%3APension/retirement%20plans%22%2C%22industry%3APlant%20propagation%22%2C%22industry%3AProgramming%20%26%20broadcasting%22%2C%22industry%3ABeverage%20serving%20%26%20bars%22%2C%22industry%3AOther%20land%20transport%22%2C%22industry%3ARemediation%20%26%20other%20waste%20management%22%2C%22industry%3ARepair%3A%20Computer%20%26%20home%20goods%22%2C%22industry%3AResidential%20elderly%20%26%20disabled%20care%22%2C%22industry%3AResidential%20mental%20health%20care%22%2C%22industry%3ASecurities%20brokerage%22%2C%22industry%3AAdmin%2C%20photocopying%20%26%20mail%20services%22%2C%22industry%3AAg%20raw%20materials/live%20animals%22%2C%22industry%3AAir%20transport%22%2C%22industry%3ABasic%20metals%22%2C%22industry%3ABasic%20metals%20%26%20products%22%2C%22industry%3AEmergency%20services%22%2C%22industry%3AMotorized%20vehicles%22%2C%22industry%3AOther%20non-metallic%20minerals%22%2C%22industry%3ARepair%3A%20automotive%22%2C%22industry%3AResidential%20nursing%20care%22%2C%22industry%3ASecurity%20%26%20investigation%22%2C%22industry%3ASewerage%22%2C%22industry%3ASteam%20%26%20air%20conditioning%22%2C%22industry%3ATechnical%20%26%20vocational%20educ%22%2C%22industry%3AWater%20transport%22%2C%22industry%3AWind%20power%20generation%22%5D%5D",
]


def bcorpGetKey() -> str:
    key: str | None = get_key(
        url="https://www.bcorporation.net/en-us/find-a-b-corp/?query=3M",
        timeout=5000,
        key_string="x-algolia-api-key",
        request_filter="queries",
    )
    if key is None:
        print("Failed to get key")
        exit()
    else:
        return key


def bcorpGetCategoryData(page, filters, index_name, query_number, apikey, count):
    url = f"https://bx1p6tr71m-dsn.algolia.net/1/indexes/*/queries?x-algolia-api-key={apikey}&x-algolia-application-id=BX1P6TR71M"
    headers = {
        "Accept": "*/*",
        "Accept-Language": "en-GB,en;q=0.9,en-US;q=0.8",
        "Connection": "keep-alive",
        "Origin": "https://www.bcorporation.net",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.4972.0 Safari/537.36 Edg/102.0.1224.0",
        "content-type": "application/x-www-form-urlencoded",
        "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="102", "Microsoft Edge";v="102"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
    }
    data = {
        "requests": [
            {
                "indexName": index_name,
                "params": f"hitsPerPage={count}&query=&page={page}&maxValuesPerFacet=200&facets=%5B%22industry%22%5D&tagFilters=&facetFilters={filters}",
            },
            {
                "indexName": index_name,
                "params": f"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&hitsPerPage={count}&query=&maxValuesPerFacet={count}&page={page}&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=countries",
            },
        ]
    }
    response = requests.post(url, headers=headers, data=json.dumps(data), timeout=5)
    response_data = response.json()
    if response_data.get("results")[0] is not None:
        print(len(response_data["results"][0]["hits"]))
        return response_data["results"]
    else:
        return None

    # with open(f"pages/bcorp_page_{query_number}_{index_name}_{page}.json", "w") as f:
    #    json.dump(response_data, f)


def bcorpGetData() -> list[Any]:
    count = 200
    query_number = 0
    combined_data = []
    apikey = bcorpGetKey()
    for country in countries:
        for timestamp in timestamps:
            for e in range(11):
                response = bcorpGetCategoryData(
                    page=e,
                    filters=country,
                    index_name=timestamp,
                    query_number=query_number,
                    apikey=apikey,
                    count=count,
                )
                if response:
                    num = len(response[0]["hits"])
                    if num == 0:
                        break
                    print_status("pass", query_number, num, f"{e}")
                    print(f"{num},{country},{timestamp},{e}")
                    for page in response:
                        combined_data.extend(page["hits"])
            query_number += 1
    return combined_data


def bcorpGetCombinedData():
    DATETODAY = datetime.datetime.now().strftime("%Y-%m-%d")
    if os.path.exists(f"combined_data_{DATETODAY}.json"):
        pprint("Loading existing data")
        with open(f"combined_data_{DATETODAY}.json", "r") as f:
            clean_combined_data = json.load(f)
    else:
        pprint("Getting new data")
        combined_data = bcorpGetData()
        # Really we could clean properly here, but we're just going to remove the ones without a slug
        clean_combined_data = {}
        for item in combined_data:
            if item.get("slug"):
                clean_combined_data[item["slug"]] = item

        with open(f"combined_data_{DATETODAY}.json", "w") as f:
            json.dump(clean_combined_data, f, indent=4)
    pprint(f"Total number of companies: {len(clean_combined_data)}")
    return clean_combined_data


data_array = bcorpGetCombinedData()
average_score_array = calculate_average_ratings(
    data_list=data_array, industry_path="industry", score_path="latestVerifiedScore"
)
available_ratings = {}
index_filename = "site_slug.json"
split_dir = "split_data"
os.makedirs(split_dir, exist_ok=True)
exceptions = {
    "www.lamarqueenmoins.f": "www.lamarqueenmoins.fr",
    "haymansgin.com & merserrum.com & respirited.com & bushrum.co.uk & symposiumspirits.co.uk & kimia.co.uk & hgcompany.co.uk": "haymansgin.com",
}

# Iterate through the data and split into individual files
for data in data_array.values():
    try:
        if not data.get("slug"):
            continue
        if len(data.get("assessments")) == 0:
            continue

        slug = data.get("slug")
        with open(f"{split_dir}/{slug}.json", "w") as file:
            json.dump(data, file, indent=4)

        # Extract data from the JSON file as needed
        # Example: Create a new object with selected data
        website = re.sub(r"\([^)]*\)", "", data.get("website"))
        if website in exceptions:
            website = exceptions[website]

        new_obj = {
            "slug": slug,
            "source": data.get("name"),
            "score": data.get("latestVerifiedScore"),
            "score_industryAverage": average_score_array.get(data.get("industry")),
            "industry": data.get("industry"),
            "ratingDate": data.get("assessments")[0]["ratingDate"],
            "location": f"bcorp/{slug}",
            "website": website,
        }

        for area in data.get("assessments")[0]["impactAreas"]:
            new_obj[area["name"]] = area["score"]

        entity_filename = f"entities/{slug}.json"

        # Write the new object to the entities folder
        with open(entity_filename, "w") as entity_file:
            json.dump(new_obj, entity_file, indent=4)

        domains = []

        if " " in website:
            for site in (
                website.replace("/", "").replace(";", "").replace(",", "").split(" ")
            ):
                if site == "":
                    continue
                domains.append(site)
        else:
            domains.append(website)

        for site in domains:
            domain = urlparse(site).hostname
            if domain is None:
                domain = urlparse(f"http://{site}").hostname

            if domain is not None:
                if domain in exceptions:
                    domain = exceptions[domain]
                get_tld("https://" + domain, as_object=True)
                if domain.replace("www.", "") not in [
                    "linkedin.com",
                    "facebook.com",
                    "instagram.com",
                    "linktr.ee",
                ]:
                    if available_ratings.get(domain.replace("www.", "")):
                        print(domain)
                    available_ratings[domain.replace("www.", "")] = slug

    except Exception as e:
        pprint(data)
        print(e)
        exit()

with open(index_filename, "w") as index_file:
    json.dump(available_ratings, index_file, indent=4)

pprint(len(available_ratings))
