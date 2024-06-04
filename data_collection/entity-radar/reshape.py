import json
import sys
import requests

sys.path.append("..")
from common import (
    lookup_document_by_label,
    print_status,
    print_status_line,
    is_file_modified_over_a_week_ago,
    get_domain,
)


def entityMapDownload():
    url = "https://raw.githubusercontent.com/duckduckgo/tracker-radar/main/build-data/generated/entity_map.json"
    if is_file_modified_over_a_week_ago("entity_map.json"):
        print("Downloading entity map...")
        response = requests.get(url)
        with open("entity_map.json", "wb") as file:
            file.write(response.content)


def entityMapMain():
    entityList = {}
    singleEntity = 0
    multipleEntity = 0
    unmatched = 0
    fine, fail, warn, pass_ = 0, 0, 0, 0
    counts: dict[int, int] = {}
    with open("entity_map.json", "r") as f:
        data = json.load(f)
        total_entries = len(data.keys())
        canon = None
        for index, entity in map(lambda x: (x[0] + 1, x[1]), enumerate(data.keys())):
            if index == len(data.keys()):
                print_over_state = False
            else:
                print_over_state = True
            entity_data = data[entity]
            entity_obj = {
                "name": entity,
                "sites": entity_data["properties"],
                "aliases": entity_data["aliases"],
                "displayName": entity_data["displayName"],
            }
            if len(entity_data["properties"]) == 1:
                # Sole entity
                singleEntity += 1
                canon = get_domain(entity_data["properties"][0])
                fine += 1
                print_status(
                    "fine",
                    index,
                    total_entries,
                    f"{entity} ({canon})",
                    print_over=print_over_state,
                )
                entityList[canon] = entity_obj
                entityList[canon]["canon"] = canon
            else:
                # Multiple domains for entity
                multipleEntity += 1
                numberOfdomains = len(entity_data["properties"])
                document_lookup = lookup_document_by_label(entity)
                if document_lookup:
                    if document_lookup["claims"].get("P856"):
                        pass_ += 1
                        canon = get_domain(
                            document_lookup["claims"]["P856"][0]["mainsnak"][
                                "datavalue"
                            ]["value"]
                        )
                        entityList[canon] = entity_obj
                        entityList[canon]["canon"] = canon
                        print_status(
                            "pass",
                            index,
                            total_entries,
                            f"{entity} ({canon})",
                            print_over=print_over_state,
                        )
                else:
                    document_lookup = lookup_document_by_label(entity, True)
                    if document_lookup:
                        if document_lookup["claims"].get("P856"):
                            canon = get_domain(
                                document_lookup["claims"]["P856"][0]["mainsnak"][
                                    "datavalue"
                                ]["value"]
                            )
                            if canon:
                                entityList[canon] = entity_obj
                                entityList[canon]["canon"] = canon
                                warn += 1
                                print_status(
                                    "warn",
                                    index,
                                    total_entries,
                                    f"{entity} ({canon})",
                                    print_over=print_over_state,
                                )

                if not canon:
                    print_status("fail", index, total_entries, entity)
                    fail += 1
                    unmatched += 1
                    if counts.get(numberOfdomains):
                        counts[numberOfdomains] += 1
                    else:
                        counts[numberOfdomains] = 1

                # for prop in entity_data["properties"]:
                #    entityList[prop] = entity_obj

    print("Complete")
    for key in sorted(counts.keys()):
        print(f"{key} domains: {counts[key]}")

    with open("site_data.json", "w") as f:
        json.dump(entityList, f, indent=4)

    print_status_line(
        total_entries,
        single=singleEntity,
        multiple=multipleEntity,
        unknown=unmatched,
        fine=fine,
        passed=pass_,
        message=f"Theres also {warn} entities from aliases.",
    )


if __name__ == "__main__":
    entityMapDownload()
    entityMapMain()
