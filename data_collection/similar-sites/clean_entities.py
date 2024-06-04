import os
import json
import sys
import requests
import random

sys.path.append("..")
from common import (
    bcolors,
    print_status,
    is_file_modified_over_a_week_ago,
    getIgnoreList,
    updateIgnoreList,
    send_notification,
)


def similarProcess(json_filename: str) -> None:
    """
    Process a JSON file to extract similar sites, sort them, and write the result to a new file.

    Parameters:
    json_filename (str): Path to the JSON file to process.

    Returns:
    None

    Raises:
    FileNotFoundError: If the JSON file does not exist.
    AttributeError: If an attribute does not exist in the JSON data.
    Exception: If an unexpected error occurs.
    """
    try:
        with open(json_filename, "r") as json_file:
            data = json.load(json_file)
            # Extract the value from the filename to construct the output path
            _, filename = os.path.split(json_filename)
            redirect_url = data.get("Redirect")
            slug = redirect_url.replace(".", "")
            entity_filename = f"entities/{slug}.json"

            sites = []
            for site in data["SimilarSites"]:
                site_obj = {
                    "s": site.get("Site"),
                    "p": float(str(site.get("Grade"))[0:4]),
                    "r": site.get("SimilarityRank"),
                }
                sites.append(site_obj)

            sorted_sites = sorted(sites, key=lambda x: x["r"])

            new_variables = {
                "location": f"similar/{slug}",
                "source": data.get("Title"),
                "domain": redirect_url,
                "similar": sorted_sites,
            }

            # Write the modified data to the entities folder
            with open(entity_filename, "w") as entity_file:
                json.dump(new_variables, entity_file, indent=4)

            print(f"Processed {json_filename} and wrote to {entity_filename}")

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")
    except AttributeError:
        print(f"Attribute error in file: {json_filename}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


def similarGetData(
    site: str, session: requests.Session, headers: dict[str, str], file_path: str
) -> bool | None:
    response: requests.Response = session.get(
        url=f"https://www.similarsites.com/api/site/{site}", headers=headers
    )
    if response.status_code == 200:
        if response.content == b"null":
            return False
        with open(file_path, "wb") as f:
            f.write(response.content)
            return True
    return None


def similarSitesUpdate(siteList: str) -> None:
    headers: dict[str, str] = {
        "accept": "*/*",
        "accept-encoding": "gzip",
        "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
        "authority": "www.similarsites.com",
        "referer": "https://www.similarsites.com/",
        "sec-ch-ua": '" Not;A Brand";v="99", "Microsoft Edge";v="103", "Chromium";v="103"',
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36 Edg/103.0.1264.44",
    }
    session: requests.Session = requests.session()
    os.makedirs(name="sites", exist_ok=True)
    ignoreList: list[str | None] = getIgnoreList()
    ignoreLength: int = len(ignoreList)

    with open(siteList, "r") as f:
        orderedSites = sorted(set(line.strip('"').split("/")[0].strip() for line in f))
        siteListToCheck = list(set(orderedSites) - set(ignoreList))
        sitesLength = len(siteListToCheck)
        sites = random.sample(siteListToCheck, sitesLength)
        sitesToCheck = sitesLength - ignoreLength
        sitesChecked = 0
        updated = 0
        seen = 0
        newIgnore = 0
        print(f"total sites to check {sitesToCheck}")
        for site in sites:
            if site in ignoreList:
                continue
            file_path: str = f"sites/{site}.json"
            if is_file_modified_over_a_week_ago(file_path):
                state: bool | None = similarGetData(
                    site=site, session=session, headers=headers, file_path=file_path
                )
                if state is False:
                    # addToIgnore(site)
                    ignoreList.append(site)
                    ignoreLength += 1
                    sitesChecked += 1
                    newIgnore += 1
                    print_status(
                        level="ignr",
                        index=sitesChecked,
                        total=sitesToCheck,
                        skipped=ignoreLength,
                        value=site,
                        print_over=True,
                    )
                else:
                    sitesChecked += 1
                    updated += 1
                    print_status(
                        level="upd8",
                        index=sitesChecked,
                        total=sitesToCheck,
                        skipped=ignoreLength,
                        value=site,
                    )
            else:
                sitesToCheck -= 1
                seen += 1
                print_status(
                    level="fine",
                    index=sitesChecked,
                    total=sitesToCheck,
                    skipped=ignoreLength,
                    value=site,
                    print_over=True,
                )

            if sitesChecked % 100000 == 0 and sitesChecked > 0:
                updateIgnoreList(ignoreList)
                print(
                    f"{bcolors.FAIL}{newIgnore} {bcolors.OKGREEN}{updated} {bcolors.OKBLUE}{seen}{bcolors.ENDC}"
                )
                send_notification(
                    title="SimilarSites",
                    message=f"[{sitesChecked} / {sitesToCheck}, ignored: {ignoreLength}]",
                )

    print(
        f"{bcolors.FAIL}{newIgnore} {bcolors.OKGREEN}{updated} {bcolors.OKBLUE}{seen}{bcolors.ENDC}"
    )
    send_notification(
        title="SimilarSites",
        message=f"[{sitesChecked} / {sitesToCheck}, ignored: {ignoreLength}]",
    )

    # Directory containing the JSON files
    json_dir = "sites"
    # Iterate through all JSON files in the directory
    for root, _, files in os.walk(json_dir):
        for file in files:
            if file.endswith(".json"):
                json_filename = os.path.join(root, file)
                similarProcess(json_filename)

    send_notification(title="SimilarSites", message="Completed!")


if __name__ == "__main__":
    similarSitesUpdate("../../websites.list")
