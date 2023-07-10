import json
from pymongo import MongoClient
import sys
from pprint import pprint

graph_pairings = [
    {"id":"P1037","in":"Directed_By","out":"Director_of"},
    {"id":"P1040","in":"Film_Editor","out":"Film_Editor_of"},
    {"id":"P112","in":"Founded_by","out":"Founder_of"},
    {"id":"P123","in":"Published_by","out":"Publisher_of"},
    {"id":"P127","in":"Owned_by","out":"Owner_of" },
    {"id":"P1431","in":"Executive_Producer","out":"Executive_Producer_of"},
    {"id":"P162","in":"Produced_by","out":"Producer_of"},
    {"id":"P170","in":"Created_by","out":"Creator_of"},
    {"id":"P1951","in":"Invested_in_by","out":"Invested_in"},
    {"id":"P2554","in":"Production_Designer","out":"Production_Designer_of"},
    {"id":"P2652","in":"Division","out":"Division_of"},
    {"id":"P2652","in":"Partnered_with","out":"Partnered_with"},
    {"id":"P286","in":"Head_coach","out":"Head_coach_of"},
    {"id":"P3320","in":"Board_Member","out":"Board_Member_of"},
    {"id":"P355","in":"Subsidary","out":"Subsidary_of"},
    {"id":"P371","in":"Presented_by","out":"Presentor_of"},
    {"id":"P488","in":"Chaired_by","out":"Chairperson_of"},
    {"id":"P50","in":"Authored_by","out":"Author_of"},
    {"id":"P5769","in":"Editor-in-chief","out":"Editor-in-chief_of"},
    {"id":"P749","in":"Parent_Company","out":"Parent_Company_of"},
    {"id":"P749","in":"Parent_organisation_of","out":"Parent_organisation"},
    {"id":"P8324","in":"Funded_by","out":"Funder_of"},
    {"id":"P98","in":"Edited_By","out":"Editor_of"},
]

pairing_id_out_list = {pair["id"]: pair["out"] for pair in graph_pairings}
pairing_id_list = set([pair["id"] for pair in graph_pairings])

def do_node(ids, collection):
    nodes = collection.find({
    "id": {"$in": ids}
}, {
    "sitelinks": {
        "eswiki": {"title": 1}, "enwiki": {"title": 1}, "zhwiki": {"title": 1},
        "eowiki": {"title": 1}, "arwiki": {"title": 1}, "frwiki": {"title": 1},
        "dewiki": {"title": 1}, "hiwiki": {"title": 1}
    },
    "labels": {
        "es": {"value":1}, "en": {"value":1}, "zh": {"value":1}, "eo": {"value":1},
        "ar": {"value":1}, "fr": {"value":1}, "de": {"value":1}, "hi": {"value":1}
    },
    "claims": {
        "P1037": {"mainsnak.datavalue.value.id": 1}, "P1040": {"mainsnak.datavalue.value.id": 1},
        "P112":  {"mainsnak.datavalue.value.id": 1}, "P123":  {"mainsnak.datavalue.value.id": 1},
        "P127":  {"mainsnak.datavalue.value.id": 1}, "P1431": {"mainsnak.datavalue.value.id": 1},
        "P162":  {"mainsnak.datavalue.value.id": 1}, "P170":  {"mainsnak.datavalue.value.id": 1},
        "P1951": {"mainsnak.datavalue.value.id": 1}, "P2554": {"mainsnak.datavalue.value.id": 1},
        "P2652": {"mainsnak.datavalue.value.id": 1}, "P286":  {"mainsnak.datavalue.value.id": 1},
        "P31":   {"mainsnak.datavalue.value.id": 1}, "P3320": {"mainsnak.datavalue.value.id": 1},
        "P355":  {"mainsnak.datavalue.value.id": 1}, "P371":  {"mainsnak.datavalue.value.id": 1},
        "P488":  {"mainsnak.datavalue.value.id": 1}, "P50":   {"mainsnak.datavalue.value.id": 1},
        "P5769": {"mainsnak.datavalue.value.id": 1}, "P749": {"mainsnak.datavalue.value.id": 1},
        "P8324": {"mainsnak.datavalue.value.id": 1}, "P98":   {"mainsnak.datavalue.value.id": 1},
    },
    "id": 1, "_id":0})
    outnodes=[]
    outlinks=[]
    nodelist=[]
    new_nodes = [node for node in nodes if node not in nodelist]
    for node in new_nodes:
        check_list = set(node['claims'].keys()).intersection(pairing_id_list)
        for pair in check_list:
            for claim in [claim for claim in node['claims'][pair] if "datavalue" in claim['mainsnak']]:
                outlinks.append({
                    "target": claim['mainsnak']['datavalue']['value']['id'],
                    "source": node['id'],
                    "type": pairing_id_out_list[pair],
                })
        try:
            node_groups = [node_in["mainsnak"]["datavalue"]["value"]["id"] for node_in in node['claims']['P31']]
        except:
            node_groups = []
        nodelist.append(node["id"])
        nullname = node["labels"]["en"]["value"] if "en" in node["labels"] else "null"
        outnodes.append({
                "id": node["id"],
                "label":   nullname,
                "eslabel": node["labels"]["es"]["value"] if "es" in node["labels"] else nullname,
                "zhlabel": node["labels"]["zh"]["value"] if "zh" in node["labels"] else nullname,
                "hilabel": node["labels"]["hi"]["value"] if "hi" in node["labels"] else nullname,
                "eolabel": node["labels"]["eo"]["value"] if "eo" in node["labels"] else nullname,
                "arlabel": node["labels"]["ar"]["value"] if "ar" in node["labels"] else nullname,
                "frlabel": node["labels"]["fr"]["value"] if "fr" in node["labels"] else nullname,
                "delabel": node["labels"]["de"]["value"] if "de" in node["labels"] else nullname,
                "enwiki": node["sitelinks"]["enwiki"]["title"] if "enwiki" in node["sitelinks"] else "null", 
                "eswiki": node["sitelinks"]["eswiki"]["title"] if "eswiki" in node["sitelinks"] else "null", 
                "zhwiki": node["sitelinks"]["zhwiki"]["title"] if "zhwiki" in node["sitelinks"] else "null", 
                "hiwiki": node["sitelinks"]["hiwiki"]["title"] if "hiwiki" in node["sitelinks"] else "null", 
                "eowiki": node["sitelinks"]["eowiki"]["title"] if "eowiki" in node["sitelinks"] else "null", 
                "arwiki": node["sitelinks"]["arwiki"]["title"] if "arwiki" in node["sitelinks"] else "null", 
                "frwiki": node["sitelinks"]["frwiki"]["title"] if "frwiki" in node["sitelinks"] else "null", 
                "dewiki": node["sitelinks"]["dewiki"]["title"] if "dewiki" in node["sitelinks"] else "null", 
                "groups": node_groups
        })

    return {"nodes": outnodes, "links": outlinks}

def set_client():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['rop']
    collection = db['wikidata']
    return collection

def do_graph(main_node, file_out=None, collection=None):
    if collection is None:
        collection = set_client()
    node_depth = 4
    gnodes = []
    links = []
    oldids = set(main_node)
    node_one = do_node(main_node, collection)
    gnodes.extend(node_one["nodes"])
    links.extend(node_one["links"])
    ids = set(main_node)
    for i in range(node_depth):
        oldids = set(node["id"] for node in gnodes)
        ids = set(link["target"] for link in links)
        newids = list(ids.difference(oldids))
        newnode = do_node(newids, collection)
        gnodes.extend(newnode["nodes"])
        links.extend(newnode["links"])
    nodes = gnodes
    graph = {
        "nodes": nodes,
        "links": links
    }
    if file_out:
        with open(file_out, "w") as f:
            json.dump(graph, f, indent=4)
    else:
        pprint(len(graph["links"]))
    return graph

if __name__ == "__main__":
    do_graph(["Q118398"])
    #do_graph(["Q355", "Q380"])
