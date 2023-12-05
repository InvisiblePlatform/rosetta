import json
from pprint import pprint
import csv
import string
from pymongo import MongoClient
from multiprocessing import Pool, cpu_count
from functools import partial
from tqdm import tqdm

def init_progress_bar(pbar):
    global progress_bar
    progress_bar = pbar

def update_progress_bar(*a):
    progress_bar.update()

def remove_punctuation(text):
    return text.translate(str.maketrans('', '', string.punctuation))

def process_document(document):
    result = {}
    oid = document['id']
    # Default OpenSecrets ID to an empty array
    openSecrets = []

    # Retrieve the English label if it exists
    label = document.get('labels', {}).get('en', '')

    # Attempt to get OpenSecrets ID directly from the document
    # direct_open_secrets = document.get('claims', {}).get('P4691', [{}])[0].get('mainsnak', {}).get('datavalue', {}).get('value', '')
    # if direct_open_secrets:
    #     openSecrets.append(direct_open_secrets)
    # Attempt other labels 
    parliment_sna = document.get('claims',{}).get('P4527', [{}])[0].get('qualifiers',{}).get('P1810', [{}])[0].get('datavalue','')

    # Process aliases if they exist, adding any matched IDs to openSecrets
    aliases = document.get('aliases', {}).get('en', [])
    if label:
        aliases.append(label)  # Include the label as part of the aliases for checking
    if parliment_sna:
        aliases.append(parliment_sna)

    for alias_entry in aliases:
        alias = alias_entry.get('value', '')
        stripped_alias = remove_punctuation(alias)
        companyless_alias = alias.replace("company", "Co").replace("Company", "Co")
        corpless_alias = alias.replace("corporation", "Corp").replace("Corporation", "Corp")

        for alias_varient in [alias, stripped_alias, companyless_alias, corpless_alias]:
            if alias_varient in data:
                matched_label_id = data[alias_varient].get('WBA_ID', '')
                if matched_label_id and matched_label_id not in openSecrets:  # Avoid duplicates
                    openSecrets.append(matched_label_id)

    if len(openSecrets) == 0:
        openSecrets = "No OpenSecrets"

    website = []
    for site in document.get('claims', {}).get('P856', [{}]):
        website.append(site.get('mainsnak', {}).get('datavalue', {}).get('value', ''))
    if len(website) > 0:
        result[oid] = {"website": website, "id": oid, "WBA_ID": openSecrets, "label": label.get('value', '') if isinstance(label, dict) else label}
        if type(openSecrets) == list:
            print(result)


    return result


def main():
    global data
    client = MongoClient('mongodb://localhost:27017/')
    db = client['rop']
    collection = db['wikidata']

    main_node = []
    wikidataidfile = '/home/orange/Projects/invisible-rosetta/data_collection/wikidata/website_id_list.csv'
    print("load wikidata")
    with open(wikidataidfile, 'r', encoding="utf8", errors='ignore') as file:
        reader = csv.reader(file)
        for row in reader:
            try:
                wikiid = row[1]
                main_node.append(wikiid)
            except Exception as e:
                print(f"Error reading CSV: {e}")

    query = {'id': {'$in': main_node}}
    print("do query")
    matching_documents = collection.find(query)
    matching_total = collection.count_documents(query)

    print("load transformed")
    file_name = '/home/orange/Projects/invisible-rosetta/data_collection/static/nosites.json'
    data = {}
    with open(file_name, 'r', encoding="utf8", errors='ignore') as file:
        index = json.load(file)
        for key, value in index.items():
            for cn in value["Company Name"]:
                data[cn] = value


    output_array = {}
    secrets_array = {}

    pbar = tqdm(total=matching_total)

    print("start pool")
    with Pool(initializer=init_progress_bar, initargs=(pbar,)) as pool:
        # The imap function is used for lazily-evaluated mapping
        results = pool.imap_unordered(process_document, matching_documents)

        # This loop will iterate over the results as they are completed, updating the progress bar
        for result in results:
            if result:
                oid = next(iter(result))
                output_array.update(result)
                if isinstance(result[oid]["WBA_ID"], list):
                    secrets_array.update(result)
            pbar.update()

    # Close the progress bar
    pbar.close()
    client.close()

    output_file_name_id = 'wbm_enrichment4.json'
    with open(output_file_name_id, 'w') as file:
        json.dump(secrets_array, file, indent=4)

if __name__ == '__main__':
    main()

