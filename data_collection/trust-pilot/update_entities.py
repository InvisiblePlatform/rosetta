import os
from pprint import pprint
import shutil
import requests
import json
import math
import time
from typing import Set
from clean_entities import trustPilotClean
import sys

sys.path.append("..")

from common import (
    is_file_modified_over_duration,
    send_notification,
    load_data_from_file,
)

apiKeyTrustPilot = "d5ccd2733fe8820c37fb4e501e0c1694"


def trustPilotItemGet(
    site: str,
    dir_to_check: str,
    prepend_str: str,
    request_url: str = "",
    merge_existing: bool = False,
):
    # When we keep running this for a long time, eventually I see urllib errors,
    # these are currently unhandled, we probably should fix this but not sure its worth
    # reproducing while we onload the huge site since we get 100,000 requests or so before
    # it happens.

    # I cant recall where I got the apiKey, but until it expires I guess, we keep using it
    headers = {
        "Accept": "*/*",
        "Accept-Language": "en-GB,en;q=0.9,en-US;q=0.8",
        "Connection": "keep-alive",
        "Content-Type": "application/json",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "apikey": apiKeyTrustPilot,
    }
    if request_url != "":
        request_url = f"{request_url}{site}"
        headers["apikey"] = "FuH31qwqA19HaAeAiGCD2iBC4HS9dKZQ"
    else:
        headers["X-Trustpilot-Platform"] = "BrowserExtension"
        headers["X-Trustpilot-Version"] = "2.0.0"
        headers["Origin"] = f"https://{site}"
        request_url = f"https://browserextension.trustpilot.com/v1/business-units/find?name={site}"

    response = requests.get(
        request_url,
        headers=headers,
    )
    # pprint(request_url)
    # pprint(response)
    data = response.json()
    response_filepath = f"{dir_to_check}/{prepend_str}{site}.json"

    if "name" not in data:
        with open(response_filepath, "w") as f:
            json.dump(response.json(), f)
        return False
    name_object = data["name"]

    if response.status_code == 200:
        if merge_existing and os.path.exists(response_filepath):
            with open(response_filepath, "r") as f:
                existing_data = json.load(f)
                for key, value in existing_data.items():
                    if key not in data:
                        data[key] = value

        with open(response_filepath, "w") as f:
            json.dump(data, f)

        # Slim down and deduplicate referring sites
        referring_sites = data["name"].get("referring", [])
        referring_sites = {
            ref_site.replace("www.", "").strip('"').split("/")[0]
            for ref_site in referring_sites
        }

        # pprint(name_object)
        # Save data for referring sites so we dont grab them again if we dont need them.
        for refsite in referring_sites:
            file_path = f"{dir_to_check}/{prepend_str}{refsite}.json"
            if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
                shutil.copy2(response_filepath, file_path)
        return True
    elif response.status_code == 404:
        # To be honest, we shouldn't save the whole object, since its going to be the
        # same data over and over, probably should minimise it.
        with open(response_filepath, "w") as f:
            json.dump(response.json(), f)
        return False


def trustPilotMain(delay: float, weblist: str, seenlist: str, dir_to_check: str):
    count: int = 0
    error_count: int = 0
    prepend_str: str = "trust_site_"
    seen_sites = set(open(seenlist).read().splitlines())
    itemGetFunct: function = trustPilotItemGet

    # TODO: Semi-Ideally we want to modify this function to allow for 3 modes;
    #   - Update all known
    #   - Check for known unknowns (sites we know of but dont have data for)
    #   - Update n-oldest known sites (fractional updates)
    #
    #       Right now we just have the second mode written.
    #       Fully Ideally we actually want the 3rd mode to weight towards more
    #       popular sites, likely via reviewCount, it'll be more costly so perhaps
    #       we can have a split 3rd mode, that updates old data in general and
    #       another section to update old-highly rated data.

    os.makedirs(dir_to_check, exist_ok=True)
    # Create a set of sites for which files exist
    # existing_sites: Set[str] = set()
    # for root, dirs, files in os.walk(dir_to_check):
    #     for file in files:
    #         if file.startswith(prepend_str) and file.endswith(".json"):
    #             existing_sites.add(file[len(prepend_str) : -len(".json")])
    # seen_sites.update(existing_sites)

    # Get the set of unknown state sites
    # unknown_sites: Set[str] = set()
    # with open(weblist, "r") as f:
    #    unknown_sites = set(line.strip('"').split("/")[0] for line in f) - seen_sites
    websites = []
    with open("site_slug.json", "r") as f:
        sites = json.load(f)
        for key, value in sites.items():
            if "/" not in key:
                websites.append(key)
    # Count sites
    # size: int = sum(1 for line in open(weblist))
    size = len(websites)
    # count = size - len(unknown_sites)
    count = 0

    # pprint(f"Existing = {len(existing_sites)}, to complete {len(unknown_sites)}")
    for line in sorted(websites):
        site = line.strip()
        count += 1
        file_path = f"{dir_to_check}/{prepend_str}{site}.json"
        if is_file_modified_over_duration(file_path, "1w"):
            itemGetFunct(
                site=site,
                dir_to_check=dir_to_check,
                prepend_str=prepend_str,
                merge_existing=False,
            )
            state = itemGetFunct(
                site=site,
                dir_to_check=dir_to_check,
                prepend_str=prepend_str,
                merge_existing=True,
                request_url="https://api.trustpilot.com/v1/business-units/find?name=",
            )
            if not state:
                error_count += 1
                if error_count % 100 == 0:
                    print(
                        f"Completed: {count}, "
                        f"Total: {size} ({math.floor((count / size) * 10000) / 100}) "
                        f"(errors: {error_count}) {line}  ({time.ctime()})"
                    )
            else:
                print(
                    f"Completed: {count}, "
                    f"Total: {size} ({math.floor((count / size) * 10000) / 100}) "
                    f"(errors: {error_count}) {line}  ({time.ctime()})"
                )
            time.sleep(delay)


def trustPilotUseCategoryToCreateAverageScore(dir_to_check):
    top_level_category_scores = {}
    bottom_level_category_scores = {}
    top_level_category_averages = {}
    bottom_level_category_averages = {}
    for root, dirs, files in os.walk(dir_to_check):
        for file in files:
            with open(f"{root}/{file}", "r") as f:
                data = json.load(f)
                score = data["score"]
                if "topLevelCategory" in data:
                    top_level_category = data["topLevelCategory"]
                    if top_level_category not in top_level_category_scores:
                        top_level_category_scores[top_level_category] = []
                    top_level_category_scores[top_level_category].append(score)
                if "bottomLevelCategory" in data:
                    bottom_level_category = data["bottomLevelCategory"]
                    if bottom_level_category not in bottom_level_category_scores:
                        bottom_level_category_scores[bottom_level_category] = []
                    bottom_level_category_scores[bottom_level_category].append(score)

    for category, scores in top_level_category_scores.items():
        if category == "":
            continue
        top_level_category_averages[category] = sum(scores) / len(scores)
    for category, scores in bottom_level_category_scores.items():
        if category == "":
            continue
        bottom_level_category_averages[category] = sum(scores) / len(scores)

    with open("trustpilot_top_level_category_averages.json", "w") as f:
        json.dump(top_level_category_averages, f, indent=4)
    with open("trustpilot_bottom_level_category_averages.json", "w") as f:
        json.dump(bottom_level_category_averages, f, indent=4)


def trustPilotRemoveSitesWithoutCategory(dir_to_check):
    for root, dirs, files in os.walk(dir_to_check):
        for file in files:
            if file.startswith("trust_site_") and file.endswith(".json"):
                with open(f"{root}/{file}", "r") as f:
                    data = json.load(f)
                    if "topLevelCategory" not in data:
                        print(f"Removing {file}")
                        os.remove(f"{root}/{file}")


def trustPilotCallGetOnOneSite(site: str, dir_to_check: str):
    prepend_str: str = "trust_site_"
    itemGetFunct: function = trustPilotItemGet
    file_path = f"{dir_to_check}/{prepend_str}{site}.json"
    itemGetFunct(
        site=site,
        dir_to_check=dir_to_check,
        prepend_str=prepend_str,
        merge_existing=False,
    )
    state = itemGetFunct(
        site=site,
        dir_to_check=dir_to_check,
        prepend_str=prepend_str,
        merge_existing=True,
        request_url="https://api.trustpilot.com/v1/business-units/find?name=",
    )
    if not state:
        print(f"Error: {site}")
    else:
        print(f"Completed: {site}")


if __name__ == "__main__":

    dir_to_check = "sites"
    seen_index = "./seen_sites.list"
    lookup_index = "slug_site.json"

    # trustPilotCallGetOnOneSite("google.com", dir_to_check)
    # data = load_data_from_file("sites/trust_site_google.com.json")
    # pprint(data)
    # exit()

    trustPilotClean(
        dir_to_check=dir_to_check,
        out_index="site_slug.json",
        seen_index=seen_index,
        lookup_index=lookup_index,
    )

    trustPilotMain(
        delay=0.01,
        weblist="../../websites.list",
        seenlist=seen_index,
        dir_to_check=dir_to_check,
    )

    trustPilotClean(
        dir_to_check=dir_to_check,
        out_index="site_slug.json",
        seen_index=seen_index,
        lookup_index=lookup_index,
    )
    trustPilotUseCategoryToCreateAverageScore("entities")

    send_notification("TrustPilot", "Data collection completed")
