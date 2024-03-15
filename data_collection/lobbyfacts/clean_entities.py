import os
import json
from pprint import pprint
from urllib.parse import urlparse

available_ratings = {}
index_filename = "site_id.json"
missing_filename = "missing_websites.json"
ids_missing_domains = {}
fresh_index = "20240224_lobbyfacts_fetched_index.json"
fresh_index_data = {}
outliers = ["deleted"]

with open(fresh_index, 'r') as json_file:
    fresh_index_data = json.load(json_file)

# Function to process a single JSON file
def process_json_file(json_filename):
    # Define the new variables to add to the data

    try:
        with open(json_filename, 'r') as json_file:
            data = json.load(json_file)
            # Extract the value from the filename to construct the output path
            _, filename = os.path.split(json_filename)
            value = os.path.splitext(filename)[0]
            dates = list(data.keys())

            # Find entries that have websites already
            site = "none"
            for i, x in data.items():
                if type(x.get("web_site_url")) != float:
                    site = x.get("web_site_url")

            if site == "none":
                ids_missing_domains[value] = data[dates[-1]]["original_name"]
                raise ValueError(f"Missing website for {value}")


            domain = urlparse(site).hostname
            if domain is None:
                domain = urlparse(f"http://{site}").hostname

            if domain in outliers:
                ids_missing_domains[value] = data[dates[-1]]["original_name"]
                raise ValueError(f"Missing website for {value}")

            available_ratings[domain.replace("www.", "")] = value

            clean = data[dates[-1]]
            #network = {}
            #if type(clean.get("networking")) != float:
            #    pprint(clean.get("networking").replace("\r\n\r\n","\r\n").replace(":\r\n", ": ").split("\r\n"))
            #    pprint(clean.get("networking"))
            #    # pprint(affiliate_list)
            #    for affiliate in clean.get("networking").replace("\r\n\r\n","\r\n").replace(":\r\n", ": ").split("\r\n"):
            #        item = affiliate.split(": ")
            #        network[item[0].strip()] = item[1].strip()

            #pprint(clean)

            if fresh_index_data[value].get("Meetings") == '':
                meetings = 0
            else:
                meetings = int(fresh_index_data[value].get("Meetings"))

            if fresh_index_data[value].get("all EP passes") == '':
                passes = 0
            else:
                passes = int(fresh_index_data[value].get("all EP passes"))

            new_variables = {
                "location": f"lobbyfacts/{value}",
                "source": clean.get("original_name"),
                "eu_transparency_id": value,
                "lobbyist_count": clean.get("members"),
                "lobbyist_fte": clean.get("members_fte"),
                "calculated_cost": clean.get("calculated_cost"),
                "category": clean.get("main_category"),
            #    "network": network,
                "head_country": clean.get("head_country"),
                "meeting_count": meetings,
                "passes_count": passes,
                "be_country": clean.get("be_country"),
                "website": domain.replace("www.", ""),
            }


            entity_filename = f"entities/{value}.json"
            # Write the modified data to the entities folder
            with open(entity_filename, 'w') as entity_file:
                json.dump(new_variables, entity_file, indent=4)

            #print(f"Processed {json_filename} and wrote to {entity_filename}")

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")
    except ValueError as e:
        print(e)

# Directory containing the JSON files
json_dir = 'json_data'

# Iterate through all JSON files in the directory
for root, _, files in os.walk(json_dir):
    for file in files:
        if file.endswith(".json"):
            json_filename = os.path.join(root, file)
            process_json_file(json_filename)


with open(index_filename, "w") as index_file:
    json.dump(available_ratings, index_file, indent=4)

with open(missing_filename, "w") as index_file:
    json.dump(ids_missing_domains, index_file, indent=4)


pprint(len(available_ratings))
