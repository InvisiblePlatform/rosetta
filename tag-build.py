import json
import re
from tqdm import tqdm
import os
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

removeables = [
    "glassdoor", "tp_rating", "tp_source", "lb_fte", "lb_source", "ts_rating", "ts_source", "lb_fte", "wikipedia", "domhash",
    "industry", "lobbyeu", "wba_id", "ts_slug", "tp_slug", "glassdoor_id", "osids", "mbfc", "mbfc_slug", "mbfc_tags", "published",
    "tosdr_source", "tosdr_rating", "ticker", "esg_rating", "esg_source"
]
def process_domain(domain):
    file_loc = 'data_objects/db/' + domain
    output_loc = 'hugo/static/db/' + domain

    tags = ""
    wbm = False
    wbm_data = []
    wbm_data_bulk = []
    tag_data = {}
    if os.path.exists(file_loc):
        with open(file_loc, "r") as file:
            yaml_data = json.load(file)
            for key in yaml_data.keys():
                if key in keyconversion.keys():
                    tags += keyconversion[key]

            for core in yaml_data["core"]:
                if core["type"] == "wbm":
                    wbm = True
                    wbm_data.append(core["url"])

            if wbm:
                #yaml_data["wbm_data"] = []
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



            if yaml_data.get("mbfc_tags"):
                tag_data["m"] = yaml_data["mbfc_tags"]
                # TODO: Blanking source right now due to it being a multiple match item
                tag_data["_m"] = " " 
                #tag_data["_m"] = yaml_data["mbfc_source"]

            tag_data["k"] = tags
            yaml_data["data"] = tag_data

            to_remove = []
            
            for key in yaml_data.keys():
                if key in removeables:
                    to_remove.append(key)

            for key in to_remove:
                del yaml_data[key]

            #pprint(tag_data)
            #pprint(yaml_data)
            #if not os.path.exists(output_dir):
            #    os.makedirs(output_dir)
            write_output_file(output_loc, yaml_data)

    return [True, keys_list]


def process_domains_parallel(domains):
    results = []
    with Pool() as pool:
        for result in pool.imap_unordered(process_domain, domains):
                results.append(result)
                pbar.update(1)
    return results


def write_output_file(file_path, data):
    with open(file_path, "w") as file:
        json.dump(data, file, indent=4)


if __name__ == "__main__":
    #process_domain("dailymailcouk.json")
    #exit()

    dom_list = []
    for filename in os.listdir('data_objects/db/'):
        if filename.endswith(".json"):
            dom_list.append(filename)

    pbar = tqdm(total=len(dom_list))
    processed_results = process_domains_parallel(dom_list)

