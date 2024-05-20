import json
import sys
import requests
import time
from requests.adapters import HTTPAdapter, Retry
import tls_client
from pprint import pprint
from bs4 import BeautifulSoup as bs
import os

sys.path.append("..")
from common import is_file_modified_over_a_week_ago


def create_session(
    proxy: dict | None = None,
    is_tls: bool = True,
    has_retry: bool = False,
    delay: int = 1,
) -> requests.Session | tls_client.Session:
    """
    Creates a requests session with optional tls, proxy, and retry settings.
    :return: A session object
    """
    if is_tls:
        session = tls_client.Session(random_tls_extension_order=True)
        session.proxies = proxy
    else:
        session = requests.Session()
        session.allow_redirects = True
        if proxy:
            session.proxies.update(proxy)
        if has_retry:
            retries = Retry(
                total=3,
                connect=3,
                status=3,
                status_forcelist=[500, 502, 503, 504, 429],
                backoff_factor=delay,
            )
            adapter = HTTPAdapter(max_retries=retries)

            session.mount("http://", adapter)
            session.mount("https://", adapter)
    return session


def glassdoorElFilter(tag):
    return not tag.has_attr("class")


def glassdoorGetInfoForId(id: str, session, json_filename, sleepTime):
    url = f"https://www.glassdoor.co.uk/Overview/-EI_IE{id}.htm"
    headers = {
        "authority": "www.glassdoor.co.uk",
        "accept": "*/*",
        "cache-control": "max-age=0",
        "accept-language": "en-US,en;q=0.9",
        "referer": "https://www.glassdoor.co.uk/",
        "sec-ch-ua": '"Chromium";v="125", "Not=A?Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "dnt": "1",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    }
    try:
        req = session.get(url, headers=headers)
        # if req.status != "301":
        #    raise Exception(f"something went wrong {id}")
    except Exception as e:
        sys.stderr.write("Exception in request {}, ({})\n".format(e, url))
        return None
    page = req.content
    soup = bs(page, features="html.parser")
    try:
        entities = soup.findAll(name="ul", attrs={"data-test": "companyDetails"})[0]
    except IndexError:
        pprint(f"sleeping for {sleepTime}s and continuing")
        time.sleep(sleepTime)
        return None
    dataObj = {
        "website": "",
        "headquarters": "",
        "size": "",
        "founded": "",
        "type": "",
        "industry": "",
        "revenue": "",
        "glasroom_rating": {
            "ratingValue": "",
            "bestRating": "",
            "worstRating": "",
            "ratingCount": "",
        },
        "url": url,
    }

    for entity in entities.children:
        # if len(entity.classList()) == 0:
        if entity.a:
            if entity.a["href"][0] == "h":
                dataObj["website"] = entity.a["href"]
            if entity.a["href"].startswith("/Explore/"):
                dataObj["industry"] = entity.string
            continue

        text = entity.string
        if not text:
            continue
        if text.startswith("Type"):
            dataObj["type"] = text.split(":")[1].strip()
            continue
        if text.startswith("Founded"):
            dataObj["founded"] = text.replace("Founded in ", "")
            continue
        if text.startswith("Revenue"):
            dataObj["revenue"] = text.split(":")[1].strip()
            continue
        if text.endswith("Employees"):
            dataObj["size"] = text
            continue
        dataObj["headquarters"] = text

    for thing in soup.findAll(name="script", attrs={"type": "application/ld+json"}):
        obj = json.loads(thing.string)
        try:
            if obj["@type"] == "Review":
                continue
            if obj["@type"] == "EmployerAggregateRating":
                ratingDict = dict()
                for item in obj:
                    if item == "@type":
                        continue
                    if item == "itemReviewed":
                        continue
                    if item == "@context":
                        continue
                    ratingDict[item] = obj[item]
                dataObj["glasroom_rating"] = ratingDict
                break
        except Exception as e:
            sys.stderr.write("Exception in thingLoop {}, ({})\n".format(e, url))
            continue

    with open(json_filename, "w") as file:
        json.dump(dataObj, file, indent=4)
        pprint(dataObj)

    return dataObj


if __name__ == "__main__":
    count = 0
    testSession = create_session(None, True, True)
    dir_to_check = "data_json"
    sleepTime = 60
    for root, _, files in os.walk(dir_to_check):
        total_files = len(files)
        pprint(f"{total_files} files to check")
        for file in files:
            if file.endswith(".json"):
                json_filename = os.path.join(root, file)
                if is_file_modified_over_a_week_ago(json_filename):
                    data_id = file.replace(".json", "")
                    ret = glassdoorGetInfoForId(
                        data_id, testSession, json_filename, sleepTime
                    )
                    if ret is None:
                        testSession = create_session(None, True, True)
                        if sleepTime < 1800:
                            sleepTime += 60
                        pprint("new session")
                    else:
                        sleepTime = 60
                    count += 1
                    time.sleep(0.2)
                else:
                    count += 1
                pprint(f"{count} / {total_files} done")
