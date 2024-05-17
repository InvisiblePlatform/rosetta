import json
from time import sleep, ctime
from bs4 import BeautifulSoup
from pprint import pprint
import requests
from typing import Set
import os
import math

user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
headers = {'User-Agent': user_agent}
index = {}
sites = []
trustScoreFailures = []

def trustScoreHandleResponse(html_content, outobject, entity_location: str, site: str):
    global trustScoreFailures
    soup = BeautifulSoup(html_content, 'html.parser')
    try:
        outobject["score"] = soup.select_one("#score-value")["data-value"]
        outobject["rating"] = soup.select_one("#dashboard-screenshot svg use")["xlink:href"].replace("#logo-", "")

        if float(outobject["score"]) > 0:
            with open(entity_location, "w") as f:
                json.dump(outobject, f)
            pprint(f"{site}: ({outobject['score']})")

    except Exception as e:
        pprint(f"failure mode {site}")
        pprint(e)
        trustScoreFailures.append(site)
        with open(f"failures.json", "w") as f:
            json.dump(trustScoreFailures, f)
        return False

    return outobject

def trustScoreItemGet(site: str, dir_to_check: str, delay: float, output_dir: str):
    prefix = "https://trustscam.com/"
    url = prefix + site
    html_file_loc = f"{dir_to_check}{site}.html"
    slug = site.replace('.','')
    entity_location = f"{output_dir}{slug}.json"
    outobject = {"location": f'trustscore/{slug}', "source": site}
    
    if not os.path.exists(html_file_loc) or os.path.getsize(html_file_loc) == 0:
        response = requests.get(url, headers=headers)
        if response.status_code == 404:
            pprint(f"No site {site}")
            return
        with open(html_file_loc, "w") as f:
            f.write(response.text)
            sleep(delay)
        out = trustScoreHandleResponse(html_content=response.text, 
                                       outobject=outobject, 
                                       entity_location=entity_location, 
                                       site=site)
        if out:
            index[site] = out 
    else:
        if os.path.exists(entity_location):
            with open(entity_location, "r") as f:
                data = json.load(f)
                index[site] = data
        else:
            with open(html_file_loc, "r") as f:
                out = trustScoreHandleResponse(html_content=f,
                                       outobject=outobject, 
                                       entity_location=entity_location, 
                                       site=site)
                if out:
                    index[site] = out 
                
            

def trustScoreMain(out_index: str, weblist: str, entities_dir: str, failures_list: str):
    global trustScoreFailures
    count: int = 0
    existing_sites: Set[str] = set()

    for root, dirs, files in os.walk(entities_dir):
        for file in files:
            if file.endswith(".json"):
                existing_sites.add(file[:-len(".json")])

    with open(weblist, "r") as file:
        sites = set([line.strip() for line in file])

    if os.path.exists(failures_list) and os.path.getsize(failures_list) > 0:
        with open(failures_list, "r") as file:
            trustScoreFailures = json.load(file)


    pprint(f"Current Total Sites: {len(sites)}, Processed sites: {len(existing_sites)}")
    failure_set = set(trustScoreFailures)
    to_check = sites - existing_sites - failure_set
    to_check_size = len(to_check)

    pprint(f"To Check Total: {to_check_size}")

    
    for site in to_check:
        trustScoreItemGet(site=site, dir_to_check='./html_cache/', output_dir=entities_dir, delay=0.1)
        pprint(f"{site} : {count}/{to_check_size} "
               f"({math.floor(count/to_check_size * 10000) / 100 })"
               f"(errors: {len(trustScoreFailures)}), {ctime()}")
        count += 1
        exit()
    
    with open(out_index, "r") as file:
        json.dump(index, file, indent=4)

if __name__ == "__main__":
    trustScoreMain(out_index="site_slug.json", 
                   weblist="../../websites.list", 
                   entities_dir="./enitites/",
                   failures_list="failures.json")
exit()

