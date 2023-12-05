import json
import selenium
from selenium import webdriver
from pprint import pprint
from urllib.parse import urlparse, parse_qs

chrome_options = webdriver.ChromeOptions()
chrome_options.set_capability(
                        "goog:loggingPrefs", {"performance": "ALL", "browser": "ALL"}
                    )
chrome_options.add_argument("--headless")
driver = webdriver.Chrome(options=chrome_options)


driver.get("https://www.bcorporation.net/en-us/find-a-b-corp/?query=3M")
log_entries = driver.get_log("performance")
key_list = []
for entry in log_entries:
    try:
        obj_serialized: str = entry.get("message")
        obj = json.loads(obj_serialized)
        message=obj.get("message")
        method=message.get("method")
        if method in ['Network.requestWillBeSent']:
            request=message['params'].get('request')
            if request:
                if 'queries' in request['url']:
                    urlobj = urlparse(request['url'])
                    key_list.append(parse_qs(urlobj.query)['x-algolia-api-key'])
    except Exception as e:
        raise e from None

print(key_list[0][0])


