import json

# Load the original JSON data
input_file = "wbai_arranged-2.json"  # Replace with your input file path
with open(input_file, "r") as json_file:
    data = json.load(json_file)

# Initialize a dictionary to store the rearranged data
rearranged_data = {}

# Iterate through the original data and rearrange it
for key, value in data.items():
    isin_ids = value.get("ISIN", [])
    for isin_id in isin_ids:
        if isin_id == "":
            continue
        if isin_id not in rearranged_data:
            rearranged_data[isin_id] = {
                "ISIN": [],
                "WBA_ID": [],
                "Company Name": []
            }
        for isin in value.get("ISIN"):
            if isin not in rearranged_data[isin_id]["ISIN"]:
                rearranged_data[isin_id]["ISIN"].append(isin)
        for wba_id in value.get("WBA_ID"):
            if wba_id not in rearranged_data[isin_id]["WBA_ID"]:
                rearranged_data[isin_id]["WBA_ID"].append(wba_id)
        for cn in value.get("Company Name"):
            if cn not in rearranged_data[isin_id]["Company Name"]:
                rearranged_data[isin_id]["Company Name"].append(cn)

# Save the rearranged data to a new JSON file
output_file = "isin-rearranged_wba.json"  # Replace with your desired output file path
with open(output_file, "w") as json_file:
    json.dump(rearranged_data, json_file, indent=4)

print(f"Rearranged data saved to {output_file}")

