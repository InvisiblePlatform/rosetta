import json
from tqdm import tqdm
import threading
import time
import os
import frontmatter
import json
from pprint import pprint
from multiprocessing import Pool


def process_domain(domhash):
    try:
        domains = data[domhash]
        total_data = {}
        total_connection_nodes = []
        total_connection_links = []
        for domain in domains:
            file_loc = 'hugo/content/db/' + domain.replace('.','') + ".md"
            json_loc = 'hugo/static/connections/' + domain + ".json"
            if os.path.exists(file_loc):
                with open(file_loc, "r") as file:
                    yaml_data = frontmatter.load(file)
                    for key in yaml_data.keys():
                        value = yaml_data[key]
                        if not key in total_data.keys():
                            total_data[key] = value
                        if type(total_data[key]) is list:
                            if key != "wikidata_id":
                                org = set(total_data[key])
                                org = org.union(set(value))
                                total_data[key] = list(org)
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

        for domain in domains:
            file_loc = 'hugo/content/db/' + domain.replace('.','') + ".md"
            output_loc = 'matched_output/' + domain.replace('.','') + ".md"
            if os.path.exists(file_loc):
                with open(file_loc, "r") as file:
                    yaml_data = frontmatter.load(file)
                    for key in total_data.keys():
                        value = total_data[key]
                        if not key in yaml_data.keys():
                            yaml_data[key] = value
                        if type(total_data[key]) is list:
                            if key != 'wikidata_id':
                                yaml_data[key] = value
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
    except:
        pass
        #return [e, domhash]
    return [True, domhash]

def progress():
    time.sleep(3)  # Check progress after 3 seconds
    print(f'total: {pbar.total} finish:{pbar.n}')

def process_domains_parallel(domains):
    thread = threading.Thread(target=progress)
    thread.start()
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


    pbar = tqdm(total=len(data))
    processed_results = process_domains_parallel(hash_list)

