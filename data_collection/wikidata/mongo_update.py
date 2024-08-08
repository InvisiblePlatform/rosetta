import os
import requests
import datetime

# Specify the URL of the latest-all.json.bz2 file on wikidata's backups
backup_url = "https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.bz2"
# Specify the path where you want to save the downloaded file
save_path = "/media/Biggs/data/wikidata"
file_name = "latest-all.json.bz2"
file_name_extracted = "latest-all.json"

last_modified = None
# check file modification date
if os.path.exists(f"{save_path}/{file_name_extracted}"):
    # Get the last modified date of the file
    last_modified = os.path.getmtime(f"{save_path}/{file_name_extracted}")
    print("Last modified date: ", last_modified)
else:
    print("Decompressed File not found")
    if os.path.exists(f"{save_path}/{file_name}"):
        print("Compressed File found")
        last_modified = os.path.getmtime(f"{save_path}/{file_name}")
        print("Last modified date: ", last_modified)

# check backup_url modification date
r = requests.head(backup_url)
last_modified_url = r.headers["Last-Modified"]
last_modified_url_date = datetime.datetime.strptime(
    last_modified_url, "%a, %d %b %Y %H:%M:%S %Z"
).timestamp()

print("Last modified date URL: ", last_modified_url_date)

if last_modified is None or last_modified_url_date != last_modified:
    # Download the file with aria2c
    os.system(f"aria2c -d {save_path} {backup_url}")
    # update the last modified date of file
    os.utime(
        f"{save_path}/latest-all.json.bz2",
        (int(last_modified_url_date), int(last_modified_url_date)),
    )

# Extract the downloaded file
if os.path.exists(f"{save_path}/latest-all.json.bz2"):
    print("Extracting the file")
    os.system(f"lbzip2 -v -d {save_path}/latest-all.json.bz2")
elif os.path.exists(f"{save_path}/latest-all.json"):
    print("File already extracted")
