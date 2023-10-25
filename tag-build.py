import json
from tqdm import tqdm
import threading
import yaml
import time
import os
import frontmatter
import json
from pprint import pprint
from multiprocessing import Pool

keys_list = set()
keyconversion = {
    'bcorp_rating': "b",
    'connections': "c",
    'glassdoor_rating': "l",
    'goodonyou': "g",
    'isin': "i",
    'isin_id': "i",
    'mbfc': "m",
    'osid': "o",
    'polalignment': "a",
    'polideology': "p",
    'ticker': "y",
    'tosdr_rating': "P",
    'wikidata_id': "w",
    'tp_rating': "t"
}

def process_domain(domain):
    file_loc = 'hugo/content/db/' + domain
    tags = ""
    if os.path.exists(file_loc):
        with open(file_loc, "r") as file:
            yaml_data = frontmatter.load(file).metadata
            for key in yaml_data.keys():
                if key in keyconversion.keys():
                    tags += keyconversion[key]

            title = yaml_data["title"]
            yaml_data["tags"] = tags
            write_output_file(file_loc, yaml_data)
            #pprint(tags)


    #if os.path.exists(json_loc):
    #    with open(json_loc, "r") as jsonfile:
    #        json_data = json.load(jsonfile)


    return [True, keys_list]

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


def write_output_file(file_path, data):
    line = "---\n"
    with open(file_path, "w") as file:
        file.write(line)
    with open(file_path, "a") as file:
        yaml.dump(data, file, sort_keys=False)
        file.write(line)

#def write_output_file(file_path, data):
#    if not os.path.exists(file_path):
#        return
#
#    with open(file_path, "r") as file:
#        content = file.read()
#
#    frontmatter_end = content.index("---", 4) + 3
#    new_frontmatter = yaml.dump(data, sort_keys=False)
#    new_content = "---\n" + new_frontmatter + "---\n" + content[frontmatter_end:]
#
#    with open(file_path, "w") as file:
#        file.write(new_content)


if __name__ == "__main__":
    # Load associated domains from JSON file
    #with open("rosetta/hashtosite.json", "r") as file:
    #    data = json.load(file)

    dom_list = []
    for filename in os.listdir('hugo/content/db/'):
        if filename.endswith(".md"):
            dom_list.append(filename)
#    for domhash in data:
#        domains = data[domhash]
#        found = 0
#        for domain in domains:
#            file_loc = 'hugo/content/db/' + domain.replace('.','') + ".md"
#            if os.path.exists(file_loc):
#                dom_list.append(domain)

    pbar = tqdm(total=len(dom_list))
    processed_results = process_domains_parallel(dom_list)

