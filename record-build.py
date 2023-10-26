import json
import os
import sys
import csv
import yaml
from threading import Thread
from frontmatter import load as frontload
from time import sleep
from copy import deepcopy
from pprint import pprint
from pymongo import MongoClient
from collections import defaultdict
from urllib.parse import urlparse
from multiprocessing import Pool
from tqdm import tqdm
from tools.mongoscripts.plain_node import do_graph

output_dir="hugo/content/db/"
rootdir = "data_collection"

def get_domain(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    return domain

client = MongoClient('mongodb://localhost:27017/')
db = client['rop']
collection = db['wikidata']
items = {}
query = {}
datapool ={}
exceptions=[]

website_list = set()

WDLOOKUP = f"{rootdir}/wikidata/website_id_list.csv"
wikidata_array = {}
MBLOOKUP = f"{rootdir}/mbfc/ratings-index.json"
mediabias_array = {}
BCLOOKUP = f"{rootdir}/bcorp/output_data.json"
bcorp_array = {}
GYLOOKUP = f"{rootdir}/goodonyou/goodforyou_web_brandid.csv"
goodonyou_array = {}
GDLOOKUP = f"{rootdir}/glassdoor/website_glassdoorneo.list"
glassdoor_array = {}
TSLOOKUP = f"{rootdir}/tosdr/site_id.list"
tosdr_array = {}
TSDATAARRAY = f"{rootdir}/tosdr/rated.json"
tosdr_data_array = {}
WPLOOKUP = f"{rootdir}/wikipedia/wikititle_webpage_id_filtered.csv"
wikipedia_array = {}
ISLOOKUP = f"{rootdir}/static/document_isin.list"
isin_array = {}
OSLOOKUP = f"{rootdir}/opensecrets/opensecretsid_manualcorrection.json"
osid_array = {}
TRUSTSCORELOOKUP = f"{rootdir}/trustscore/ratings-index.json"
trust_array = {}
TRUSTPILOTLOOKUP = f"{rootdir}/trust-pilot/merged_output.json"
trustp_array = {}
bulk_array = defaultdict(dict)

def progress():
    sleep(3)  # Check progress after 3 seconds
    print(f'total: {pbar.total} finish:{pbar.n}')


def process_domains_parrallel(domains):
    thread = Thread(target=progress)
    thread.start()
    results = []
    with Pool() as pool:
        for result in pool.imap_unordered(build_document, domains):
                results.append(result)
                pbar.update(1)
    return results

def build_pairings_and_datapool():
    pairings=[
        {"label":"twittername", "id":"P2002"},
        {"label":"officialblog", "id":"P1581"},
        {"label":"subreddit", "id":"P3984"},
        {"label":"facebookid", "id":"P2013"},
        {"label":"facebookpage", "id":"P4003"},
        {"label":"instagramid", "id":"P2003"},
        {"label":"youtubechannelid", "id":"P2397"},
        {"label":"emailaddress", "id":"P968"},
        {"label":"truthsocial", "id":"P10858"},
        {"label":"parleruser", "id":"P8904"},
        {"label":"gabuser", "id":"P8919"},
        {"label":"soundcloud", "id":"P3040"},
        {"label":"tumblr", "id":"P3943" },
        {"label":"medium", "id":"P3899"},
        {"label":"telegram", "id":"P3789"},
        {"label":"mastodon", "id":"P4033"},
        {"label":"patreon", "id":"P4175"},
        {"label":"reddituser", "id":"P4265"},
        {"label":"twitch", "id":"P5797"},
        {"label":"tiktok", "id":"P7085"},
    ]
    for pair in pairings:
        items[pair["id"]] = {"mainsnak.datavalue.value": 1}
        datapool[pair["id"]] = {"label": pair["label"], "data": []}
    datapool["P1387"] = {"label": "polalignment", "data": []}
    datapool["P8525"] = {"label": "tosdr", "data": []}
    datapool["P1142"] = {"label": "polideology", "data": []}
    datapool["P414"] = {"label": "ticker", "data": []}
    datapool["P946"] = {"label": "isin_id", "data": []}
    items["P8525.mainsnak.datavalue.value"] = items["P414"] = 1
    items["P1142"] = items["P1387"] = {"mainsnak.datavalue.value.id": 1}
    items["P946"] = {"mainsnak.datavalue.value": 1}

exceptions = ["P1142", "P1387", "P414", "P946", "P8525"]

def query_for_wikidata(wikiid):
    tmpoutput = collection.find_one({'id': wikiid }, {
                "claims": items,
                "id": 1,
                "_id": 0
    })
    if not tmpoutput:
        return None
    if not tmpoutput["claims"]:
        return {}

    tmpdatapool = deepcopy(datapool)

    for claim, claim_data in tmpoutput["claims"].items():
        for i in claim_data:
            try:
                if claim not in exceptions:
                    tmpdatapool[claim]['data'].append(f"{i['mainsnak']['datavalue']['value']};{claim};{tmpoutput['id']}")
                elif claim == "P414":
                    if i["rank"] != 'deprecated':
                        startdata = tmpdatapool[claim]["data"]
                        try:
                            for qualifier in [qualifier for qualifier in i["qualifiers"] if qualifier in "P249"]:
                                startdata.append(i["qualifiers"][qualifier][0]["datavalue"]["value"])
                        except:
                            pass
                        tmpdatapool[claim]["data"] = startdata
                elif claim == "P8525":
                    tmpdatapool[claim]["data"] = i["mainsnak"]["datavalue"]["value"]
                elif claim == "P946":
                    tmpdatapool[claim]["data"].append(i["mainsnak"]["datavalue"]["value"])
                elif "datavalue" in i["mainsnak"]:
                    tmpdatapool[claim]["data"].append(f"{i['mainsnak']['datavalue']['value']['id']};{claim};{tmpoutput['id']}")
            except:
                pass
                #pprint(i)
                #pprint(claim)
    return tmpdatapool

def show_document(domain):
    file_path = output_dir + domain.replace('.','') + ".md"
    if os.path.exists(file_path):
        with open(file_path, "r") as file:
            yaml_data = frontload(file)
            pprint(yaml_data.metadata)

def write_output_file(domain, data):
    file_path = os.path.join(output_dir, domain.replace('.', '') + ".md")
    separator_line = "---\n"

    with open(file_path, "w") as file:
        file.write(separator_line)
        yaml.dump(data, file, sort_keys=False)
        file.write(separator_line)


def build_document(website):
    output = {}
    output.update(bulk_array[website])
    output["title"] = website
    output["published"] = True
    try:
        output["wikidata_id"]
    except KeyError:
        output["wikidata_id"] = False

    if output["wikidata_id"]:
        wids = output["wikidata_id"]
        output["connections"] = f"/connections/{website}.json"
        do_graph(main_node=wids, file_out=f"hugo/static/connections/{website}.json", collection=collection)
        for wid in wids:
            result = query_for_wikidata(wid)
            if result is None:
                continue

            for claim in result:
                if result[claim]["data"]:
                    output[result[claim]["label"]] = result[claim]["data"]

            isin_id_list = output.get("isin_id", [])
            if isin_id_list:
                output["isin"] = list(set(f"{i}:{isin_id}" for isin_id in isin_id_list for i in isin_array.get(isin_id, [])))
            try:
                output["osid"] = osid_array[wid]
            except:
                pass

    try:
        if tosdr_data_array[str(output["tosdr"])]["rated"]:
            output["tosdr_rating"] = tosdr_data_array[str(output["tosdr"])]["rated"]
    except:
        pass

    try:
        output["mbfc_tags"] = [output["mbfc"]["bias"]] + output["mbfc"].get("questionable", [])
    except:
        pass

    try:
        glassid = output["glassdoor"]
        with open(f"{rootdir}/glassdoor/data_json/{glassid}.json", "r") as f:
            glassdata = json.load(f)
            output["glassdoor_source"] = website
            output["glassdoor_rating"] = glassdata["glasroom_rating"]["ratingValue"]
    except:
        pass

    write_output_file(website, output)

def prepare():
    global mediabias_array, tosdr_data_array, trust_array, trustp_array, bcorp_array, osid_array, isin_array, bulk_array

    def process_lookup_file(lookup_file, array, field):
        with open(lookup_file, "r") as f:
            csv_reader = csv.reader(f)
            next(csv_reader)  # Skip the header row, if present
            for row in csv_reader:
                domain = get_domain("http://" + row[0])
                website_list.add(domain)
                array[domain] = row[1]
                bulk_array[domain][field] = row[1]

    def process_lookup_file_json(lookup_file, array):
        with open(lookup_file, "r") as f:
            array.update(json.load(f))

    def process_lookup_file_json_webaware(lookup_file, array, field):
        with open(lookup_file, "r") as f:
            for i, i_data in json.load(f).items():
                bulk_array[i][field] = i_data

    # Process GoodOnYou lookup file
    process_lookup_file(GYLOOKUP, goodonyou_array, "goodonyou")

    # Process TOSDR lookup file
    process_lookup_file(TSLOOKUP, tosdr_array, "tosdr")

    # Process Glassdoor lookup file
    process_lookup_file(GDLOOKUP, glassdoor_array, "glassdoor")

    # Process Wikipedia lookup file
    process_lookup_file(WPLOOKUP, wikipedia_array, "wikipedia")

    # Process MediaBias lookup file
    process_lookup_file_json_webaware(MBLOOKUP, mediabias_array, "mbfc")

    # TOSDR Data
    process_lookup_file_json(TSDATAARRAY, tosdr_data_array)

    # Trustscore Data
    process_lookup_file_json_webaware(TRUSTSCORELOOKUP, trust_array, "trustscore")

    # Trustpilot array
    process_lookup_file_json_webaware(TRUSTPILOTLOOKUP, trustp_array, "tp_rating")

    # Process Wikidata lookup file
    with open(WDLOOKUP, "r") as f:
        wikidata_file = csv.reader(f)
        for i in wikidata_file:
            domain = get_domain("http://" + i[0])
            website_list.add(domain)
            wikidata_array.setdefault(domain, []).append(i[1])
            try:
                if bulk_array[domain]["wikidata_id"]:
                    bulk_array[domain]["wikidata_id"] = wikidata_array[domain]
            except KeyError:
                bulk_array[domain]["wikidata_id"]=[i[1]]

    with open(BCLOOKUP, "r") as f:
        for domain, i_data in json.load(f).items():
            bulk_array[domain]["bcorp"] = i_data["slug"]
            bulk_array[domain]["bcorp_source"] = i_data["name"]
            bulk_array[domain]["bcorp_rating"] = i_data["latestVerifiedScore"]


    # Process ISIN lookup file
    with open(ISLOOKUP, "r") as f:
        isin_file = csv.reader(f)
        for i in isin_file:
            entry = i[0].split(':')
            isin_array.setdefault(entry[1], []).append(entry[0])

    # Process OpenSecrets lookup file
    with open(OSLOOKUP, "r") as f:
        opensecrets_file = json.load(f)
        osid_array = {i: opensecrets_file[i]["osid"] for i in opensecrets_file}


prepare()
build_pairings_and_datapool()
#testdomain = "meta.com"
#testdomain = "facebook.com"
#testdomain = "theguardian.com"
#build_document(testdomain)
#show_document(testdomain)
pbar = tqdm(total=len(website_list))

if __name__ == "__main__":
    #domains = ["opendemocracy.net","facebook.com", "meta.com", "twitter.com", "poundland.co.uk", "walleniuslines.com", "foxnews.com"]
    #processed_results = process_domains_parrallel(domains)
    processed_results = process_domains_parrallel(website_list)
    #processed_results = process_domains_parrallel(list(website_list)[:100000])
