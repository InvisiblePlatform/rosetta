import os
from pprint import pprint
import yaml
import json
import concurrent.futures
from tqdm import tqdm
result_dict = {}

# Function to process a single Markdown file
def process_md_file(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()
        yaml_lines = []
        # Extract YAML frontmatter
        for line in lines:
            if line.strip() == '---':
                continue
            if line.strip() == '':
                continue
            yaml_lines.append(line)
        yaml_content = ''.join(yaml_lines)
        # Parse YAML
        yaml_data = yaml.safe_load(yaml_content)
        # Extract core data
        core_data = yaml_data.get('core', [])
        if len(core_data) > 0:
            # Update result_dict
            for item in core_data:
                url = item.get('url', '')
                if url:
                    # Remove ".json" from the URL
                    url = url.replace('.json', '')
                    # pprint(url)
                    result_dict[url] = item.get('type', '')
                    if item.get("type",'') == 'wbm':
                        idNo = url.replace("wbm/",'')
                        with open(f'../data_collection/static/entities/{idNo}.json', 'r') as f:
                            data = json.load(f)
                            for index, item in data["modules"].items():
                                submodule = "-".join(item["file"].split("_")[1:]).lower()
                                result_dict[f'{url}-{submodule}'] = "wbm"

# Function to process all Markdown files in a directory in parallel
def process_md_directory_parallel(directory_path):
    md_files = [os.path.join(directory_path, filename) for filename in os.listdir(directory_path) if filename.endswith('.md')]
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Map process_md_file to each Markdown file
        futures = {executor.submit(process_md_file, file): file for file in md_files}
        # Display progress bar
        for future in tqdm(concurrent.futures.as_completed(futures), total=len(futures)):
            pass

# Main function
def main():
    directory_path = '../hugo/content/db/'
    process_md_directory_parallel(directory_path)
    # Output result_dict as JSON
    with open('../master_list.json', 'w') as json_file:
        json.dump(result_dict, json_file, indent=4)

if __name__ == "__main__":
    main()

