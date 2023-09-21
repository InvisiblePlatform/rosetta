import json
import os
import sys
import csv
import yaml
import threading
import time
import frontmatter
from pprint import pprint
from pymongo import MongoClient
from urllib.parse import urlparse
from multiprocessing import Pool
from tqdm import tqdm
from tools.mongoscripts.plain_node import do_graph

def get_domain(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    return domain

client = MongoClient('mongodb://localhost:27017/')
db = client['rop']
collection = db['wikidata']
datapool={}
items={}
query={}
exceptions=[]
output_dir="hugo/content/db/"

website_list = set()
rootdir = "data_collection"
WDLOOKUP = f"{rootdir}/wikidata/website_id_list.csv"
wikidata_array = {}
MBLOOKUP = f"{rootdir}/mbfc/mbfc-index.json"
mediabias_array = {}
BCLOOKUP = f"{rootdir}/bcorp/website_stub_bcorp.csv"
bcorp_array = {}
GYLOOKUP = f"{rootdir}/goodonyou/goodforyou_web_brandid.csv"
goodonyou_array = {}
GDLOOKUP = f"{rootdir}/glassdoor/website_glassdoorneo.list"
glassdoor_array = {}
TSLOOKUP = f"{rootdir}/tosdr/site_id.list"
tosdr_array = {}
WPLOOKUP = f"{rootdir}/wikipedia/wikititle_webpage_id_filtered.csv"
wikipedia_array = {}
ISLOOKUP = f"{rootdir}/static/document_isin.list"
isin_array = {}
OSLOOKUP = f"{rootdir}/opensecrets/opensecretsid_manualcorrection.json"
osid_array = {}

def progress():
    time.sleep(3)  # Check progress after 3 seconds
    print(f'total: {pbar.total} finish:{pbar.n}')


def process_domains_parrallel(domains):
    thread = threading.Thread(target=progress)
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
    items["P8525.mainsnak.datavalue.value"] = 1
    items["P1142"] = {"mainsnak.datavalue.value.id": 1}
    items["P1387"] = {"mainsnak.datavalue.value.id": 1}
    items["P946"] = {"mainsnak.datavalue.value": 1}
    items["P414"] = 1

exceptions = ["P1142", "P1387", "P414", "P946", "P8525"]

def query_for_wikidata(wikiid):
    tmpdatapool = None
    tmpdatapool = datapool.copy()
    tmpoutput = collection.find_one({'id': wikiid }, {
                "claims": items,
                "id": 1,
                "_id": 0
    })
    if not tmpoutput:
        return None
    if len(tmpoutput["claims"]) == 0:
        return {}
    for claim in tmpdatapool:
        if claim != "id":
            tmpdatapool[claim]["data"] = []
    for claim in tmpoutput["claims"]:
        for i in tmpoutput["claims"][claim]:
            if claim not in exceptions:
                try:
                    tmpdatapool[claim]["data"].append(i["mainsnak"]["datavalue"]["value"] + ";" + claim + ";" + tmpoutput["id"])
                except:
                    pass
            if claim == "P414":
                if i["rank"] != 'deprecated':
                    startdata = tmpdatapool[claim]["data"]
                    try:
                        for qualifier in [qualifier for qualifier in i["qualifiers"] if qualifier in "P249"]:
                            startdata.append(i["qualifiers"][qualifier][0]["datavalue"]["value"])
                    except:
                        pass
                    tmpdatapool[claim]["data"] = startdata
            if claim in ["P946", "P8525"]:
                try:
                    tmpdatapool[claim]["data"].append(i["mainsnak"]["datavalue"]["value"])
                except:
                    pass
            if claim in exceptions: 
                if claim not in ["P414", "P946", "P8525"]:
                    if "datavalue" in i["mainsnak"]:
                        try:
                            tmpdatapool[claim]["data"].append(i["mainsnak"]["datavalue"]["value"]["id"] + ";" + claim + ";" + tmpoutput["id"])
                        except:
                            pprint(i)
                            pprint(claim)
    return tmpdatapool

def show_document(domain):
    file_path = output_dir + domain.replace('.','') + ".md"
    if os.path.exists(file_path):
        with open(file_path, "r") as file:
            yaml_data = frontmatter.load(file)
            pprint(yaml_data.metadata)

def write_output_file(domain, data):
    file_path = output_dir + domain.replace('.','') + ".md"
    line = "---\n"
    with open(file_path, "w") as file:
        file.write(line)
    with open(file_path, "a") as file:
        yaml.dump(data, file, sort_keys=False)
        file.write(line)


def build_document(website):
    output = {}
    output["title"] = website
    wids = []
    graphfileloc = f"hugo/static/connections/{website}.json"
    graphfileloc_rel = f"/connections/{website}.json"
    output["published"] = True
    if website in wikidata_array:
        wids = list(set(wikidata_array[website]))
        output["wikidata_id"] = wids
        do_graph(main_node=wids, file_out=graphfileloc, collection=collection)
        output["connections"] = graphfileloc_rel
        for wid in wids:
            result = query_for_wikidata(wid)
            if result is None:
                continue
            for claim in result:
                if result[claim]["data"] != []:
                    output[result[claim]["label"]] = result[claim]["data"]
            if "isin_id" in output:
                for isin_id in output["isin_id"]:
                    try:
                        isin_array[isin_id]
                        tempset = set()
                        try:
                            output["isin"]
                        except:
                            output["isin"] = []
                        tempset = set(output["isin"])
                        # String building
                        for i in isin_array[isin_id]:
                            tempset.add(i + ":" + isin_id)
                        output["isin"] = list(tempset)
                    except:
                        pass
            try:
                output["osid"] = osid_array[wid]
            except:
                pass
    try:
        if not "tosdr" in output.keys():
            output["tosdr"] = [tosdr_array[website]]
    except:
        pass
    try:
        mediabias_slug = mediabias_array[website]
        with open(f"{rootdir}/mbfc/entries/{mediabias_slug}.json", "r") as file:
            output["mbfc"] = json.load(file)
    except:
        pass
    try:
        output["goodonyou"] = goodonyou_array[website]
    except:
        pass
    try:
        glassid = glassdoor_array[website]
        output["glassdoor"] = glassid
        with open(f"{rootdir}/glassdoor/data_json/" + glassid + ".json", "r") as f:
            glassdata = json.load(f)
            output["glassdoor_source"] = website
            output["glassdoor_rating"] = glassdata["glasroom_rating"]["ratingValue"]
    except:
        pass
    try:
        bcorpid = bcorp_array[website]
        output["bcorp"] = bcorpid
        with open(f"{rootdir}/bcorp/split_files/bcorp_" + bcorpid + ".json", "r") as f:
            bcorpdata = json.load(f)
            output["bcorp_source"] = website
            output["bcorp_rating"] = bcorpdata["latestVerifiedScore"]
    except:
        pass
    write_output_file(website, output)

def prepare():
    global mediabias_array
    with open(WDLOOKUP, "r") as f:
        wikidata_file = csv.reader(f)
        for i in wikidata_file:
            domain = get_domain("http://"+i[0])
            website_list.add(domain)
            try:
                wikidata_array[domain].append(i[1])
            except:
                wikidata_array[domain] = [i[1]]
    with open(MBLOOKUP, "r") as f:
        mediabias_array = json.load(f)
    with open(BCLOOKUP, "r") as f:
        bcorp_file = csv.reader(f)
        for i in bcorp_file:
            domain = get_domain("http://"+i[0])
            website_list.add(domain)
            bcorp_array[domain] = i[1]
    with open(GYLOOKUP, "r") as f:
        good_file = csv.reader(f)
        for i in good_file:
            domain = get_domain("http://"+i[0])
            website_list.add(domain)
            goodonyou_array[domain] = i[1]
    with open(GDLOOKUP, "r") as f:
        glass_file = csv.reader(f)
        for i in glass_file:
            domain = get_domain("http://"+i[0])
            website_list.add(domain)
            glassdoor_array[domain] = i[1]
    with open(TSLOOKUP, "r") as f:
        tosdr_file = csv.reader(f)
        for i in tosdr_file:
            domain = get_domain("http://"+i[0])
            website_list.add(domain)
            tosdr_array[domain] = i[1]
    with open(WPLOOKUP, "r") as f:
        wiki_file = csv.reader(f)
        for i in wiki_file:
            domain = get_domain("http://"+i[0])
            website_list.add(domain)
            wikipedia_array[domain] = i[1]
    with open(ISLOOKUP, "r") as f:
        isin_file = csv.reader(f)
        for i in isin_file:
            entry = i[0].split(':')
            try:
                lists = isin_array[entry[1]]
            except:
                lists = []
            lists.append(entry[0])
            isin_array[entry[1]] = lists
    with open(OSLOOKUP, "r") as f:
        opensecrets_file = json.load(f)
        for i in opensecrets_file:
            osid = opensecrets_file[i]["osid"]
            osid_array[i] = osid

prepare()
build_pairings_and_datapool()
# build_document("breitbart.com")
# show_document("breitbart.com")
# exit()
pbar = tqdm(total=len(website_list))

if __name__ == "__main__":
    #domains = ["opendemocracy.net","facebook.com", "meta.com", "twitter.com", "poundland.co.uk", "walleniuslines.com", "foxnews.com"]
    #processed_results = process_domains_parrallel(domains)
    processed_results = process_domains_parrallel(website_list)
    #processed_results = process_domains_parrallel(list(website_list)[:200])
