import os
import json
from pprint import pprint
from tld import get_tld

index_data = {}
index_file = "site_slug.json"
exceptions = [
    "seasalt.loc",
    "dk.\u200btrustpilot.\u200bcom",
]

# Function to process a single JSON file
def process_json_file(json_filename):
    # Define the new variables to add to the data

    with open(json_filename, 'r') as json_file:
        data = json.load(json_file)
        # Extract the value from the filename to construct the output path
        _, filename = os.path.split(json_filename)
        value = os.path.splitext(filename)[0]
        clean = data
        slug = clean.get("name")["identifying"].replace("www.", "").replace(".","").split("/")[0]
        entity_filename = f"entities/{slug}.json"
        #if os.path.isfile(entity_filename):
        #    return
        sites = list(set([name.replace("www.","") for name in clean.get("name")["referring"]]))
        new_variables = {
            "location": f"trustpilot/{slug}",
            "source": clean.get("displayName"),
            "domains": sites,
            "domain": clean.get("name")["identifying"],
            "websiteUrl": clean.get("websiteUrl"),
            "score": clean.get("score")["trustScore"],
            "rating": clean.get("score")["stars"],
            "reviews": clean.get("numberOfReviews")
        }

        for site in sites:
            if site in exceptions:
                continue
            if site.endswith(".local"):
                continue
            get_tld("https://" + site, as_object=True)
            index_data[site] = slug

        ## Add the new variables to the data
        #clean.update(new_variables)

        # Write the modified data to the entities folder
        with open(entity_filename, 'w') as entity_file:
            json.dump(new_variables, entity_file, indent=4)

        print(f"Processed {json_filename} and wrote to {entity_filename}")



# Directory containing the JSON files
json_dir = 'sites'

# Iterate through all JSON files in the directory
for root, _, files in os.walk(json_dir):
    for file in files:
        if file.endswith(".json"):
            json_filename = os.path.join(root, file)
            process_json_file(json_filename)

with open(index_file, 'w') as indexfile:
    json.dump(index_data, indexfile, indent=4)
