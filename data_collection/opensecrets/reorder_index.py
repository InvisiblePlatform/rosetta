import json
from pprint import pprint
from urllib.parse import urlparse
import os
from tld import get_tld

exceptions = {
    "www.warburgpincus.comm": "www.warburgpincus.com"
}

with open("opensecretsid2.json", "r") as file:
    dataIn = json.load(file)

dataOut = {}

for key, value in dataIn.items():
    for osid in value["osid"]:
        if not os.path.isfile(f"entities/{osid}.json"):
            continue
        pprint(osid)
        for site in value["website"]:
            domain = urlparse(site).hostname
            if domain:
                if domain in exceptions:
                    domain = exceptions[domain]
                get_tld("https://" + domain, as_object=True)
                if domain.replace("www.","") not in dataOut:
                    dataOut[domain.replace("www.", "")] = [ osid ]
                else:
                    if osid not in dataOut[domain.replace("www.","")]:
                        dataOut[domain.replace("www.","")].append(osid)

with open("site_id.json", "w") as outfile:
    json.dump(dataOut, outfile, indent=4)

#  "Q99482082": {
#    "website": [
#      "https://www.canoo.com/"
#    ],
#    "id": "Q99482082",
#    "osid": [
#      "D000096623"
#    ],
#    "label": "Canoo"
#  },
