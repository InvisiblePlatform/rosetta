from pprint import pprint
from urllib.parse import urlparse
from tld import get_tld
import json
import os
import re

# Load the JSON data from the input file
input_file = "combined_data.json"  # Replace with your input file path
with open(input_file, "r") as json_file:
    array = json.load(json_file)

average_input_file = "average_ratings_latest_verified_score.json"  # Replace with your input file path
with open(average_input_file, "r") as json_file:
    av_array = json.load(json_file)

# Define the output directory
output_dir = "entities"
available_ratings = {}
index_filename = "site_slug.json"

exceptions = {
    "www.lamarqueenmoins.f": "www.lamarqueenmoins.fr"
}

# Iterate through the data and split into individual files
for data in array:
    try:
        if not data.get("slug"):
            continue
        if len(data.get("assessments")) == 0:
            continue

        slug = data.get("slug")
        # Extract data from the JSON file as needed
        # Example: Create a new object with selected data
        website = re.sub(r'\([^)]*\)', '', data.get("website"))
        new_obj = {
            "slug": slug,
            "source": data.get("name"),
            "score": data.get("latestVerifiedScore"),
            "score_industryAverage": av_array.get(data.get("industry")),
            "industry": data.get("industry"),
            "ratingDate": data.get("assessments")[0]["ratingDate"],
            "location": f"bcorp/{slug}",
            "website": website
        }

        for area in data.get("assessments")[0]["impactAreas"]:
            new_obj[area["name"]] = area["score"]

        entity_filename = f"entities/{slug}.json"


        # Write the new object to the entities folder
        with open(entity_filename, 'w') as entity_file:
            json.dump(new_obj, entity_file, indent=4)

        domains = []

        if " " in website:
            for site in website.replace("/","").replace(";","").replace(",","").split(" "):
                if site == '':
                    continue
                domains.append(site)
        else:
            domains.append(website)

        for site in domains:
            domain = urlparse(site).hostname
            if domain is None:
                domain = urlparse(f"http://{site}").hostname

            if not domain is None:
                if domain in exceptions:
                    domain = exceptions[domain]
                get_tld("https://" + domain, as_object=True)
                if domain.replace("www.","") not in [ "linkedin.com", "facebook.com", "instagram.com", "linktr.ee"]:
                   if available_ratings.get(domain.replace("www.","")):
                       print(domain)
                   available_ratings[domain.replace("www.","")] = slug


        #print(f"Processed {slug} and wrote to {entity_filename}")

    except Exception as e:
        pprint(data)
        print(e)
        exit()

with open(index_filename, "w") as index_file:
    json.dump(available_ratings, index_file, indent=4)

pprint(len(available_ratings))
