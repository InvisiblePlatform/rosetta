import os
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
    if "core" in frontmatter and isinstance(frontmatter["core"], list) and len(frontmatter["core"]) > 0:
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
    core_data_set.add(item["url"])

# Convert the set back to a list for further processing or printing
#core_data_list = [dict(entry) for entry in core_data_set]

# Print or process the unique core data list
#for item in core_data_list:
#    print(item)

# Print a newline to separate progress output
print("\nInitial Processing complete.")
#pprint(len(core_data_list))
pprint(len(core_data_set))
for url in core_data_set:
    path = url.split("/")
    locationmap = {
        'bcorp': "bcorp",
        'glassdoor': "glassdoor",
        'goodonyou': "goodonyou",
        'mbfc': "mbfc",
        'opensecrets': "opensecrets",
        'similar': "similar-sites",
        'tosdr': "tosdr",
        'trustpilot': "trust-pilot",
        'trustscore': 'trustscore',
        'wbm': "static",
        'yahoo': "yahoo",
        'cta': 'cta',
        'lobbyfacts':'lobbyfacts',
    }
    if not os.path.isfile(f"data_collection/{locationmap[path[0]]}/entities/{path[1]}"):
        pprint(url)
        exit()
    shutil.copy2(f"data_collection/{locationmap[path[0]]}/entities/{path[1]}", 
                 f"hugo/static/ds/{path[0]}/{path[1]}")

