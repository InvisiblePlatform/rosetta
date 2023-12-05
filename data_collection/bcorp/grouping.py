import json
from pprint import pprint
import urllib.parse

def group_keys_to_sum(data, max_sum):
    keys = list(data.keys())
    groups = []
    current_group = []
    current_sum = 0

    for key in keys:
        value = data[key]
        if current_sum + value <= max_sum:
            current_group.append(key)
            current_sum += value
        else:
            groups.append(current_group)
            current_group = [key]
            current_sum = value

    if current_group:
        groups.append(current_group)

    return groups

def main(input_file):
    try:
        with open(input_file, 'r') as file:
            json_data = json.load(file)
    except FileNotFoundError:
        print(f"File '{input_file}' not found.")
        return
    except json.JSONDecodeError:
        print(f"Invalid JSON format in '{input_file}'.")
        return

    max_sum = 500
    key_groups = group_keys_to_sum(json_data, max_sum)

    encoded_strings = []

    for group in key_groups:
        added_groups = [[f"industry:{key}" for key in group]]
        stringitem = json.dumps(added_groups, separators=(',', ':'))
        encoded_data = urllib.parse.quote(stringitem)
        encoded_strings.append(encoded_data)

    with open("facet.list", 'w') as f:
        f.write("\n".join(encoded_strings))


if __name__ == "__main__":
    input_file = "industries.json"  # Replace with your JSON file's path
    main(input_file)

