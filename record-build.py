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

def build_document(website):
    output = {}
    output["title"] = website
    graphfileloc = f"hugo/static/connection/{website}.json"
    try:
        wid = wikidata_array[website]
        output["wikidata_id"] = wid
        query = { 'id': wid }
        document = collection.find_one(query)

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

build_document("facebook.com")
