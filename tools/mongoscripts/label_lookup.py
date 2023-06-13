import json
import sys
from pymongo import MongoClient
# Replace 'mongodb://localhost:27017/' with your MongoDB connection string
client = MongoClient('mongodb://localhost:27017/')
# Replace 'mydatabase' with the name of your database
# Replace 'mycollection' with the name of your collection
db = client['rop']
collection = db['wikidata']

# Define the query to retrieve documents with 'mainsnak.datavalue' and 'label' fields
query = {}


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

# Process the retrieved documents
for document in matching_documents:
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
            print(output_object)
    except:
        pass

output_file_name_id = 'opensecretsid.json'
with open(output_file_name_id, 'w') as file:
    json.dump(secrets_array, file, indent=4)


# Close the MongoDB connection
client.close()
