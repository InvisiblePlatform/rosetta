import json
import os
import requests
import sys

sys.path.append("..")

from common import save_data_to_file, load_data_from_file


def tosdrCleanData(data):
    cleaned_data = []
    for item in data:
        cleaned_item = {
            "id": str(item["id"]),
            "title": item["title"],
            "url": item["url"],
            "points": item["points"],
            "class": item["class"],
            "tosdr": item["tosdr"],
        }
        cleaned_data.append(cleaned_item)
    return cleaned_data


def process_data(data):
    output_dir = "entities"
    index_filename = "site_id.json"
    available_ratings = {}

    for key, values in data.items():
        try:
            slug = values["slug"]
            rated = values["rated"]
            id_value = values["id"]
            domain = key.replace("tosdr/review/", "")
            if "/" in domain:
                continue

            entity_data = {
                "source": values["name"],
                "slug": slug,
                "rated": rated,
                "id": id_value,
                "location": f"tosdr/{id_value}",
            }

            if rated:
                available_ratings[domain] = {"id": id_value, "rating": rated}
                output_filename = os.path.join(output_dir, f"{id_value}.json")
                if not os.path.exists(output_filename):
                    with open(output_filename, "w") as output_file:
                        json.dump(entity_data, output_file, indent=4)
                    print(f"Processed {key} and saved to {output_filename}")

        except Exception as e:
            print(key)
            if key in ["tosdr/api/version", "tosdr/data/version"]:
                continue
            print(e)
            exit()

    save_data_to_file(available_ratings, index_filename)


def main():
    response = requests.get("https://tosdr.org/api/1/all.json")
    data = response.json()

    cleaned_data = tosdrCleanData(data)
    save_data_to_file(cleaned_data, "rated.json")

    input_file = "all.json"
    data = load_data_from_file(input_file)

    process_data(data)


if __name__ == "__main__":
    main()
