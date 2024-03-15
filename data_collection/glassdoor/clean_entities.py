import os
import json
from pprint import pprint
from urllib.parse import urlparse

index_filename = "site_id.json"
available_ratings = {}

industry_average_file = "average_ratings.json"

with open(industry_average_file, "r") as iaf:
    av_array= json.load(iaf)

# Function to process a single JSON file
def process_json_file(json_filename):
    try:
        with open(json_filename, 'r') as json_file:
            data = json.load(json_file)
            # Extract the value from the filename to construct the output path
            _, filename = os.path.split(json_filename)
            value = os.path.splitext(filename)[0]
            entity_filename = f"entities/{value}.json"

            new_variables = {
                "score_industryAverage": av_array.get(data.get("industry")),
                "location": f"glassdoor/{value}",
                "source": data.get("website").replace("http://","").replace("https://","")
            }

            # Add the new variables to the data
            data.update(new_variables)

            # Write the modified data to the entities folder
            with open(entity_filename, 'w') as entity_file:
                json.dump(data, entity_file, indent=4)

            site = new_variables["source"]
            domain = urlparse(site).hostname
            if domain is None:
                domain = urlparse(f"http://{site}").hostname

            if not domain is None:
                if domain.replace("www.","") not in [ "linkedin.com", "facebook.com", "instagram.com", "linktr.ee"]:
                   if available_ratings.get(domain.replace("www.","")):
                       if available_ratings[domain.replace("www.","")] > value:
                           available_ratings[domain.replace("www.","")] = value
                       pprint([domain,value])
                   available_ratings[domain.replace("www.","")] = value
            else:
               pprint([domain,value])


            #print(f"Processed {json_filename} and wrote to {entity_filename}")

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")

# Directory containing the JSON files
json_dir = 'data_json'

# Iterate through all JSON files in the directory
for root, _, files in os.walk(json_dir):
    for file in files:
        if file.endswith(".json"):
            json_filename = os.path.join(root, file)
            process_json_file(json_filename)


with open(index_filename, "w") as index_file:
    json.dump(available_ratings, index_file, indent=4)

pprint(len(available_ratings))
