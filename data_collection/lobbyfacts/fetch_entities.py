from urllib.parse import urlparse
import csv
import datetime
import json
import os
import pandas as pd
import requests
import sys


sys.path.append("..")

from common import (
    is_file_modified_over_a_week_ago,
    is_file_modified_over_duration,
    get_key,
    lookup_document_by_label,
    print_status,
    get_domain,
)

index_file = "./20240525_lobbyfacts_result.json"


def lobbyEuGetIndex(index_file):
    url = "https://www.lobbyfacts.eu/"
    headers = {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "cache-control": "max-age=0",
        "content-type": "application/x-www-form-urlencoded",
        "dnt": "1",
        "origin": "https://www.lobbyfacts.eu",
        "priority": "u=0, i",
        "referer": "https://www.lobbyfacts.eu/",
        "sec-ch-ua": '"Chromium";v="125", "Not.A/Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    }
    data = {
        "categories_select": "",
        "country_select": "",
        "cutoff_date": "",
        "be_office_select": "either",
        "ep_passes_select": "either",
        "meetings_select": "either",
        "financial_category_select": "any",
        "sortcol": "cost",
        "sort": "desc",
        "page": "418",
        "download": "1",
        "form_build_id": "form-9lLGhnLaHf3Ne2t3tZja5tu6rsHIwQhF7dShCSQyfTw",
        "form_id": "lf_get_started_form",
        "op": "Download",
        "representative_search": "",
        "accreditation_search": "",
        "client_search": "",
    }
    if os.path.exists(index_file):
        print(f"Todays index file already exists: {index_file}")
        return
    response = requests.post(url, headers=headers, data=data)
    json_data = {}

    column_label = "Identification code"
    csv_reader = csv.DictReader(response.text.splitlines())
    for row in csv_reader:
        if column_label in row:
            json_data[row[column_label]] = row

    with open(
        index_file,
        "w",
    ) as f:
        json.dump(json_data, f, indent=4)
        print(f"Successfully fetched: {f.name}")


def lobbyEuGetData(json_file):
    # Load JSON file
    with open(json_file, "r") as f:
        data = json.load(f)

    total_rows = len(data)
    count = 0
    # Iterate through each object in JSON
    for key, value in data.items():
        count += 1
        identification_code = value.get("Identification code")
        if identification_code:
            if is_file_modified_over_duration(
                f"json_data/{identification_code}.json", "2m"
            ):
                url = f"https://www.lobbyfacts.eu/csv_export/{identification_code}"
                response = requests.get(url)

                # Check if the request was successful
                if response.status_code == 200:
                    # Convert CSV to JSON
                    csv_data = pd.read_csv(url)
                    csv_data.replace(
                        {"https:[^?]*\?rid=[0-9-]*&sid=": ""}, regex=True, inplace=True
                    )
                    try:
                        json_data = csv_data.set_index("state_date").to_dict(
                            orient="index"
                        )
                    except ValueError:
                        print(
                            f"multiple rows with same state_date {identification_code}"
                        )
                        grouped_data = (
                            csv_data.groupby("state_date")["url"]
                            .apply(list)
                            .reset_index(name="state_date_url")
                        )

                        # Need to filterout the earlier versions of that
                        # duplicate rows, maybe should do the whole things with
                        # sids but c'est la vie
                        for i, data in grouped_data["state_date_url"].items():
                            if len(data) > 1:
                                highest_sid = data[-1]
                                remove_set = set(data)
                                remove_set.remove(highest_sid)
                                for sid in remove_set:
                                    csv_data.drop(
                                        csv_data[csv_data.url == sid].index,
                                        inplace=True,
                                    )
                        json_data = csv_data.set_index("state_date").to_dict(
                            orient="index"
                        )

                    json_filename = f"json_data/{identification_code}.json"
                    with open(json_filename, "w") as json_file:
                        json.dump(json_data, json_file, indent=4)
                    print_status(
                        level="info",
                        index=count,
                        total=total_rows,
                        value=f"Successfully fetched and converted: {json_filename}",
                        print_over=True,
                    )

                    # sleep(0.5) # Rate limiting
                else:
                    print(
                        f"Failed to fetch data for identification code: {identification_code}"
                    )
                    exit()


# Function to process a single JSON file
def lobbyeuProcessJsonFile(
    json_filename,
    available_ratings,
    available_ratings_plus,
    ids_missing_domains,
    fresh_index_data,
    outliers,
):
    # Define the new variables to add to the data
    try:
        with open(json_filename, "r") as json_file:
            data = json.load(json_file)
            # Extract the value from the filename to construct the output path
            _, filename = os.path.split(json_filename)
            value = os.path.splitext(filename)[0]
            dates = list(data.keys())
            clean = data[dates[-1]]

            # Find entries that have websites already
            site = "none"
            for i, x in data.items():
                if type(x.get("web_site_url")) != float:
                    site = x.get("web_site_url")

            domain = None
            if site == "none":
                ids_missing_domains[value] = data[dates[-1]]["original_name"]
            else:
                domain = urlparse(site).hostname

            if domain is None:
                domain = urlparse(f"http://{site}").hostname

            if domain is None:
                domain = lookup_document_by_label(
                    label=clean.get("original_name"), returnWebsite=True
                )
            if domain is None:
                domain = lookup_document_by_label(
                    label=clean.get("original_name"), returnWebsite=True, alias=True
                )

            if domain in outliers:
                ids_missing_domains[value] = data[dates[-1]]["original_name"]
                raise ValueError(f"Missing website for {value}")

            # network = {}
            # if type(clean.get("networking")) != float:
            #    pprint(clean.get("networking").replace("\r\n\r\n","\r\n").replace(":\r\n", ": ").split("\r\n"))
            #    pprint(clean.get("networking"))
            #    # pprint(affiliate_list)
            #    for affiliate in clean.get("networking").replace("\r\n\r\n","\r\n").replace(":\r\n", ": ").split("\r\n"):
            #        item = affiliate.split(": ")
            #        network[item[0].strip()] = item[1].strip()

            # pprint(clean)

            if fresh_index_data[value].get("Meetings") == "":
                meetings = 0
            else:
                meetings = int(fresh_index_data[value].get("Meetings"))

            if fresh_index_data[value].get("all EP passes") == "":
                passes = 0
            else:
                passes = int(fresh_index_data[value].get("all EP passes"))

            new_variables = {
                "location": f"lobbyfacts/{value}",
                "source": clean.get("original_name"),
                "eu_transparency_id": value,
                "lobbyist_count": clean.get("members"),
                "lobbyist_fte": clean.get("members_fte"),
                "calculated_cost": clean.get("calculated_cost"),
                "category": clean.get("main_category"),
                #    "network": network,
                "head_country": clean.get("head_country"),
                "meeting_count": meetings,
                "passes_count": passes,
                "be_country": clean.get("be_country"),
            }
            if domain:
                new_variables["website"] = domain.replace("www.", "")
                domain_key = domain.replace("www.", "")
                available_ratings[domain_key] = value
                available_ratings_plus[domain_key] = {
                    "source": clean.get("original_name"),
                    "lobbyist_fte": clean.get("members_fte"),
                    "lobbyist_count": clean.get("members"),
                    "calculated_cost": clean.get("calculated_cost"),
                    "meeting_count": meetings,
                    "category": clean.get("main_category"),
                    "slug": value,
                }

            entity_filename = f"entities/{value}.json"
            # Write the modified data to the entities folder
            with open(entity_filename, "w") as entity_file:
                json.dump(new_variables, entity_file, indent=4)

            # print(f"Processed {json_filename} and wrote to {entity_filename}")
            print_status(
                "info",
                len(available_ratings),
                len(ids_missing_domains),
                f"Processed {json_filename} and wrote to {entity_filename} ({domain})",
                print_over=True,
            )

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")
    except ValueError as e:
        # print(e)
        pass
    except KeyError as e:
        # print(e)
        pass


def lobbyEuCleanEntities(
    output_index_filename="site_id.json",
    output_index_plus_filename="site_id_plus.json",
    missing_filename="missing_websites.json",
    fresh_index=None,
):
    if fresh_index is None:
        print("Please provide a fresh index file")
        return

    # Define the new variables to add to the data
    available_ratings = {}
    available_ratings_plus = {}
    ids_missing_domains = {}
    fresh_index_data = {}
    outliers = ["deleted"]

    with open(fresh_index, "r") as json_file:
        fresh_index_data = json.load(json_file)

    # Directory containing the JSON files
    json_dir = "json_data"

    # Iterate through all JSON files in the directory
    for root, _, files in os.walk(json_dir):
        for file in files:
            if file.endswith(".json"):
                json_filename = os.path.join(root, file)
                lobbyeuProcessJsonFile(
                    json_filename=json_filename,
                    available_ratings=available_ratings,
                    available_ratings_plus=available_ratings_plus,
                    ids_missing_domains=ids_missing_domains,
                    fresh_index_data=fresh_index_data,
                    outliers=outliers,
                )

    with open(output_index_filename, "w") as index_file:
        json.dump(available_ratings, index_file, indent=4)

    with open(output_index_plus_filename, "w") as index_file:
        json.dump(available_ratings_plus, index_file, indent=4)

    with open(missing_filename, "w") as index_file:
        json.dump(ids_missing_domains, index_file, indent=4)

    # pprint(len(available_ratings))


def lobbyEuAverageRatingsByCategory(output_index_plus_filename="site_id_plus.json"):
    with open(output_index_plus_filename, "r") as json_file:
        data = json.load(json_file)
        categories_fte = {}
        categories_lobbyist_count = {}
        categories_calculated_cost = {}
        categories_meeting_count = {}
        for key, value in data.items():
            category = value.get("category")
            fte = value.get("lobbyist_fte")
            meeting_count = value.get("meeting_count")
            lobbyist_count = value.get("lobbyist_count")
            calculated_cost = value.get("calculated_cost")
            if category in categories_fte:
                categories_fte[category].append(fte)
            else:
                categories_fte[category] = [fte]
            if category in categories_meeting_count:
                categories_meeting_count[category].append(meeting_count)
            else:
                categories_meeting_count[category] = [meeting_count]
            if category in categories_lobbyist_count:
                categories_lobbyist_count[category].append(lobbyist_count)
            else:
                categories_lobbyist_count[category] = [lobbyist_count]
            if category in categories_calculated_cost:
                categories_calculated_cost[category].append(calculated_cost)
            else:
                categories_calculated_cost[category] = [calculated_cost]

        for category, fte in categories_fte.items():
            categories_fte[category] = sum(fte) / len(fte)
        for category, meeting_count in categories_meeting_count.items():
            categories_meeting_count[category] = sum(meeting_count) / len(meeting_count)
        for category, lobbyist_count in categories_lobbyist_count.items():
            categories_lobbyist_count[category] = sum(lobbyist_count) / len(
                lobbyist_count
            )
        for category, calculated_cost in categories_calculated_cost.items():
            categories_calculated_cost[category] = sum(calculated_cost) / len(
                calculated_cost
            )

        with open("lobbyeu_average_fte_by_category.json", "w") as f:
            json.dump(categories_fte, f, indent=4)

        with open("lobbyeu_average_meeting_count_by_category.json", "w") as f:
            json.dump(categories_meeting_count, f, indent=4)

        with open("lobbyeu_average_lobbyist_count_by_category.json", "w") as f:
            json.dump(categories_lobbyist_count, f, indent=4)

        with open("lobbyeu_average_calculated_cost_by_category.json", "w") as f:
            json.dump(categories_calculated_cost, f, indent=4)


if __name__ == "__main__":
    index_file = (
        f"indexes/{datetime.datetime.now().strftime('%Y%m%d')}_lobbyfacts_result.json"
    )
    lobbyEuGetIndex(index_file)
    lobbyEuGetData(index_file)
    lobbyEuCleanEntities(
        output_index_filename="site_id.json",
        output_index_plus_filename="site_id_plus.json",
        missing_filename="missing_websites.json",
        fresh_index=index_file,
    )
    lobbyEuAverageRatingsByCategory()
    print("complete")
