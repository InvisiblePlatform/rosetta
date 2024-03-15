import json

# Load data from the first JSON file
with open("wbm_enritchmentindex.json", "r") as file1:
    data1 = json.load(file1)

# Load data from the second JSON file
with open("wbai_arranged-name.json", "r") as file2:
    data2 = json.load(file2)

# Initialize a dictionary to store the combined data
combined_data = {}

# Merge data from the first file into the combined_data dictionary
for key, value in data1.items():
    if key not in combined_data:
        combined_data[key] = {
            "Company Name": value["Company Name"],
            "ISIN": [],
            "WBA_ID": []
        }
    combined_data[key]["ISIN"].append(value["ISIN"])
    combined_data[key]["WBA_ID"].append(value["WBA_ID"])

# Merge data from the second file into the combined_data dictionary
for key, value in data2.items():
    if key not in combined_data:
        combined_data[key] = {
            "Company Name": value["Company Name"],
            "ISIN": [],
            "WBA_ID": []
        }
    for isin in value["ISIN"]:
        if isin not in combined_data[key]["ISIN"]:
            combined_data[key]["ISIN"].append(isin)
    for wbaid in value["WBA_ID"]:
        if wbaid not in combined_data[key]["WBA_ID"]:
            combined_data[key]["WBA_ID"].append(wbaid)

# Save the combined data to an output JSON file
with open("combined_data_wba.json", "w") as output_file:
    json.dump(combined_data, output_file, indent=4)

print("Combined data saved to combined_data.json")

