import os
import shutil
import json
from multiprocessing import Pool
from tqdm import tqdm
from pprint import pprint
import os

folder_path = "data_objects/db"
core_data_set = set()


# Function to extract core data from frontmatter
def extract_core_data(frontmatter):
    if (
        "core" in frontmatter
        and isinstance(frontmatter["core"], list)
        and len(frontmatter["core"]) > 0
    ):
        return frontmatter["core"]
    return None


def process_files_parrallel(files):
    results = []
    with Pool() as pool:
        for result in pool.imap_unordered(process_file, files):
            if result is not None:
                for entry in result:
                    results.append(entry)
            pbar.update(1)
    return results


# Function to process a single file
def process_file(file_path):
    with open(file_path, "r") as file:
        content = json.load(file)
        return extract_core_data(content)
    return None


# Get a list of all .md files in the folder
md_files = []
for root, _, files in os.walk(folder_path):
    for filename in files:
        if filename.endswith(".json"):
            file_path = os.path.join(root, filename)
            md_files.append(file_path)

# Initialize progress variables
total_files = len(md_files)

# Process the files using multiple threads
pbar = tqdm(total=total_files)
core_data_list = process_files_parrallel(md_files)
for item in core_data_list:
    core_data_set.add(item["url"])

# Print a newline to separate progress output
print("\nInitial Processing complete.")
# pprint(len(core_data_list))
pprint(len(core_data_set))
for url in core_data_set:
    path = url.split("/")
    locationmap = {
        "bcorp": "bcorp",
        "glassdoor": "glassdoor",
        "goodonyou": "goodonyou",
        "mbfc": "mbfc",
        "opensecrets": "opensecrets",
        "similar": "similar-sites",
        "tosdr": "tosdr",
        "trustpilot": "trust-pilot",
        "trustscore": "trustscore",
        "wbm": "static",
        "yahoo": "yahoo",
        "cta": "cta",
        "lobbyfacts": "lobbyfacts",
    }
    if not os.path.isfile(f"data_collection/{locationmap[path[0]]}/entities/{path[1]}"):
        pprint(url)
        exit()
    shutil.copy2(
        f"data_collection/{locationmap[path[0]]}/entities/{path[1]}",
        f"data_objects/public/ds/{path[0]}/{path[1]}",
    )

# Delete all files in matched_output folder
folder_path = "matched_output"
for filename in os.listdir(folder_path):
    file_path = os.path.join(folder_path, filename)
    if os.path.isfile(file_path):
        os.remove(file_path)
