#!/bin/bash

# Set the directory where JSON files are located
json_dir="sites"

# # Iterate through JSON files in the directory
# for json_file in "$json_dir"/*.json; do
#   # Check if the JSON file contains ".name" field with the value "ApplicationError"
#   if jq -e '.errorCode > 0' "$json_file" > /dev/null; then
#     # If the condition is met, remove the file
#     rm -f "$json_file"
#     printf '%s\n' "Removed $json_file"
#     # else
#     #  jq . $json_file
#   fi
# done
# 
# echo "Deletion of JSON files with '.name' as 'ApplicationError' completed."
# 
mapfile -t files_to_delete < <(rg -l "errorCode" "$json_dir")

# Iterate over the array of files and delete them
for file in "${files_to_delete[@]}"; do
  rm -f "$file"
  printf "%s\n" "Deleted: $file"
done

echo "Deletion of files containing 'errorCode' completed."
