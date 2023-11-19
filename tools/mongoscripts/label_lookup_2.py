import json
import sys
import csv
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017/')
db = client['rop']
collection = db['wikidata']


main_node = []
wikidataidfile = '/home/orange/Projects/invisible-rosetta/data_collection/wikidata/website_id_list.csv'
with open(wikidataidfile, 'r', encoding="utf8", errors='ignore') as file:
    reader = csv.reader(file)
    for row in reader:
        try:
            wikiid = row[1]
            main_node.append(wikiid)
        except:
            pass

query = { 'id': {'$in': main_node }}

file_name = '/home/orange/Projects/invisible-rosetta/IVDataIngestion/opensecrets/transformed.json'
with open(file_name, 'r', encoding="utf8", errors='ignore') as file:
    data = json.load(file)

# Execute the query and retrieve the matching documents
matching_documents = collection.find(query)

output_array = {}
secrets_array = {}
for document in matching_documents:
    oid = document['id']
    try:
        if output_array[oid]:
            continue
    except:
        pass
    try:
        label = document['labels']['en']
    except:
        continue
    try:
        openSecrets = document['claims']['P4691'][0]['mainsnak']['datavalue']['value']
    except:
        try:
            openSecrets = []
            other_labels = document['aliases']["en"]
            other_labels.append(label)
            for new_label in other_labels:
                new_label_value = new_label["value"]
                try:
                    matched_label = list(filter(lambda element: new_label_value.lower() == element.lower(), data.keys()))[0]
                    if matched_label:
                        openSecrets.append(data[matched_label]['id'])
                except:
                    pass
        except:
            if len(openSecrets) == 0:
                openSecrets = "No OpenSecrets"

    try:
        website = document['claims']['P856'][0]['mainsnak']['datavalue']['value']
        output_object = { "website": website, "id": oid, "osid": openSecrets }
        output_array[oid] = output_object
        if type(openSecrets) == list:
            secrets_array[oid] = output_object
    except:
        pass

output_file_name_id = 'opensecretsid2.json'
with open(output_file_name_id, 'w') as file:
    json.dump(secrets_array, file, indent=4)

client.close()
