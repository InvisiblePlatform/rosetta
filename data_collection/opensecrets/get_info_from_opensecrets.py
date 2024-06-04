import json
from bs4 import BeautifulSoup
from pprint import pprint
import os
import sys
from numpy import add
from playwright.sync_api import sync_playwright
from playwright._impl._errors import TimeoutError

sys.path.append("..")
from common import (
    print_status_line,
    save_data_to_file,
    load_data_from_file,
    is_file_modified_over_a_week_ago,
    send_notification,
)


def get_html_content(opensecrets_id):
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


def parse_html_content(html_content):
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


def process_opensecrets_data():
    # Load the JSON data from the file
    data = load_data_from_file("opensecretsid2.json")
    ignoreList = load_data_from_file("ignore.json")

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
            file_path = f"html_cache/{opensecrets_id}.html"
            if opensecrets_id in ignoreList:
                # print(f"Ignoring {opensecrets_id}")
                ignored += 1
                continue

            if is_file_modified_over_a_week_ago(file_path):
                try:
                    html_content = get_html_content(opensecrets_id)
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
                output_dict.update(parse_html_content(html_content))
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


def openSecProcessJson(json_filename):
    # Define the new variables to add to the data

    try:
        with open(json_filename, "r") as json_file:
            data = json.load(json_file)
            # Extract the value from the filename to construct the output path
            _, filename = os.path.split(json_filename)
            value = os.path.splitext(filename)[0]
            clean = data
            slug = clean.get("stub")
            entity_filename = f"entities/{value}.json"

            new_variables = {
                "location": f"opensecrets/{value}",
                "source": clean.get("name"),
            }

            # Add the new variables to the data
            clean.update(new_variables)

            # domain = urlparse(site).hostname
            # if domain is None:
            #    domain = urlparse(f"http://{site}").hostname

            # if not domain is None and not site is None:
            #    if available_ratings.get(domain.replace("www.","")):
            #        available_ratings[domain.replace("www.","")].append(slug)
            #        pprint([domain, slug, available_ratings.get(domain.replace("www.",""))])
            #    else:
            #        available_ratings[domain.replace("www.","")] = [slug]

            # Write the modified data to the entities folder
            save_data_to_file(clean, entity_filename)

            print(f"Processed {json_filename} and wrote to {entity_filename}")

    except FileNotFoundError:
        print(f"JSON file not found: {json_filename}")


if __name__ == "__main__":
    process_opensecrets_data()
    send_notification("OpenSecrets", "OpenSecrets data processed!")
    print("Done!")
