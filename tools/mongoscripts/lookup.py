from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['rop']
collection = db['wikidata']
query = {
    'id': 'Q355'
}

document = collection.find_one(query)

print(document)
client.close()
