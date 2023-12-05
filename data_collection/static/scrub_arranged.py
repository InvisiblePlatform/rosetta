import json
from pprint import pprint

# Load the original JSON data
input_file = "wbai_arranged-2.json"  # Replace with your input file path
with open(input_file, "r") as json_file:
    data = json.load(json_file)

# Initialize a dictionary to store the rearranged data
rearranged_data = {}

# Iterate through the original data and rearrange it
for key, value in data.items():
    new_object = {}
    new_object["WBA_ID"] = list(set(value["WBA_ID"]))

    if len(new_object["WBA_ID"]) > 1:
        new_object["WBA_ID"] = [wbaid for wbaid in new_object["WBA_ID"] if 'UNK' not in wbaid and 'PT' in wbaid]
    if len(new_object["WBA_ID"]) > 1:
        pprint(value)
        exit()

    new_object["Company Name"] = []
    for name in value["Company Name"]:
        if isinstance(name, list):
            new_object["Company Name"].append(name[0])
        else:
            new_object["Company Name"].append(name)

    new_object["ISIN"] = []
    for isin in value["ISIN"]:
        if isin not in new_object["ISIN"] and isin and isin != "NULL" and isin != "TBC":
            new_object["ISIN"].append(isin)

    #if len(new_object["ISIN"]) > 1:
    #    pprint(new_object)
    #    exit()

    if key not in new_object["WBA_ID"]:
        rearranged_data[new_object["WBA_ID"][0]] = new_object
    else:
        if key not in rearranged_data:
            rearranged_data[key] = new_object
        else:
            for isin in new_object["ISIN"]:
                if isin not in rearranged_data[key]["ISIN"]:
                    rearranged_data[key]["ISIN"].append(isin)
            for cn in new_object["Company Name"]:
                if cn not in rearranged_data[key]["Company Name"]:
                    rearranged_data[key]["Company Name"].append(cn)
            for wbaid in new_object["WBA_ID"]:
                if wbaid not in rearranged_data[key]["WBA_ID"]:
                    rearranged_data[key]["WBA_ID"].append(wbaid)



pprint(rearranged_data["PT_01993"])
exit()
# Save the rearranged data to a new JSON file
output_file = "wbai_arranged-3.json"  # Replace with your desired output file path
with open(output_file, "w") as json_file:
    json.dump(rearranged_data, json_file, indent=4)

print(f"Rearranged data saved to {output_file}")

