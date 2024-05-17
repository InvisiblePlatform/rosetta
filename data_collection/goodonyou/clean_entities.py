import os
import json
from pprint import pprint
from urllib.parse import urlparse

available_ratings = {}
index_filename = "site_slug.json"

# Function to process a single JSON file
def process_json_file(json_filename):
    # Define the new variables to add to the data
    # pprint(json_filename)

    try:
        with open(json_filename, 'r') as json_file:
            data = json.load(json_file)
            # Extract the value from the filename to construct the output path
            _, filename = os.path.split(json_filename)
            value = os.path.splitext(filename)[0]
            clean = data.get("pageProps")["brand"]
            slug = clean.get("slug")
            entity_filename = f"entities/{slug}.json"
            site = clean.get("website")
            try:
                if site.index("avantlink"):
                    site = "https://patagonia.com"
            except:
                pass

            new_variables = {
                "location": f"goodonyou/{slug}",
                "source": clean.get("name"),
                "labourRating": clean.get("labourRating"),
                "animalRating": clean.get("animalRating"),
                "environmentRating": clean.get("environmentRating"),
                "price": clean.get("price"),
                "website": site,
                "rating": clean.get("ethicalRating"),
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
                       #pprint([domain, slug, available_ratings.get(domain.replace("www.",""))])
                   else:
                       available_ratings[domain.replace("www.","")] = [slug]
            #else:
            #    pprint([site, slug])

            # Write the modified data to the entities folder
            with open(entity_filename, 'w') as entity_file:
                json.dump(new_variables, entity_file, indent=4)

            #print(f"Processed {json_filename} and wrote to {entity_filename}")

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")
    except json.decoder.JSONDecodeError:
        print(f"JSON file decode issue found: {json_filename}")

# Directory containing the JSON files
json_dir = 'brands'

# Iterate through all JSON files in the directory
for root, _, files in os.walk(json_dir):
    for file in files:
        if file.endswith(".json"):
            json_filename = os.path.join(root, file)
            process_json_file(json_filename)


with open(index_filename, "w") as index_file:
    json.dump(available_ratings, index_file, indent=4)


pprint(len(available_ratings))
