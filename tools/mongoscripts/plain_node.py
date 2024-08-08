import json
from pymongo import MongoClient
from typing import Optional, List, Dict, Any
from pprint import pprint
import csv
import sys

sys.path.append(".")
from data_collection.common import get_domain


rootdir = "data_collection"
WDLOOKUP = f"{rootdir}/wikidata/website_id_list.csv"
wikidata_array = {}


# Process Wikidata lookup file
with open(WDLOOKUP, "r") as f:
    wikidata_file = csv.reader(f)
    for i in wikidata_file:
        domain = get_domain("http://" + i[0])
        wikidata_array.setdefault(i[1], []).append(domain)

graph_pairings = [
    # {"id": "P199", "in": "Division", "out": "Division_of"},
    # {"id": "P31", "in": "Instance_of", "out": "Has_Instance"},
    # {"id": "P361", "in": "Part_of", "out": "Has_Part"},
    # {"id": "P463", "in": "Member_of", "out": "Has_Member"},
    # {"id": "P527", "in": "Has_Part", "out": "Part_of"},
    # {"id": "P1433", "in": "Published_in", "out": "Contains"},
    {"id": "P1037", "in": "Directed_By", "out": "Director_of"},
    {"id": "P1040", "in": "Film_Editor", "out": "Film_Editor_of"},
    {"id": "P112", "in": "Founded_by", "out": "Founder_of"},
    {"id": "P123", "in": "Published_by", "out": "Publisher_of"},
    {"id": "P127", "in": "Owned_by", "out": "Owner_of"},
    {"id": "P1431", "in": "Executive_Producer", "out": "Executive_Producer_of"},
    {"id": "P162", "in": "Produced_by", "out": "Producer_of"},
    {"id": "P169", "in": "Chief_Executive_Officer", "out": "Chief_Executive_Officer"},
    {"id": "P170", "in": "Created_by", "out": "Creator_of"},
    {"id": "P1951", "in": "Invested_in_by", "out": "Invested_in"},
    {"id": "P2554", "in": "Production_Designer", "out": "Production_Designer_of"},
    {"id": "P2652", "in": "Partnered_with", "out": "Partnered_with"},
    {"id": "P286", "in": "Head_coach", "out": "Head_coach_of"},
    {"id": "P3320", "in": "Board_Member", "out": "Board_Member_of"},
    {"id": "P355", "in": "Subsidary", "out": "Subsidary_of"},
    {"id": "P371", "in": "Presented_by", "out": "Presentor_of"},
    {"id": "P488", "in": "Chaired_by", "out": "Chairperson_of"},
    {"id": "P50", "in": "Authored_by", "out": "Author_of"},
    {"id": "P5769", "in": "Editor-in-chief", "out": "Editor-in-chief_of"},
    {"id": "P749", "in": "Parent_organisation_of", "out": "Parent_organisation"},
    {"id": "P8324", "in": "Funded_by", "out": "Funder_of"},
    {"id": "P8402", "in": "Open_data_portal_for", "out": "Open_data_portal_of"},
    {"id": "P859", "in": "Sponsered_By", "out": "Sponser_of"},
    {"id": "P98", "in": "Edited_By", "out": "Editor_of"},
]

label_array = ["es", "en", "zh", "eo", "ar", "fr", "de", "hi", "ca"]
wiki_array = [f"{lang}wiki" for lang in label_array]

pairing_id_out_list = {pair["id"]: pair["out"] for pair in graph_pairings}
pairing_id_list = set([pair["id"] for pair in graph_pairings])

skip_groups = ["Q13442814", "Q108095628", "Q93204", "Q196600", "Q1186399", "Q5398426"]
single_groups = [
    ["Q591041"],
    ["Q2352616"],
    ["Q732577"],
    ["Q1266946"],
    ["Q7725634"],
]


def do_node(ids, collection, person=False, organisation=False) -> dict[str, list[Any]]:
    personLookup = {
        "$or": [
            {"id": {"$in": ids}},
            # {"claims.P1037.mainsnak.datavalue.value.id": {"$in": ids}}, # Directed By
            # {"claims.P1040.mainsnak.datavalue.value.id": {"$in": ids}}, # Film Editor
            {"claims.P112.mainsnak.datavalue.value.id": {"$in": ids}},  # Founded By
            # {"claims.P123.mainsnak.datavalue.value.id": {"$in": ids}}, # Published By
            # {"claims.P127.mainsnak.datavalue.value.id": {"$in": ids}}, # Owned By
            # {"claims.P1431.mainsnak.datavalue.value.id": {"$in": ids}}, # Executive Producer
            # {"claims.P162.mainsnak.datavalue.value.id": {"$in": ids}}, # Produced By
            # {"claims.P170.mainsnak.datavalue.value.id": {"$in": ids}}, # Created By
            # {"claims.P1951.mainsnak.datavalue.value.id": {"$in": ids}}, # Invested In By
            # {"claims.P2554.mainsnak.datavalue.value.id": {"$in": ids}}, # Production Designer
            # {"claims.P2652.mainsnak.datavalue.value.id": {"$in": ids}}, # Partnered With
            {"claims.P286.mainsnak.datavalue.value.id": {"$in": ids}},  # Head Coach
            {"claims.P3320.mainsnak.datavalue.value.id": {"$in": ids}},  # Board Member
            # {"claims.P355.mainsnak.datavalue.value.id": {"$in": ids}}, # Subsidary
            # {"claims.P371.mainsnak.datavalue.value.id": {"$in": ids}},  # Presented By
            {"claims.P488.mainsnak.datavalue.value.id": {"$in": ids}},  # Chaired By
            # {"claims.P50.mainsnak.datavalue.value.id": {"$in": ids}}, # Authored By
            {"claims.P5769.mainsnak.datavalue.value.id": {"$in": ids}},  # EditorNchief
            # {"claims.P749.mainsnak.datavalue.value.id": {"$in": ids}}, # Parent organisation of
            # {"claims.P8324.mainsnak.datavalue.value.id": {"$in": ids}}, # Funded By
            # {"claims.P856.mainsnak.datavalue.value.id": {"$in": ids}},  # Website
            # {"claims.P859.mainsnak.datavalue.value.id": {"$in": ids}}, # Sponsered By
            # {"claims.P98.mainsnak.datavalue.value.id": {"$in": ids}}, # Edited By
        ]
    }

    defaultLookup = {
        "id": {"$in": ids},
    }

    organisationLookup = {
        "$or": [
            {"id": {"$in": ids}},
            # {"claims.P1037.mainsnak.datavalue.value.id": {"$in": ids}}, # Directed By
            # {"claims.P1040.mainsnak.datavalue.value.id": {"$in": ids}}, # Film Editor
            {"claims.P112.mainsnak.datavalue.value.id": {"$in": ids}},  # Founded By
            # {"claims.P123.mainsnak.datavalue.value.id": {"$in": ids}},  # Published By
            {"claims.P127.mainsnak.datavalue.value.id": {"$in": ids}},  # Owned By
            # {"claims.P1431.mainsnak.datavalue.value.id": {"$in": ids}}, # Executive Producer
            # {"claims.P162.mainsnak.datavalue.value.id": {"$in": ids}},  # Produced By
            # {"claims.P170.mainsnak.datavalue.value.id": {"$in": ids}},  # Created By
            {"claims.P1951.mainsnak.datavalue.value.id": {"$in": ids}},  # Invested In
            # {"claims.P2554.mainsnak.datavalue.value.id": {"$in": ids}},  # Production Designer
            # {"claims.P2652.mainsnak.datavalue.value.id": {"$in": ids}},  # Partnered With
            # {"claims.P286.mainsnak.datavalue.value.id": {"$in": ids}},  # Head Coach
            # {"claims.P3320.mainsnak.datavalue.value.id": {"$in": ids}},  # Board Member
            {"claims.P355.mainsnak.datavalue.value.id": {"$in": ids}},  # Subsidary
            # {"claims.P371.mainsnak.datavalue.value.id": {"$in": ids}},  # Presented By
            # {"claims.P488.mainsnak.datavalue.value.id": {"$in": ids}},  # Chaired By
            # {"claims.P50.mainsnak.datavalue.value.id": {"$in": ids}},  # Authored By
            # {"claims.P5769.mainsnak.datavalue.value.id": {"$in": ids}},  # EditorNchief
            {"claims.P749.mainsnak.datavalue.value.id": {"$in": ids}},  # Parent orgof
            {"claims.P8324.mainsnak.datavalue.value.id": {"$in": ids}},  # Funded By
            # {"claims.P856.mainsnak.datavalue.value.id": {"$in": ids}},  # Website
            {"claims.P8402.mainsnak.datavalue.value.id": {"$in": ids}},  # Opendata
            {"claims.P859.mainsnak.datavalue.value.id": {"$in": ids}},  # Sponsered By
            {"claims.P98.mainsnak.datavalue.value.id": {"$in": ids}},  # Edited By
        ]
    }

    if person:
        lookup = personLookup
    elif organisation:
        lookup = organisationLookup
    else:
        lookup = defaultLookup
    nodes = collection.find(
        lookup,
        {
            "sitelinks": {
                "eswiki": {"title": 1},
                "enwiki": {"title": 1},
                "zhwiki": {"title": 1},
                "eowiki": {"title": 1},
                "arwiki": {"title": 1},
                "frwiki": {"title": 1},
                "dewiki": {"title": 1},
                "hiwiki": {"title": 1},
                "cawiki": {"title": 1},
            },
            "labels": {
                "es": {"value": 1},
                "en": {"value": 1},
                "zh": {"value": 1},
                "eo": {"value": 1},
                "ar": {"value": 1},
                "fr": {"value": 1},
                "de": {"value": 1},
                "hi": {"value": 1},
                "ca": {"value": 1},
            },
            "claims": {
                "P169": {"mainsnak.datavalue.value.id": 1},
                "P1037": {"mainsnak.datavalue.value.id": 1},
                "P1040": {"mainsnak.datavalue.value.id": 1},
                "P112": {"mainsnak.datavalue.value.id": 1},
                "P123": {"mainsnak.datavalue.value.id": 1},
                "P127": {"mainsnak.datavalue.value.id": 1},
                "P1431": {"mainsnak.datavalue.value.id": 1},
                "P162": {"mainsnak.datavalue.value.id": 1},
                "P170": {"mainsnak.datavalue.value.id": 1},
                "P1951": {"mainsnak.datavalue.value.id": 1},
                "P2554": {"mainsnak.datavalue.value.id": 1},
                "P2652": {"mainsnak.datavalue.value.id": 1},
                "P286": {"mainsnak.datavalue.value.id": 1},
                "P31": {"mainsnak.datavalue.value.id": 1},
                "P3320": {"mainsnak.datavalue.value.id": 1},
                "P355": {"mainsnak.datavalue.value.id": 1},
                "P371": {"mainsnak.datavalue.value.id": 1},
                "P488": {"mainsnak.datavalue.value.id": 1},
                "P50": {"mainsnak.datavalue.value.id": 1},
                "P5769": {"mainsnak.datavalue.value.id": 1},
                "P859": {"mainsnak.datavalue.value.id": 1},
                "P856": {"mainsnak.datavalue.value": 1},
                "P749": {"mainsnak.datavalue.value.id": 1},
                "P8324": {"mainsnak.datavalue.value.id": 1},
                "P8402": {"mainsnak.datavalue.value.id": 1},
                "P98": {"mainsnak.datavalue.value.id": 1},
            },
            "id": 1,
            "_id": 0,
        },
    )
    outnodes = []
    outlinks = []
    nodeIds = []
    nodelist = []

    for node in nodes:
        check_list = set(node["claims"].keys()).intersection(pairing_id_list)
        links_to_add = []
        for pair in check_list:
            for claim in [
                claim
                for claim in node["claims"][pair]
                if "datavalue" in claim["mainsnak"]
            ]:
                links_to_add.append(
                    {
                        "target": claim["mainsnak"]["datavalue"]["value"]["id"],
                        "source": node["id"],
                        "type": pairing_id_out_list[pair],
                    }
                )
        try:
            node_groups = [
                node_in["mainsnak"]["datavalue"]["value"]["id"]
                for node_in in node["claims"]["P31"]
            ]
        except:
            node_groups = []

        if node_groups in single_groups:
            continue
        if any(group in node_groups for group in skip_groups):
            continue

        nullname = node.get("labels", {"en": {"value": "null"}}).get(
            "en", {"value": "null"}
        )["value"]
        nullwiki = node.get("sitelinks", {"enwiki": {"title": "null"}}).get(
            "enwiki", {"title": "null"}
        )["title"]
        defSite = wikidata_array.get(node["id"], [None])[0]
        sitelinks = node.get("sitelinks", {}).keys()
        # sitelinks = wikidata_array.get("sitelinks", {}).keys()
        wikiLinks = {
            wiki: node["sitelinks"][wiki]["title"]
            for wiki in wiki_array
            if wiki in sitelinks
            and (node["sitelinks"][wiki]["title"] != nullwiki or wiki == "enwiki")
        }
        labels = {
            lang: node["labels"][lang]["value"]
            for lang in label_array
            if lang in node["labels"]
            and (node["labels"][lang]["value"] != nullname or lang == "en")
        }
        defSiteObj = defSite.replace(".", "") if defSite else "null"

        if len(wikiLinks) == 0 and defSiteObj == "null":
            continue

        outlinks.extend(links_to_add)
        nodelist.append(node["id"])
        websites = (
            list(
                set(
                    [
                        get_domain(
                            website.get("mainsnak", {})
                            .get("datavalue", {})
                            .get("value", {}),
                            noDot=True,
                        )
                        for website in node["claims"]["P856"]
                    ]
                )
            )
            if (node.get("claims", {}).get("P856", None) is not None)
            else None
        )
        if websites:
            newWebsites = []
            for website in websites:
                if website is not None:
                    newWebsites.append(website)

            if len(newWebsites) > 0:
                websites = newWebsites
            else:
                websites = None

        if websites is not None:
            if defSiteObj == "null":
                defSiteObj = websites[0]
            if defSiteObj not in websites:
                # Take sortest domain as default
                websites.sort(key=lambda x: len(x))
                websites.append(defSiteObj)
                defSiteObj = websites[0]

        outnodes.append(
            {
                "id": node["id"],
                "label": nullname,
                "defSite": defSiteObj,
                "website": websites,
                "labels": labels,
                "wiki": wikiLinks,
                "groups": node_groups,
            }
        )
    return {"nodes": outnodes, "links": outlinks}


def set_client():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["rop"]
    collection = db["wikidata"]
    return collection


def do_graph(
    main_node: Optional[List[str]] = None,
    file_out: Optional[str] = None,
    collection: Optional[Any] = None,
    node_depth: int = 2,
    silent: bool = False,
    skip_to_fancy: bool = False,
) -> Dict[str, Any] | bool:
    """
    Generate a graph based on the given main_node and collection.

    Args:
        main_node (List[str], optional): The main node to start the graph from. Defaults to None.
        file_out (str, optional): The output file path to save the graph. Defaults to None.
        collection (Any, optional): The MongoDB collection to query. Defaults to None.
        node_depth (int, optional): The depth of nodes to include in the graph. Defaults to 2.

    Returns:
        Dict[str, Any]: The generated graph.

    Raises:
        pymongo.errors.PyMongoError: If there is an error in querying the MongoDB collection.
    """
    gnodes = []
    links = []

    if collection is None:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["rop"]
        collection = db["wikidata"]
        node_depth = 1

    node_one = do_node(main_node, collection)
    gnodes.extend(node_one["nodes"])
    links.extend(node_one["links"])

    if main_node is None:
        main_node = [node["id"] for node in gnodes]
    skipping_to_fancy = skip_to_fancy
    oldids = set(main_node)
    ids = set(main_node)
    for place in range(node_depth):
        oldids = set(node["id"] for node in gnodes)
        ids = set(link["target"] for link in links)
        newids = list(ids.difference(oldids))
        if skipping_to_fancy:
            newids = main_node
        if place != 1 and not skipping_to_fancy:
            newnode = do_node(newids, collection)
            gnodes.extend(newnode["nodes"])
            links.extend(newnode["links"])
        else:
            skipping_to_fancy = False
            newnode = do_node(newids, collection)
            gnodes.extend(newnode["nodes"])
            links.extend(newnode["links"])
            peopleIds = list(node["id"] for node in gnodes if "Q5" in node["groups"])
            busineIds = list(
                node["id"] for node in gnodes if "Q4830453" in node["groups"]
            )
            if len(peopleIds) == 0 or len(busineIds) == 0:
                peopleIds = newids
                busineIds = newids
            newnode1 = do_node(peopleIds, collection, person=True)
            newnode2 = do_node(busineIds, collection, organisation=True)
            gnodes.extend(newnode1["nodes"])
            links.extend(newnode1["links"])
            gnodes.extend(newnode2["nodes"])
            links.extend(newnode2["links"])

    # Remove duplicate links
    nodeIds = []
    for node in gnodes:
        nodeIds.append(node["id"])

    linkNodeIds = set()
    cleanedOutLinks = set()
    for link in links:
        linkString = f"{link['source']}@{link['target']}@{link['type']}"
        if link["source"] not in nodeIds and link["target"] not in nodeIds:
            continue
        if linkString not in cleanedOutLinks:
            linkNodeIds.add(link["source"])
            linkNodeIds.add(link["target"])
            cleanedOutLinks.add(linkString)

    outlinks = []
    for link in list(cleanedOutLinks):
        source, target, linkType = link.split("@")
        outlinks.append({"source": source, "target": target, "type": linkType})

    graph = {"nodes": gnodes, "links": outlinks}

    if not skip_to_fancy and len(gnodes) == 0:
        return do_graph(main_node, file_out, collection, node_depth + 1, silent, True)

    if file_out:
        with open(file_out.encode("utf-8"), "w") as f:
            json.dump(graph, f, indent=4)
        return True
    else:
        pprint(graph)
        with open("testFileOut.json", "w") as f:
            json.dump(graph, f, indent=4)

    if silent:
        return True
    return graph


if __name__ == "__main__":
    # do_graph(main_node=["Q544293"])
    do_graph(main_node=["Q5227102"])
    # do_graph(["Q355", "Q380"])
