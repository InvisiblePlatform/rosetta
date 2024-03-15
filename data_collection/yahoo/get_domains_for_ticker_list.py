import yfinance as yf
from pprint import pprint
import json
import os
import requests
from tld import get_tld
import signal

def signal_handler(signal, frame):
    print(" ")
    print(f"{len(output_array)}")
    print(f"{len(ignore_array)}")
    print(f"{len(no_website_array)}")
    print(f"{len(output_array) + len(ignore_array) + len(no_website_array)}")
    exit(0)

signal.signal(signal.SIGINT, signal_handler)



input_file = "2023-12-tickerlist.json"
output_array = {}
output_file = "site_ticker.json"
ignore_file = "ignorefile.json"
ignore_array = []
no_website_file = "nowebsite.json"
no_website_array = []

with open(ignore_file, "r") as f:
    ignore_array = json.load(f)

with open(no_website_file, "r") as f:
    no_website_array = json.load(f)

with open(input_file, "r") as f:
    data = json.load(f)
    for key, value in data.items():
        infopath = f"tickerinfo/{key}.json"
        if key in ignore_array:
            continue
        if key in no_website_array:
            continue
        if os.path.exists(infopath):
            with open(infopath, "r") as d:
                data = json.load(d)
                output_array[data["website"]] = data
        else:
            ticker = yf.Ticker(value["symbol"])

            try:
                info = ticker.info
                if info["quoteType"] == 'NONE':
                    ignore_array.append(key)
                    with open(ignore_file, "w") as d:
                        json.dump(ignore_array, d, indent=4)
                    continue
                if "website" in info:
                    website = get_tld(info["website"], as_object=True).fld
                    industry = info.get("industry", "")
                    pprint(website)
                    output_array[website] = {
                        "symbol": key,
                        "website": website,
                        "industry": industry
                    }
                    with open(infopath, "w") as d:
                        json.dump(output_array[website], d, indent=4)
                else:
                    no_website_array.append(key)
                    with open(no_website_file, "w") as d:
                        json.dump(no_website_array, d, indent=4)
            except yf.exceptions.YFinanceException:
                ignore_array.append(key)
                with open(ignore_file, "w") as d:
                    json.dump(ignore_array, d, indent=4)
            except requests.exceptions.HTTPError:
                ignore_array.append(key)
                with open(ignore_file, "w") as d:
                    json.dump(ignore_array, d, indent=4)
            except KeyError:
                ignore_array.append(key)
                with open(ignore_file, "w") as d:
                    json.dump(ignore_array, d, indent=4)

with open(output_file, "w") as f:
    json.dump(output_array, f, indent=4)

