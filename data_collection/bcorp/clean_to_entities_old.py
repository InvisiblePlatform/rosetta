import csv
import json
from pprint import pprint

# Function to process a single CSV line and create a new JSON object
def process_csv_line(csv_row):
    value = csv_row[1]
    json_filename = f"split_files/bcorp_{value}.json"

    try:
        with open(json_filename, 'r') as json_file:
            data = json.load(json_file)

            slug = data.get("slug")
            # Extract data from the JSON file as needed
            # Example: Create a new object with selected data
            new_obj = {
                "slug": slug,
                "source": data.get("name"),
                "score": data.get("latestVerifiedScore"),
                "ratingDate": data.get("assessments")[0]["ratingDate"],
                "location": f"bcorp/{slug}"
            }

            for area in data.get("assessments")[0]["impactAreas"]:
                new_obj[area["name"]] = area["score"]

            entity_filename = f"entities/{slug}.json"


            # Write the new object to the entities folder
            with open(entity_filename, 'w') as entity_file:
                json.dump(new_obj, entity_file, indent=4)

            print(f"Processed {json_filename} and wrote to {entity_filename}")

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")
    except TypeError:
        print(f"Value missing in: {json_filename}")

# Replace 'input.csv' with your CSV file path
csv_file_path = 'website_stub_bcorp.csv'

# Read the CSV file and process each line
with open(csv_file_path, 'r') as csv_file:
    csv_reader = csv.reader(csv_file)
    next(csv_reader)  # Skip header row if present
    for row in csv_reader:
        process_csv_line(row)

