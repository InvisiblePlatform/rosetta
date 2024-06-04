from json import load as load_json
from json import dump as dump_json
import os
import csv
from copy import deepcopy
from pprint import pprint
from pymongo import MongoClient
from collections import defaultdict, deque
from itertools import repeat
from multiprocessing import Pool
from tqdm import tqdm
from tools.mongoscripts.plain_node import do_graph
from tld import get_tld
from tld.exceptions import TldDomainNotFound, TldBadUrl


output_dir = "data_objects/db/"
rootdir = "data_collection"
extra = True


def get_domain(url):
    try:
        if not url.startswith("http"):
            url = "http://" + url
        parsed_url = get_tld(url, as_object=True)
    except TldDomainNotFound:
        failures.append(url)
        return None
    except TldBadUrl:
        failures.append(url)
        return None
    if parsed_url.subdomain != "":
        domain = parsed_url.subdomain + "." + parsed_url.fld
    else:
        domain = parsed_url.fld

    if parsed_url.subdomain in ["about", "shop", "m"]:
        domain = parsed_url.fld
    return domain


client = MongoClient("mongodb://localhost:27017/")
db = client["rop"]
collection = db["wikidata"]
items = {}
query = {}
datapool = {}
exceptions = []
failures = []
missingLabels = set()

website_list = set()

WDLOOKUP = f"{rootdir}/wikidata/website_id_list.csv"
WDLOOKUPEXTRA = f"tools/mongoscripts/websites.csv"
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
YAHOOLOOKUP = f"{rootdir}/yahoo/site_ticker_new.json"
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

missingLabelArray = set()


def process_domains_parrallel(domains):
    global missingLabelArray
    with Pool() as pool:
        for result in pool.imap_unordered(build_document, domains):
            missingLabelArray.update(result)
            pbar.update(1)
    return


def build_pairings_and_datapool():
    pairings = [
        {"label": "emailaddress", "id": "P968"},
        {"label": "officialblog", "id": "P1581"},
        {"label": "twittername", "id": "P2002"},
        {"label": "instagramid", "id": "P2003"},
        {"label": "facebookid", "id": "P2013"},
        {"label": "youtubechannelid", "id": "P2397"},
        {"label": "soundcloud", "id": "P3040"},
        {"label": "telegram", "id": "P3789"},
        {"label": "medium", "id": "P3899"},
        {"label": "tumblr", "id": "P3943"},
        {"label": "subreddit", "id": "P3984"},
        {"label": "facebookpage", "id": "P4003"},
        {"label": "mastodon", "id": "P4033"},
        {"label": "patreon", "id": "P4175"},
        {"label": "reddituser", "id": "P4265"},
        {"label": "twitch", "id": "P5797"},
        {"label": "tiktok", "id": "P7085"},
        {"label": "parleruser", "id": "P8904"},
        {"label": "gabuser", "id": "P8919"},
        {"label": "truthsocial", "id": "P10858"},
    ]
    items.update({pair["id"]: {"mainsnak.datavalue.value": 1} for pair in pairings})
    datapool.update(
        {pair["id"]: {"label": pair["label"], "data": []} for pair in pairings}
    )
    datapool["P1387"] = {"label": "polalignment", "data": []}
    datapool["P1142"] = {"label": "polideology", "data": []}
    datapool["P452"] = {"label": "industry_wd", "data": []}
    items["P452"] = items["P1142"] = items["P1387"] = {"mainsnak.datavalue.value.id": 1}


# exceptions = ["P1142", "P1387", "P414", "P946", "P8525"]
exceptions = ["P1142", "P1387", "P452"]


def query_for_wikidata(wikiid):
    tmpoutput = collection.find_one(
        {"id": wikiid},
        {"claims": items, "sitelinks": {"enwiki": {"title": 1}}, "id": 1, "_id": 0},
    )
    if not tmpoutput:
        return None
    if not tmpoutput["claims"]:
        return {}

    tmpdatapool = deepcopy(datapool)

    for claim, claim_data in tmpoutput["claims"].items():
        tmpdatapool[claim]["data"].extend(
            [
                {
                    "data": (
                        i["mainsnak"]["datavalue"]["value"]
                        if claim not in exceptions
                        else i["mainsnak"]["datavalue"]["value"]["id"]
                    ),
                    "claim": claim,
                    "output_id": wikiid,
                }
                for i in claim_data
                if "mainsnak" in i and "datavalue" in i["mainsnak"]
            ]
        )
    if "enwiki" in tmpoutput["sitelinks"]:
        tmpdatapool["wikipedia_page"] = tmpoutput["sitelinks"]["enwiki"]["title"]
    return tmpdatapool


def show_document(domain):
    file_path = os.path.join(output_dir, domain.replace(".", "") + ".json")
    if os.path.exists(file_path):
        with open(file_path, "r") as file:
            pprint(load_json(file))

    if os.path.exists(f"data_objects/public/connections/{domain}.json"):
        with open(f"data_objects/public/connections/{domain}.json", "r") as file:
            graph = load_json(file)
            pprint(graph)
            pprint(f"Connections: {len(graph['nodes'])}, {len(graph['links'])}")


def write_output_file(domain, data):
    file_path = os.path.join(output_dir, domain.replace(".", "") + ".json")
    with open(file_path, "w") as file:
        dump_json(data, file, indent=4)


def map_data(item, website):
    try:
        return {
            "data": propsLabels[item["data"]],
            "dataId": item["data"],
            "source": website,
            "sourceLabels": propsLabels[item["data"]],
        }
    except KeyError:
        missingLabels.update(item["data"])
        return None


social_claims = [
    "twittername",
    "officialblog",
    "subreddit",
    "facebookid",
    "facebookpage",
    "instagramid",
    "youtubechannelid",
    "emailaddress",
    "truthsocial",
    "parleruser",
    "gabuser",
    "soundcloud",
    "tumblr",
    "medium",
    "telegram",
    "mastodon",
    "patreon",
    "reddituser",
    "twitch",
    "tiktok",
]


def build_document(website):
    global failures, missingLabels
    output = {}
    output.update(bulk_array[website])
    output["title"] = website
    core = output.get("core", [])

    if "wikidata_id" in output:
        tmp_wids = output["wikidata_id"]
        wids = list(set(tmp_wids))
        output["wikidata_id"] = wids
        output["connections"] = f"/connections/{website}.json"
        do_graph(
            main_node=wids,
            file_out=f"data_objects/public/connections/{website}.json",
            collection=collection,
        )
        for wid in wids:
            result = query_for_wikidata(wid)
            if result is None:
                continue

            # pprint(result)
            if "wikipedia_page" in result:
                output["wikipedia_page"] = result["wikipedia_page"]
                result.pop("wikipedia_page")

            for claim in result:
                if result[claim]["data"]:
                    label = result[claim]["label"]
                    if label in social_claims:
                        if not "social" in output:
                            output["social"] = {}
                        try:
                            propName = propsNaming[claim]
                            propFormat = propsFormatting[claim]
                            resolvedResult = list(
                                map(
                                    lambda item: {
                                        "url": f"{propFormat.replace('$1', item['data'])}",
                                        "source": website,
                                    },
                                    result[claim]["data"],
                                )
                            )

                            if not propName in output["social"]:
                                output["social"][propName] = resolvedResult
                            else:
                                output["social"][propName].extend(resolvedResult)
                        except KeyError:
                            continue
                    else:
                        resolvedResult = filter(
                            lambda x: x is not None,
                            map(map_data, result[claim]["data"], repeat(website)),
                        )
                        if claim == "P452":
                            if not "industry" in output:
                                output["industry"] = {label: []}
                            output["industry"][label].extend(resolvedResult)
                        else:
                            if not "political" in output:
                                output["political"] = {label: []}
                            if not label in output["political"]:
                                output["political"][label] = []
                            output["political"][label].extend(resolvedResult)

    for slug_id in list(filter(lambda item: "_slug" in item, output.keys())):
        match slug_id:
            case "tosdr_slug":
                pass
            case "bcorp_slug":
                core.append(
                    {"type": "bcorp", "url": f"bcorp/{output['bcorp_slug']}.json"}
                )
                with open(f'{rootdir}/bcorp/entities/{output["bcorp_slug"]}.json') as f:
                    bcorp_data = load_json(f)
                    output["bcorp"] = {
                        "source": bcorp_data["source"],
                        "score": bcorp_data["score"],
                    }
            case "goodonyou_slug":
                for slug in output.get("goodonyou_slug", []):
                    core.append({"type": "goodonyou", "url": f"goodonyou/{slug}.json"})
                    with open(f"{rootdir}/goodonyou/entities/{slug}.json") as f:
                        goy = load_json(f)
                        if not output.get("goodonyou"):
                            output["goodonyou"] = []
                        output["goodonyou"].append(
                            {"rating": goy["rating"], "source": goy["source"]}
                        )
            case "mbfc_slug":
                for slug in output.get("mbfc_slug", []):
                    core.append({"type": "mbfc", "url": f"mbfc/{slug}.json"})
                    with open(f"{rootdir}/mbfc/entities/{slug}.json") as f:
                        mbfc = load_json(f)
                        if not output.get("mbfc"):
                            output["mbfc"] = []
                        output["mbfc"].append(
                            {
                                "rating": mbfc["bias"],
                                "questionable": mbfc["questionable"],
                                "source": mbfc["source"],
                            }
                        )
                        if not output.get("mbfc_tags"):
                            output["mbfc_tags"] = [mbfc["bias"]] + mbfc.get(
                                "questionable", []
                            )
                        else:
                            for tag in [mbfc["bias"]] + mbfc.get("questionable", []):
                                if not tag in output["mbfc_tags"]:
                                    output["mbfc_tags"].append(tag)
            case "ts_slug":
                tsdata = output.get("ts_slug", {})
                core.append(
                    {"type": "trustscore", "url": f"trustscore/{tsdata['slug']}.json"}
                )
                output.update(
                    {
                        "ts_rating": tsdata["rating"],
                        "ts_source": tsdata["source"],
                        "ts_slug": tsdata["slug"],
                    }
                )
            case "tp_slug":
                tpdata = output.get("tp_slug", {})
                core.append(
                    {"type": "trustpilot", "url": f"trustpilot/{tpdata['slug']}.json"}
                )
                output.update(
                    {
                        "tp_rating": tpdata["score"],
                        "tp_source": tpdata["source"],
                        "tp_slug": tpdata["slug"],
                    }
                )
            case "osid_slug":
                core.extend(
                    map(
                        lambda osid: {
                            "type": "opensecrets",
                            "url": f"opensecrets/{osid}.json",
                        },
                        output.get("osid_slug", []),
                    )
                )
                output["osids"] = output.get("osid_slug", [])

            case "ticker_slug":
                ticker = output.get("ticker_slug")
                with open(f"{rootdir}/yahoo/entities/{ticker}.json", "r") as f:
                    yahoo_data = load_json(f)
                    if yahoo_data.get("totalEsg") and yahoo_data.get("source"):
                        output["ticker"] = ticker
                        core.append({"type": "yahoo", "url": f"yahoo/{ticker}.json"})
                        output.update(
                            {
                                "esg_rating": yahoo_data["totalEsg"],
                                "esg_source": yahoo_data["source"],
                            }
                        )

            case "glassdoor_slug":
                glassid = output["glassdoor_slug"]
                output["glassdoor_id"] = glassid
                try:
                    with open(f"{rootdir}/glassdoor/entities/{glassid}.json", "r") as f:
                        glassdata = load_json(f)
                        output["glassdoor"] = {
                            "source": glassdata["source"],
                            "rating": glassdata["glasroom_rating"]["ratingValue"],
                        }
                        core.append(
                            {"type": "glassdoor", "url": f"glassdoor/{glassid}.json"}
                        )
                except KeyError:
                    pass
            case "wba_slug":
                output["wba_id"] = output["wba_slug"]
                core.append({"type": "wbm", "url": f"wbm/{output['wba_slug']}.json"})

            case "lobbyeu_slug":
                lobby = output.get("lobbyeu_slug")
                core.append({"type": "lobbyeu", "url": f"lobbyfacts/{lobby}.json"})
                with open(f"{rootdir}/lobbyfacts/entities/{lobby}.json", "r") as f:
                    lbdata = load_json(f)
                    output.update(
                        {
                            "lb_fte": lbdata["lobbyist_fte"],
                            "lb_source": lbdata["source"],
                            "lobbyeu": lobby,
                        }
                    )

    if os.path.isfile(
        f"{rootdir}/similar-sites/entities/{website.replace('.','')}.json"
    ):
        core.append(
            {"type": "similar", "url": f"similar/{website.replace('.','')}.json"}
        )

    # if os.path.isfile(f"{rootdir}/trustpilot/entities/{website.replace('.','')}.json"):
    #     core.extend([{"type": "similar", "url": f"similar/{website.replace('.','')}.json"}])

    output["core"] = core
    write_output_file(website, output)
    return missingLabels


def prepare():
    global tosdr_data_array, bulk_array, propsFormatting, propsNaming, propsLabels, website_list

    print("Preparing data...")

    def process_lookup_file(lookup_file, array, field):
        print(f"Processing {lookup_file}...")
        with open(lookup_file, "r") as f:
            csv_reader = csv.reader(f)
            next(csv_reader)  # Skip the header row, if present
            for row in csv_reader:
                domain = get_domain("http://" + row[0])
                if not domain:
                    continue
                website_list.add(domain)
                array[domain] = row[1]
                bulk_array[domain][field] = row[1]

    def process_lookup_file_json(lookup_file, array):
        print(f"Processing {lookup_file}...")
        with open(lookup_file, "r") as f:
            for i, data in load_json(f).items():
                domain = get_domain("http://" + i)
                if not domain:
                    continue
                bulk_array[domain].update(
                    {
                        "tosdr_rating": data["rating"],
                        "tosdr_slug": data["id"],
                        "tosdr_source": i,
                    }
                )
                if not "core" in bulk_array[domain]:
                    bulk_array[domain]["core"] = [
                        {"type": "tosdr", "url": f"tosdr/{data['id']}.json"}
                    ]
                    continue
                bulk_array[domain]["core"].append(
                    {"type": "tosdr", "url": f"tosdr/{data['id']}.json"}
                )

    def processWikidataList(lookup_file, array, onlyAdd=False):
        print(f"Processing {lookup_file}...")
        with open(lookup_file, "r") as f:
            wikidata_file = csv.reader(f)
            for i in wikidata_file:
                domain = get_domain("http://" + i[0])
                if not domain:
                    continue
                if domain in website_list and onlyAdd:
                    continue
                website_list.add(domain)
                array.setdefault(domain, []).append(i[1])
                try:
                    if bulk_array[domain]["wikidata_id"]:
                        bulk_array[domain]["wikidata_id"] = array[domain]
                except KeyError:
                    bulk_array[domain]["wikidata_id"] = [i[1]]

    # Process Wikidata lookup file
    processWikidataList(WDLOOKUP, wikidata_array)
    if extra:
        processWikidataList(WDLOOKUPEXTRA, wikidata_array, True)

    lookups = [
        (GYLOOKUP, None, "goodonyou_slug"),  # Process GoodOnYou lookup file
        (BCLOOKUP, None, "bcorp_slug"),  # Process Bcorp lookup file
        (OSLOOKUP, None, "osid_slug"),  # Process OSID lookup file
        (MBLOOKUP, None, "mbfc_slug"),  # Process MediaBias lookup file
        (TRUSTSCORELOOKUP, None, "ts_slug"),  # Trustscore Data
        (TRUSTPILOTLOOKUP, None, "tp_slug"),  # Trustpilot array
        (YAHOOLOOKUP, None, "ticker_slug"),  # Process Yahoo lookup_file
        (GDLOOKUP, None, "glassdoor_slug"),  # Process Glassdoor lookup file
        (WBMLOOKUP, None, "wba_slug"),  # Process WBM lookup file
        (LOBBYLOOKUP, None, "lobbyeu_slug"),  # Process Lobby lookup_file
    ]

    def process_lookup_file_json_webaware(arr):
        lookup_file, coreTemplate, field = arr
        print(f"Processing {lookup_file}...")
        with open(lookup_file, "r") as f:
            for i, i_data in load_json(f).items():
                domain = get_domain("http://" + i)
                if not domain:
                    continue
                bulk_array[domain][field] = i_data
                website_list.add(domain)
                if not coreTemplate:
                    continue
                if not bulk_array[domain].get("core"):
                    bulk_array[domain]["core"] = []
                bulk_array[domain]["core"].append(
                    {
                        "type": coreTemplate[0],
                        "url": f"{coreTemplate[1]}{i_data[coreTemplate[2]]}.json",
                    }
                )

    for lookup in lookups:
        process_lookup_file_json_webaware(lookup)

    # TOSDR Data
    process_lookup_file_json(TSDATAARRAY, tosdr_data_array)

    # Process Wikipedia lookup file
    process_lookup_file(WPLOOKUP, wikipedia_array, "wikipedia")

    with open(PROPSFORM, "r") as f:
        propsFormatting = load_json(f)
    with open(PROPSNAME, "r") as f:
        propsNaming = load_json(f)
    with open(PROPSLABEL, "r") as f:
        propsLabels = load_json(f)
    with open("websites.list", "w") as f:
        f.write("\n".join(list(website_list)))


def testRun():
    # testdomain = "meta.com"
    # testdomain = "reddit.com"
    # testdomain = "facebook.com"
    # testdomain = "theguardian.com"
    # testdomain = "breitbart.com"
    # testdomain = "facebook.com"
    # testdomain = "microsoft.com"
    testdomain = "monsterenergy.com"
    build_document(testdomain)
    show_document(testdomain)
    pprint(len(bulk_array))

    # with open("missingLabels.json", "w") as missingLabelFile:
    #    dump_json(list(missingLabels),missingLabelFile, indent=4)
    exit()


def checkForFiles():
    for domain in website_list:
        if not os.path.exists(
            os.path.join(output_dir, domain.replace(".", "") + ".json")
        ):
            pprint(domain)


prepare()
build_pairings_and_datapool()
# testRun()

pbar = tqdm(total=len(website_list))
if __name__ == "__main__":
    processed_results = process_domains_parrallel(website_list)
    pprint(f"Missing labels: {len(missingLabels)}")
    pprint(f"Fails: {len(failures)}")
    pprint(failures)
    pprint(len(missingLabelArray))
    with open("missingLabels.json", "w") as missingLabelFile:
        dump_json(list(missingLabelArray), missingLabelFile, indent=4)
    checkForFiles()
