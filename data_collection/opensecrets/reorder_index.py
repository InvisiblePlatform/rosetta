import json
from pprint import pprint
import os

exceptions = {"www.warburgpincus.comm": "www.warburgpincus.com"}

with open("opensecretsid2.json", "r") as file:
    dataIn = json.load(file)

dataOut = {}


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
