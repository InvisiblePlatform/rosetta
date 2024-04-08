import os
import json
import shutil
import time
import yaml
from threading import Thread
from time import sleep
from multiprocessing import Pool
from tqdm import tqdm
from pprint import pprint

folder_path = "hugo/content/db"
core_data_set = set()


# Function to extract core data from frontmatter
def extract_core_data(frontmatter):
    if "political" in frontmatter and isinstance(frontmatter["political"], dict) and len(frontmatter["political"]) > 0:
        tempArr = []
        for key, value in frontmatter["political"].items():
            tempArr.extend(value)
        return tempArr
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
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()
        # Check if the file starts with "---" (indicating frontmatter)
        if content.startswith("---"):
            frontmatter_end = content.index("---", 3)
            frontmatter_text = content[3:frontmatter_end]
            frontmatter = yaml.safe_load(frontmatter_text)
            return extract_core_data(frontmatter)
    return None

# Get a list of all .md files in the folder
md_files = []
for root, _, files in os.walk(folder_path):
    for filename in files:
        if filename.endswith(".md"):
            file_path = os.path.join(root, filename)
            md_files.append(file_path)

# Initialize progress variables
total_files = len(md_files)

# Process the files using multiple threads
pbar = tqdm(total=total_files)
core_data_list = process_files_parrallel(md_files)
for item in core_data_list:
    core_data_set.add(item["sourceLabels"])
    core_data_set.add(item["dataId"])

print("\nInitial Processing complete.")
pprint(list(core_data_set))

with open("tools/mongoscripts/missingsids.json", "w") as f:
    json.dump({"ids": list(core_data_set)}, f, indent=4)


