import os
import json
from pprint import pprint

wba_lookup = {}
with open("wbm_enrichment4.json", "r") as f:
    enriched_data = json.load(f)
    for key, value in enriched_data.items():
        wba_lookup[value["WBA_ID"][0]] = value

missing_ids = {}
with open("nosites.json", "r") as f:
    nosites = json.load(f)
    for key, value in nosites.items():
        try:
            wba_lookup[key]["Company Name"] = value["Company Name"]
        except:
            missing_ids[key] = value
            missing_ids[key]["website"] = ""
            pass

with open("additional_index.json", "w") as f:
    json.dump(wba_lookup, f, indent=4)

with open("missing_index.json", "w") as f:
    json.dump(missing_ids, f, indent=4)

pprint(wba_lookup)
pprint(len(wba_lookup))
pprint(len(missing_ids))

