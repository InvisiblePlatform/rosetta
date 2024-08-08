import json
import sys
import requests
import time
from requests.adapters import HTTPAdapter, Retry
import tls_client
from pprint import pprint
from bs4 import BeautifulSoup as bs
from collections import defaultdict
import os
from clean_entities import glassDoorClean

sys.path.append("..")
from common import (
    print_status,
    print_status_line,
    is_file_modified_over_duration,
)


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


def glassdoor_calculate_average_ratings(folder_path: str):
    industry_ratings = defaultdict(list)

    # Iterate over each file in the folder
    for filename in os.listdir(folder_path):
        if filename.endswith(".json"):
            with open(os.path.join(folder_path, filename), "r") as file:
                data = json.load(file)
                industry = data.get("industry")
                rating_value = data.get("glasroom_rating", {}).get("ratingValue")

                if industry and rating_value:
                    industry_ratings[industry].append(float(rating_value))

    # Calculate average ratings for each industry
    average_ratings = {}
    for industry, ratings in industry_ratings.items():
        average_rating = sum(ratings) / len(ratings)
        average_ratings[industry] = round(average_rating, 2)

    return average_ratings


if __name__ == "__main__":
    testSession = create_session(None, True, True)
    dir_to_check = "data_json"
    total_files, updated, failed, fine = 0, 0, 0, 0
    sleepTime = 60
    for root, _, files in os.walk(dir_to_check):
        total_files = len(files)
        pprint(f"{total_files} files to check")
        for index, file in enumerate(files):
            if file.endswith(".json"):
                json_filename = os.path.join(root, file)
                if is_file_modified_over_duration(json_filename, "1w"):
                    data_id = file.replace(".json", "")
                    ret = glassdoorGetInfoForId(
                        data_id, testSession, json_filename, sleepTime
                    )
                    if ret is None:
                        testSession = create_session(None, True, True)
                        if sleepTime < 1800:
                            sleepTime += 60
                        pprint("new session")
                        failed += 1
                        print_status("fail", index, total_files, file)
                    else:
                        sleepTime = 60
                        updated += 1
                        print_status("upd8", index, total_files, file)
                    time.sleep(0.2)
                else:
                    fine += 1
                    print_status("fine", index, total_files, file, print_over=True)

    glassDoorClean(
        index_filename="site_id.json",
        dir_to_check="data_json",
        average_data_index="average_ratings.json",
    )

    folder_path = "entities"
    average_ratings = glassdoor_calculate_average_ratings(folder_path)

    # Output results as JSON object
    with open("glassdoor_average_ratings_by_industry.json", "w") as json_file:
        json.dump(average_ratings, json_file, indent=4)

    print("Average Ratings by Industry:")
    for industry, avg_rating in average_ratings.items():
        print(f"{industry}: {avg_rating:.2f}")
    print_status_line(total_files, updated=updated, fine=fine, failed=failed)
