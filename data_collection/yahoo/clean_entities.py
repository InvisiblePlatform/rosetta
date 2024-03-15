import os
import json
from pprint import pprint
from urllib.parse import urlparse

available_ratings = {}
index_filename = "site_ticker.json"
symbol_index = {}

tags = [ 'adult', 'alcoholic', 'animalTesting', 'catholic', 'coal',
         'controversialWeapons', 'furLeather', 'gambling', 'gmo',
         'militaryContract', 'nuclear', 'palmOil', 'pesticides',
         'smallArms', 'tobacco']

# Function to process a single JSON file
def process_json_file(json_filename):
    # Define the new variables to add to the data

    try:
        with open(json_filename, 'r') as json_file:
            data = json.load(json_file)["quoteSummary"]["result"][0]["esgScores"]
            # Extract the value from the filename to construct the output path
            _, filename = os.path.split(json_filename)
            value = os.path.splitext(filename)[0]
            entity_filename = f"entities/{value}.json"
            site = symbol_index[value]
            new_variables = {
                "location": f"yahoo/{value}",
                "source": symbol_index[value],
                'peerGroup': data.get('peerGroup'),
                'ratingYear': data.get('ratingYear'),
                'ratingMonth': data.get('ratingMonth'),
                'esgPerformance': data.get('esgPerformance'),
                'relatedControversy': data.get('relatedControversy'),
                'environmentScore': data.get('environmentScore')["raw"],
                'socialScore': data.get('socialScore')["raw"],
                'governanceScore': data.get('governanceScore')["raw"],
                'totalEsg': data.get('totalEsg')["raw"],
                "website": symbol_index[value],
            }

            # Write the modified data to the entities folder
            with open(entity_filename, 'w') as entity_file:
                json.dump(new_variables, entity_file, indent=4)

            available_ratings[site] = value
            print(f"Processed {json_filename} and wrote to {entity_filename}")

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")
    except KeyError:
        print(f"Site not found: {json_filename}")
    except TypeError:
        print(f"TypeError: {json_filename}")

# Directory containing the JSON files
json_dir = 'ticker'

with open(index_filename, "r") as f:
    site_index = json.load(f)
    for key, value in site_index.items():
        symbol = value["symbol"]
        symbol_index[symbol] = value["website"]


# Iterate through all JSON files in the directory
for root, _, files in os.walk(json_dir):
    for file in files:
        if file.endswith(".json"):
            json_filename = os.path.join(root, file)
            process_json_file(json_filename)

tempIndex = "site_index_temp.json"
with open(tempIndex, "w") as index_file:
    json.dump(available_ratings, index_file, indent=4)


pprint(len(available_ratings))
