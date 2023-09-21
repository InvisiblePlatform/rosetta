import json
from time import sleep
from bs4 import BeautifulSoup
from pprint import pprint
import requests
import os

url_stub = "https://www.opensecrets.org/orgs/x/summary?id="
user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
headers = {'User-Agent': user_agent}
live = True


# Load the JSON data from the file
with open('./opensecretsid1.json') as json_file:
    data = json.load(json_file)

# Extract the IDs from the JSON array
for obj_key, obj_value in data.items():
    wikidata_id = obj_value['id']
    opensecrets_id = obj_value['osid']
    output_dict = {}
    output_dict['osid'] = opensecrets_id
    pprint(url_stub + opensecrets_id)

    if live:
        pprint("getting " + opensecrets_id)
        if os.path.exists("./output_cleaned/" + opensecrets_id + ".json"):
            pprint("skipping: " + opensecrets_id)
            pprint("loading " + opensecrets_id)
            with open("html_cache/" + opensecrets_id + ".html", "r") as f:
                html_content = f.read()
        else:
            sleep(1)
            response = requests.get(url_stub + opensecrets_id, headers=headers)
            with open("html_cache/" + opensecrets_id + ".html", "w") as f:
                f.write(response.text)
            html_content = response.text
    else:
        pprint("loading " + opensecrets_id)
        with open("html_cache/" + opensecrets_id + ".html", "r") as f:
            html_content = f.read()


    soup = BeautifulSoup(html_content, 'html.parser')
    try:
        cycle_select_element = soup.select_one("#top-numbers-select")
        for element in cycle_select_element.select("option"):
            if element.get('selected'):
                output_dict['cycle_year'] = element.get_text()
    except:
        continue

    output_dict['name'] = soup.select_one(".Orgs--profile-bio-name").get_text(strip=True)

    for item in soup.select(".Orgs--profile-top-numbers--info"):
        item_type = item.h5.get_text(strip=True)
        if item_type == "Contributions":
            for child in item.div.div.find_all():
                child.extract()
            output_dict["contributions_rank"] = item.div.div.get_text(strip=True)
            output_dict["contributions_amount"] = item.div.find_all()[1].get_text(strip=True)
        if item_type == "Lobbying":
            lobbying_amounts = []
            for entry in item.select(".Orgs--profile-top-numbers--info--stats-number"):
                lobbying_amounts.append(entry.get_text(strip=True).replace("in", " in"))
            output_dict["lobbying_amounts"] = lobbying_amounts
            try:
                for child in item.div.div.span.find_all():
                    child.extract()
                output_dict["lobbying_rank"] = item.div.div.span.get_text(strip=True)
            except:
                pass
        if item_type == "Outside Spending":
            output_dict["outside_spending"] = item.div.get_text(strip=True)

    # Charts
    for chart in soup.select(".FusionChart"):
        try:
            output_dict['charts']
        except:
            output_dict['charts'] = {}
        chart_data = json.loads(chart['data-source'])
        chart_key = chart_data['chart']['caption']
        output_dict['charts'][chart_key] = {}
        years = {}
        try:
            output_dict['charts'][chart_key]['earliest_year'] = chart_data['categories'][0]['category'][0]['label']
            output_dict['charts'][chart_key]['latest_year'] = chart_data['categories'][0]['category'][-1]['label']
            _ = 0
            for year in chart_data['categories'][0]['category']:
                party_one = chart_data['dataset'][0]['seriesname']
                value_one = chart_data['dataset'][0]['data'][_]['value']
                party_two = chart_data['dataset'][1]['seriesname']
                value_two = chart_data['dataset'][1]['data'][_]['value']
                years[year['label']] = { party_one: value_one,
                                         party_two: value_two }
                _ += 1
            output_dict['charts'][chart_key]["all_data"] = years
            for party in chart_data['dataset']:
                party_key = party['seriesname']
                output_dict['charts'][chart_key][party_key] = {}
                output_dict['charts'][chart_key][party_key]['latest_year'] = party['data'][-1]["value"]
                all_years = []
                for i in party["data"]:
                    all_years.append(i["value"])
                output_dict['charts'][chart_key][party_key]["all_years"] = all_years
        except:
            pass

    # Bars
    for bar in soup.select(".HorizontalStackedBar"):
        title_bar = bar.select('.HorizontalStackedBar-title-container')[0].get_text(strip=True)
        if title_bar == '':
            continue
        try:
            output_dict["bars"]
        except:
            output_dict["bars"] = {}
        slug = title_bar.lower().replace(' ', '_')
        output_dict["bars"][slug] = []
        body = bar.table.tbody
        for row in body.find_all("tr"):
            cells = row.find_all("td")
            entity = cells[0].get_text(strip=True)
            amount = cells[1].get_text(strip=True)
            percent = cells[2].get_text(strip=True)
            output_dict["bars"][slug].append({
                "entity": entity,
                "amount": amount,
                "percent": percent
            })

    output_dict["lobbycards"] = []
    # Org Lobbying card
    for card in soup.select(".Orgs-summary-lobbying-card"):
        year = card.select('.Orgs-summary-lobbying-card-total h2')[0].get_text(strip=True)
        dollars = card.select('.Orgs-summary-lobbying-card-total div')[0].get_text(strip=True)
        cardOut = { "year": year,
                    "dollars": dollars}
        rows = card.select("tr")
        for row in rows:
            title = row.select("td")[0].get_text(strip=True)
            count = row.select("td")[1].get_text(strip=True)
            percent = row.select("td")[2].get_text(strip=True)
            if not title.find("Did"):
                cardOut["notheld"] = { "count": count, "percent": percent }
            else:
                cardOut["held"] = { "count": count, "percent": percent }
        output_dict["lobbycards"].append(cardOut)

    bill_most = soup.select("#bill")
    try:
        output_dict["bill_most_heading"] = bill_most[0].div.find_all()[0].get_text(strip=True)
        output_dict["bill_most_url"] = "https://www.opensecrets.org" + bill_most[0].div.find("a")['href']
        output_dict["bill_most_code"] = bill_most[0].div.find("a").get_text(strip=True)
        output_dict["bill_most_title"] = bill_most[0].div.find("span").get_text(strip=True)
    except:
        pass
    #pprint(output_dict)
    #exit()
    with open("./output_cleaned/" + opensecrets_id + ".json", "w") as f:
        json.dump(output_dict, f)
