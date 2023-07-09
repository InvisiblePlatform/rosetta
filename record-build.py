import json
import os
import sys
import csv
from pprint import pprint
from pymongo import MongoClient
from urllib.parse import urlparse

def get_domain(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    return domain

client = MongoClient('mongodb://localhost:27017/')
db = client['rop']
collection = db['wikidata']
datapool={}
items={}
exceptions=[]

website_list = set()
rootdir = "data_collection"
WDLOOKUP = f"{rootdir}/wikidata/website_id_list.csv"
wikidata_array = {}
MBLOOKUP = f"{rootdir}/mbfc/website_bias.csv"
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
OSLOOKUP = f"{rootdir}/opensecrets/opensecretsid1.json"
osid_array = {}
# Build lists of websites

with open(WDLOOKUP, "r") as f:
    wikidata_file = csv.reader(f)
    for i in wikidata_file:
        domain = get_domain("http://"+i[0])
        website_list.add(domain)
        wikidata_array[domain] = i[1]
        # FIXME: Needs multiple wikidataid support
with open(MBLOOKUP, "r") as f:
    mediabias_file = csv.reader(f)
    for i in mediabias_file:
        domain = get_domain("http://"+i[0])
        website_list.add(domain)
        mediabias_array[domain] = i[1]
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
        lists += entry[0]
        isin_array[entry[1]] = lists
with open(OSLOOKUP, "r") as f:
    opensecrets_file = json.load(f)
    for i in opensecrets_file:
        osid = opensecrets_file[i]["osid"]
        osid_array[i] = osid

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
    exceptions = ["P1142", "P1387", "P414", "P946", "P8525"]

def query_for_wikidata(wikiid):
    tmpclient = MongoClient('mongodb://localhost:27017/')
    tmpdb = tmpclient['rop']
    tmpcollection = tmpdb['wikidata']
    tmpdatapool = datapool
    tmpquery = {
        'id': wikiid
    }
    claims = items
    tmpoutput = tmpcollection.find_one(tmpquery, {
                "claims": claims,
                "id": 1,
                "_id": 0
    })
    pprint(tmpoutput)
    for claim in tmpoutput["claims"]:
        if len(tmpoutput["claims"][claim]) > 0:
            if claim in exceptions:
                if claim == "P414":
                    if len(tmpoutput["claims"][claim]["qualifiers"]) > 0:
                        startdata = tmpdatapool[claim]["data"]
                        for qualifier in tmpoutput["claims"][claim]["qualifiers"]:
                            startdata.append(tmpoutput["claims"][claim]["qualifiers"]["datavalue"]["value"])
                        tmpdatapool[claim]["data"] = startdata
                if claim in ["P946", "P8525"]:
                    tmpdatapool[claim]["data"].append(tmpoutput["claims"][claim]["mainsnak"]["datavalue"]["value"])
                else:
                    tmpdatapool[claim]["data"].append(tmpoutput["claims"][claim]["mainsnak"]["datavalue"]["value"]["id"] + ";" + claim + ";" + tmpoutput["id"])
            else:
                if len(tmpoutput["claims"][claim]) > 0:
                    for i in tmpoutput["claims"][claim]:
                        tmpdatapool[claim]["data"].append(i["mainsnak"]["datavalue"]["value"] + ";" + claim + ";" + tmpoutput["id"])
    result = 0
    tmpclient.close()
    return tmpdatapool

def build_document(website):
    output = {}
    output["title"] = website
    wid = ''
    graphfileloc = f"hugo/static/connection/{website}.json"
    wid = wikidata_array[website]

    output["wikidata_id"] = wid
    result = query_for_wikidata(wid)
    for claim in result:
        if result[claim]["data"] != []:
            output[result[claim]["label"]] = result[claim]["data"]
    try:
        isin = output["isin_id"]
        # FIXME: The logic for ISIN stuff needs to be added and checked
    except:
        pass
    if wid != '':
        try:
            output["osid"] = osid_array[wid]
        except:
            pass
    try:
        output["tosdr_id"] = tosdr_array[website]
    except:
        pass
    try:
        output["mbfc"] = mediabias_array[website]
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
            pprint(bcorpdata)
    except:
        pass

    pprint(output)

build_pairings_and_datapool()
build_document("shell.co.uk")
