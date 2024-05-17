from multiprocessing import process
import os
import json
from pprint import pprint
from telnetlib import EC
import zipfile
import requests
import shutil
import hashlib
import lxml.etree as lxEt
from tld import get_tld
from tld.exceptions import TldDomainNotFound

def download_and_extract():
    url = "https://github.com/EFForg/https-everywhere/archive/refs/heads/master.zip"
    with requests.get(url, stream=True) as r:
        with open("master.zip", 'wb') as f:
            shutil.copyfileobj(r.raw, f)

    with zipfile.ZipFile("master.zip", 'r') as zip_ref:
        zip_ref.extractall()

    if os.path.exists("rules"):
        shutil.rmtree("rules")
    os.rename("https-everywhere-master/src/chrome/content/rules", "rules")

def process_xml_to_hosts(filename):
    tree = lxEt.parse(os.path.join("rules", filename))
    root = tree.getroot()
    hosts = [rule.get("host") for rule in root.findall(".//target")]
    exceptions = [
        "1.1.1.1", "1.0.0.1"
    ]
    site_list = set()
    canon = ""
    for site in hosts:
        try:
            parsed_url = get_tld(site.replace("*.","").replace(".*",""), fix_protocol=True, as_object=True) 
            if parsed_url.subdomain in ["about", "shop", "m", "", "www"]:
                res = parsed_url.fld
            else:
                res = parsed_url.subdomain + "." + parsed_url.fld
        except Exception as e:
            print(e)
            print(site)
            if site in exceptions:
                res = site
                pass
            else:
                exit()
        if type(res) is str:
            domain = res
            if len(canon) > len(domain) or canon == "":
                canon = domain
            site_list.add(domain)
    
    return {"canon": canon, "sites": list(site_list)}
    

def generate_masterlist():
    master_data = {}
    seen_files = []
    os.makedirs("lists", exist_ok=True)
    #parser = lxEt.XMLParser(target=lxEt.TreeBuilder(insert_comments=True))
    with open("masterlist.csv", "w") as masterlist:
        for filename in os.listdir("rules"):
            if filename.endswith(".xml"):
                item = os.path.splitext(filename)[0]
                tree = lxEt.parse(os.path.join("rules", filename))
                root = tree.getroot()
                hosts = [rule.get("host") for rule in root.findall(".//target")]
                md5_hash = hashlib.md5(hosts[0].encode()).hexdigest()

                comments = root.getprevious()
                commentList= []
                if comments is not None:
                    for comment in comments.text.split("\t- "):
                        if comment.endswith(".xml\n\t"):
                            commentList.append(comment.replace("\n\t", ""))
                            seen_files.append(comment.replace("\n\t",""))
                

                with open(f"lists/{item}.list", "w") as list_file:
                    data = process_xml_to_hosts(filename)
                    site_list = set()
                    for site in data["sites"]:
                        site_list.add(site)

                    for file in commentList:
                        sub_data = process_xml_to_hosts(file)
                        for site in sub_data["sites"]:
                            site_list.add(site)
                    toremove = []
                    for site in site_list:
                        if site != data["canon"]:
                            if site.endswith(data["canon"]):
                                toremove.append(site)

                    for site in toremove:
                        site_list.remove(site)

                    master_data[md5_hash] = {
                        "sites": sorted(list(site_list)),
                        "canon": data["canon"],
                        "canonFile": item,
                        "filesincomment": commentList
                    }
                    list_file.seek(0)
                    list_file.write(f"{md5_hash},{hosts[0]}\n")
                masterlist.write(f"{item},{md5_hash}\n")
    return master_data

def remove_www_prefix(master_data):
    clean_data = {}
    exceptions = [
        "1.1.1.1", "1.0.0.1"
    ]
    if master_data:
        for hash, sites in master_data.items():
            site_list = set()
            canon = ""
            for site in sites["sites"]:

                try:
                    parsed_url = get_tld(site.replace("*.","").replace(".*",""), fix_protocol=True, as_object=True) 
                    if parsed_url.subdomain in ["about", "shop", "m", "", "www"]:
                        res = parsed_url.fld
                    else:
                        res = parsed_url.subdomain + "." + parsed_url.fld
                except Exception as e:
                    print(e)
                    print(site)
                    if site in exceptions:
                        res = site
                        pass
                    else:
                        exit()
                if type(res) is str:
                    domain = res
                    if len(canon) > len(domain) or canon == "":
                        canon = domain
                    site_list.add(domain)

            clean_data[hash] = {
                "sites": list(site_list),
                "canon": canon
            }
    return clean_data

if __name__ == "__main__":
    # download_and_extract()
    master_data = generate_masterlist()
    #clean_data = remove_www_prefix(master_data)
    if master_data:
        with open("slug_site.json", "w") as indexfile:
            json.dump(master_data, indexfile, indent=4)

    #os.remove("master.zip")
    #shutil.rmtree("https-everywhere-master")
