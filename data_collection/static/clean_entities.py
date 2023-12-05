import os
from tld import get_tld
import json
from pprint import pprint
json_dir = "WBMJSON"
lookup = "wba_just_isin.json"
test_index = "test_index.json"

new_lookup = {}
newer_lookup = {}
nottruthy = {}
by_PT = {}
social_refs_name = {}

full_output_index = "wba_full_entities.json"

# By WID, Web, WBAID,Label
with open("wbm_enrichment2.json", "r") as f:
    enriched_data = json.load(f)
# By Name, Website
with open("name_website_2022_social_trans_ref.json", "r") as f:
    social_refs_name = json.load(f)
# By WBA_ID, WBA_ID, Name, ISIN
with open("wbai_arranged-3.json", "r") as f:
    nottruthy = json.load(f)
# By WBA_ID, WBA_ID, Website
with open("wba_id_2023_digitalinclusion.json", "r") as f:
    tempobj = json.load(f)
    for key, value in tempobj.items():
        if by_PT.get(key):
            if value["website"] not in by_PT[key]:
                by_PT[key].append(value["website"])
        else:
            by_PT[key] = [value["website"]]

# By WBA_ID, website, wid, WBA_ID, label, Name
with open("additional_index.json", "r") as f:
    tempobj = json.load(f)
    for key, value in tempobj.items():
        if isinstance(value["website"], list):
            for site in value["website"]:
                if by_PT.get(key):
                    if site not in by_PT[key]:
                        by_PT[key].append(site)
                else:
                    by_PT[key] = [site]
        else:
            if by_PT.get(key):
                if value["website"] not in by_PT[key]:
                    by_PT[key].append(value["website"])
            else:
                by_PT[key] = [value["website"]]


for key, value in enriched_data.items():
    new_lookup[value["label"]] = value["website"]
    for wbaid in value["WBA_ID"]:
        by_PT[wbaid] = value["website"]

for key, value in social_refs_name.items():
    if key in new_lookup:
        for site in value:
            if f"https://{site}" not in new_lookup[key]:
                new_lookup[key].append(f"https://{site}")
    else:
        new_lookup[key] = []
        for site in value:
            if f"https://{site}" not in new_lookup[key]:
                new_lookup[key].append(f"https://{site}")

# By WBA_ID, ISIN, WBA_ID, Name
with open(lookup, "r") as f:
    lookup_data = json.load(f)
    for key, value in lookup_data.items():
        for i in value["Company Name"]:
            if i in new_lookup:
                newer_lookup[i] = value
                newer_lookup[i]["websites"] = new_lookup[i]
            if i not in new_lookup:
                newer_lookup[i] = value
                newer_lookup[i]["websites"] = []
                for j in value["WBA_ID"]:
                    if j in by_PT:
                        for website in by_PT[j]:
                            if website not in newer_lookup[i]["websites"]:
                                newer_lookup[i]["websites"].append(website)

newest_lookup = {}
for key, value in newer_lookup.items():
    for i in value["Company Name"]:
        newest_lookup[i] = value

for key, value in nottruthy.items():
    current_object = {}
    for cn in value["Company Name"]:
        if cn in newest_lookup:
            current_object = newest_lookup[cn]

    if current_object == {}:
        current_object = value
        current_object["websites"] = []

    for cn in value["Company Name"]:
        if cn not in newest_lookup:
            newest_lookup[cn] = current_object

for key, value in social_refs_name.items():
    current_object = {}
    if key in newest_lookup:
        current_object = newest_lookup[key]
    else:
        current_object = {
            "Company Name": [key],
            "WBA_ID": [],
            "ISIN": [],
        }
    for site in value:
        fsite = f"https://{site}"
        if not current_object.get("websites"):
            current_object["websites"] = []
        if fsite not in current_object["websites"]:
            current_object["websites"].append(fsite)

    newest_lookup[key] = current_object

for key, value in newest_lookup.items():
    for wbaid in value["WBA_ID"]:
        if wbaid in by_PT:
            for site in by_PT[wbaid]:
                if site not in value["websites"]:
                    value["websites"].append(site)

for key, value in newest_lookup.items():
    site_list = []
    for site in value["websites"]:
        if site:
            if site.startswith("http"):
                site_list.append(get_tld(site.strip(),as_object=True).fld)
            else:
                site_list.append(get_tld(f"https://{site.strip()}",as_object=True).fld)

    value["websites"] = list(set(site_list))



with open(test_index, "w") as f:
    json.dump(newest_lookup, f, indent=4)

all_data = {}

def process_json_file(json_filename):
    # Define the new variables to add to the data
    file_id = os.path.basename(json_filename).split(".")[0]
    with open(json_filename, 'r') as json_file:
        data = json.load(json_file)
        for key, value in data.items():
            for WBA_ID in newest_lookup[key]["WBA_ID"]:
                if not all_data.get(WBA_ID):
                    all_data[WBA_ID] = { "modules": {}}
                if all_data[WBA_ID]["modules"].get(file_id):
                    pprint(value)
                    pprint(file_id)
                    pprint(all_data[WBA_ID])
                    exit()
                else:
                    if " " in value:
                        del value[" "]
                    if "ISIN" in value:
                        del value["ISIN"]
                    if "WBA_ID" in value:
                        del value["WBA_ID"]
                    if "Company Name" in value:
                        del value["Company Name"]
                    if "Company ID" in value:
                        del value["Company ID"]
                    if "Website" in value:
                        del value["Website"]
                    if "SEDOL" in value:
                        del value["SEDOL"]
                    all_data[WBA_ID]["modules"][file_id] = value

for root, _, files in os.walk(json_dir):
    for file in files:
        if file.endswith(".json"):
            json_filename = os.path.join(root, file)
            process_json_file(json_filename)

for key, value in newest_lookup.items():
    for WBA_ID in value["WBA_ID"]:
        if all_data.get(WBA_ID):
            for variable in ["WBA_ID", "websites", "Company Name", "ISIN"]:
                if variable not in all_data[WBA_ID]:
                    all_data[WBA_ID][variable] = value[variable]
                else:
                    for datum in value[variable]:
                        if datum not in all_data[WBA_ID][variable]:
                            all_data[WBA_ID][variable].append(datum)

with open(full_output_index, "w") as f:
    json.dump(all_data, f, indent=4)

no_sites = {}
site_index = {}
for key, value in all_data.items():
    if len(value["websites"]) == 0:
        no_sites[key] = { "Company Name": value["Company Name"], "WBA_ID": key }
    else:
        value["location"] = f"wbm/{key}"
        value["source"] = value["Company Name"][0]
        with open(f"entities/{key}.json", "w") as f:
            json.dump(value, f, indent=4)
            print(f"{key} written")

        for site in value["websites"]:
            site_index[site] = key

with open("nosites.json", "w") as f:
    json.dump(no_sites, f, indent=4)

with open("site_wbaid.json", "w") as f:
    json.dump(site_index, f, indent=4)

pprint(len(no_sites))

#for key, value in no_sites.items():
#    pprint(value)
#    exit()

#pprint(no_sites)
#pprint(all_data)
