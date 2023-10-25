#!/bin/bash

# Get the total number of JSON files in the "entries/" directory
total_files=$(find entries/ -type f -name "*.json" | wc -l)
current_file=0

# Initialize an empty JSON object
echo "{" > ratings-index.json

# Function to update the progress bar
update_progress() {
    current_file=$((current_file + 1))
    percentage=$((current_file * 100 / total_files))
    printf "Progress: [%-50s] %d%% (%d/%d)\r" "$(< /dev/urandom tr -dc '|#' | head -c 25)" "$percentage" "$current_file" "$total_files"
}

# Iterate through all JSON files in the "entries/" directory
for file in entries/*.json; do
    # Check if the file exists and is readable
    if [ -r "$file" ]; then
        # Extract the "domain" value from the JSON file
        domain=$(jq -r '.domain' "$file")
        # Check if the "domain" value is not empty
        if [ -n "$domain" ]; then
            # Add the object to the "ratings-index.json" file
            echo "\"$domain\": $(jq '.' "$file")," >> ratings-index.json
        fi
    fi
    update_progress
done

# Remove the trailing comma from the last line
sed -i '$ s/,$//' ratings-index.json

# Close the JSON object
echo "}" >> ratings-index.json

# Print a newline character to clear the progress bar
echo

echo "Completed! ratings-index.json has been created."

