import os
from numpy import save
import requests
from pprint import pprint
import json
from typing import Any
import datetime
import sys

sys.path.append("..")

from common import (
    is_file_modified_over_a_week_ago,
    get_key,
    lookup_document_by_label,
    print_status,
    get_domain,
    save_data_to_file,
    load_data_from_file,
)


def goodonyouGetCategory(category, ID, avoidDownload=False):
    url = f"https://directory.goodonyou.eco/_next/data/{ID}/categories/{category}.json"
    if avoidDownload:
        json_data = load_data_from_file(f"categories/{category}.json")
    else:
        response = requests.get(url)
        json_data = response.json()

    brandData: dict[Any, bool] = {}
    for brand in json_data["pageProps"]["category"]["brands"]:
        brandData[brand["slug"]] = True

    save_data_to_file(json_data, f"categories/{category}.json")

    return brandData


def goodonyouCategoryIndexGet(ID):
    url = f"https://directory.goodonyou.eco/_next/data/{ID}/index.json"
    response = requests.get(url)
    json_data = response.json()
    category_objects = json_data["pageProps"]["mainCategories"]["categories"]
    category_list_objects = []
    for category in category_objects:
        category_name = category["name"]
        category_id = category["id"]
        category_qty = category["qty"]
        category_total = category["total"]
        category_list_objects.append(
            {
                "name": category_name,
                "id": category_id,
                "qty": category_qty,
                "total": category_total,
            }
        )
    with open("categories.json", "w") as file:
        file.write(json.dumps(category_list_objects))


def goodonyouGetBrand(brand, ID):
    if is_file_modified_over_a_week_ago(f"brands/{brand}.json"):
        url = f"https://directory.goodonyou.eco/_next/data/{ID}/brand/{brand}.json"
        response = requests.get(url)
        json_data = response.json()
        with open(f"brands/{brand}.json", "w") as file:
            json.dump(json_data, file, indent=4)
    else:
        with open(f"brands/{brand}.json") as file:
            json_data = json.load(file)

    if json_data.get("pageProps") is None:
        return None, None

    brandObj = {}
    brand_catagories = []
    hasDominant = False

    for category in json_data["pageProps"]["brand"]["categories"]:
        brand_catagories.append(category["name"])
        if category.get("isDominant"):
            hasDominant = True
            brandObj["dominantCategory"] = category["name"]

    if not hasDominant:
        brandObj["dominantCategory"] = None

    if json_data["pageProps"]["brand"].get("website") is None:
        brandObj["website"] = lookup_document_by_label(
            label=json_data["pageProps"]["brand"]["name"], returnWebsite=True
        )
    else:
        brandObj["website"] = get_domain(json_data["pageProps"]["brand"]["website"])

    try:
        brandObj.update(
            {
                "name": json_data["pageProps"]["brand"]["name"],
                "slug": json_data["pageProps"]["brand"]["slug"],
                "price": json_data["pageProps"]["brand"].get("price", None),
                "territories": json_data["pageProps"]["brand"]["territories"],
                "lastRated": json_data["pageProps"]["brand"].get("lastRated", None),
                "ethicalLabel": json_data["pageProps"]["brand"]["ethicalLabel"],
                "ethicalRating": json_data["pageProps"]["brand"]["ethicalRating"],
                "environmentRating": json_data["pageProps"]["brand"][
                    "environmentRating"
                ],
                "environmentLabel": json_data["pageProps"]["brand"]["environmentLabel"],
                "labourRating": json_data["pageProps"]["brand"]["labourRating"],
                "labourLabel": json_data["pageProps"]["brand"]["labourLabel"],
                "animalRating": json_data["pageProps"]["brand"]["animalRating"],
                "animalLabel": json_data["pageProps"]["brand"]["animalLabel"],
                "hasEmail": json_data["pageProps"]["brand"].get("hasEmail", None),
                "causes": json_data["pageProps"]["brand"].get("causes", None),
                "values": json_data["pageProps"]["brand"].get("values", None),
                "certifications": json_data["pageProps"]["brand"].get(
                    "certifications", None
                ),
                "onlineInfo": json_data["pageProps"]["brand"]["onlineInfo"],
            }
        )
    except KeyError as e:
        print(f"Error with {brand}")
        print(f"{e}")
        return None, None
    # convert all the categories to lowercase
    brandObj["categories"] = [
        category.lower().replace("&", "and") for category in brand_catagories
    ]

    if not json_data.get("pageProps"):
        return None, None

    return brandObj, json_data["pageProps"]["similarBrands"]


def goodonyouUpdate():
    category_list_objects = []
    brandInfo = {}
    brandData = {}
    ID = get_key(
        url="https://directory.goodonyou.eco/",
        timeout=500,
        key_string="https://directory.goodonyou.eco/_next/data/",
        request_filter="/index.json",
        from_url=True,
    )
    print(f"ID: {ID}")

    if is_file_modified_over_a_week_ago("categories.json"):
        goodonyouCategoryIndexGet(ID=ID)
    else:
        with open("categories.json") as file:
            category_list_objects = json.load(file)

    rolling_total = 0
    for category in category_list_objects:
        rolling_total += category["qty"]
        print(
            f"Processing {category['name']}..., {category['qty']} brands, {category['total']['all']} total brands"
        )
        if is_file_modified_over_a_week_ago(f"categories/{category['id']}.json"):
            goodonyouGetCategory(category["id"], ID=ID)
        else:
            goodonyouGetCategory(category["id"], ID=ID, avoidDownload=True)

    print(f"Total brands according to index: {rolling_total}")
    print(f"Total brands seen: {len(brandData)}")

    brands_downloaded = set(
        [brand.replace(".json", "") for brand in os.listdir("brands")]
    )
    brands_to_do = set(brandData.keys()).union(brands_downloaded)

    with open("brand_id_list.list", "r") as file:
        brand_id_list = file.readlines()
        brand_id_list = [brand.strip() for brand in brand_id_list]
        for brand in brand_id_list:
            if brand not in brands_to_do:
                brands_to_do.add(brand)

    categories_to_brandid = {}
    brands_download_done = False
    brands_checked = set()
    while not brands_download_done:
        brand = brands_to_do.pop()
        data, similarBrands = goodonyouGetBrand(brand, ID=ID)
        brands_checked.add(brand)
        if data is None:
            if len(brands_to_do) == 0:
                brands_download_done = True
            continue

        brandInfo[brand] = data

        if similarBrands is None:
            similarBrands = []

        for similarBrand in similarBrands:
            if (
                similarBrand["id"] not in brands_checked
                and similarBrand["id"] not in brands_to_do
            ):
                pprint(f"Adding {similarBrand['id']} to brands_to_do")
                brands_to_do.add(similarBrand["id"])

        for category in data["categories"]:
            if category not in categories_to_brandid:
                categories_to_brandid[category] = set()
            categories_to_brandid[category].add(brand)

        if len(brands_to_do) == 0:
            brands_download_done = True

        print_status(
            "info",
            len(brandInfo),
            len(brands_to_do),
            brand,
            print_over=True,
        )

    # pprint(brandInfo)
    with open("brands.json", "w") as file:
        json.dump(brandInfo, file, indent=4)

    with open("brand_id_list.list", "w") as file:
        for brand in brands_checked:
            file.write(f"{brand}\n")

    categories_to_brandid = {
        key: list(value) for key, value in categories_to_brandid.items()
    }
    with open("categories_to_brandid.json", "w") as file:
        json.dump(categories_to_brandid, file, indent=4)

    print(f"Total brands seen: {len(brandInfo)}")
    return categories_to_brandid, brandInfo


def goodonyouCategoryAverages(categories_to_brandid, brands):
    average_ratings_by_category = {}
    types_of_ratings = [
        "ethicalRating",
        "labourRating",
        "animalRating",
        "environmentRating",
        "price",
    ]
    for item in categories_to_brandid:
        print(f"Processing {item}")
        category_brands = categories_to_brandid[item]
        category_ratings = {}
        average_ratings = {}
        for brand in category_brands:
            number_of_brands = len(category_brands)
            if brands.get(brand):
                for rating_type in types_of_ratings:
                    if brands[brand].get(rating_type):
                        if rating_type not in category_ratings:
                            category_ratings[rating_type] = []
                        category_ratings[rating_type].append(
                            float(brands[brand][rating_type])
                        )
        for rating_type in category_ratings:
            average_ratings[rating_type] = sum(category_ratings[rating_type]) / len(
                category_ratings[rating_type]
            )
        average_ratings["number_of_brands"] = number_of_brands

        average_ratings_by_category[item] = average_ratings

    with open("glassdoor_average_ratings_by_category.json", "w") as file:
        json.dump(average_ratings_by_category, file, indent=4)
    return average_ratings_by_category


if __name__ == "__main__":
    categories_to_brandid, brandInfo = goodonyouUpdate()
    average_ratings_by_category = goodonyouCategoryAverages(
        categories_to_brandid, brandInfo
    )
    build_state = {
        "entity_count": len(brandInfo),
        "category_count": len(average_ratings_by_category),
        "build_date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "source": "goodonyou",
    }
    pprint(build_state)
    save_data_to_file(build_state, "build_state.json")
