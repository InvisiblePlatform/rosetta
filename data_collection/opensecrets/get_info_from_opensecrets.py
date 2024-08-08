from ast import FormattedValue
from cProfile import label
import json
from gpg import Data
from tld import get_tld
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from pprint import pprint

import os
import sys
from playwright.sync_api import sync_playwright
from playwright._impl._errors import TimeoutError

sys.path.append("..")
from common import (
    print_status_line,
    save_data_to_file,
    load_data_from_file,
    is_file_modified_over_duration,
    send_notification,
    wikidata_id_to_industry,
    wikidata_id_to_label,
    lookup_document_by_label,
    get_results_from_logodev_search,
    lookup_document_by_website,
    lookup_document_by_id,
)


def openSecFetchHtmlContent(opensecrets_id):
    url_stub = "https://www.opensecrets.org/orgs/x/summary?id="
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        # Add headers to the request
        headers = {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "cache-control": "max-age=0",
            "cookie": "_opensecrets_session=q02TOCFnXPeqJ31t%2BnG2DuB9%2FmKgOaW4FOiOk6gLMoDhmRjAnkIDWn%2FgUxjYgYd6Vow3QwEns7yrv0Sia7Q%2FvBwQueCgEbSHQ5SNk7oxYlOhkL9qNgLKbV5yKydKPVUHOFnTUuQWdXVUcZiWgNdVu2y40S0SatkBfa7%2Bo%2Fk%2FlAJxgQpb6Vw8XuXYXLl29%2F9xLNV6HkZmfWD5cvsrW7jPXFkVnQIkPB7fVxCWrAY2p1JTXsWaphKtAGTa2NWrFfHazfEG9b5v6UV%2Fak7PiPQ07i%2BUEDkmcJUXIKfkxg%3D%3D--lzu461UhQy9WX2Qo--EDdQhpainxKgPWGOLrwQwA%3D%3D; modal-scrim-ask-id-81=true",
            "dnt": "1",
            "priority": "u=0, i",
            "sec-ch-ua": '"Chromium";v="125", "Not.A/Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        }
        page.set_extra_http_headers(headers)
        page.goto(url_stub + opensecrets_id)
        # page.wait_for_timeout(5000)
        html_content = page.content()
        browser.close()
    return html_content


def openSecParseHtmlContent(html_content):
    soup = BeautifulSoup(html_content, "html.parser")
    output_dict = {}

    try:
        cycle_select_element = soup.select_one("#top-numbers-select")
        for element in cycle_select_element.select("option"):  # type: ignore
            if element.get("selected"):
                output_dict["cycle_year"] = element.get_text()
    except:
        pass

    output_dict["name"] = soup.select_one(".Orgs--profile-bio-name").get_text(  # type: ignore
        strip=True
    )

    for item in soup.select(".Orgs--profile-top-numbers--info"):
        item_type = item.h5.get_text(strip=True)  # type: ignore
        if item_type == "Contributions":
            for child in item.div.div.find_all():  # type: ignore
                child.extract()
            output_dict["contributions_rank"] = item.div.div.get_text(strip=True)  # type: ignore
            output_dict["contributions_amount"] = item.div.find_all()[1].get_text(  # type: ignore
                strip=True
            )
        if item_type == "Lobbying":
            lobbying_amounts = []
            for entry in item.select(".Orgs--profile-top-numbers--info--stats-number"):
                lobbying_amounts.append(entry.get_text(strip=True).replace("in", " in"))
            output_dict["lobbying_amounts"] = lobbying_amounts
            try:
                for child in item.div.div.span.find_all():  # type: ignore
                    child.extract()
                output_dict["lobbying_rank"] = item.div.div.span.get_text(strip=True)  # type: ignore
            except:
                pass
        if item_type == "Outside Spending":
            output_dict["outside_spending"] = item.div.get_text(strip=True)  # type: ignore

    # Charts
    for chart in soup.select(".FusionChart"):
        try:
            output_dict["charts"]
        except:
            output_dict["charts"] = {}
        chart_data = json.loads(chart["data-source"])  # type: ignore
        chart_key = chart_data["chart"]["caption"]
        output_dict["charts"][chart_key] = {}
        years = {}
        try:
            output_dict["charts"][chart_key]["earliest_year"] = chart_data[
                "categories"
            ][0]["category"][0]["label"]
            output_dict["charts"][chart_key]["latest_year"] = chart_data["categories"][
                0
            ]["category"][-1]["label"]
            _ = 0
            for year in chart_data["categories"][0]["category"]:
                party_one = chart_data["dataset"][0]["seriesname"]
                value_one = chart_data["dataset"][0]["data"][_]["value"]
                party_two = chart_data["dataset"][1]["seriesname"]
                value_two = chart_data["dataset"][1]["data"][_]["value"]
                years[year["label"]] = {party_one: value_one, party_two: value_two}
                _ += 1
            output_dict["charts"][chart_key]["all_data"] = years
            for party in chart_data["dataset"]:
                party_key = party["seriesname"]
                output_dict["charts"][chart_key][party_key] = {}
                output_dict["charts"][chart_key][party_key]["latest_year"] = party[
                    "data"
                ][-1]["value"]
                all_years = []
                for i in party["data"]:
                    all_years.append(i["value"])
                output_dict["charts"][chart_key][party_key]["all_years"] = all_years
        except:
            pass

    # Bars
    for bar in soup.select(".HorizontalStackedBar"):
        title_bar = bar.select(".HorizontalStackedBar-title-container")[0].get_text(
            strip=True
        )
        if title_bar == "":
            continue
        try:
            output_dict["bars"]
        except:
            output_dict["bars"] = {}
        slug = title_bar.lower().replace(" ", "_")
        output_dict["bars"][slug] = []
        body = bar.table.tbody  # type: ignore
        for row in body.find_all("tr"):  # type: ignore
            cells = row.find_all("td")
            entity = cells[0].get_text(strip=True)
            amount = cells[1].get_text(strip=True)
            percent = cells[2].get_text(strip=True)
            output_dict["bars"][slug].append(
                {"entity": entity, "amount": amount, "percent": percent}
            )

    output_dict["lobbycards"] = []
    # Org Lobbying card
    for card in soup.select(".Orgs-summary-lobbying-card"):
        year = card.select(".Orgs-summary-lobbying-card-total h2")[0].get_text(
            strip=True
        )
        dollars = card.select(".Orgs-summary-lobbying-card-total div")[0].get_text(
            strip=True
        )
        cardOut = {"year": year, "dollars": dollars}
        rows = card.select("tr")
        for row in rows:
            title = row.select("td")[0].get_text(strip=True)
            count = row.select("td")[1].get_text(strip=True)
            percent = row.select("td")[2].get_text(strip=True)
            if not title.find("Did"):
                cardOut["notheld"] = {"count": count, "percent": percent}  # type: ignore
            else:
                cardOut["held"] = {"count": count, "percent": percent}  # type: ignore
        output_dict["lobbycards"].append(cardOut)

    bill_most = soup.select("#bill")
    try:
        output_dict["bill_most_heading"] = (
            bill_most[0].div.find_all()[0].get_text(strip=True)  # type: ignore
        )
        output_dict["bill_most_url"] = (
            "https://www.opensecrets.org" + bill_most[0].div.find("a")["href"]  # type: ignore
        )
        output_dict["bill_most_code"] = bill_most[0].div.find("a").get_text(strip=True)  # type: ignore
        output_dict["bill_most_title"] = (
            bill_most[0].div.find("span").get_text(strip=True)  # type: ignore
        )
    except:
        pass

    return output_dict


def openSecCleanFiles():
    # Load the JSON data from the file
    data = load_data_from_file("openSecid2.json")
    ignoreList = load_data_from_file("ignore.json")

    ignoreList = list(set(ignoreList))
    # Extract the IDs from the JSON array
    total_count = len(data)
    updated = 0
    skipped = 0
    failed = 0
    ignored = 0
    for obj_key, obj_value in data.items():
        wikidata_id = obj_value["id"]
        for opensecrets_id in obj_value["osid"]:
            output_dict = {}
            output_dict["osid"] = opensecrets_id
            output_dict["wikidata_id"] = wikidata_id
            output_dict["website"] = obj_value["website"]
            file_path = f"html_cache/{opensecrets_id}.html"
            if opensecrets_id in ignoreList:
                # print(f"Ignoring {opensecrets_id}")
                ignored += 1
                continue

            if is_file_modified_over_duration(file_path, "1w"):
                try:
                    html_content = openSecFetchHtmlContent(opensecrets_id)
                except TimeoutError as e:
                    print(e)
                    failed += 1
                    addToIgnoreFile(opensecrets_id)
                    continue
                with open(file_path, "w") as f:
                    f.write(html_content)
                updated += 1
            else:
                with open(file_path, "r") as f:
                    html_content = f.read()
                skipped += 1

            try:
                output_dict.update(openSecParseHtmlContent(html_content))
            except AttributeError as e:
                os.remove(file_path)
                print(e)
                failed += 1
                addToIgnoreFile(opensecrets_id)

            save_data_to_file(output_dict, f"output_cleaned/{opensecrets_id}.json")
        print_status_line(
            total=total_count,
            skipped=skipped,
            updated=updated,
            failed=failed,
            ignored=ignored,
            message=f"Processed {wikidata_id}",
            print_over=False,
        )


def addToIgnoreFile(opensecrets_id):
    ignoreList = load_data_from_file("ignore.json")
    ignoreList.append(opensecrets_id)
    with open("ignore.json", "w") as f:
        json.dump(ignoreList, f, indent=4)


def openSecProcessJson(json_filename, osid_to_industry):
    # Define the new variables to add to the data
    clean = {}
    exceptions = {"www.warburgpincus.comm": "www.warburgpincus.com"}
    try:
        with open(json_filename, "r") as json_file:
            data = json.load(json_file)
            # Extract the value from the filename to construct the output path
            _, filename = os.path.split(json_filename)
            value = os.path.splitext(filename)[0]
            clean = data
            slug = clean.get("stub")
            entity_filename = f"entities/{value}.json"
            industry_list = osid_to_industry.get(value, [])
            websites = clean.get("website")

            new_variables = {
                "location": f"opensecrets/{value}",
                "industry": industry_list,
                "source": clean.get("name"),
            }

            if websites is None:
                possible_websites = lookup_document_by_label(
                    clean.get("name"), False, True
                )
                if possible_websites:
                    websites = possible_websites
                else:
                    possible_websites = lookup_document_by_label(
                        clean.get("name"), True, True
                    )
                    if possible_websites:
                        websites = possible_websites

            out_website = []
            # Add the new variables to the data
            if websites is not None:
                for site in websites:
                    if site in exceptions:
                        domain = exceptions[site]
                        out_website.append(domain.replace("www.", ""))
                    domain = urlparse(site).hostname
                    if domain is None:
                        domain = urlparse(f"http://{site}").hostname
                    if domain is None:
                        continue
                    out_website.append(domain.replace("www.", ""))

            new_variables["website"] = out_website
            clean.update(new_variables)

            # Write the modified data to the entities folder
            save_data_to_file(clean, entity_filename)

            print(f"Processed {json_filename} and wrote to {entity_filename}")

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")

    return clean


def openSecCreateIndexes(data_by_osid):
    exceptions = {"www.warburgpincus.comm": "www.warburgpincus.com"}

    dataOut = {}
    dataOutPlus = {}
    # Note each of these average arrays have to first be done by cycle year and then by industry
    industries = {}
    industries_contribution_amounts = {}
    industries_lobbying_amounts = {}
    industries_number_of_lobbyists_in_government = {}
    industries_number_of_lobbyists_not_in_government = {}

    industries_contribution_amounts_averages = {}
    industries_lobbying_amounts_averages = {}
    industries_number_of_lobbyists_in_government_averages = {}
    industries_number_of_lobbyists_not_in_government_averages = {}

    for key, value in data_by_osid.items():
        if not os.path.isfile(f"entities/{key}.json"):
            continue
        for site in value["website"]:
            if site is None:
                continue
            if site in exceptions:
                site = exceptions[site]
            if site in dataOut:
                dataOut[site].append(key)
            else:
                dataOut[site] = [key]

            if site in dataOutPlus:
                dataOutPlus[site].append(
                    {
                        "osid": key,
                        "source": value["source"],
                        "industry": value["industry"],
                        "location": value["location"],
                    }
                )
            else:
                dataOutPlus[site] = [
                    {
                        "osid": key,
                        "source": value["source"],
                        "industry": value["industry"],
                        "location": value["location"],
                    }
                ]
        # Average stuff
        for industry in value["industry"]:
            cycle_year = value.get("cycle_year")
            if cycle_year is None:
                continue
            if cycle_year not in industries:
                industries[cycle_year] = {}
                industries_contribution_amounts[cycle_year] = {}
                industries_lobbying_amounts[cycle_year] = {}
                industries_number_of_lobbyists_in_government[cycle_year] = {}
                industries_number_of_lobbyists_not_in_government[cycle_year] = {}
            if industry not in industries[cycle_year]:
                industries[cycle_year][industry] = []
                industries_contribution_amounts[cycle_year][industry] = []
                industries_lobbying_amounts[cycle_year][industry] = []
                industries_number_of_lobbyists_in_government[cycle_year][industry] = []
                industries_number_of_lobbyists_not_in_government[cycle_year][
                    industry
                ] = []
            if "contributions_amount" in value:
                industries_contribution_amounts[cycle_year][industry].append(
                    value["contributions_amount"]
                    .replace("$", "")
                    .replace(",", "")
                    .strip()
                )
            if "lobbying_amounts" in value:
                for amount in value["lobbying_amounts"]:
                    if f"in {cycle_year}" in amount:
                        industries_lobbying_amounts[cycle_year][industry].append(
                            amount.replace(f"in {cycle_year}", "")
                            .replace("$", "")
                            .replace(",", "")
                            .strip()
                        )
            if "lobbycards" in value:
                for card in value["lobbycards"]:
                    if "notheld" in card:
                        year = card["year"]
                        count = card["notheld"]["count"]
                        if year not in industries_number_of_lobbyists_in_government:
                            industries_number_of_lobbyists_in_government[year] = {}
                        if (
                            industry
                            not in industries_number_of_lobbyists_in_government[year]
                        ):
                            industries_number_of_lobbyists_in_government[year][
                                industry
                            ] = []
                        industries_number_of_lobbyists_in_government[year][
                            industry
                        ].append(count)
                    if "held" in card:
                        year = card["year"]
                        count = card["held"]["count"]
                        if year not in industries_number_of_lobbyists_not_in_government:
                            industries_number_of_lobbyists_not_in_government[year] = {}
                        if (
                            industry
                            not in industries_number_of_lobbyists_not_in_government[
                                year
                            ]
                        ):
                            industries_number_of_lobbyists_not_in_government[year][
                                industry
                            ] = []
                        industries_number_of_lobbyists_not_in_government[year][
                            industry
                        ].append(count)

    # Create array of averages by year and industry
    for year, industry_data in industries_contribution_amounts.items():
        industries_contribution_amounts_averages[year] = {}
        for industry, amounts in industry_data.items():
            if len(amounts) == 0:
                continue
            industries_contribution_amounts_averages[year][industry] = round(
                sum(map(float, amounts)) / len(amounts), 2
            )
    for year, industry_data in industries_lobbying_amounts.items():
        industries_lobbying_amounts_averages[year] = {}
        for industry, amounts in industry_data.items():
            if len(amounts) == 0:
                continue
            industries_lobbying_amounts_averages[year][industry] = round(
                sum(map(float, amounts)) / len(amounts), 2
            )
    for year, industry_data in industries_number_of_lobbyists_in_government.items():
        industries_number_of_lobbyists_in_government_averages[year] = {}
        for industry, amounts in industry_data.items():
            if len(amounts) == 0:
                continue
            industries_number_of_lobbyists_in_government_averages[year][industry] = (
                round(sum(map(float, amounts)) / len(amounts), 2)
            )
    for year, industry_data in industries_number_of_lobbyists_not_in_government.items():
        industries_number_of_lobbyists_not_in_government_averages[year] = {}
        for industry, amounts in industry_data.items():
            if len(amounts) == 0:
                continue
            industries_number_of_lobbyists_not_in_government_averages[year][
                industry
            ] = round(sum(map(float, amounts)) / len(amounts), 2)

    with open("opensec_industries_contribution_amounts_averages.json", "w") as outfile:
        json.dump(industries_contribution_amounts_averages, outfile, indent=4)
    with open("opensec_industries_lobbying_amounts_averages.json", "w") as outfile:
        json.dump(industries_lobbying_amounts_averages, outfile, indent=4)
    with open(
        "opensec_industries_number_of_lobbyists_in_government_averages.json", "w"
    ) as outfile:
        json.dump(
            industries_number_of_lobbyists_in_government_averages, outfile, indent=4
        )
    with open(
        "opensec_industries_number_of_lobbyists_not_in_government_averages.json", "w"
    ) as outfile:
        json.dump(
            industries_number_of_lobbyists_not_in_government_averages, outfile, indent=4
        )

    with open("site_id_plus.json", "w") as outfile:
        json.dump(dataOutPlus, outfile, indent=4)

    with open("site_id.json", "w") as outfile:
        json.dump(dataOut, outfile, indent=4)


def openSecBuildIndustryLookup():
    osid_to_industry = {}
    industry_count = {}
    industry_labels = {}
    ignoreable_industries = [
        "Q4830453",
        "Q891723",
        "Q6881511",
    ]
    with open("openSecid2.json", "r") as file:
        dataIn = json.load(file)
        for key, value in dataIn.items():
            wikidata_id = value["id"]
            industry_list = wikidata_id_to_industry(wikidata_id)
            if industry_list is None:
                continue

            # filter out the ignoreable industries
            industry_list = list(set(industry_list) - set(ignoreable_industries))

            for industry in industry_list:
                if not industry in industry_labels:
                    industry_labels[industry] = wikidata_id_to_label(industry)

                industry_label = industry_labels[industry]
                for osid in value["osid"]:
                    industry_count[f"{industry_label}"] = (
                        industry_count.get(f"{industry_label}", 0) + 1
                    )
                    if osid in osid_to_industry:
                        osid_to_industry[osid].append(industry_label)
                    else:
                        osid_to_industry[osid] = [industry_label]

    print(f"Found {len(osid_to_industry)} OSIDs with industries")

    # Go back over the data and remove any industries that have just one entry, as we want to use them for averages
    # also make sure to turn the list of industries into a set to remove duplicates
    new_osid_to_industry = osid_to_industry.copy()
    for osid, industries in new_osid_to_industry.items():
        osid_to_industry[osid] = list(set(industries))
        for industry in osid_to_industry[osid]:
            if industry and industry_count[industry] == 1:
                osid_to_industry[osid].remove(industry)

        if len(osid_to_industry[osid]) == 0:
            del osid_to_industry[osid]

    with open("osid_to_industry.json", "w") as outfile:
        json.dump(osid_to_industry, outfile, indent=4)

    print(f"Found {len(osid_to_industry)} OSIDs with industries, after cleaning")
    # Sort industry_count by value
    industry_count = dict(
        sorted(industry_count.items(), key=lambda item: item[1], reverse=True)
    )
    with open("industry_count.json", "w") as outfile:
        json.dump(industry_count, outfile, indent=4)

    return osid_to_industry


def openSecFetchForOsidList(osid_list):
    broke_list = []
    with open("broke_list.json", "r") as file:
        broke_list = json.load(file)

    new_osid_list = osid_list.copy()
    for osid in osid_list:
        if osid in broke_list:
            if os.path.isfile(f"html_cache/{osid}.html"):
                os.remove(f"html_cache/{osid}.html")
            continue
        # if os.path.isfile(f"output_cleaned/{osid}.json"):
        # Format the id strings do that they fit in 9 characters + D and append them to the list
        formatted_above_id = f"D{str(int(osid.replace('D',''))+1).zfill(9)}"
        formatted_below_id = f"D{str(int(osid.replace('D',''))-1).zfill(9)}"
        if not formatted_above_id in osid_list:
            new_osid_list.append(formatted_above_id)
        if not formatted_below_id in osid_list:
            new_osid_list.append(formatted_below_id)
        print(f"Processing {osid}")
        try:
            html_content = openSecFetchHtmlContent(osid)
        except TimeoutError as e:
            print(e)
            continue
        with open(f"html_cache/{osid}.html", "w") as f:
            f.write(html_content)
        try:
            output_dict = openSecParseHtmlContent(html_content)
        except AttributeError as e:
            broke_list.append(osid)
            save_data_to_file(broke_list, "broke_list.json")
            print(e)
            continue
        save_data_to_file(output_dict, f"output_cleaned/{osid}.json")
    with open("opensec_known_osids", "w") as outfile:
        for osid in new_osid_list:
            outfile.write(f"{osid}\n")


def openSecSearchForMissingWikidataIdsInOutput():
    osid_to_wikidataid = {}
    opensecretsid2 = {}
    wikidata_extra_list = {}
    no_wikidata_but_website = {}
    if os.path.isfile("no_wikidata_but_website.json"):
        with open("no_wikidata_but_website.json", "r") as file:
            no_wikidata_but_website = json.load(file)

    with open("../../tools/mongoscripts/websites.csv", "r") as file:
        dataIn = file.read().splitlines()
        for line in dataIn:
            line = line.split(",")
            if len(line) == 2:
                wikidata_extra_list[line[0]] = line[1]

    with open("openSecid2.json", "r") as file:
        dataIn = json.load(file)
        opensecretsid2 = dataIn
        for key, value in dataIn.items():
            wikidata_id = value["id"]
            for osid in value["osid"]:
                osid_to_wikidataid[osid] = wikidata_id
    missing_wikidata_ids = []
    for root, _, files in os.walk("output_cleaned"):
        for file in files:
            if file.endswith(".json"):
                osid = file.replace(".json", "")
                if (
                    osid not in osid_to_wikidataid
                    and osid not in no_wikidata_but_website
                ):
                    print(f"Missing wikidata id for {osid}")
                    missing_wikidata_ids.append(osid)
                    continue

    print(f"Found {len(missing_wikidata_ids)} missing wikidata ids")
    not_found = 0
    found = 0
    for osid in missing_wikidata_ids:
        with open(f"output_cleaned/{osid}.json", "r") as file:
            data = json.load(file)
            if not data.get("name"):
                continue
            wikidata_document = lookup_document_by_label(data["name"], False, False)
            if not wikidata_document:
                wikidata_document = lookup_document_by_label(data["name"], True, False)
            if not wikidata_document:
                wikidata_document = lookup_document_by_label(
                    data["name"]
                    .replace(" PLLC", "")
                    .replace(" PLC", "")
                    .replace(" Plc", "")
                    .replace(" SKG", "")
                    .replace(" Communications", "")
                    .replace(" Ltd", "")
                    .replace(" LLC", "")
                    .replace(" Inc", ""),
                    False,
                    False,
                )
                if not wikidata_document:
                    wikidata_document = lookup_document_by_label(
                        data["name"]
                        .replace(" PLLC", "")
                        .replace(" PLC", "")
                        .replace(" Plc", "")
                        .replace(" SKG", "")
                        .replace(" Communications", "")
                        .replace(" Ltd", "")
                        .replace(" LLC", "")
                        .replace(" Inc", ""),
                        True,
                        False,
                    )
            if wikidata_document is None:
                print(
                    f"No wikidata document found for {data['name']}, {osid} trying logodev"
                )
                logodevRes = get_results_from_logodev_search(data["name"])
                if logodevRes == []:
                    label = (
                        data["name"]
                        .replace("Bancorp", "Bank")
                        .replace(" LLC", "")
                        .replace(" Inc", "")
                        .replace(" Corp", "")
                        .replace(" Co", "")
                        .replace(" Ltd", "")
                        .replace(" Group", "")
                    )
                    logodevRes = get_results_from_logodev_search(label)
                if logodevRes != []:
                    wikiid = wikidata_extra_list.get(logodevRes[0]["domain"], None)
                    if wikiid:
                        wikidata_document = lookup_document_by_id(wikiid)
                    else:
                        no_wikidata_but_website[osid] = logodevRes[0]["domain"]
                        print(
                            f'No wikidata id found for {data["name"]}, {osid}, but found website {logodevRes[0]["domain"]}'
                        )
                        save_data_to_file(
                            no_wikidata_but_website, "no_wikidata_but_website.json"
                        )

            if not wikidata_document:
                wikidata_document = lookup_document_by_label(
                    data["name"]
                    .replace("-", " ")
                    .replace(" PLLC", "")
                    .replace(" PLC", "")
                    .replace(" Plc", "")
                    .replace(" LLC", "")
                    .replace(" SKG", "")
                    .replace(" Ltd", "")
                    .replace(" Inc", "")
                    .replace(" Investors", "")
                    .replace(" Group", "")
                    .replace(" Partners", "")
                    .replace(" Communications", "")
                    .replace(" International", "")
                    .replace(" Financial", "")
                    .replace(" Cellular", "")
                    .replace(" Holdings", "")
                    .replace(" Holding", "")
                    .replace(" Global", "")
                    .replace(" Corp", "")
                    .replace(" Co", ""),
                    False,
                    False,
                )
                if not wikidata_document:
                    wikidata_document = lookup_document_by_label(
                        data["name"]
                        .replace("-", " ")
                        .replace(" PLLC", "")
                        .replace(" PLC", "")
                        .replace(" Plc", "")
                        .replace(" LLC", "")
                        .replace(" SKG", "")
                        .replace(" Ltd", "")
                        .replace(" Inc", "")
                        .replace(" Investors", "")
                        .replace(" Group", "")
                        .replace(" Partners", "")
                        .replace(" Communications", "")
                        .replace(" International", "")
                        .replace(" Cellular", "")
                        .replace(" Holdings", "")
                        .replace(" Holding", "")
                        .replace(" Financial", "")
                        .replace(" Global", "")
                        .replace(" Corp", "")
                        .replace(" Co", ""),
                        True,
                        False,
                    )

            # if not wikidata_document:
            #    label = (
            #        data["name"]
            #        .replace(" PLLC", "")
            #        .replace(" PLC", "")
            #        .replace(" LLC", "")
            #        .replace(" SKG", "")
            #        .replace(" Ltd", "")
            #        .replace(" Inc", "")
            #        .replace(" Group", "")
            #        .replace(" Partners", "")
            #        .replace(" Communications", "")
            #        .replace(" International", "")
            #        .replace(" Cellular", "")
            #        .replace(" Holdings", "")
            #        .replace(" Holding", "")
            #        .replace(" Financial", "")
            #        .replace(" Global", "")
            #        .replace(" Companies", "")
            #        .replace(" ATC", "")
            #        .replace(" USA", "")
            #        .replace(" SA", "")
            #        .replace(" SpA", "")
            #        .replace(" EDA", "")
            #        .replace(" Plc", "")
            #        .replace(" Products", "")
            #        .replace(" Services", "")
            #        .replace(" Capital", "")
            #    )
            #    if (
            #        " " not in label
            #        and not label.endswith(" Corp")
            #        and not label.endswith(" Co")
            #    ):
            #        # Since our indexes are case-sensitive, we need to check for the label with all combinations of upper and lower case
            #        # This is a bit of a hack, but it should work, and we should continue until a document is found or all combinations are exhausted
            #        print(f"Looking for {label} (brute)")
            #        for i in range(1, 2 ** len(label)):
            #            new_label = ""
            #            for j in range(len(label)):
            #                if i & (1 << j):
            #                    new_label += label[j].upper()
            #                else:
            #                    new_label += label[j].lower()
            #            wikidata_document = lookup_document_by_label(
            #                new_label, False, False
            #            )
            #            if wikidata_document:
            #                break
            #            wikidata_document = lookup_document_by_label(
            #                new_label, True, False
            #            )
            #            if wikidata_document:
            #                break

            if not wikidata_document:
                label = data["name"] + " Company"
                wikidata_document = lookup_document_by_label(label, False, False)
                if not wikidata_document:
                    wikidata_document = lookup_document_by_label(label, True, False)

            if not wikidata_document:
                label = data["name"].replace(" ", "")
                wikidata_document = lookup_document_by_label(label, False, False)
                if not wikidata_document:
                    wikidata_document = lookup_document_by_label(label, True, False)

            if not wikidata_document:
                if data["name"].endswith(" Inc"):
                    label = data["name"].replace(" Inc", " Incorporated")
                    wikidata_document = lookup_document_by_label(label, False, False)
                    if not wikidata_document:
                        wikidata_document = lookup_document_by_label(label, True, False)

            if not wikidata_document:
                if data["name"].endswith(" Assn"):
                    label = data["name"].replace(" Assn", " Association")
                    wikidata_document = lookup_document_by_label(label, False, False)
                    if not wikidata_document:
                        wikidata_document = lookup_document_by_label(label, True, False)

            if not wikidata_document:
                if data["name"].endswith(" Corp"):
                    label = data["name"].replace(" Corp", " Corporation")
                    wikidata_document = lookup_document_by_label(label, False, False)
                    if not wikidata_document:
                        wikidata_document = lookup_document_by_label(label, True, False)

            if not wikidata_document:
                if data["name"].endswith(" Co"):
                    label = data["name"].replace(" Co", " Company")
                    wikidata_document = lookup_document_by_label(label, False, False)
                    if not wikidata_document:
                        wikidata_document = lookup_document_by_label(label, True, False)

                if not wikidata_document:
                    print(f"Did not find wikidata id for {data['name']}, {osid}")
                    not_found += 1

            if wikidata_document:
                wikidataid = wikidata_document["id"]  # type: ignore
                websites = []
                if "P856" in wikidata_document["claims"]:
                    for item in wikidata_document["claims"]["P856"]:  # type: ignore
                        if "mainsnak" in item:
                            if "datavalue" in item["mainsnak"]:  # type: ignore
                                if "value" in item["mainsnak"]["datavalue"]:  # type: ignore
                                    websites.append(item["mainsnak"]["datavalue"]["value"])  # type: ignore

                if wikidataid in opensecretsid2:
                    opensecretsid2[wikidataid]["osid"].append(osid)
                    websites = list(
                        set(opensecretsid2[wikidataid]["website"] + websites)
                    )
                    opensecretsid2[wikidataid]["website"] = websites
                    print(f"Found wikidata id {wikidataid} for {data['name']}")
                    found += 1
                else:
                    opensecretsid2[wikidataid] = {
                        "id": wikidataid,
                        "osid": [osid],
                        "website": websites,
                        "label": data["name"],
                    }
                    print(f"Found wikidata id {wikidataid} for {data['name']}")
                    found += 1
            save_data_to_file(opensecretsid2, "openSecid2.json")

    print(f"Found {found} missing wikidata ids")
    print(f"Did not find {not_found} missing wikidata ids")
    save_data_to_file(opensecretsid2, "openSecid2.json")
    send_notification("OpenSecrets", "OpenSecrets data processed!")


if __name__ == "__main__":
    with open("opensec_known_osids", "r") as file:
        osid_list = file.read().splitlines()
    openSecFetchForOsidList(osid_list)
    openSecSearchForMissingWikidataIdsInOutput()

    osid_to_industry = openSecBuildIndustryLookup()
    data_by_osid = {}
    openSecCleanFiles()
    json_dir = "output_cleaned"
    available_ratings = {}
    # Iterate through all JSON files in the directory
    for root, _, files in os.walk(json_dir):
        for file in files:
            if file.endswith(".json"):
                json_filename = os.path.join(root, file)
                dataOut = openSecProcessJson(json_filename, osid_to_industry)
                if dataOut:
                    osid = dataOut.get(
                        "osid", json_filename.replace(".json", "").split("/")[-1]
                    )
                    data_by_osid[osid] = dataOut

    with open("data_by_osid.json", "w") as outfile:
        json.dump(data_by_osid, outfile, indent=4)

    openSecCreateIndexes(data_by_osid)

    send_notification("OpenSecrets", "OpenSecrets data processed!")
    print("Done!")
