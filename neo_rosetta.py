import json
from hashlib import md5
import os

from data_collection.common import (
    print_status_line,
    send_notification,
    load_data_from_file,
    save_data_to_file,
)

from tqdm import tqdm
from multiprocessing import Pool
from pprint import pprint
import shutil

dicts = ["core", "mbfc", "goodonyou", "social", "political"]


def sort_filenames_by_line_count(domains):
    # Create a list of tuples with filename and line count
    file_info = []

    for domain in domains:
        file_loc = "data_objects/db/" + domain.replace(".", "") + ".json"
        if os.path.exists(file_loc):
            with open(file_loc, "r") as file:
                line_count = sum(1 for _ in file)
            file_info.append((domain, line_count))

    # Sort the list of tuples based on line count
    sorted_file_info = sorted(file_info, key=lambda x: x[1], reverse=True)

    # Extract the sorted filenames from the sorted list
    sorted_filenames = [entry[0] for entry in sorted_file_info]

    return sorted_filenames


def rosettaGatherLists():
    listArray = [
        "data_collection/trust-pilot/slug_site.json",
        "data_collection/ror/slug_site.json",
        "data_collection/https-everywhere/slug_site.json",
        "data_collection/entity-radar/site_data.json",
        # "data_collection/ssl-crawler/slug_sites.json",
    ]
    oldHashList = load_data_from_file("rosetta/sitetohash.json")

    canonSites = {}

    for listFile in listArray:
        listData = load_data_from_file(listFile)
        for slug, data in listData.items():
            if slug == "null":
                continue
            sites = set(data["sites"])
            if data["canon"] is None:
                print(f"Missing Canon: {slug}, {listFile}")
                exit()
            canon = data["canon"]
            if canon.startswith("www."):
                canon = canon[4:]

            if canon in canonSites:
                sites.update(canonSites[canon])

            canonSites[canon] = list(sites)
    stillLoop = True

    subSites = []
    while stillLoop:
        stillLoop = False
        print("Looping")
        cleanCanon = {}
        for canon, sites in canonSites.items():
            if canon in subSites:
                continue

            setSites = set(sites)
            cleanCanon[canon] = list(setSites)

            for site in list(setSites):
                if site.startswith("www."):
                    site = site[4:]

                if site in canonSites and site != canon:
                    print_status_line(
                        total=len(canonSites),
                        fine=len(cleanCanon),
                        message=f"{site} -> {canon}",
                        print_over=True,
                    )
                    stillLoop = True
                    subSites.append(site)
                    setSites.update(canonSites[site])
                    cleanCanon[canon] = list(setSites)

        canonSites = cleanCanon

    save_data_to_file(canonSites, "rosetta/canon_to_sites.json")

    canonByHash = {}
    canonSitesWithHash = {}
    for canon, sites in canonSites.items():
        hash = oldHashList.get(canon, None)
        if not hash:
            for site in sites:
                if site in oldHashList:
                    hash = oldHashList[site]
                    break

        if not hash:
            hash = md5(canon.encode()).hexdigest()
        #   print(f"New Hash: {canon} {hash}")
        # else:
        #   print(f"Old Hash: {canon} {hash}")

        canonSitesWithHash[canon] = {
            "sites": sites,
            "canon": canon,
            "hash": hash,
        }
        if hash in canonByHash:
            print(f"Duplicate Hash: {hash} {canon} {canonByHash[hash]}")
            if len(canonSitesWithHash[canon]["sites"]) > len(
                canonByHash[hash]["sites"]
            ):
                tempObj = canonSitesWithHash[canon]
                tempObj["sites"].extend(canonByHash[hash]["sites"])
                canonByHash[hash] = tempObj
            else:
                canonByHash[hash]["sites"].extend(canonSitesWithHash[canon]["sites"])
        else:
            canonByHash[hash] = canonSitesWithHash[canon]

    save_data_to_file(canonSitesWithHash, "rosetta/canon_to_sites_with_hash.json")
    save_data_to_file(canonByHash, "rosetta/hash_to_canon.json")
    print(f"Canon Sites: {len(canonSites)}")

    return


def rosettaLoadData():
    canonSites = load_data_from_file("rosetta/canon_to_sites.json")
    canonSitesWithHash = load_data_from_file("rosetta/canon_to_sites_with_hash.json")
    canonByHash = load_data_from_file("rosetta/hash_to_canon.json")


def rosettaGatherData():
    global hash_to_canon
    global pbar

    hash_to_canon = load_data_from_file("rosetta/hash_to_canon.json")
    hash_list = []
    found = 0
    for hash, data in hash_to_canon.items():
        for site in data["sites"]:
            file_loc = "data_objects/db/" + site.replace(".", "") + ".json"
            if os.path.exists(file_loc):
                found += 1
        if found > 2:
            hash_list.append(hash)
    # hash_list = ["b1e620b575faa516fd243b5700539b4e"]
    # process_domain(hash_list[0])
    # exit()
    pbar = tqdm(total=len(hash_list))
    processed_results = process_domains_parallel(hash_list)
    return


def process_domains_parallel(domains):
    global pbar
    results = []
    with Pool() as pool:
        for result in pool.imap_unordered(process_domain, domains):
            results.append(result)
            pbar.update(1)
    return results


def process_domain(domhash):
    """
    Process a domain given its hash.

    Args:
        domhash (str): The hash of the domain.

    Returns:
        list: A list containing a boolean value indicating success and the domain hash.

    """
    global hash_to_canon
    # Get the set of domains associated with the given hash
    domains = set(hash_to_canon[domhash]["sites"])
    total_data = {}

    total_connection_nodes = []
    total_connection_links = []
    canon_site = hash_to_canon[domhash]["canon"]

    # Remove the canonical domain from the set of domains
    if canon_site in domains:
        domains.remove(canon_site)

    # Sort the domains by line count and add the canonical domain at the beginning
    sorted_domains = sort_filenames_by_line_count(list(domains))
    domains = [canon_site] + sorted_domains

    # Process each domain
    for domain in domains:
        clean_domain = domain.replace(".", "")
        file_loc = f"data_objects/db/{clean_domain}.json"
        json_loc = f"data_objects/public/connections/{clean_domain}.json"
        if not os.path.exists(json_loc):
            json_loc = f"data_objects/public/connections/{domain}.json"

        # Check if the file exists
        if os.path.exists(file_loc):
            with open(file_loc, "r") as file:
                yaml_data = json.load(file)
                for key, value in yaml_data.items():
                    # Merge the data into total_data
                    if key not in total_data:
                        total_data[key] = value
                    else:
                        if isinstance(total_data[key], list) and key not in dicts:
                            if key != "wikidata_id" and key != "mbfc_tags":
                                total_data[key] = list(
                                    set(total_data[key]).union(set(value))
                                )
                        elif isinstance(total_data[key], list) and key in dicts:
                            if key == "core":
                                seen = set(["trustpilot", "trustscore", "similar"])
                                # seen.update(
                                #    item["type"] for item in total_data["core"]
                                # )
                                total_data["core"].extend(
                                    item for item in value if item["type"] not in seen
                                )
                        elif key == "social":
                            seen = set(total_data["social"].keys())
                            total_data["social"].update(
                                (k, v) for k, v in value.items() if k not in seen
                            )

        # Check if the JSON file exists
        if os.path.exists(json_loc):
            with open(json_loc, "r") as jsonfile:
                json_data = json.load(jsonfile)
                json_nodes = json_data["nodes"]
                json_links = json_data["links"]
                total_connection_nodes.extend(
                    node for node in json_nodes if node not in total_connection_nodes
                )
                total_connection_links.extend(
                    link for link in json_links if link not in total_connection_links
                )

    # nodeIds = set()
    # for node in total_connection_nodes:
    #     nodeIds.add(node["id"])

    # linkNodeId = set()
    # for link in total_connection_links:
    #     if link["source"] not in nodeIds or link["target"] not in nodeIds:
    #         continue
    #     linkNodeId.add(link["source"])
    #     linkNodeId.add(link["target"])

    # for node in total_connection_nodes:
    #     if node["id"] not in linkNodeId:
    #         nodeIds.remove(node["id"])

    # total_connection_nodes = [
    #     node for node in total_connection_nodes if node["id"] in nodeIds
    # ]

    # Save the connection data to a JSON file
    connections_out = {
        "nodes": total_connection_nodes,
        "links": total_connection_links,
    }
    json_output_file = f"data_objects/public/connections/{domhash}.json"
    save_data_to_file(connections_out, json_output_file)

    # Process each domain again
    for domain in domains:
        clean_domain = domain.replace(".", "")
        output_loc = f"matched_output/{clean_domain}.json"
        file_loc = f"data_objects/db/{clean_domain}.json"

        # Check if the file exists
        if os.path.exists(file_loc):
            with open(file_loc, "r") as file:
                yaml_data = json.load(file)

                oldconnections = yaml_data.get("connections", None)
                if oldconnections:
                    path = f"data_objects/public/connections/{oldconnections}"
                    if os.path.exists(path):
                        os.remove(path)

                for key, value in total_data.items():
                    # Merge the data into yaml_data
                    if key not in yaml_data:
                        yaml_data[key] = value
                    else:
                        if isinstance(total_data[key], list) and key not in dicts:
                            if key != "wikidata_id" and key != "mbfc_tags":
                                yaml_data[key] = list(
                                    set(yaml_data[key]).union(set(value))
                                )
                        elif isinstance(total_data[key], list) and key in dicts:
                            if key == "core":
                                stable = set(["trustpilot", "trustscore", "similar"])
                                # seen = set(
                                #    item["type"] for item in yaml_data["core"]
                                # )
                                coreSetReal = {}
                                coreSet = set()
                                for module in total_data["core"]:
                                    if module["type"] not in stable:
                                        moduleId = f"{module['type']},{module['url']}"
                                        if not coreSetReal.get(moduleId):
                                            coreSetReal[moduleId] = module
                                        elif (
                                            coreSetReal[moduleId].get("src")
                                            == canon_site
                                        ):
                                            coreSetReal[moduleId] = module

                                for module in yaml_data["core"]:
                                    moduleId = f"{module['type']},{module['url']}"
                                    if not coreSetReal.get(moduleId):
                                        coreSetReal[moduleId] = module

                                newValue = []
                                for moduleId, module in coreSetReal.items():
                                    newValue.append(module)

                                yaml_data["core"] = newValue
                        elif key == "social":
                            seen = set(yaml_data["social"].keys())
                            yaml_data["social"].update(
                                (k, v) for k, v in value.items() if k not in seen
                            )
                yaml_data["domhash"] = domhash
                yaml_data["connections"] = f"/connections/{domhash}.json"
                save_data_to_file(yaml_data, output_loc)

    return [True, domhash]


def rosettaMain():
    return


if __name__ == "__main__":
    # rosettaGatherLists()
    rosettaLoadData()
    rosettaGatherData()
    # Copy all files from matched_output to data_objects/db
    file_list = os.listdir("matched_output")
    for file_name in file_list:
        if file_name.endswith(".json"):
            src = os.path.join("matched_output", file_name)
            dst = os.path.join("data_objects/db", file_name)
            shutil.copyfile(src, dst)
    # rosettaMain()
    # send_notification(title="Rosetta", message="Completed!")
