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

langArray = ["en", "fr", "ar", "es", "eo", "zh", "de", "hi", "ca"]
secrets_array = {}
ids = []

def process_document(document):
    result = {}
    oid = document['id']
    labels = {}

    # Retrieve the English label if it exists
    label = document.get('labels', {})

    for lang in langArray:
        if label.get(lang):
            labels[f'{lang}label'] = label.get(lang)["value"]
        else:
            labels[f'{lang}label'] = 'null'

    result[oid] = labels

    return result


def main():
    global data
    client = MongoClient('mongodb://localhost:27017/')
    db = client['rop']
    collection = db['wikidata']

    output_file_name_id = 'labelindex.json'
    with open(output_file_name_id, 'r') as file:
        secrets_array = json.load(file)

    with open("../../missingLabels.json", 'r') as f:
        ids = json.load(f)
    main_node = ids
    query = {'id': {'$in': main_node}}
    print("do query")
    matching_documents = collection.find(query)
    matching_total = collection.count_documents(query)

    pbar = tqdm(total=matching_total)

    print("start pool")
    with Pool(initializer=init_progress_bar, initargs=(pbar,)) as pool:
        # The imap function is used for lazily-evaluated mapping
        results = pool.imap_unordered(process_document, matching_documents)

        # This loop will iterate over the results as they are completed, updating the progress bar
        for result in results:
            if result:
                oid = next(iter(result))
                secrets_array.update(result)
            pbar.update()

    # Close the progress bar
    pbar.close()
    client.close()

    with open(output_file_name_id, 'w') as file:
        json.dump(secrets_array, file, indent=4)

if __name__ == '__main__':
    main()

