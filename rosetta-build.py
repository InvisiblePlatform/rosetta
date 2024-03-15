import json
from tqdm import tqdm
import threading
import time
import os
import frontmatter
import json
from pprint import pprint
from multiprocessing import Pool

dicts = ['core', 'mbfc', 'goodonyou', 'social', 'political']
def sort_filenames_by_line_count(domains):
    # Create a list of tuples with filename and line count
    file_info = []

    for domain in domains:
        file_loc = 'hugo/content/db/' + domain.replace('.','') + ".md"
        if os.path.exists(file_loc):
            with open(file_loc, 'r') as file:
                line_count = sum(1 for _ in file)
            file_info.append((domain, line_count))

    # Sort the list of tuples based on line count
    sorted_file_info = sorted(file_info, key=lambda x: x[1], reverse=True)

    # Extract the sorted filenames from the sorted list
    sorted_filenames = [entry[0] for entry in sorted_file_info]

    return sorted_filenames

def process_domain(domhash):
    try:
        domains = data[domhash]
        total_data = {}
        total_connection_nodes = []
        total_connection_links = []

        sorted_domains = sort_filenames_by_line_count(domains)
        for domain in sorted_domains:
            file_loc = 'hugo/content/db/' + domain.replace('.','') + ".md"
            json_loc = 'hugo/static/connections/' + domain + ".json"
            if os.path.exists(file_loc):
                with open(file_loc, "r") as file:
                    yaml_data = frontmatter.load(file)
                    for key in yaml_data.keys():
                        value = yaml_data[key]
                        if not key in total_data.keys():
                            total_data[key] = value
                        else:
                            if type(total_data[key]) is list and key not in dicts:
                                if key != "wikidata_id":
                                    if key != "mbfc_tags":
                                        org = set(total_data[key])
                                        org = org.union(set(value))
                                        total_data[key] = list(org)
                            elif type(total_data[key]) is list and key in dicts:
                                if key == "core":
                                    seen = ["trustpilot", "trustscore", "similar"]
                                    for item in total_data["core"]:
                                        seen.append(item["type"])
                                    for item in value:
                                        if item["type"] not in seen:
                                            total_data["core"].append(item)
                            elif key == "social":
                                seen = []
                                for key, item in total_data["social"].items():
                                    seen.append(key)
                                for key, item in value.items():
                                    if key not in seen:
                                        total_data["social"][key] = item


            if os.path.exists(json_loc):
                with open(json_loc, "r") as jsonfile:
                    json_data = json.load(jsonfile)
                    json_nodes = json_data['nodes']
                    json_links = json_data['links']
                    for node in json_nodes:
                        if node not in total_connection_nodes:
                            total_connection_nodes.append(node)
                    for link in json_links:
                        if link not in total_connection_links:
                            total_connection_links.append(link)

        for domain in sorted_domains:
            file_loc = 'hugo/content/db/' + domain.replace('.','') + ".md"
            output_loc = 'matched_output/' + domain.replace('.','') + ".md"
            if os.path.exists(file_loc):
                with open(file_loc, "r") as file:
                    yaml_data = frontmatter.load(file)
                    for key in total_data.keys():
                        value = total_data[key]
                        if not key in yaml_data.keys():
                            yaml_data[key] = value
                        else:
                            if type(total_data[key]) is list and key not in dicts:
                                if key != 'wikidata_id':
                                    if key != "mbfc_tags":
                                        yaml_data[key] = value
                            elif type(total_data[key]) is list and key in dicts:
                                if key == "core":
                                    seen = []
                                    for item in yaml_data["core"]:
                                        seen.append(item["type"])
                                    for item in value:
                                        if item["type"] not in seen:
                                            yaml_data["core"].append(item)
                            elif key == "social":
                                seen = []
                                for key, item in yaml_data["social"].items():
                                    seen.append(key)
                                for key, item in value.items():
                                    if key not in seen:
                                        yaml_data["social"][key] = item
                    yaml_data['domhash'] = domhash
                    yaml_data['connections'] = f'/connections/{domhash}.json'
                    with open(output_loc, "w") as output:
                        output.writelines(frontmatter.dumps(yaml_data))
        connections_out = {}
        connections_out['nodes'] = total_connection_nodes
        connections_out['links'] = total_connection_links
        json_output_file = f'hugo/static/connections/{domhash}.json'
        with open(json_output_file, 'w') as output:
            json.dump(connections_out, output)
    except Exception as e:
        pprint(e)
        # exit()

        #return [e, domhash]
    return [True, domhash]

def process_domains_parallel(domains):
    results = []
    with Pool() as pool:
        for result in pool.imap_unordered(process_domain, domains):
                results.append(result)
                pbar.update(1)
    return results


def write_output_file(domain, data):
    file_path = domain + ".md"
    if not os.path.exists(file_path):
        return

    with open(file_path, "r") as file:
        content = file.read()

    frontmatter_end = content.index("---", 4) + 3
    new_frontmatter = yaml.dump(data, sort_keys=False)
    new_content = "---\n" + new_frontmatter + "---\n" + content[frontmatter_end:]

    with open(file_path, "w") as file:
        file.write(new_content)


if __name__ == "__main__":
    # Load associated domains from JSON file
    with open("rosetta/hashtosite.json", "r") as file:
        data = json.load(file)

    found = 0
    hashtolook = None
    hash_list = []
    for domhash in data:
        domains = data[domhash]
        found = 0
        for domain in domains:
            file_loc = 'hugo/content/db/' + domain.replace('.','') + ".md"
            if os.path.exists(file_loc):
                found += 1
        if found > 2:
            # process_domain(domhash)
            hash_list.append(domhash)
            # exit()


    pbar = tqdm(total=len(hash_list))
    processed_results = process_domains_parallel(hash_list)

