depth=4
pairings=[
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

nodelist=[]
function do_node(ids){
    // nodes = db.wikidata.find({id: {$in: ids}})
    nodes = db.wikidata.find({
    id: {$in: ids}
}, {
    sitelinks: {
        eswiki: {title: 1}, 
        enwiki: {title: 1}, 
        zhwiki: {title: 1},
        eowiki: {title: 1},
        arwiki: {title: 1},
        frwiki: {title: 1},
        dewiki: {title: 1},
        hiwiki: {title: 1}
    }, 
    labels: { 
        es: {value:1}, 
        en: {value:1}, 
        zh: {value:1},
        eo: {value:1},
        ar: {value:1},
        fr: {value:1},
        de: {value:1},
        hi: {value:1}
    }, 
    claims: {
        "P1037": {"mainsnak.datavalue.value.id": 1},
        "P1040": {"mainsnak.datavalue.value.id": 1},
        "P112":  {"mainsnak.datavalue.value.id": 1},
        "P123":  {"mainsnak.datavalue.value.id": 1},
        "P127":  {"mainsnak.datavalue.value.id": 1},
        "P1431": {"mainsnak.datavalue.value.id": 1},
        "P162":  {"mainsnak.datavalue.value.id": 1},
        "P170":  {"mainsnak.datavalue.value.id": 1},
        "P1951": {"mainsnak.datavalue.value.id": 1},
        "P2554": {"mainsnak.datavalue.value.id": 1},
        "P2652": {"mainsnak.datavalue.value.id": 1},
        "P286":  {"mainsnak.datavalue.value.id": 1},
        "P31":   {"mainsnak.datavalue.value.id": 1},
        "P3320": {"mainsnak.datavalue.value.id": 1},
        "P355":  {"mainsnak.datavalue.value.id": 1},
        "P371":  {"mainsnak.datavalue.value.id": 1},
        "P488":  {"mainsnak.datavalue.value.id": 1},
        "P50":   {"mainsnak.datavalue.value.id": 1},
        "P5769": {"mainsnak.datavalue.value.id": 1},
        "P749": {"mainsnak.datavalue.value.id": 1},
        "P8324": {"mainsnak.datavalue.value.id": 1},
        "P98":   {"mainsnak.datavalue.value.id": 1},
    }, 
    id: 1, _id:0})
    outnodes=[]
    outlinks=[]
    nodes.forEach(function(node){
        try {
            node_groups=node.claims.P31.map( node => node.mainsnak.datavalue.value.id)
        } catch {}
        pairings.forEach(function(pair){
            try {
                outlinks.push(node.claims[pair.id].map(
                    function(claim){ 
                        return {
                        "target": claim.mainsnak.datavalue.value.id, 
                        "source": node.id, 
                        "type": pair.out 
                    }
                }))
            } catch {}
        })
        if (!nodelist.includes(node.id)){
            nodelist.push(node.id)
            nullname=node.labels.en ? node.labels.en.value : "null"
            outnodes.push({
                    "id": node.id,
                    "label":   nullname,
                    "eslabel": node.labels.es ? node.labels.es.value : nullname,
                    "zhlabel": node.labels.zh ? node.labels.zh.value : nullname,
                    "hilabel": node.labels.hi ? node.labels.hi.value : nullname,
                    "eolabel": node.labels.eo ? node.labels.eo.value : nullname,
                    "arlabel": node.labels.ar ? node.labels.ar.value : nullname,
                    "frlabel": node.labels.fr ? node.labels.fr.value : nullname,
                    "delabel": node.labels.de ? node.labels.de.value : nullname,
                    "enwiki": node.sitelinks.enwiki ? node.sitelinks.enwiki.title : "null", 
                    "eswiki": node.sitelinks.eswiki ? node.sitelinks.eswiki.title : "null", 
                    "zhwiki": node.sitelinks.zhwiki ? node.sitelinks.zhwiki.title : "null", 
                    "hiwiki": node.sitelinks.hiwiki ? node.sitelinks.hiwiki.title : "null", 
                    "eowiki": node.sitelinks.eowiki ? node.sitelinks.eowiki.title : "null", 
                    "arwiki": node.sitelinks.arwiki ? node.sitelinks.arwiki.title : "null", 
                    "frwiki": node.sitelinks.frwiki ? node.sitelinks.frwiki.title : "null", 
                    "dewiki": node.sitelinks.dewiki ? node.sitelinks.dewiki.title : "null", 
                    "groups": node_groups
            })
        }
    })

    return {"nodes": outnodes, "links": outlinks.flat()}
}

function difference(setA, setB) {
  const _difference = new Set(setA);
  for (const elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}

gnodes=[]
links=[]
oldids=new Set([main_node])

node_one=do_node([main_node])
gnodes.push(...node_one.nodes)
links.push(...node_one.links)
ids=new Set([main_node])
for (i = 0; i < depth; i++){
    oldids=new Set(gnodes.map(id => id.id ))
    ids=new Set(links.map(link => link.target))
    newids=[...difference(ids,oldids)]
    newnode=do_node(newids)
    gnodes.push(...newnode.nodes)
    links.push(...newnode.links)
}

nodes=gnodes
graph={
    nodes,
    links
}

fs.writeFileSync(file_out, JSON.stringify(graph))
