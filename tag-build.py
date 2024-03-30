import json
import re
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
    'bcorp': "b",
    'connections': "c",
    'glassdoor': "l",
    'goodonyou': "g",
    'mbfc': "m",
    'osid': "o",
    'polalignment': "a",
    'polideology': "q",
    'ticker': "y",
    'tosdr_rating': "p",
    'wikidata_id': "z",
    'wbm': "w",
    'tp_rating': "t",
    'ts_rating': "s",
    "lb_fte": "e",
}

single_keys = "tsep"
multiple_keys = "blgw"

def process_domain(domain):
    file_loc = 'hugo/content/db/' + domain
    tags = ""
    wbm = False
    wbm_data = []
    wbm_data_bulk = []
    tag_data = {}
    if os.path.exists(file_loc):
        with open(file_loc, "r") as file:
            yaml_data = frontmatter.load(file).metadata
            for key in yaml_data.keys():
                if key in keyconversion.keys():
                    tags += keyconversion[key]

            for core in yaml_data["core"]:
                if core["type"] == "wbm":
                    wbm = True
                    wbm_data.append(core["url"])

            if wbm:
                yaml_data["wbm_data"] = []
                tags += keyconversion["wbm"]
                for wbm in wbm_data:
                    json_loc = f"hugo/static/ds/{wbm}"
                    wbm_obj = {}
                    with open(json_loc, "r") as json_file:
                        json_data = json.load(json_file)
                        wbm_obj["s"] = json_data["Company Name"][0]
                        wbm_obj["m"] = []
                        for index, module in json_data["modules"].items():
                            #pprint(module)
                            score = ""
                            for key, value in module.items():
                                if "Total Score (" in key:
                                    score = value
                            wbm_module = {
                                "s": index,
                                "r": float(score),
                            }
                            wbm_obj["m"].append(wbm_module)


                    wbm_data_bulk.append(wbm_obj)

            for index, tag in keyconversion.items():
                if not tag in tags:
                    continue
                if tag == keyconversion["wbm"]:
                    tag_data[tag] = wbm_data_bulk
                if tag in single_keys:
                    source = re.sub(r'_.*',"_source", index)
                    data = yaml_data.get(index)
                    source_data = yaml_data.get(source)
                    tag_data[tag] = data
                    tag_data[f"_{tag}"] = source_data

                if tag in multiple_keys:
                    data = yaml_data.get(index)
                    if isinstance(data, list):
                        for i, item in enumerate(data):
                            tag_data[f"{tag}{i}"] = float(item["rating"])
                            tag_data[f"_{tag}{i}"] = item["source"]

                    if isinstance(data, dict):
                        tag_data[tag] = data.get("rating", False)
                        if tag_data[tag] == False:
                            tag_data[tag] = float(data.get("score", False))
                        else:
                            tag_data[tag] = float(tag_data[tag])
                        tag_data[f"_{tag}"] = data["source"]



            yaml_data["tag_data"] = tag_data
            yaml_data["tags"] = tags


            #pprint(tag_data)
            #pprint(yaml_data)
            write_output_file(file_loc, yaml_data)

    return [True, keys_list]


def process_domains_parallel(domains):
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


if __name__ == "__main__":
    #process_domain("examplecom.md")
    #exit()

    dom_list = []
    for filename in os.listdir('hugo/content/db/'):
        if filename.endswith(".md"):
            dom_list.append(filename)

    pbar = tqdm(total=len(dom_list))
    processed_results = process_domains_parallel(dom_list)

