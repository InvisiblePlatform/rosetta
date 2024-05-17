from pprint import pprint
from urllib.parse import urlparse
from tld import get_tld
import json
import os
import re

# Load the JSON data from the input file
input_file = "data/combined_data.json"  # Replace with your input file path
with open(input_file, "r") as json_file:
    array = json.load(json_file)

# Define the output directory
output_dir = "entities"
available_sites = {}
index_filename = "slug_data.json"
canon_index_filename = "site_slug.json"
parent_index_filename = "site_parent_slug.json"
lookup_index_filename = "slug_site.json"


data_for_parents = {}
# Iterate through the data and split into individual files
for data in array:
    try:
        if data.get("id"):
            slug = data.get("id").replace("https://ror.org/","")
        else:
            continue


        pprint(slug)

        sites = set()
        links = data.get("links")
        for url in links:
            sites.add(urlparse(url).hostname.replace("www.", ""))

        canon_sites = list(sites)
        child_sites = []
        if child_sites := data_for_parents.get(slug):
            for site in child_sites:
                sites.add(site)
            del data_for_parents[slug]

        hasParent=False
        relationships = []
        for relation in data.get("relationships"):
            item = {
                "type": relation["type"].lower(),
                "label": relation["label"],
                "slug": relation["id"].replace("https://ror.org/","")
            }
            relationships.append(item)

            if item.get("type") == "parent":
                hasParent = True
                if parent := available_sites.get(item.get("slug")):
                    parent_sites = set(parent.get("sites"))
                    for site in sites:
                        parent_sites.add(site)
                    parent["sites"] = list(parent_sites)
                    available_sites[parent["slug"]] = parent
                else:
                    if parent_data := data_for_parents.get(item["slug"]):
                        parent_sites = set(parent_data)
                        for site in sites:
                            parent_sites.add(site)
                        data_for_parents[item["slug"]] = list(parent_sites)
                    else:
                        data_for_parents[item["slug"]] = list(sites)

        new_obj = {
            "slug": slug,
            "aliases": data.get("aliases", None),
            "country": data.get("country", None),
            "name": data.get("name", None),
            "types": data.get("types", None),
            "wikipedia": data.get("wikipedia_url", None),
            "location": f"ror/{slug}",
            "relations": relationships,
            "child_sites": child_sites,
            "canon_sites": canon_sites,
            "hasParent": hasParent,
            "sites": list(sites)
        }

        for idx, obj in data.get("external_ids").items():
            truthy = []
            if type(obj.get("preferred")) != type(None):
                truthy = [obj.get("preferred")]
            else:
                if isinstance(obj.get("all"), list):
                    truthy = obj.get("all")
                else:
                    truthy = [obj.get("all")]
            new_obj[idx.lower()] = truthy


        #pprint(new_obj)

        available_sites[slug] = new_obj
        #exit()

        entity_filename = f"entities/{slug}.json"

        # Write the new object to the entities folder
        with open(entity_filename, 'w') as entity_file:
            json.dump(new_obj, entity_file, indent=4)


    except Exception as e:
        pprint(data)
        print(e)
        exit()

markfordel = set()
for idx, item in data_for_parents.items():
    if item == []:
        continue
    if parent := available_sites.get(idx):
        sites = set(parent["sites"])
        for site in item:
            sites.add(site)
        parent["sites"] = list(sites)
        available_sites[idx] = parent
        markfordel.add(idx)

for i in markfordel:
    del data_for_parents[idx]

site_to_parent_id = {}
site_to_id = {}
slug_to_site = {}

for slug, obj in available_sites.items():
    if not obj["hasParent"]:
        for site in obj["sites"]:
            site_to_parent_id[site] = obj["slug"]

    if len(obj["canon_sites"]) > 0:
        slug_to_site[slug] = {
            "sites": obj["sites"],
            "canon": obj["canon_sites"][0]
        }

    for site in obj["canon_sites"]:
        site_to_id[site] = obj["slug"]


#pprint(len(data_for_parents))
#pprint(data_for_parents)
with open(index_filename, "w") as index_file:
    json.dump(available_sites, index_file, indent=4)

with open(canon_index_filename, "w") as index_file:
    json.dump(site_to_id, index_file, indent=4)

with open(parent_index_filename, "w") as index_file:
    json.dump(site_to_parent_id, index_file, indent=4)

with open(lookup_index_filename, "w") as index_file:
    json.dump(slug_to_site, index_file, indent=4)

pprint(len(available_sites))
