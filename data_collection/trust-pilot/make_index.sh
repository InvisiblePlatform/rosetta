#!/bin/bash

# Set the input and output directory
input_dir="sites"
output_file="merged_output.json"


# Function to update the progress bar
update_progress() {
  local current=$1
  local total=$2
  local percentage=$((current * 100 / total))
  local length=$((percentage / 2))
  printf "\r[%-${length}s] %d%%" $(printf "%-${length}s" "#" ) "$percentage"
}

# Get a list of JSON files in the input directory
json_files=("$input_dir"/*.json)
total_files="${#json_files[@]}"
current_file=0

echo "{" > "$output_file"

# Loop through the JSON files
for json_file in "${json_files[@]}"; do
  # Increment the current file count
  ((current_file++))

  # Update the progress bar
  update_progress "$current_file" "$total_files"


    # Process the JSON file with jq
    jq -c '. | { (.websiteUrl | sub("https?://"; "") | ltrimstr("www.") | sub("/.*$"; "") | sub("\\?.*$"; "")): { "websiteUrl": (.websiteUrl | sub("https?://"; "") | ltrimstr("www.") | sub("/.*$"; "") | sub("\\?.*$"; "")), "trustScore": .score.trustScore }}' "$json_file" | sed -e "s/^{//g;s/}$//g" >> "$output_file"
    
    # Add a comma if it's not the last file
    if [ "$current_file" -lt "$total_files" ]; then
      printf "," >> "$output_file"
    fi
done

# Complete the progress bar
update_progress "$total_files" "$total_files"
echo

# Enclose the merged JSON objects in curly braces
echo "}" >> "$output_file"

echo "Merged JSON data written to $output_file"

