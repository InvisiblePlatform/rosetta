import json

# Load the original JSON data
input_file = "isin-rearranged_wba.json"  # Replace with your input file path
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
                "ISIN": [],
                "WBA_ID": [],
                "Company Name": []
            }
        for isin in value.get("ISIN"):
            if isin not in rearranged_data[wba_id]["ISIN"]:
                rearranged_data[wba_id]["ISIN"].append(isin)
        for wba_id in value.get("WBA_ID"):
            if wba_id not in rearranged_data[wba_id]["WBA_ID"]:
                rearranged_data[wba_id]["WBA_ID"].append(wba_id)
        for cn in value.get("Company Name"):
            if cn not in rearranged_data[wba_id]["Company Name"]:
                rearranged_data[wba_id]["Company Name"].append(cn)

# Save the rearranged data to a new JSON file
output_file = "wba_just_isin.json"  # Replace with your desired output file path
with open(output_file, "w") as json_file:
    json.dump(rearranged_data, json_file, indent=4)

print(f"Rearranged data saved to {output_file}")
