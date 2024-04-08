import json
from pprint import pprint

# Step 1: Read the contents of both JSON files
with open("../../rosetta/hashtosite.json", "r") as f1:
    hashtosite_data = json.load(f1)

with open("top10mil-2col.json", "r") as f2:
    top10mil_data = json.load(f2)

# Step 2: Create a dictionary with hashes as keys and empty lists as values
result = {hash_key: {"domains": domains} for hash_key, domains in hashtosite_data.items()}

# Step 3: Iterate over domains, find corresponding rank, and update the result dictionary
for hash_key, domain_info in result.items():
    domains = domain_info["domains"]
    canonical_domain = None
    canonical_rank = float('inf')  # Initialize with infinity for comparison
    for domain in domains:
        if domain in top10mil_data:
            rank = float(top10mil_data[domain])
            if rank < canonical_rank:
                canonical_domain = domain
                canonical_rank = rank
    if canonical_domain:
        domain_info["canonical_domain"] = canonical_domain
        domain_info["canonical_rank"] = int(canonical_rank)
        pprint(domain_info)

# Step 4: Write the result dictionary to a new JSON file
with open("canon_hashtosite.json", "w") as f3:
    json.dump(result, f3, indent=4)
