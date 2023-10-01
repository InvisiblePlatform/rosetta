import json
import hashlib
import csv


with open('./website_hash.csv', 'w') as csvfile:
    csvwriter = csv.writer(csvfile)
    with open('./entity_map.json', 'r') as f:
        data = json.load(f)
        for i in data:
            result = hashlib.md5(data[i]['properties'][0].encode())
            for x in data[i]['properties']:
                csvwriter.writerow([ x, result.hexdigest()])

