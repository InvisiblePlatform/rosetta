import json
import os
import requests
import pandas as pd
from pprint import pprint

index_file = "./20240224_lobbyfacts_fetched_index.json"

def fetch_and_convert(json_file):
    # Load JSON file
    with open(json_file, 'r') as f:
        data = json.load(f)

    total_rows = len(data)
    count = 0
    # Iterate through each object in JSON
    for key, value  in data.items():
        count += 1
        identification_code = value.get("Identification code")
        if identification_code:
            if os.path.exists(f"json_data/{identification_code}.json"):
                #print(f"Already downloaded: {identification_code}")
                continue
            else:
                url = f"https://www.lobbyfacts.eu/csv_export/{identification_code}"
                response = requests.get(url)

                # Check if the request was successful
                if response.status_code == 200:
                    # Convert CSV to JSON
                    csv_data = pd.read_csv(url)
                    csv_data.replace({'https:[^?]*\?rid=[0-9-]*&sid=': ''}, regex=True, inplace=True)
                    try:
                        json_data = csv_data.set_index('state_date').to_dict(orient='index')
                    except ValueError:
                        print(f"multiple rows with same state_date {identification_code}")
                        grouped_data = csv_data.groupby('state_date')['url'].apply(list).reset_index(name='state_date_url')

                        # Need to filterout the earlier versions of that
                        # duplicate rows, maybe should do the whole things with
                        # sids but c'est la vie
                        for i, data in grouped_data['state_date_url'].items():
                            if len(data) > 1:
                                highest_sid = (data[-1])
                                remove_set = set(data)
                                remove_set.remove(highest_sid)
                                for sid in remove_set:
                                    csv_data.drop(csv_data[csv_data.url == sid].index, inplace=True)
                        json_data = csv_data.set_index('state_date').to_dict(orient='index')

                    json_filename = f"json_data/{identification_code}.json"
                    with open(json_filename, 'w') as json_file:
                        json.dump(json_data, json_file, indent=4)
                    print(f"Successfully fetched and converted: {json_filename}, {count}/{total_rows}")


                    # sleep(0.5) # Rate limiting 
                else:
                    print(f"Failed to fetch data for identification code: {identification_code}")
                    exit()

fetch_and_convert(index_file)  # Replace "data.json" with your JSON file name

