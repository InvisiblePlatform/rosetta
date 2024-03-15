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
from tld import get_tld

output_dir="hugo/content/db/"
rootdir = "data_collection"


def get_domain(url):
    parsed_url = get_tld(url, as_object=True)
    domain = parsed_url.subdomain + parsed_url.fld
    if parsed_url.subdomain in ["about", "shop", "m"]:
        domain = parsed_url.fld
    return domain

client = MongoClient('mongodb://localhost:27017/')
db = client['rop']
collection = db['wikidata']
items = {}
query = {}
datapool ={}
exceptions=[]
failures = []
missingLabels = set()

website_list = set()

WDLOOKUP = f"{rootdir}/wikidata/website_id_list.csv"
wikidata_array = {}
MBLOOKUP = f"{rootdir}/mbfc/site_slug.json"
mediabias_array = {}
BCLOOKUP = f"{rootdir}/bcorp/site_slug.json"
bcorp_array = {}
GYLOOKUP = f"{rootdir}/goodonyou/site_slug.json"
goodonyou_array = {}
GDLOOKUP = f"{rootdir}/glassdoor/site_id.json"
glassdoor_array = {}
TSDATAARRAY = f"{rootdir}/tosdr/site_id.json"
tosdr_data_array = {}
WPLOOKUP = f"{rootdir}/wikipedia/wikititle_webpage_id_filtered.csv"
wikipedia_array = {}
ISLOOKUP = f"{rootdir}/static/document_isin.list"
isin_array = {}
OSLOOKUP = f"{rootdir}/opensecrets/site_id.json"
osid_array = {}
TRUSTSCORELOOKUP = f"{rootdir}/trustscore/site_slug.json"
trust_array = {}
TRUSTPILOTLOOKUP = f"{rootdir}/trust-pilot/site_slug.json"
trustp_array = {}
WBMLOOKUP = f"{rootdir}/static/site_wbaid.json"
wbm_array = {}
YAHOOLOOKUP = f"{rootdir}/yahoo/site_index_temp.json"
yahoo_array = {}
LOBBYLOOKUP = f"{rootdir}/lobbyfacts/site_id.json"
lobby_array = {}
bulk_array = defaultdict(dict)

PROPSFORM = f"tools/propsformatter.json"
propsFormatting = {}
PROPSNAME = f"tools/props.json"
propsNaming = {}
PROPSLABEL = f"tools/mongoscripts/labelindex.json"
propsLabels = {}

#def progress():
#    sleep(3)  # Check progress after 3 seconds
#    print(f'total: {pbar.total} finish:{pbar.n}')

missingLabelArray = set()
def process_domains_parrallel(domains):
    global missingLabelArray
#    thread = Thread(target=progress)
#    thread.start()
    results = []
    with Pool() as pool:
        for result in pool.imap_unordered(build_document, domains):
                results.append(result)
                pbar.update(1)
                for item in result:
                    missingLabelArray.add(item)
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
    datapool["P1142"] = {"label": "polideology", "data": []}
    datapool["P452"] = {"label": "industry_wd", "data": []}
    items["P452"] = items["P1142"] = items["P1387"] = {"mainsnak.datavalue.value.id": 1}

#exceptions = ["P1142", "P1387", "P414", "P946", "P8525"]
exceptions = ["P1142", "P1387", "P452"]

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
                elif "datavalue" in i["mainsnak"]:
                    tmpdatapool[claim]["data"].append(f"{i['mainsnak']['datavalue']['value']['id']};{claim};{tmpoutput['id']}")
            except:
                pass
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


social_claims = [ "twittername", "officialblog", "subreddit", "facebookid",
        "facebookpage", "instagramid", "youtubechannelid", "emailaddress",
        "truthsocial", "parleruser", "gabuser", "soundcloud", "tumblr",
        "medium", "telegram", "mastodon", "patreon", "reddituser", "twitch",
        "tiktok" ]

def build_document(website):
    global failures, missingLabels
    output = {}
    output.update(bulk_array[website])
    output["title"] = website
    output["published"] = True
    core = []
    try:
        output["wikidata_id"]
    except KeyError:
        output["wikidata_id"] = False

    if output["wikidata_id"]:
        tmp_wids = output["wikidata_id"]
        wids = list(set(tmp_wids))
        output["wikidata_id"] = wids
        output["connections"] = f"/connections/{website}.json"
        do_graph(main_node=wids, file_out=f"hugo/static/connections/{website}.json", collection=collection)
        for wid in wids:
            result = query_for_wikidata(wid)
            if result is None:
                continue

            #pprint(result)
            for claim in result:
                if result[claim]["data"]:
                    label = result[claim]["label"]
                    if label in social_claims:
                        if not output.get("social"):
                            output["social"] = {}
                        resolvedResult = []
                        propName = ''
                        for item in result[claim]["data"]:
                            dataBreakdown = item.split(";")
                            urlForm = propsFormatting[dataBreakdown[1]].replace("$1",dataBreakdown[0])
                            propName = propsNaming[dataBreakdown[1]]
                            resolvedResult.append({"url": f"{urlForm}", "source": website })

                        if not output.get("social").get(propName):
                            output["social"][propName] = []
                        output["social"][propName].extend(resolvedResult)
                    else:
                        resolvedResult = []
                        propName = ''
                        for item in result[claim]["data"]:
                            dataBreakdown = item.split(";")
                            try:
                                dataName = propsLabels[dataBreakdown[0]]
                            except KeyError:
                                missingLabels.add(dataBreakdown[0])
                                continue
                            try:
                                sourceLabels = propsLabels[dataBreakdown[2]]
                            except KeyError:
                                missingLabels.add(dataBreakdown[2])
                                continue
                            try:
                                propName = propsNaming[dataBreakdown[1]]
                            except KeyError:
                                missingLabels.add(dataBreakdown[1])
                                continue
                            resolvedResult.append({"data": dataName, "dataId": dataBreakdown[0], "source": website, "sourceLabels": sourceLabels })

                        if claim == "P452":
                            if not output.get("industry"):
                                output["industry"] = {}
                            if not output["industry"].get(result[claim]["label"]):
                                output["industry"][result[claim]["label"]] = []
                            output["industry"][result[claim]["label"]].extend(resolvedResult)
                        else:
                            if not output.get("political"):
                                output["political"] = {}
                            if not output["political"].get(result[claim]["label"]):
                                output["political"][result[claim]["label"]] = []
                            output["political"][result[claim]["label"]].extend(resolvedResult)

            #isin_id_list = output.get("isin_id", [])
            #if isin_id_list:
            #    output["isin"] = list(set(f"{i}:{isin_id}" for isin_id in isin_id_list for i in isin_array.get(isin_id, [])))


    try:
        if tosdr_data_array[str(website)]:
            output["tosdr_rating"] = tosdr_data_array[str(website)]["rating"]
            core.append({
                "type": "tosdr", "url": f"tosdr/{tosdr_data_array[str(website)]['id']}.json"
            })
    except:
        pass

    if "bcorp_slug" in output:
        core.append({
            "type": "bcorp", "url": f"bcorp/{output['bcorp_slug']}.json"
        })
        with open(f'{rootdir}/bcorp/entities/{output["bcorp_slug"]}.json') as f:
            bcorp_data = json.load(f)
            output["bcorp"] = {}
            output["bcorp"]["source"] = bcorp_data["source"]
            output["bcorp"]["score"] = bcorp_data["score"]

    if "goodonyou_slug" in output:
        for slug in output.get("goodonyou_slug"):
            core.append({
                "type": "goodonyou", "url": f"goodonyou/{slug}.json"
            })
            with open(f'{rootdir}/goodonyou/entities/{slug}.json') as f:
                goy = json.load(f)
                if not output.get("goodonyou"):
                    output["goodonyou"] = []
                output["goodonyou"].append({
                    "rating": goy["rating"],
                    "source": goy["source"]
                })

    for slug in output.get("mbfc_slug", []):
        core.append({
            "type": "mbfc", "url": f"mbfc/{slug}.json"
        })
        with open(f'{rootdir}/mbfc/entities/{slug}.json') as f:
            mbfc = json.load(f)
            if not output.get("mbfc"):
                output["mbfc"] = []
            output["mbfc"].append({
                "rating": mbfc["bias"],
                "questionable": mbfc["questionable"],
                "source": mbfc["source"]
            })
            if not output.get("mbfc_tags"):
                output["mbfc_tags"] = [ mbfc["bias"]] + mbfc.get("questionable", [])
            else:
                for tag in [ mbfc["bias"] ] + mbfc.get("questionable", []):
                    if not tag in output["mbfc_tags"]:
                        output["mbfc_tags"].append(tag)

    if "glassdoor_id" in output:
        glassid = output["glassdoor_id"]
        with open(f"{rootdir}/glassdoor/entities/{glassid}.json", "r") as f:
            glassdata = json.load(f)
            glasstemp = {}
            glasstemp["source"] = glassdata["source"]
            try:
                glasstemp["rating"] = glassdata["glasroom_rating"]["ratingValue"]
                output["glassdoor"] = glasstemp
                core.append({"type":"glassdoor","url":f"glassdoor/{glassid}.json"})
            except:
                failures.append(f"glassdoor/{glassid}")

    for osid in output.get("osids", []):
        core.append({"type": "opensecrets", "url": f"opensecrets/{osid}.json"})

    if "wba_id" in output:
        core.append({"type": "wbm", "url": f"wbm/{output['wba_id']}.json"})

    if "ticker" in output:
        ticker = output.get("ticker")
        core.append({"type": "yahoo", "url": f"yahoo/{ticker}.json"})
        with open(f"{rootdir}/yahoo/entities/{ticker}.json", "r") as f:
            yahoo_data = json.load(f)
            output["esg_rating"] = yahoo_data["totalEsg"]
            output["esg_source"] = yahoo_data["source"]

    if "tp_slug" in output:
        tpslug = output.get("tp_slug")
        core.append({"type": "trustpilot", "url": f"trustpilot/{tpslug}.json"})
        with open(f"{rootdir}/trust-pilot/entities/{tpslug}.json", "r") as f:
            tpdata = json.load(f)
            output["tp_rating"] = tpdata["score"]
            output["tp_source"] = tpdata["source"]

    if "lobbyeu" in output:
        lobby = output.get("lobbyeu")
        core.append({"type": "lobbyeu", "url": f"lobbyfacts/{lobby}.json"})
        with open(f"{rootdir}/lobbyfacts/entities/{lobby}.json", "r") as f:
            lbdata = json.load(f)
            output["lb_fte"] = lbdata["lobbyist_fte"]
            output["lb_source"] = lbdata["source"]

    if "ts_slug" in output:
        tsslug = output.get("ts_slug")
        core.append({"type": "trustscore", "url": f"trustscore/{tsslug}.json"})
        with open(f"{rootdir}/trustscore/entities/{tsslug}.json", "r") as f:
            tsdata = json.load(f)
            output["ts_rating"] = tsdata["score"]
            output["ts_source"] = tsdata["source"]

    if os.path.isfile(f"{rootdir}/similar-sites/entities/{website.replace('.','')}.json"):
        core.append({"type": "similar", "url": f"similar/{website.replace('.','')}.json"})

    if os.path.isfile(f"{rootdir}/trustpilot/entities/{website.replace('.','')}.json"):
        core.append({"type": "similar", "url": f"similar/{website.replace('.','')}.json"})


    output["core"] = core
    write_output_file(website, output)
    return missingLabels

def prepare():
    global mediabias_array, tosdr_data_array, trust_array, trustp_array, bcorp_array, osid_array, isin_array, bulk_array, propsFormatting, propsNaming, propsLabels

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
                site = get_domain("http://" + i)
                bulk_array[site][field] = i_data
                website_list.add(site)

    # Process GoodOnYou lookup file
    process_lookup_file_json_webaware(GYLOOKUP, goodonyou_array, "goodonyou_slug")

    # Process Glassdoor lookup file
    process_lookup_file_json_webaware(GDLOOKUP, glassdoor_array, "glassdoor_id")

    # Process MediaBias lookup file
    process_lookup_file_json_webaware(MBLOOKUP, mediabias_array, "mbfc_slug")

    # Trustscore Data
    process_lookup_file_json_webaware(TRUSTSCORELOOKUP, trust_array, "ts_slug")

    # Trustpilot array
    process_lookup_file_json_webaware(TRUSTPILOTLOOKUP, trustp_array, "tp_slug")

    # Process Bcorp lookup file
    process_lookup_file_json_webaware(BCLOOKUP, bcorp_array, "bcorp_slug")

    # Process OSID lookup file
    process_lookup_file_json_webaware(OSLOOKUP, osid_array, "osids")

    # Process WBM lookup file
    process_lookup_file_json_webaware(WBMLOOKUP, wbm_array, "wba_id")

    # Process Yahoo lookup_file
    process_lookup_file_json_webaware(YAHOOLOOKUP, yahoo_array, "ticker")

    # Process Lobby lookup_file
    process_lookup_file_json_webaware(LOBBYLOOKUP, lobby_array, "lobbyeu")

    # TOSDR Data
    process_lookup_file_json(TSDATAARRAY, tosdr_data_array)

    # Process Wikipedia lookup file
    process_lookup_file(WPLOOKUP, wikipedia_array, "wikipedia")

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

    # Process ISIN lookup file
    #with open(ISLOOKUP, "r") as f:
    #    isin_file = csv.reader(f)
    #    for i in isin_file:
    #        entry = i[0].split(':')
    #        isin_array.setdefault(entry[1], []).append(entry[0])
    with open(PROPSFORM, "r") as f:
        propsFormatting = json.load(f)
    with open(PROPSNAME, "r") as f:
        propsNaming = json.load(f)
    with open(PROPSLABEL, "r") as f:
        propsLabels = json.load(f)

def testRun():
    #testdomain = "meta.com"
    testdomain = "reddit.com"
    #testdomain = "facebook.com"
    #testdomain = "theguardian.com"
    #testdomain = "breitbart.com"
    #testdomain = "nespresso.com"
    #testdomain = "nike.com"
    build_document(testdomain)
    show_document(testdomain)
    pprint(len(bulk_array))
    #with open("missingLabels.json", "w") as missingLabelFile:
    #    json.dump(list(missingLabels),missingLabelFile, indent=4)
    exit()


prepare()
build_pairings_and_datapool()
#testRun()
pbar = tqdm(total=len(website_list))
if __name__ == "__main__":
    processed_results = process_domains_parrallel(website_list)
    pprint(failures)
    pprint(len(missingLabelArray))
    with open("missingLabels.json", "w") as missingLabelFile:
        json.dump(list(missingLabelArray),missingLabelFile, indent=4)
