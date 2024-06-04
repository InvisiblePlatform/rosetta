import json
import os
import ssl
import sys
from pprint import pprint

from time import sleep

sys.path.append("..")
from common import (
    print_status,
    save_data_to_file,
    get_domain,
    addToIgnore,
    load_data_from_file,
)
import requests

seen_domains = set()


def sslGetCert(domain):
    if os.path.exists(f"entities/{domain}.json"):
        print(f"Skipping {domain} because it already exists")
        json_data = load_data_from_file(f"entities/{domain}.json")
        for entity in json_data["entities"]:
            seen_domains.add(entity)
        domain_data[domain] = json_data
        return
    else:
        request = requests.get(
            f"https://api.ssllabs.com/api/v3/analyze?host={domain}&all=done"
        )
        json_data = request.json()
        try:
            json_data["status"]
        except KeyError:
            pprint(json_data)
            if "errors" in json_data:
                if (
                    json_data["errors"][0]["message"]
                    == "Running at full capacity. Please try again later."
                ):
                    print(f"Sleeping for 360 seconds for {domain}")
                    sleep(120)
                    sslGetCert(domain)
                    return
                exit()

        if json_data["status"] != "READY":
            try:
                print(f"Error: {json_data['statusMessage']} for {domain}")
            except KeyError:
                print(f"Error: {json_data} for {domain}")

            if json_data["status"] == "IN_PROGRESS":
                try:
                    sleep_time = json_data["endpoints"][0]["eta"]
                    sleep(sleep_time + 5)
                    sslGetCert(domain)
                except KeyError:
                    print(json_data)
                    sleep(10)
                    sslGetCert(domain)
                return

            if json_data["statusMessage"] == "Resolving domain names":
                sleep(10)
                sslGetCert(domain)
                return

            if json_data["statusMessage"] == "Unable to resolve domain":
                addToIgnore(domain)
                return
            return

    this_domain_group = set()
    common_names = set()
    for cert in json_data["certs"]:
        if "commonNames" in cert:
            for common_name in cert["commonNames"]:
                this_domain_group.add(common_name)
                common_names.add(common_name)
        if "altNames" in cert:
            for alt_name in cert["altNames"]:
                this_domain_group.add(alt_name)

    this_domain_group.add(domain)

    print(f"Found {len(this_domain_group)} entities for {domain}")

    seen_domains.update(this_domain_group)
    domain_obj = {
        "domain": domain,
        "common_names": list(common_names),
        "entities": list(this_domain_group),
    }
    domain_data[domain] = domain_obj
    save_data_to_file(domain_obj, f"entities/{domain}.json")


def findSharedDomains():
    with open("../../websites.list", "r") as f:
        sites = f.readlines()
        shared_domains = set()
        for site in sites:
            site = site.strip()
            domain = get_domain(site, nottld=True)
            if domain in shared_domains:
                continue
            if domain in seen_domains:
                shared_domains.add(domain)
                continue
            if domain not in seen_domains:
                seen_domains.add(domain)

        domains_to_check = set()

        domain_array = {}
        for site in sites:
            site = site.strip()
            domain = get_domain(site, nottld=True)
            if domain not in shared_domains:
                continue
            if domain in shared_domains:
                full_domain = get_domain(site)
                if domain not in domain_array:
                    domain_array[domain] = [full_domain]
                else:
                    domain_array[domain].append(full_domain)
                domains_to_check.add(full_domain)

        slug_sites_array = {}
        for short, domain in domain_array.items():
            if domain[0] is None:
                continue
            shortest_item = min(domain, key=len)
            domain_obj = {"sites": domain, "canon": shortest_item}
            slug_sites_array[short] = domain_obj

        save_data_to_file(list(domains_to_check), "shared_domains.json")
        save_data_to_file(slug_sites_array, "slug_sites.json")
        return list(domains_to_check)


if __name__ == "__main__":
    domains = findSharedDomains()
    if not os.path.exists("entities"):
        os.makedirs("entities")

    seen_domains = set()
    domain_data = {}
    ignorelist = load_data_from_file("ignorefile.json")
    sslGetCert("eu.patagonia.com")
    for index, domain in enumerate(domains):
        if domain in ignorelist:
            print(f"Skipping {domain} because it is in the ignore list")
            continue
        if domain in seen_domains:
            print(f"Skipping {domain} because it is already seen")
            continue
        if len(domain.split(".")) < 3:
            print(f"Skipping {domain} because it is too little")
            continue
        print(f"Processing {index}/{len(domains)}: {domain}")
        sslGetCert(domain)
        sleep(5)
    exit()

    with open("../../websites.list", "r") as f:
        sites = f.readlines()

        for site in sites:
            site = site.strip()
            if site in seen_domains:
                print(f"Skipping {site}")
                continue
                sslGetCert(site)
            break
