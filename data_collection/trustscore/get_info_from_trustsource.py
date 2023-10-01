import json
from time import sleep
from bs4 import BeautifulSoup
from pprint import pprint
import requests
import os

user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
headers = {'User-Agent': user_agent}
live = True
prefix = "https://trustscam.com/"

index = {}
sites = []

# Load the JSON data from the file
with open('../../websites.list', "r") as file:
    sites = [line.strip() for line in file]

def do_site(site):
    url = prefix + site
    html_file_loc = "./html_cache/" + site + ".html"
    outobject = {}
    outobject["domain"] = site
    pprint(site)
    if not os.path.exists(html_file_loc):
        response = requests.get(url, headers=headers)
        with open(html_file_loc, "w") as f:
            f.write(response.text)
            html_content = response.text
            sleep(1)
        soup = BeautifulSoup(html_content, 'html.parser')
        try:
            outobject["score"] = soup.select_one("#score-value")["data-value"]
            outobject["rating"] = soup.select_one("#dashboard-screenshot svg use")["xlink:href"].replace("#logo-", "")
            if float(outobject["score"]) > 0:
                with open("./entries/" + site + ".json", "w") as f:
                    json.dump(outobject, f)
                pprint(outobject)
        except:
            pprint(f"failure mode {site}")
            pass
    # else:
    #     with open(html_file_loc, "r") as f:
    #         html_content = f.read()


for site in sites:
    do_site(site)

exit()

