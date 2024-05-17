from bs4 import BeautifulSoup
from pprint import pprint
from time import sleep
from tld import get_tld
from urllib.parse import urlparse
import json
import os
import requests

available_ratings = {}
index_filename = "site_slug.json"

exceptions = {
    "thedenverchannel": "thedenverchannel.com",
    "womensrightsnews": "facebook.com/WOMENSRIGHTSNEWS",
    "brainerddispatch.cpm": "brainerdispactch.com",
    "bemidji pioneer": "bemidjipioneer.com",
    "borowitz-report": "newyorker.com/humor/borowitz-report"
}

def mbfcGetIndex():
    # Get a copy of the data index from the extension
    url = "https://raw.githubusercontent.com/drmikecrowe/mbfcext/main/docs/v5/data/combined.json"
    indexFilePath = "combined.json"
    response = requests.get(url)
    data = response.json()
    with open(indexFilePath, "w") as file:
        json.dump(data, file, indent=4) 

def mbfcGetData():
    # Honestly we should probably break this up and/or just make a 
    # template for this description to allow for translation

    user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    headers = {'User-Agent': user_agent}
    index = {}
    
    # Load the JSON data index from the file
    with open('./combined.json') as json_file:
        data = json.load(json_file)
    
    for source in reversed(data["sources"]):
        url = source["url"]
        if not url.startswith("https://mediabias"):
            continue
        stub = url.replace("https://mediabiasfactcheck.com/", "").replace("/", "")

        if os.path.exists(f"entries/{stub}.json"):
            index[source["domain"]] = stub
            continue
    
        # We should probably do some smart updating of the cached pages
        # For now, we will just get new ones
        if not os.path.exists("./html_cache/" + stub + ".html"):
            response = requests.get(url, headers=headers)
            with open("./html_cache/" + stub + ".html", "w") as f:
                f.write(response.text)
                html_content = response.text
                sleep(1)
        else:
            with open("./html_cache/" + stub + ".html", "r") as f:
                html_content = f.read()
    
        soup = BeautifulSoup(html_content, 'html.parser')
    
        try:
            entry_content = soup.select_one(".entry-content ul li")
            source["description"] = entry_content.get_text()
        except:
            source["description"] = ""
    
        source["stub"] = stub
        with open("./entries/" + stub + ".json", "w") as f:
            json.dump(source, f, indent=4)
    
        print([source["stub"], source["domain"]])
        index[source["domain"]] = source["stub"]
    
    with open("mbfc-index.json", "w") as f:
        json.dump(index, f, indent=4)


# Function to process a single JSON file
def mbfcProcessFile(json_filename):
    try:
        with open(json_filename, 'r') as json_file:
            data = json.load(json_file)
            # Extract the value from the filename to construct the output path
            _, filename = os.path.split(json_filename)
            value = os.path.splitext(filename)[0]
            clean = data
            slug = clean.get("stub")
            entity_filename = f"entities/{slug}.json"
            site = clean.get("domain")
            if site in exceptions:
                site = exceptions[site]

            get_tld("https://" + site, as_object=True)
            new_variables = {
                "location": f"mbfc/{slug}",
                "source": clean.get("name"),
                "bias": clean.get("bias"),
                "credibility": clean.get("credibility"),
                "description": clean.get("description"),
                "domain": clean.get("domain"),
                "popularity": clean.get("popularity"),
                "questionable": clean.get("questionable"),
                "reporting": clean.get("reporting"),
                "url": clean.get("url")
            }

            # Add the new variables to the data
            # clean.update(new_variables)
            domain = urlparse(site).hostname
            if domain is None:
                domain = urlparse(f"http://{site}").hostname

            if not domain is None and not site is None:
                if domain.replace("www.","") not in [
                        "linkedin.com", "facebook.com", "instagram.com",
                        "linktr.ee", "etsy.com", "shop.davidjones.com.au",
                        "shop.nordstrom.com", "ebay.com.au", "macys.com",
                        "cinori.com.au", "kohls.com", "farfetch.com",
                        "t.cfjump.com", "poshmark.com", "target.com", "t.dgm-au.com" ]:
                   if available_ratings.get(domain.replace("www.","")):
                       available_ratings[domain.replace("www.","")].append(slug)
                       pprint([domain, slug, available_ratings.get(domain.replace("www.",""))])
                   else:
                       available_ratings[domain.replace("www.","")] = [slug]

            # Write the modified data to the entities folder
            with open(entity_filename, 'w') as entity_file:
                json.dump(new_variables, entity_file, indent=4)

            #print(f"Processed {json_filename} and wrote to {entity_filename}")

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")

if __name__ == "__main__":
    mbfcGetIndex()
    mbfcGetData()

    # Directory containing the JSON files
    json_dir = 'entries'
    # Iterate through all JSON files in the directory
    for root, _, files in os.walk(json_dir):
        for file in files:
            if file.endswith(".json"):
                json_filename = os.path.join(root, file)
                mbfcProcessFile(json_filename)

    with open(index_filename, "w") as index_file:
        json.dump(available_ratings, index_file, indent=4)


    pprint(len(available_ratings))


