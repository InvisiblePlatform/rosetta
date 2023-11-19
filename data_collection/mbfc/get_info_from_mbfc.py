import json
from time import sleep
from bs4 import BeautifulSoup
from pprint import pprint
import requests
import os

user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
headers = {'User-Agent': user_agent}
live = True

index = {}

# Load the JSON data from the file
with open('./combined.json') as json_file:
    data = json.load(json_file)


for source in reversed(data["sources"]):
    url = source["url"]
    stub = url.replace("https://mediabiasfactcheck.com/", "").replace("/", "")

    if not os.path.exists("./html_cache/" + stub + ".html"):
        response = requests.get(url, headers=headers)
        with open("./html_cache/" + stub + ".html", "w") as f:
            f.write(response.text)
            html_content = response.text
            sleep(1)
    else:
        with open("./html_cache/" + stub + ".html", "r") as f:
            html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    try:
        entry_content = soup.select_one(".entry-content ul li")
        source["description"] = entry_content.get_text()
    except:
        source["description"] = ""

    source["stub"] = stub
    source

    with open("./entries/" + stub + ".json", "w") as f:
        json.dump(source, f)

    print([source["stub"], source["domain"]])
    index[source["domain"]] = source["stub"]

with open("mbfc-index.json", "w") as f:
    json.dump(index, f)
exit()

