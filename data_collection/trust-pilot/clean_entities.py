import os
import json
from tld import get_tld
from tld.exceptions import TldDomainNotFound

# Function to process a single JSON file
def trustPilotProcessJson(json_filename):
    # Define the new variables to add to the data
    with open(json_filename, 'r') as json_file:
        clean = json.load(json_file)
        # Extract the value from the filename to construct the output path
        if clean.get("name") == "ApplicationError":
            return
        slug = clean.get("name")["identifying"].replace("www.", "").replace(".","").split("/")[0]
        entity_filename = f"entities/{slug}.json"
        sites = list(set([name.replace("www.","") for name in clean.get("name")["referring"]]))
        score = clean.get("score")["trustScore"]
        new_variables = {
            "location": f"trustpilot/{slug}",
            "source": clean.get("displayName"),
            "domains": sites,
            "domain": clean.get("name")["identifying"],
            "websiteUrl": clean.get("websiteUrl"),
            "score": score,
            "rating": clean.get("score")["stars"],
            "reviews": clean.get("numberOfReviews")
        }
        # Add referring array to seensites so we can cut down on redundancy 
        seen_sites = set()
        for site in clean.get("name")["referring"]:
            seen_sites.add(site)

        index_data = {}
        for site in sites:
            # We dont do anything with the return, just using it to check if its
            # a legit domain and not a local or broken one
            try:
                get_tld("https://" + site, as_object=True)
            except TldDomainNotFound:
                continue

            index_data[site] = { "slug": slug, "source": site, "score": score }

        # Write the modified data to the entities folder
        with open(entity_filename, 'w') as entity_file:
            json.dump(new_variables, entity_file, indent=4)

        print(f"Processed {json_filename} and wrote to {entity_filename}")
        return seen_sites, index_data


def trustPilotClean(dir_to_check: str, out_index: str, seen_index: str, lookup_index: str):
    # Directory containing the JSON files
    seen_sites = set()
    index_data = {}
    lookup_data = {}

    # Iterate through all JSON files in the directory
    for root, _, files in os.walk(dir_to_check):
        for file in files:
            if file.endswith(".json"):
                json_filename = os.path.join(root, file)
                seen_output = trustPilotProcessJson(json_filename)
                if seen_output:
                    seen_sites.update(seen_output[0])
                    index_data.update(seen_output[1])

    # For rosetta usage
    for index, item in index_data.items():
        entry = lookup_data.get(item["slug"],{})
        cleaned = index.split('/')[0]

        if not entry.get("canon"):
            if item["slug"] == cleaned.replace(".",""):
                entry["canon"] = cleaned

        if not entry.get("sites"):
            entry["sites"] = []

        if not cleaned in entry["sites"]:
            entry["sites"].append(cleaned)

        lookup_data[item["slug"]] = entry

        
    with open(out_index, 'w') as indexfile:
        json.dump(index_data, indexfile, indent=4)
    
    with open(lookup_index, 'w') as indexfile:
        json.dump(lookup_data, indexfile, indent=4)

    with open(seen_index, 'w') as indexfile:
        indexfile.writelines(f"{site}\n" for site in seen_sites)


if __name__ == "__main__":
    trustPilotClean(dir_to_check='sites', out_index='site_slug.json', seen_index='seen_sites.list', lookup_index='slug_site.json')