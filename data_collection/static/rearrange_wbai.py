import json

# Load the original JSON data
input_file = "combined_data_wba.json"  # Replace with your input file path
with open(input_file, "r") as json_file:
    data = json.load(json_file)

# Initialize a dictionary to store the rearranged data
rearranged_data = {}

# Iterate through the original data and rearrange it
for key, value in data.items():
    wba_ids = value.get("WBA_ID", [])
    for wba_id in wba_ids:
        if wba_id not in rearranged_data:
            rearranged_data[wba_id] = {
                "Company Name": [],
                "WBA_ID": [],
                "ISIN": []
            }
        rearranged_data[wba_id]["Company Name"].append(value.get("Company Name"))
        rearranged_data[wba_id]["WBA_ID"].extend(value.get("WBA_ID"))
        rearranged_data[wba_id]["ISIN"].extend(value.get("ISIN"))

# Save the rearranged data to a new JSON file
output_file = "wbai_arranged-2.json"  # Replace with your desired output file path
with open(output_file, "w") as json_file:
    json.dump(rearranged_data, json_file, indent=4)

print(f"Rearranged data saved to {output_file}")
