from pymongo import MongoClient
import json

client = MongoClient('mongodb://localhost:27017/')
db = client['rop']
collection = db['wikidata']
idn = "Q186068"
query = {
    'id': idn
}

document = collection.find_one(query)
output_file_name_id = f"{idn}.json"
document["_id"] = None
with open(output_file_name_id, 'w') as file:
    json.dump(document, file, indent=4)
client.close()
