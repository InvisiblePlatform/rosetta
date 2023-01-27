//db= connect('mongodb://127.0.0.1:27017/rop');

pairings=[
    {"label":"twittername", "id":"P2002"},
    {"label":"officialblog", "id":"P1581"},
    {"label":"subreddit", "id":"P3984"},
    {"label":"facebookid", "id":"P2013"},
    {"label":"facebookpage", "id":"P4003"},
    {"label":"instagramid", "id":"P2003"},
    {"label":"youtubechannelid", "id":"P2397"},
    {"label":"emailaddress", "id":"P968"},
    {"label":"truthsocial", "id":"P10858"},
    {"label":"parleruser", "id":"P8904"},
    {"label":"gabuser", "id":"P8919"},
    {"label":"soundcloud", "id":"P3040"},
    {"label":"tumblr", "id":"P3943" },
    {"label":"medium", "id":"P3899"},
    {"label":"telegram", "id":"P3789"},
    {"label":"mastodon", "id":"P4033"},
    {"label":"patreon", "id":"P4175"},
    {"label":"reddituser", "id":"P4265"},
    {"label":"twitch", "id":"P5797"},
    {"label":"tiktok", "id":"P7085"},
]
items=[]
datapool=[]
pairings.forEach(function(pair){
    items[pair["id"]] = {"mainsnak.datavalue.value": 1}
    datapool[pair["id"]] = { "label": pair["label"], data: []}
})
datapool["P1387"] = {"label": "polalignment", data: []}
datapool["P1142"] = {"label": "polideology", data: []}
datapool["P414"] = {"label": "ticker", data: []}
datapool["P946"] = {"label": "isin_id", data: []}

// .entities[].claims.P414[].qualifiers.P249[].datavalue.value ticker
// add_values_from_wikidata_id "$website" "$WDLOOKUP" "polalignment" "P1387" "$resort"
// add_values_from_wikidata_id "$website" "$WDLOOKUP" "polideology" "P1142" "$resort"
output = db.wikidata.find({
    id: {$in: main_node}
}, {
    claims: {
        "P1142": {"mainsnak.datavalue.value.id": 1}, // political ideology
        "P1387": {"mainsnak.datavalue.value.id": 1}, // political alignment
        "P946": {"mainsnak.datavalue.value": 1}, // ISINID
        "P414": {"qualifiers.P249": {"datavalue.value": 1}}, // ticker
        ...items
    }, 
    id: 1, _id:0})

exceptions=["P1142", "P1387", "P414", "P946"]

output.forEach( function(result){
 for (claim in result.claims) {
  result.claims[claim].forEach( function(claimer){ 
   if (Object.keys(claimer).length > 0){
    if (exceptions.includes(claim)){
     if (claim == "P414"){
       if (Object.keys(claimer.qualifiers) > 0)
         claimer.qualifiers['P249'].forEach(x => datapool[claim].data.push(x.datavalue.value))
     } else {
       if (Object.keys(claimer.mainsnak).length > 0){
         if (claim == "P946"){
           datapool[claim].data.push(claimer.mainsnak.datavalue.value)
         } else {
           datapool[claim].data.push(claimer.mainsnak.datavalue.value.id+';'+claim+';'+result.id)
         }
       }
     }
    } else {
     if (Object.keys(claimer.mainsnak).length > 0)
       datapool[claim].data.push(claimer.mainsnak.datavalue.value+';'+claim+';'+result.id)
    }
   }
  })
 }
})

lines={}
for (claim in datapool) if (datapool[claim].data.length > 0) lines[datapool[claim].label] = datapool[claim].data

fs.writeFileSync(file_out, JSON.stringify(lines))

