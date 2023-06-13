import json
import sys
import csv
from pymongo import MongoClient
# Replace 'mongodb://localhost:27017/' with your MongoDB connection string
client = MongoClient('mongodb://localhost:27017/')
# Replace 'mydatabase' with the name of your database
# Replace 'mycollection' with the name of your collection
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

print(main_node)
print(len(main_node))


# Define the query to retrieve documents with 'mainsnak.datavalue' and 'label' fields
query = { 'id': {'$in': main_node }}
# {
#     'mainsnak.datavalue': 1,
#     'label': 1
# }

file_name = '/home/orange/Projects/invisible-rosetta/IVDataIngestion/opensecrets/transformed.json'
with open(file_name, 'r', encoding="utf8", errors='ignore') as file:
    data = json.load(file)

# Execute the query and retrieve the matching documents
matching_documents = collection.find(query)

output_array = {}
secrets_array = {}
count = 0
# Process the retrieved documents
for document in matching_documents:
    count += 1
    oid = document['id']
    try:
        if output_array[oid]:
            continue
    except:
        pass
    try:
        label = document['labels']['en']['value']
    except:
        continue
    try:
        openSecrets = document['claims']['P4691'][0]['mainsnak']['datavalue']['value']
    except:
        try:
            matched_label = list(filter(lambda element: label.lower() == element.lower(), data.keys()))[0]
            openSecrets = data[matched_label]['id']
        except:
            openSecrets = "No OpenSecrets"

    try:
        website = document['claims']['P856'][0]['mainsnak']['datavalue']['value']
        output_object = { "website": website, "id": oid, "osid": openSecrets }
        output_array[oid] = output_object
        if "D" in openSecrets:
            secrets_array[oid] = output_object
            print(output_object, count)
    except:
        pass

output_file_name_id = 'opensecretsid1.json'
with open(output_file_name_id, 'w') as file:
    json.dump(secrets_array, file, indent=4)


# Close the MongoDB connection
client.close()
