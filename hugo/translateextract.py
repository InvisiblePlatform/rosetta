import json
import csv

# Input JSON file
input_file = 'static/i18n/en.json'

# Output CSV file
output_file = 'translatables'

def flatten_json(json_obj, parent_key='', sep='.'):
    items = []
    for key, value in json_obj.items():
        new_key = f"{parent_key}{sep}{key}" if parent_key else key
        if isinstance(value, dict):
            items.extend(flatten_json(value, new_key, sep=sep).items())
        else:
            items.append((new_key, value))
    return dict(items)


# Load JSON data
with open(input_file, 'r') as f:
    data = json.load(f)

# Flatten the JSON object
flattened_data = flatten_json(data)

# Write flattened data to CSV
with open(output_file, 'w', newline='') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerow(["Key", "Value"])  # Header
    for key, value in flattened_data.items():
        writer.writerow([key, value])

print("Conversion complete. CSV file generated:", output_file)
