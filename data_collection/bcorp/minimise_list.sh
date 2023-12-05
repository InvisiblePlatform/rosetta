#!/bin/bash

input_file="combined_data.json"
output_file="output_data.json"

#jq -c '.[] | {(.website | ltrimstr("www.") | sub("/.*$"; "")): {name: .name, latestVerifiedScore: .latestVerifiedScore}}' "$input_file" > "$output_file"
jq -r 'map({(.website | ltrimstr("www.") | sub("/.*$";"")): {name: .name, latestVerifiedScore: .latestVerifiedScore, slug: .slug}}) | add' "$input_file" > "$output_file"


jq . $output_file
