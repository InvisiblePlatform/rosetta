import yfinance as yf
from pprint import pprint
import json
import os
import requests
from tld import get_tld



input_file = "2023-12-tickerlist.json"
output_array = {}
output_file = "site_ticker.json"

with open(input_file, "r") as f:
    data = json.load(f)
    for key, value in data.items():
        ticker = yf.Ticker(value["symbol"])
        try:
            info = ticker.info
            if "website" in info:
                website = get_tld(info["website"], as_object=True).fld
                pprint(website)
                output_array[website] = {
                    "symbol": key,
                    "website": website
                }
        except requests.exceptions.HTTPError:
            pass

with open(output_file, "w") as f:
    json.dump(output_array, f, indent=4)
