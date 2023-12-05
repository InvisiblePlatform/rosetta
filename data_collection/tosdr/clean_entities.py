from pprint import pprint
import json
import os

# Load the JSON data from the input file
input_file = "all.json"  # Replace with your input file path
with open(input_file, "r") as json_file:
    data = json.load(json_file)

# Define the output directory
output_dir = "entities"
index_filename = "site_id.json"
available_ratings = {}

# Iterate through the data and split into individual files
for key, values in data.items():
    try:
        slug = values["slug"]
        rated = values["rated"]
        id_value = values["id"]
        domain = key.replace("tosdr/review/","")
        if "/" in domain:
            continue

        # Create a dictionary with the required fields
        entity_data = {
            "source": values["name"],
            "slug": slug,
            "rated": rated,
            "id": id_value,
            "location": f"tosdr/{id_value}"
        }

        # Define the output filename based on the "slug" and "rated" fields
        if rated:
            available_ratings[domain] = { "id": id_value, "rating": rated }
            output_filename = os.path.join(output_dir, f"{id_value}.json")
            if not os.path.exists(output_filename):
                with open(output_filename, "w") as output_file:
                    json.dump(entity_data, output_file, indent=4)
                print(f"Processed {key} and saved to {output_filename}")
    except Exception as e:
        print(key)
        if key in ["tosdr/api/version","tosdr/data/version"]:
            continue
        print(e)
        exit()

with open(index_filename, "w") as index_file:
    json.dump(available_ratings, index_file, indent=4)

