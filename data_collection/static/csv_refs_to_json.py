import csv
import json
import argparse
import os
from pprint import pprint
from tld import get_tld

#Company Name,Transformation,Reference,Link
def csv_to_json(input_csv_file, column_label):
    json_data = {}

    try:
        with open(input_csv_file, 'r') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            for row in csv_reader:
                if column_label in row:
                    if row['Link']:
                        if row[column_label] not in json_data:
                            try:
                                site = get_tld(row['Link'], as_object=True).fld
                                json_data[row[column_label]] = [site]
                            except:
                                pass
                        else:
                            try:
                                site = get_tld(row['Link'], as_object=True).fld
                                if site not in json_data[row[column_label]]:
                                    json_data[row[column_label]].append(site)
                            except:
                                pass

        if json_data:
            # Convert the list of dictionaries to JSON format
            json_output = json.dumps(json_data, indent=4)
            return json_output
        else:
            return None

    except FileNotFoundError:
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert a CSV file to JSON using a specified column label as the key.")
    parser.add_argument("input_csv_file", help="Path to the input CSV file")
    parser.add_argument("column_label", help="Column label to use as the key")

    args = parser.parse_args()

    json_output = csv_to_json(args.input_csv_file, args.column_label)

    if json_output:
        output_json_file = os.path.splitext(args.input_csv_file)[0] + ".json"
        with open(output_json_file, 'w') as json_file:
            json_file.write(json_output)
        print(f"JSON data written to {output_json_file}")
    else:
        print("CSV file or column label not found or empty.")

