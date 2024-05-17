from pprint import pprint
import json
import os

# Load the JSON data from the input file
input_file = "ratings-index.json"  # Replace with your input file path
with open(input_file, "r") as json_file:
    data = json.load(json_file)

# Define the output directory
output_dir = "entities"
site_array = {}
site_file = "site_slug.json"

# Iterate through the data and split into individual files
for key, values in data.items():
    try:
        rated = values["rating"]
        score = values["score"]
        domain = key
        slug = key.replace('.',"")

        # Create a dictionary with the required fields
        entity_data = {
            "source": values["domain"],
            "rating": rated,
            "score": score,
            "location": f"trustscore/{slug}"
        }

        site_array[values["domain"]] = {"slug": slug, "source": values["domain"], "rating": rated, "score": score }

        # Define the output filename based on the "slug" and "rated" fields
        if rated:
            output_filename = os.path.join(output_dir, f"{domain.replace('.','')}.json")
            with open(output_filename, "w") as output_file:
                json.dump(entity_data, output_file, indent=4)
            print(f"Processed {key} and saved to {output_filename}")
    except Exception as e:
        print(e)
        exit()

with open(site_file, "w") as index_file:
    json.dump(site_array, index_file, indent=4)


#if __name__ == "__main__":
#    trustScoreClean()