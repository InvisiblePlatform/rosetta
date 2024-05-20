import json
from selenium import webdriver

chrome_options = webdriver.ChromeOptions()
chrome_options.set_capability(
    "goog:loggingPrefs", {"performance": "ALL", "browser": "ALL"}
)
chrome_options.add_argument("--headless")
driver = webdriver.Chrome(options=chrome_options)


driver.get("https://directory.goodonyou.eco")
log_entries = driver.get_log("performance")
key_list = []
for entry in log_entries:
    try:
        obj_serialized: str = entry.get("message")
        obj = json.loads(obj_serialized)
        message = obj.get("message")
        method = message.get("method")
        if method in [
            "Network.requestWillBeSentExtraInfo" or "Network.requestWillBeSent"
        ]:
            headers = message["params"]["headers"]
            if len(headers) != 0:
                try:
                    if "/data/" in headers[":path"]:
                        key_list.append(
                            headers[":path"].replace("/_next/data/", "").split("/")[0]
                        )
                except:
                    pass
    except Exception as e:
        raise e from None

print(key_list[0])
