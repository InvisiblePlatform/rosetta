var debug = false;
Url = {
    get get(){
        var vars= {};
        if(window.location.search.length!==0)
            window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value){
                key=decodeURIComponent(key);
                if(typeof vars[key]==="undefined") {vars[key]= decodeURIComponent(value);}
                else {vars[key]= [].concat(vars[key], decodeURIComponent(value));}
            });
        return vars;
    }
};
if (Url.get["debug"] == 'true'){
    debug = true;
}
var mode = 0                                                                    
const phoneRegexG = /Mobile/i;                                                   
                                                                                
if (phoneRegexG.test(navigator.userAgent)){                                      
    mode = 1;
    if (debug) console.log("[ Invisible Voice ]: phone mode");
    document.getElementsByClassName("content")[0].classList.add("mobile");
}         
// const zoom = d3.zoom()
//     .scaleExtent([-5, 40])
//     .on("zoom", zoomed);
var svg2 = d3.select("#key");
var docwidth = mode == 1 ? window.innerWidth : "836";
var docHeight = window.innerHeight; 
var svg = d3.select("#graph").attr("height", docHeight).attr("width", docwidth);
var resetButton = document.getElementById('graphZoomReset').setAttribute("onclick", "reset()");
var zoomInButton = document.getElementById('graphZoomIn').setAttribute("onclick", "zoomIn()");
var zoomOutButton = document.getElementById('graphZoomOut').setAttribute("onclick", "zoomOut()");
var width = +svg.attr("width");
var height = +svg.attr("height");
var wikiframe = document.getElementById("wikipedia-frame");
var titlebar = document.getElementById("titlebar");
var keyDiv = document.getElementById("key");
var wikiframeclose = document.getElementById("wikipedia-frame-close");
var wikicardframe = document.getElementById("wikipedia-infocard-frame");
var wikifirstframe = document.getElementById("wikipedia-first-frame");
var graphBox = document.getElementById("graph-box");
var graphContainer = document.getElementById("graph-container");
var infoCardContainer = document.getElementById("wikicard-container");
var bigtext = ''
var langArray = ["en", "fr", "ar", "es", "eo", "zh", "de", "hi"];
var langPref = localStorage.preferred_language;
var wikichoice = langArray.indexOf(langPref) ? `https://${langPref}.wikipedia.org` : "https://en.wikipedia.org";

var skipsections = ["See_also", "References", "Further_reading", "External_links",
                    "Sources", "undefined", "Notes", "Notes_et_références", 
                    "Source_de_l'entreprise", "Sources_externes", "Annexes", 
                    "Articles_connexes", "Liens_externes", "Referencias", "Véase_también",
                    "Enlaces_externos", "Referencoj","Eksteraj_ligiloj", "Literatur",
                    "Rundfunkberichte", "Weblinks", "Einzelnachweise", "參見", "注释",
                    "參考資料", "外部連結", "सन्दर्भ", "बाहरी_कड़ियाँانظر_أيضًا", "مراجع", 
                    "وصلات_خارجية", "انظر_أيضًا"];

function removeSectionsWithMatchingId() {
  skipsections.forEach(function(section) {
    var matchingh2 = document.getElementById(section);
    if (matchingh2 != undefined) {
        matchingh2.parentNode.remove();
    }
  });
}
const modtypestypes = {
    "trustscore": { "id": "trust-scam", "label": "Trust Scam" },
    "mbfc": { "id": "mbfc", "label": "Media Bias" },
    "glassdoor": { "id": "glassdoor", "label": "Employee Rating" },
    "similar": { "id": "similar-site-wrapper", "label": "Similar Sites" },
    // "tosdr": { "id": "tosdr-link", "label": "Privacy" },
}

var currentDomain = window.location.protocol + "//" + window.location.host;
function getDocumentIndex(document){
    $.ajax({
        url: `${currentDomain}/db/${document}/index.json`,
        type: 'GET',
    }).done(function(data) {
        console.log(data)
        if ('connections' in data){
            addNewFile(`${currentDomain}${data.connections}`)
        }
        if ('core' in data )
        for (module of data.core){
            if (module.url == 'local'){
                console.log(module);
            } else {
                addModule(type=module.type, url=`${pageHost}/ds/${module.url}`);
            }
        }
    })
}

wikiframeclose.onclick = function() {
    wikiframe.style.display = "none";
    wikiframeclose.style.display = "none";
    wikiframeclose.style.display = "none";
    wikiframe.classList.remove("floating")
    titlebar.style.transform = "";
    keyDiv.style.transform = "";
    document.getElementById("graphButtons").setAttribute("style", "top: 12px;")
};


const sort_byg = (field, reverse, primer) => {

  const key = primer ?
    function(x) {
      return primer(x[field])
    } :
    function(x) {
      return x[field]
    };

  reverse = !reverse ? 1 : -1;

  return function(a, b) {
    return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
  }
}
function getMyCentroid(element) {
    var bbox = element.getBBox();
    return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
}

function getMostCommon(array) {
    var count = {};
    array.forEach(function(a) {
        count[a] = (count[a] || 0) + 1;
    });
    if (debug) console.log(count);
    return Object.keys(count).reduce(function(r, k, i) {
        if (!i || count[k] > count[r[0]]) {
            return [k, r];
        }
        if (count[k] === count[r[0]]) {
            r.push(k);
        }
        if (k) return [r, k];
        return [r,r];
    });

}


// svg.call(zoom);
// 
// function zoomIn() {
//    svg.transition()
//        .call(zoom.scaleBy, 2);
// }
// 
// function zoomOut() {
//    svg.transition()
//        .call(zoom.scaleBy, 0.5);
// }
// 
// function reset() {
//     svg.transition().duration(750).call(
//         zoom.transform,
//         d3.zoomIdentity,
//         d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
//     );
// }
// 
// function clicked(event, [x, y]) {
//     svg.transition().duration(750).call(
//         zoom.transform,
//         d3.zoomIdentity.translate(width / 2, height / 2).scale(40).translate(-x, -y),
//         d3.pointer(event)
//     );
// }
// 
// function zoomed({ transform }) {
//     d3.select('svg g').attr("transform", transform);
//     d3.select('svg g.nodes').attr("transform", transform);
// }

graphLoc = document.getElementById('graphLoc').innerHTML;
var wikidataid, wikidataidbackup;
var ids = [];
var urls = [];

function getObjectsBySource(sourceValue, connectionList) {
  return connectionList.filter(function(connection) {
    return connection.source === sourceValue;
  });
}

function getNodeById(sourceValue, nodeList) {
  return nodeList.filter(function(node) {
    return node.id === sourceValue;
  });
}

var graph;
function myGraph() {

    // Add and remove elements on the graph object
    this.addNode = function (label, id, groups, defSite) {
        nodes.push({"id": id, "label": label, "groups": groups, "defSite": defSite});
        update();
    };

    this.removeNode = function (id) {
        var i = 0;
        var n = findNode(id);
        while (i < links.length) {
            if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
                links.splice(i, 1);
            }
            else i++;
        }
        nodes.splice(findNodeIndex(id), 1);
        update();
    };

    this.removeLink = function (source, target) {
        for (var i = 0; i < links.length; i++) {
            if (links[i].source.id == source && links[i].target.id == target) {
                links.splice(i, 1);
                break;
            }
        }
        update();
    };

    this.removeallLinks = function () {
        links.splice(0, links.length);
        update();
    };

    this.removeAllNodes = function () {
        nodes.splice(0, links.length);
        update();
    };

    this.centerNode = function (id) {
            node = findNode(id);
            node.x = w/2;
            node.y = h/2;
            update();
    }

    this.addLink = function (source, target, value) {
        links.push({"source": findNode(source), "target": findNode(target), "type": value});
        update();
    };
    this.isthereNode = function (id){
        if (findNode(id) != undefined ) return true;
        return false
    }

    var findNode = function (id) {
        for (var i in nodes) {
            if (nodes[i]["id"] == id) return nodes[i];
        }
        ;
    };

    var findNodeIndex = function (id) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id == id) {
                return i;
            }
        }
        ;
    };

    // set up the D3 visualisation in the specified element
    var w = 1800, h = 900;

    // var types = ["1"]
    // if (links){
    //   types = Array.from(new Set(links.map(d => d.type)));
    // } else {
    //   types = [""];
    // }
    // const split = 1 / types.length;
    // colors_array = [];
    // d3.range(0, 1, split).forEach(function(d) {
    //     colors_array.push(d3.interpolateSinebow(d));
    // });
    // var color = d3.scaleOrdinal(types, colors_array);
    var color = d3.scale.category10();

    var vis = d3.select("body")
            .append("svg:svg")
            .attr("width", w)
            .attr("height", h)
            .attr("id", "svg")
            .attr("pointer-events", "all")
            .attr("viewBox", "0 0 " + w + " " + h)
            .attr("perserveAspectRatio", "xMinYMid")
            .append('svg:g');

    var force = d3.layout.force();

    var nodes = force.nodes(),
            links = force.links();
    

    var update = function () {
        var link = vis.selectAll("line")
                .data(links, function (d) {
                    return d.source.id + "-" + d.target.id;
                });

        link.enter().append("line")
                .attr("id", function (d) {
                    return d.source.id + "-" + d.target.id;
                })
                .attr("stroke-width", function (d) {
                    return 2;
                })
                .attr("class", "link");
        link.append("title")
                .text(function (d) {
                    return d.type;
                });
        link.exit().remove();

        var node = vis.selectAll("g.node")
                .data(nodes, function (d) {
                    return d.id;
                }).attr("onclick", function(d){
                    if (d.defSite != 'null')
                        return `getDocumentIndex("${d.defSite}")`;
                });

        var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .call(force.drag);

        nodeEnter.append("svg:circle")
                .attr("r", 12)
                .attr("id", function (d) {
                    return "Node;" + d.id;
                })
                .attr("class", "nodeStrokeClass")
                .attr("fill", function(d) { return color(d.id); });

        nodeEnter.append("svg:text")
                .attr("class", "textClass")
                .attr("x", 14)
                .attr("y", ".31em")
                .text(function (d) {
                    return d.label;
                });

        node.exit().remove();

        force.on("tick", function () {

            node.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            link.attr("x1", function (d) {
                return d.source.x;
            })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });
        });

        // Restart the force layout.
        force.gravity(.01)
             .charge(-400)
             .friction(0)
             .linkStrength(10)
             .linkDistance(function(d){
                if (d.target.groups.includes("Q5")){
                    return 100;
                } else {
                    return 200;
                }
             })
             .size([w, h])
             .start();
    };


    // Make it all go
    update();
}
function loadJSON(url, callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open("GET", url, true);
  xobj.onreadystatechange = function() {
    if (xobj.readyState === 4 && xobj.status === 200) {
      callback(JSON.parse(xobj.responseText));
    }
  };
  xobj.send(null);
}

// Usage

function addNewFile(jsonloc){
    loadJSON(jsonloc, function(data) {
      var links = data.links;
      var nodes = data.nodes;
    
      // Iterating through nodes
      console.log("Nodes:");
      nodes.forEach(function(node) {
        if (graph.isthereNode(node["id"])){
        } else {
        graph.addNode(node["label"], node["id"], node["groups"], node["defSite"]);
        }
      });
      // Iterating through links
      console.log("Links:");
      links.forEach(function(link) {
        //console.log(link);
        if (graph.isthereNode(link["target"])){
            graph.addLink(link["source"], link["target"], 10);
        }
      });
        // graph.centerNode(id)
        keepNodesOnTop();
    
    });
}

function drawGraph() {
    graph = new myGraph("#svgdiv");
    addNewFile(graphLoc);
    keepNodesOnTop();
}

drawGraph();

// because of the way the network is created, nodes are created first, and links second,
// so the lines were on top of the nodes, this just reorders the DOM to put the svg:g on top
function keepNodesOnTop() {
    $(".nodeStrokeClass").each(function( index ) {
        var gnode = this.parentNode;
        gnode.parentNode.appendChild(gnode);
    });
}
function addNodes() {
    d3.select("svg")
            .remove();
     drawGraph();
}

// d3.json(graphLoc).then(function(graph) {
//     for (var i = document.links.length; i-- > 0;)
//         if (document.links[i].hostname.match(/wikidata/))
//             urls.push(document.links[i].href)
//     for (var i = urls.length; i-- > 0;)
//         ids.push(urls[i].replace(/#.*/g, "").replace(/.*\//, ""))
//     try {
//         wikidataid = document.getElementById("wikidataid").innerText
//     } catch(e) {
//         console.error(e)
//     }
//     if (wikidataid == undefined){
//         wikidataid = getMostCommon(ids)[0];
//         if (wikidataid == "Q") wikidataid = getMostCommon(ids);
//         wikidataidbackup = getMostCommon(ids)[1];
//         if (wikidataidbackup == "Q") wikidataidbackup = getMostCommon(ids);
//     }
//     graphCon = graph["links"];
//     graphNod = graph["nodes"];
// 
//     const types = Array.from(new Set(graph.links.map(d => d.type)));
//     const split = 1 / types.length;
//     colors_array = [];
//     d3.range(0, 1, split).forEach(function(d) {
//         colors_array.push(d3.interpolateSinebow(d));
//     });
//     var color = d3.scaleOrdinal(types, colors_array);
//     const nodeIds = new Set(graph.nodes.map(node => node.id));
//     const filteredLinks = graph.links.filter(link => nodeIds.has(link.source) && nodeIds.has(link.target));
//     graph.links = filteredLinks;
// 
// 
//     svg.call(d3.zoom()
//         .scaleExtent([-4, 8])
//         .on("zoom", zoomed));
// 
//     svg.append("defs").selectAll("marker")
//         .data(types).enter()
//         .append("marker")
//         .attr("id", d => `arrow-${d}`)
//         .attr("viewBox", "0 -5 10 10")
//         .attr("refX", 15)
//         .attr("refY", -0.5)
//         .attr("markerWidth", 6)
//         .attr("markerHeight", 6)
//         .attr("orient", "auto")
//         .append("path")
//         .attr("fill", d => color(d))
//         .attr("d", "M0,-5L10,0L0,5");
// 
//     var key_y = d3.scaleOrdinal(types, d3.range(0, 15 * types.length, 15));
// 
//     var key = svg2.append("div")
//         .selectAll("g")
//         .data(types).enter()
//         .append("table");
// 
//     var key_rects = key.append("th")
//         .attr("style", function(d) {
//             return "background-color:" + color(d) + ";";
//         });
// 
//     var key_labels = key.append("td")
//         .attr("class", "key-text")
//         .text(function(d) {
//             return d.replaceAll("_", " ");
//         })
//         .attr("data-i18n", function(d) {
//             return "graph." + d.toLowerCase();
//         });
// 
//     // var key_include_size = svg2.append("div").text(`${docwidth}, ${docHeight}`);
// 
//     var link = svg.append("g")
//         .attr("stroke-width", 1.5)
//         .attr("fill", "none")
//         .selectAll("path")
//         .data(graph.links)
//         .enter().append("path")
//         .attr("stroke", d => color(d.type))
//         .attr("marker-mid", d => `url(#arrow-${d.type})`);
// 
//     var linkColors = {};
//     link.each(function(d) {
//         linkColors[d.target] = d3.select(this).style("stroke");
//     });
// 
//     var node = svg.append("g")
//         .attr("class", "nodes")
//         .attr("fill", "currentColor")
//         .attr("stroke-linecap", "round")
//         .attr("stroke-linejoin", "round")
//         .selectAll("g")
//         .data(graph.nodes)
//         .enter().append("g").attr("id", function(d) {
//             if (d.id == wikidataid) {
//                 d.fx = width / 2;
//                 d.fy = height / 2;
//             }
//             return d.id;
//         });
//     if (wikidataid) {
//         var main = d3.select("#" + wikidataid);
//         // console.log(wikidataid)
//         var wikidataMainWiki;
//         try {
//             wikidataMainWiki = langArray.indexOf(langPref) ? main._groups[0][0].__data__[`${langPref}wiki`] : main._groups[0][0].__data__.enwiki;
//          } catch (e){
//             // console.log(e);
//             wikidataid = wikidataidbackup;
//             // console.log(wikidataidbackup);
//             main = d3.select("#" + wikidataid);
//             wikidataMainWiki = 'null';
//          }
// 
//         if (wikidataMainWiki == 'null') {
//             wikidataid = wikidataidbackup;
//             // console.log(wikidataidbackup);
//             main = d3.select("#" + wikidataid);
//             wikidataMainWiki = langArray.indexOf(langPref) ? main._groups[0][0].__data__[`${langPref}wiki`] : main._groups[0][0].__data__.enwiki;
//         };
//         if (wikidataMainWiki.includes("wikipedia.org"))
//             wikidataMainWiki = wikidataMainWiki.split('/').slice(4).join("/");
// 
//         if (wikidataMainWiki != "null") {
//             let requestURL = wikichoice + "/api/rest_v1/page/html/" + wikidataMainWiki + "?redirect=true"
//             $.support.cors = true;
//             $.ajax({
//                 url: requestURL,
//                 headers: { 'Api-User-Agent': "admin@invisible-voice.com"}
// 
//             }).done(function(data) {
//                 var tempObj = document.createElement("div")
//                 tempObj.innerHTML = data
//                 var tempElement = tempObj.getElementsByClassName("infobox")[0]
//                 if (debug) console.log(tempObj)
//                 wikicardframe.innerHTML = ""
//                 wikicardframe.appendChild(tempElement)
//                 tempObj.getElementsByTagName("link")[2].remove()
//                 wikifirstframe.innerHTML = ""
//                 wikifirstframe.appendChild(tempObj)
// 
//                 // for (let x in data.remaining.sections) {
//                 //     let section = data.remaining.sections[x];
//                 //     if (!section.anchor) continue;
//                 //     if (skipsections.includes(section.anchor)) continue;
//                 //     text += `<p id="${section.anchor}"><h2>${section.line}</h2>` + 
//                 //         `${(section.text != '\n') ? `<div>${section.text.replace(/href=\"/g, 'href=\"' + wikichoice)}</div></p>` : '\n'}`;
//                 // }
//                 wikifirstframe.innerHTML = wikifirstframe.innerHTML.replace(/<img/g,'<img loading=lazy ');
// 
//                 // for (var i = wikifirstframe.children.length; i-- > 0;){
//                 //     let child = wikifirstframe.children[i];
//                 //     if (child.classList.contains("infobox") || child.classList.contains("infobox_v2")) {
//                 //         wikicardframe.innerHTML = "";
//                 //         wikicardframe.appendChild(child);
//                 //     }
//                 // }
//                 // i18n, id, title, inId, innerHTML, icon, onclick
//                 var cardVars = [ 'w.companyinfo', 'profile-card', "Company Info", 'wikipedia-page', wikicardframe.innerHTML, "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'%3e%3cpath stroke='%23343434' d='M12.5 8.5h16v7h-16z'/%3e%3cpath stroke='%23343434' d='M10.5 6.5h20v27h-20z'/%3e%3cpath stroke='%23343434' d='M12.5 27.5h16v4h-16zM14 17.5h3M14 21.5h3M14 25.5h3M14 19.5h3M14 23.5h3M19 17.5h8M19 21.5h8M19 25.5h8M19 19.5h8M19 23.5h8'/%3e%3c/svg%3e", "loadWikipediaCard()"];
//                 var wikiVars = [ 'w.wikipedia', 'company-info', "Wikipedia", 'wikipedia-know', wikifirstframe.innerHTML, "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'%3e%3cpath stroke='%23343434' stroke-linecap='round' stroke-linejoin='round' d='M6 11.75S8.1 9 13 9s7 2.75 7 2.75V31s-2.1-1.375-7-1.375S6 31 6 31V11.75Zm14 0S22.1 9 27 9s7 2.75 7 2.75V31s-2.1-1.375-7-1.375S20 31 20 31V11.75Z'/%3e%3c/svg%3e", "loadWikipediaPage()"];
//                 var fullWikiUrl = `${wikichoice}/wiki/${wikidataMainWiki}`;
//                 [ cardVars, wikiVars ].forEach(function(itemArray){
//                         var tempEl = `<h2 class='sectionTitle' id='${itemArray[1]}' data-i18n='${itemArray[0]}'>${itemArray[2]}</h2>
//                                       <div class='scoreText'><div id='${itemArray[3]}' class='hideInSmall'>
//                                       ${itemArray[4]}</div></div><img src="${itemArray[5]}" class='iconclass' />
//                                       <a href='${fullWikiUrl}' class='source'>WIKIPEDIA</a>
//                                       <button type='button' onclick='${itemArray[6]}' class='fullView' data-i18n='common.fullview'>FULL-VIEW</button>`;
//                         contentsLength = document.getElementsByClassName("content").length;
//                         lastContent = document.getElementsByClassName("content")[contentsLength - 1];
//                         if (itemArray[1] == "profile-card") {
//                             wikicardframe.innerHTML = tempEl.replace(/<img/g,'<img loading=lazy ');
//                             lastContent.appendChild(wikicardframe);
//                         }
//                         if (itemArray[1] == "company-info") {
//                             wikifirstframe.innerHTML = tempEl.replace(/<img/g,'<img loading=lazy ');
//                             lastContent.appendChild(wikifirstframe);
//                             removeSectionsWithMatchingId();
//                         }
//                 })
// 
//                 // var profiletext = "<h2 class='sectionTitle' data-i18n='w.companyinfo' id='profile-card'>Company Info</h2>" +
//                 //                   "<div class='scoreText'><div id='wikipedia-page' class='hideInSmall'>" + 
//                 //                   `${wikicardframe.innerHTML}</div></div><img src='/icon/profile.svg' class='iconclass' />` + 
//                 //                   `<a href='${fullWikiUrl}' class='source blanksource'>WIKIPEDIA</a>`;
//                 // wikicardframe.innerHTML = profiletext.replace(/<img/g,'<img loading=lazy ');
// 
//                 // var companyinfotext = "<h2 class='sectionTitle' id='company-info' data-i18n='w.wikipedia'>Wikipedia</h2>" +
//                 //                       "<div class='scoreText'><div id='wikipedia-know' class='hideInSmall'>" +
//                 //                       `${wikifirstframe.innerHTML}</div></div><img src='/icon/info.svg' class='iconclass' />` +
//                 //                       `<a href='${fullWikiUrl}' class='source'>WIKIPEDIA</a>`+
//                 //                       "<button type='button' onclick='loadWikipediaPage()' class='fullView' data-i18n='common.fullview'>FULL-VIEW</button>";
// 
//                 // wikifirstframe.innerHTML = companyinfotext.replace(/<img/g,'<img loading=lazy ');
// 
//                 lastContent.appendChild(wikifirstframe);
//                 lastContent.appendChild(wikicardframe);
//                 removeSectionsWithMatchingId();
//                 wikifirstframe.style.display = "";
//                 wikicardframe.style.display = "";
//             }).fail(function() {
//                 if (debug) console.log("oh no")
//             });
//         };
//         contentsLength = document.getElementsByClassName("content").length;
//         lastContent = document.getElementsByClassName("content")[contentsLength - 1];
//         graphBox.innerHTML = `<h2 class='sectionTitle' id='graph-box-interior'>Network Graph</h2>
//                              <img src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'%3e%3ccircle cx='16.5' cy='14.5' r='7' stroke='%23343434'/%3e%3ccircle cx='30.5' cy='9.5' r='3' stroke='%23343434'/%3e%3ccircle cx='10' cy='26' r='3.5' stroke='%23343434'/%3e%3ccircle cx='19' cy='31' r='2.5' stroke='%23343434'/%3e%3ccircle cx='29' cy='28' r='4.5' stroke='%23343434'/%3e%3cpath stroke='%23343434' d='m23.154 12.271 4.571-1.632M21.195 19.86l4.597 4.95M11.316 22.749l1.431-2.453M24.739 29.343 21 30.5'/%3e%3c/svg%3e" class='iconclass'/>
//                              <a href='https://wikidata.org/wiki/${wikidataid}' class='source blanksource'>WIKIDATA</a>`;
//         lastContent.appendChild(graphBox);
//         if (graphBox.style.display == "none") graphBox.style.display = "";
//         l1list = [];
//         try {
//             var matchingObjects = getObjectsBySource(wikidataid, graphCon);
//             for (object in matchingObjects){
//                 personType = matchingObjects[object].type;
//                 enlabel = getNodeById(matchingObjects[object].target, graphNod)[0].label;
//                 l1list.push({"type": personType, "label": enlabel, "id": matchingObjects[object].target});
//             }
//         } catch(e) {
//             var matchingObjects = getObjectsBySource(wikidataidbackup, graphCon);
//             for (object in matchingObjects){
//                 personType = matchingObjects[object].type;
//                 enlabel = getNodeById(matchingObjects[object].target, graphNod)[0].label;
//                 l1list.push({"type": personType, "label": enlabel, "id": matchingObjects[object].target});
//             }
//         }
//         sortedl1list = l1list.sort(sort_byg("id", true, String));
//         l1list_ids = [];
//         var list = document.createElement('div');
//         list.setAttribute('class', 'graphList');
//         graphBox.childNodes[0].classList.add("noShowTitle");
//         graphBox.getElementsByTagName('img')[0].classList.add("graphIconOffset");
//         if (sortedl1list.length == 0){
//             try {
//                 personType = "Organization"
//                 enlabel = getNodeById(wikidataid, graphNod)[0].label 
//                 sortedl1list.push({"type": personType, "label": enlabel, "id": wikidataid});
//             } catch(e) {
//                 personType = "Organization"
//                 enlabel = getNodeById(wikidataidbackup, graphNod)[0].label 
//                 sortedl1list.push({"type": personType, "label": enlabel, "id": wikidataidbackup});
//                 console.log("issue in no results list graph");
//             }
// 
//         }
//         for (item in sortedl1list){
//             itemData = sortedl1list[item];
//             if (!l1list_ids.includes(itemData.id)){
//             listItem = document.createElement('li');
//             listItem.innerHTML = 
//                     `<div class="graphListName" >${itemData.label}</div>` + 
//                     `<i>${itemData.type.replaceAll('_', ' ').replaceAll(' of', '')}</i>`;
//             list.appendChild(listItem);
//             l1list_ids.push(itemData.id);
//             }
//         }
//         graphBox.appendChild(list)
//     };
// 
// 
//     var circles = node.append("a").attr("href", function(d) {
//             var wikidataWiki = "";
//             wikidataWiki = langArray.indexOf(langPref) ? d[`${langPref}wiki`] : d.enwiki;
//             if (wikidataWiki.includes("wikipedia.org")) wikidataWiki = wikidataWiki.split('/').slice(4).join("/");
//             return (wikidataWiki != "null") ? wikichoice + "/wiki/" + wikidataWiki : "https://wikidata.org/wiki/" + d.id;
//         }).attr("target", "_blank")
//         .on('click', function(d, i) {
//             document.getElementById("graphButtons").setAttribute("style", "")
//             var wikidataWiki;
//             wikidataWiki = langArray.indexOf(langPref) ? i[`${langPref}wiki`] : i['enwiki'];
//             console.log(i)
//             if (wikidataWiki == "null") return
//             if (wikidataWiki.includes("wikipedia.org")) wikidataWiki = wikidataWiki.split('/').slice(4).join("/");
//             if (i["defSite"] != "null"){
//                 getDocumentIndex(i["defSite"])
//             }
//             d.preventDefault();
//             // console.log("clicking on", this, wikidataWiki);
//             let requestURL = wikichoice + "/api/rest_v1/page/html/" + wikidataWiki + "?redirect=true"
//             if (wikiframe.style.display == "none") {
//                 wikiframe.style.display = "block";
//                 titlebar.style.transform = "translate(0, -200px)";
//                 keyDiv.style.transform = "translate(0, -200px)";
//                 wikiframe.classList.add("floating")
//                 wikiframeclose.style.display = "block";
//             }
//             $.support.cors = true;
//             $.ajax({
//                 url: requestURL,
//                 headers: { 'Api-User-Agent': "admin@invisible-voice.com"}
//             }).done(function(data) {
//                 var tempObj = document.createElement("div")
//                 tempObj.innerHTML = data
//                 tempObj.getElementsByTagName("link")[2].remove()
//                 //var tempElement = tempObj.getElementsByClassName("infobox")[0]
//                 //if (debug) console.log(tempObj)
//                 wikiframe.innerHTML = ""
//                 wikiframe.appendChild(tempObj)
//                 removeSectionsWithMatchingId();
// 
//                 // var text = data.lead.sections[0].text.replace(/href=\"/g, 'href=\"' + wikichoice);
//                 // for (let x in data.remaining.sections) {
//                 //     let section = data.remaining.sections[x];
//                 //     if (!section.anchor) continue;
//                 //     if (skipsections.includes(section.anchor)) {
//                 //         continue;
//                 //     }
//                 //     let item = '<p id="' +
//                 //         section.anchor +
//                 //         '"><h2>' +
//                 //         section.line +
//                 //         '</h2><div>' +
//                 //         section.text.replace(/href=\"/g, 'href=\"' + wikichoice) +
//                 //         '</div></p>';
//                 //     text += item;
// 
//                 // }
//                 // var title = '<div class="sectionTitle" style="font-variation-settings:\'wght\'500;">' + data.lead.normalizedtitle + '</div>';
//                 // wikiframe.innerHTML = title + text;
//             }).fail(function() {
//                 if (debug) console.log("oh no")
//             });
// 
//         })
// 
//     var rects = circles.append("rect")
//         .attr("fill", function(d) {
//             return (d.id == wikidataid) ? "var(--c-background)" : "var(--c-light-text)";
//         })
//         .attr("ry", "4")
//         .attr("rx", "4")
//         .attr("text-anchor", "center")
//         .attr("class", function(d) {
//             return d.groups.toString().replace(/,/g, ' ');
//         });
// 
//     var lables = circles.append("text")
//         .attr("class", "label-text")
//         .attr("text-anchor", "middle")
//         .attr("fill", function(d) {
//             return (d.id == wikidataid) ? "var(--c-light-text)" : "var(--c-background)";
//         })
//         .attr("z-index", function(d) {
//             return (d.groups.includes("Q5")) ? "100" : "101";
//         })
//         .attr("font-size", function(d) {
//             if (d.id == wikidataid) return "18px";
//             return (d.groups.includes("Q5")) ? "6px" : "10px";
//         })
//         .text(function(d) {
//             return d.label;
//         });
// 
// 
//     node.selectAll('rect')
//     .attr('width', function(d) { return (document.getElementById(d.id).getBBox().width) + 32; })
//     .attr('height', function(d) { return (document.getElementById(d.id).getBBox().height) + 16; })
//     .attr('x', function(d) { 
//         return document.getElementById(d.id).getBBox().x - 16; 
//     })
//     .attr('y', function(d) { 
//         return document.getElementById(d.id).getBBox().y - 8; 
//     }).style("stroke", function(d) { 
//         return ( d.id == wikidataid ) ? "var(--c-light-text)" : linkColors[d.id]; 
//     });
// 
//     // Create a drag handler and append it to the node object instead
//     var drag_handler = d3.drag()
//         .on("start", dragstarted)
//         .on("drag", dragged);
//     // .on("end", dragended);
// 
//     drag_handler(node);
// 
//     simulation
//         .nodes(graph.nodes)
//         .on("tick", ticked)
// 
//     simulation.force("link")
//         .links(graph.links);
// 
//     function ticked(){
//         link.attr("d", linkArc)
//         // node.attr("transform", function(d) {
//         //     var b = document.getElementById(d.id).getBBox();
// 
// 		//     var diffX = d.x - b.x;
// 		//     var diffY = d.y - b.y;
// 		//     var dist = Math.sqrt(diffX * diffX + diffY * diffY);
// 		//     var shiftX = b.width * (diffX - dist) / (dist * 2);
// 		//     var shiftY = b.height * (diffY - dist) / (dist * 2);
//         //     return "translate(" + (shiftX+d.x) + "," + (shiftY+d.y) + ")";
//         // })
//         node.attr("transform", function(d) { 
// 		 			return "translate(" + d.x + "," + d.y + ")";});
//     };
// });
// 
// function dragstarted(event, d) {
//     if (!event.active) simulation.alphaTarget(0.3).restart();
//     d.fx = d.x;
//     d.fy = d.y;
// }
// 
// function dragged(event, d) {
//     d.fx = event.x;
//     d.fy = event.y;
//     d.fixed = true;
// }
// 
// function dragended(event,d) {
//   if (!event.active) simulation.alphaTarget(0);
//   d.fx = null;
//   d.fy = null;
// }
// function linkArc(d) {
//     //const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
//     const r = 0;
//     return `
//         M${d.source.x},${d.source.y}
//         A${r},${r} 0 0,1 ${(d.source.x+d.target.x)/2},${(d.source.y+d.target.y)/2}
//         M${(d.source.x+d.target.x)/2},${(d.source.y+d.target.y)/2}
//         A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
//       `;
// }
