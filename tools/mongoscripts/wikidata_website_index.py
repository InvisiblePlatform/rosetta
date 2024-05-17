import csv
import json
from urllib.parse import urlparse
from pprint import pprint
from pymongo import MongoClient
from tld import get_tld
from tld.exceptions import TldDomainNotFound, TldBadUrl

failures = []
seen = []
def get_domain(url):
    try:
        parsed_url = get_tld(url, as_object=True)
    except TldDomainNotFound:
        failures.append(url)
        return None
    except TldBadUrl:
        failures.append(url)
        return None

    domain = parsed_url.subdomain + parsed_url.fld
    if parsed_url.subdomain in ["about", "shop", "m", "www"]:
        domain = parsed_url.fld
    return domain

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['rop']
collection = db['wikidata']

# Query documents with a website
cursor = collection.find({'claims.P856.0.mainsnak.datavalue.value': {'$exists': True}})

# Prepare CSV file
csv_file = open('websites.csv', 'w', newline='')
csv_writer = csv.writer(csv_file)
csv_writer.writerow(['website', 'id'])

# Iterate over documents and extract website information
for document in cursor:
    website_claim = document.get('claims', {}).get('P856', [])
    if website_claim:
        website_url = website_claim[0]['mainsnak']['datavalue']['value']
        # TODO: Check to see if the website is a page on the site or a domain in and of itself. 
        #       This will probably make cleaning of junk much easier, and also switch to tldlib instead
        # Clean website URL to extract domain
        domain = get_domain(website_url)
        if domain:
            clean = domain.replace("www.","")
            if clean in seen:
                continue
            seen.append(clean)
            pprint([clean, document['id']])
            csv_writer.writerow([clean, document['id']])

# Close CSV file
csv_file.close()

with open("failures.json", "w") as f:
    json.dump(failures, f, indent=4)

with open("seen.json", "w") as f:
    json.dump(seen, f, indent=4)
