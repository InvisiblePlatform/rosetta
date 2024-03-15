import os
import json
from pprint import pprint

# Function to process a single JSON file
def process_json_file(json_filename):
    # Define the new variables to add to the data
    try:
        with open(json_filename, 'r') as json_file:
            data = json.load(json_file)
            # Extract the value from the filename to construct the output path
            _, filename = os.path.split(json_filename)
            value = os.path.splitext(filename)[0]
            clean = data
            slug = clean.get("Redirect").replace(".", "")
            entity_filename = f"entities/{slug}.json"

            sites = []
            for site in clean["SimilarSites"]:
                site_obj = {
                    "s": site.get("Site"),
                    "p": float(str(site.get("Grade"))[0:4]),
                    "r": site.get("SimilarityRank")
                }
                sites.append(site_obj)

            sorted_sites = sorted(sites, key=lambda x: x["r"])

            new_variables = {
                "location": f"similar/{slug}",
                "source": clean.get("Title"),
                "domain": clean.get("Redirect"),
                "similar": sorted_sites
            }


            ## Add the new variables to the data
            #clean.update(new_variables)

            # Write the modified data to the entities folder
            with open(entity_filename, 'w') as entity_file:
                json.dump(new_variables, entity_file, indent=4)

            print(f"Processed {json_filename} and wrote to {entity_filename}")

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")
    except AttributeError:
        print(f"JSON file issue: {json_filename}")
    except json.decoder.JSONDecodeError:
        print(f"JSON file issue: {json_filename}")


# Directory containing the JSON files
json_dir = 'sites'

# Iterate through all JSON files in the directory
for root, _, files in os.walk(json_dir):
    for file in files:
        if file.endswith(".json"):
            json_filename = os.path.join(root, file)
            process_json_file(json_filename)
