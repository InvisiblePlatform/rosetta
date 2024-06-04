from pprint import pprint
from tld import get_tld
from tld.exceptions import TldDomainNotFound
import json
from yahooquery import Ticker
import sys
import os

sys.path.append("..")
from common import is_file_modified_over_a_week_ago, print_status_line


def yahooGetData(ticker: str):
    tickerObj = Ticker(ticker)
    esgData = tickerObj.esg_scores[ticker]
    assetProfile = tickerObj.asset_profile[ticker]
    return esgData, assetProfile


def yahooProcessData(ticker: str):
    filepath = f"entities/{ticker}.json"
    if not is_file_modified_over_a_week_ago(filepath):
        with open(filepath, "r") as file:
            return json.load(file)
    tags = [
        "adult",
        "alcoholic",
        "animalTesting",
        "catholic",
        "coal",
        "controversialWeapons",
        "furLeather",
        "gambling",
        "gmo",
        "militaryContract",
        "nuclear",
        "palmOil",
        "pesticides",
        "smallArms",
        "tobacco",
    ]

    esgScores, assetProfile = yahooGetData(ticker)
    symbolData = {
        "esgScores": esgScores,
        "assetProfile": assetProfile,
    }
    try:
        website = assetProfile.get("website")
        if not website:
            return False
    except AttributeError:
        pprint(symbolData)
        return False

    try:
        domain = get_tld(website, as_object=True).fld
    except TldDomainNotFound:
        return False

    new_variables = {
        "location": f"yahoo/{ticker}",
        "source": domain,
        "symbol": ticker,
        "sector": assetProfile.get("sector"),
        "sectorKey": assetProfile.get("sectorKey"),
        "industry": assetProfile.get("industry"),
        "industryKey": assetProfile.get("industryKey"),
        "website": website,
    }

    if type(esgScores) != str:
        existingTags = []
        for tag in tags:
            if esgScores[tag]:
                existingTags.append(tag)
        esgItems = {
            "peerGroup": esgScores.get("peerGroup"),
            "involvedIn": existingTags,
            "esgPerformance": esgScores.get("esgPerformance"),
            "relatedControversy": esgScores.get("relatedControversy"),
            "environmentScore": esgScores.get("environmentScore"),
            "socialScore": esgScores.get("socialScore"),
            "governanceScore": esgScores.get("governanceScore"),
            "totalEsg": esgScores.get("totalEsg"),
            "esgRatingYearMonth": f"{esgScores.get('ratingYear')}-{esgScores.get('ratingMonth')}",
        }
        new_variables.update(esgItems)

    with open(f"entities/{ticker}.json", "w") as file:
        json.dump(new_variables, file, indent=4)

    return new_variables


def yahooProcessDataList(
    tickerlistfile: str, indexfile: str, ignoreFile: str, missingDataFile: str
):
    tickerArray = {}
    tickerData = {}
    ignoreArray = []
    missingDataArray = []

    with open(tickerlistfile, "r") as file:
        tickerArray = json.load(file)

    with open(ignoreFile, "r") as file:
        ignoreArray = json.load(file)

    with open(missingDataFile, "r") as file:
        missingDataArray = json.load(file)
        for item in missingDataArray:
            ignoreArray.append(item)

    # Remove extra files
    for symbol in ignoreArray:
        if os.path.isfile(f"entities/{symbol}.json"):
            os.remove(f"entities/{symbol}.json")

    pprint(f"Fetching data ({len(tickerArray)})")
    count = 0
    errors = 0
    ignored = 0
    for symbol in tickerArray.keys():
        if symbol in ignoreArray:
            ignored += 1
            continue

        response = yahooProcessData(symbol)

        if response:
            tickerData[symbol] = response
        else:
            missingDataArray.append(symbol)
            with open(missingDataFile, "w") as file:
                json.dump(missingDataArray, file, indent=4)
            errors += 1

        count += 1
        print_status_line(
            total=len(tickerArray),
            failed=errors,
            skipped=ignored,
            message=f"Processing {symbol}, {count}/{len(tickerArray)}",
            print_over=True,
        )

    pprint("Slimindex")
    with open(indexfile, "w") as file:
        slimIndex = {}
        for sym, data in tickerData.items():
            if slimIndex.get(data["source"]):
                currentSym = slimIndex[data["source"]]
                if len(currentSym) > len(sym):
                    addToIgnore(currentSym)
                    slimIndex[data["source"]] = sym
                    pprint(f"{sym}, {data['source']}, updated from ({currentSym})")
            else:
                slimIndex[data["source"]] = sym
                # pprint(f"{sym}, {data['source']}")

        json.dump(slimIndex, file, indent=4)


def addToIgnore(sym):
    ignoreData = []
    ignoreFile = "ignorefile.json"
    with open(ignoreFile, "r") as file:
        ignoreData = set(json.load(file))
    ignoreData.add(sym)
    with open(ignoreFile, "w") as file:
        json.dump(list(ignoreData), file, indent=4)


if __name__ == "__main__":
    tickerList = "2023-12-tickerlist.json"
    indexFile = "site_ticker_new.json"
    ignoreFile = "ignorefile.json"
    missingDataFile = "missingdata.json"
    yahooProcessDataList(tickerList, indexFile, ignoreFile, missingDataFile)
