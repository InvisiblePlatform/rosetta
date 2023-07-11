var mode = 0                                                                    
const phoneRegexG = /Mobile/i;                                                   
                                                                                
if (phoneRegexG.test(navigator.userAgent)){                                      
    mode = 1;
    console.log("[ Invisible Voice ]: phone mode");
    document.getElementsByClassName("content")[0].classList.add("mobile");
}         
const zoom = d3.zoom()
    .scaleExtent([-5, 40])
    .on("zoom", zoomed);
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

var skipsections = ["See_also", "References", "Further_reading", "External_links",
                    "Sources", "undefined", "Notes", "Notes_et_références", 
                    "Source_de_l'entreprise", "Sources_externes", "Annexes", 
                    "Articles_connexes", "Liens_externes", "Referencias", "Véase_también",
                    "Enlaces_externos", "Referencoj","Eksteraj_ligiloj", "Literatur",
                    "Rundfunkberichte", "Weblinks", "Einzelnachweise", "參見", "注释",
                    "參考資料", "外部連結", "सन्दर्भ", "बाहरी_कड़ियाँانظر_أيضًا", "مراجع", 
                    "وصلات_خارجية", "انظر_أيضًا"];

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
    console.log(count);
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

var forceLink = d3.forceLink().id(function(d) {return d.id; }).distance(100);
var charge = d3.forceManyBody().distanceMin(50).distanceMax(5000).strength(-1500);

var simulation = d3.forceSimulation()
    .force("link", forceLink )
    // .force("charge", d3.forceManyBody().strength(-200).distanceMin(50))
    .force("charge", charge)
    .force("center", d3.forceCenter(width / 2, height / 2));

svg.call(zoom);

function zoomIn() {
   svg.transition()
       .call(zoom.scaleBy, 2);
}

function zoomOut() {
   svg.transition()
       .call(zoom.scaleBy, 0.5);
}

function reset() {
    svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    );
}

function clicked(event, [x, y]) {
    svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(40).translate(-x, -y),
        d3.pointer(event)
    );
}

function zoomed({ transform }) {
    d3.select('svg g').attr("transform", transform);
    d3.select('svg g.nodes').attr("transform", transform);
}

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


d3.json(graphLoc).then(function(graph) {
    for (var i = document.links.length; i-- > 0;)
        if (document.links[i].hostname.match(/wikidata/))
            urls.push(document.links[i].href)
    for (var i = urls.length; i-- > 0;)
        ids.push(urls[i].replace(/#.*/g, "").replace(/.*\//, ""))
    try {
        wikidataid = document.getElementById("wikidataid").innerText
    } catch(e) {
        console.error(e)
    }
    if (wikidataid == undefined){
        wikidataid = getMostCommon(ids)[0];
        if (wikidataid == "Q") wikidataid = getMostCommon(ids);
        wikidataidbackup = getMostCommon(ids)[1];
        if (wikidataidbackup == "Q") wikidataidbackup = getMostCommon(ids);
    }
    graphCon = graph["links"];
    graphNod = graph["nodes"];

    const types = Array.from(new Set(graph.links.map(d => d.type)));
    const split = 1 / types.length;
    colors_array = [];
    d3.range(0, 1, split).forEach(function(d) {
        colors_array.push(d3.interpolateSinebow(d));
    });
    var color = d3.scaleOrdinal(types, colors_array);
    const nodeIds = new Set(graph.nodes.map(node => node.id));
    const filteredLinks = graph.links.filter(link => nodeIds.has(link.source) && nodeIds.has(link.target));
    graph.links = filteredLinks;


    svg.call(d3.zoom()
        .scaleExtent([-4, 8])
        .on("zoom", zoomed));

    svg.append("defs").selectAll("marker")
        .data(types).enter()
        .append("marker")
        .attr("id", d => `arrow-${d}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -0.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", d => color(d))
        .attr("d", "M0,-5L10,0L0,5");

    var key_y = d3.scaleOrdinal(types, d3.range(0, 15 * types.length, 15));

    var key = svg2.append("div")
        .selectAll("g")
        .data(types).enter()
        .append("table");

    var key_rects = key.append("th")
        .attr("style", function(d) {
            return "background-color:" + color(d) + ";";
        });

    var key_labels = key.append("td")
        .attr("class", "key-text")
        .text(function(d) {
            return d.replaceAll("_", " ");
        })
        .attr("data-i18n", function(d) {
            return "graph." + d.toLowerCase();
        });

    // var key_include_size = svg2.append("div").text(`${docwidth}, ${docHeight}`);

    var link = svg.append("g")
        .attr("stroke-width", 1.5)
        .attr("fill", "none")
        .selectAll("path")
        .data(graph.links)
        .enter().append("path")
        .attr("stroke", d => color(d.type))
        .attr("marker-mid", d => `url(#arrow-${d.type})`);

    var linkColors = {};
    link.each(function(d) {
        linkColors[d.target] = d3.select(this).style("stroke");
    });

    var node = svg.append("g")
        .attr("class", "nodes")
        .attr("fill", "currentColor")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .selectAll("g")
        .data(graph.nodes)
        .enter().append("g").attr("id", function(d) {
            if (d.id == wikidataid) {
                d.fx = width / 2;
                d.fy = height / 2;
            }
            return d.id;
        });
    var langArray = ["en", "fr", "ar", "es", "eo", "zh", "de", "hi"];
    var langPref = localStorage.preferred_language;
    var wikichoice = langArray.indexOf(langPref) ? `https://${langPref}.wikipedia.org` : "https://en.wikipedia.org";
    if (wikidataid) {
        var main = d3.select("#" + wikidataid);
        // console.log(wikidataid)
        var wikidataMainWiki;
        try {
            wikidataMainWiki = langArray.indexOf(langPref) ? main._groups[0][0].__data__[`${langPref}wiki`] : main._groups[0][0].__data__.enwiki;
         } catch (e){
            // console.log(e);
            wikidataid = wikidataidbackup;
            // console.log(wikidataidbackup);
            main = d3.select("#" + wikidataid);
            wikidataMainWiki = 'null';
         }

        if (wikidataMainWiki == 'null') {
            wikidataid = wikidataidbackup;
            // console.log(wikidataidbackup);
            main = d3.select("#" + wikidataid);
            wikidataMainWiki = langArray.indexOf(langPref) ? main._groups[0][0].__data__[`${langPref}wiki`] : main._groups[0][0].__data__.enwiki;
        };
        if (wikidataMainWiki.includes("wikipedia.org"))
            wikidataMainWiki = wikidataMainWiki.split('/').slice(4).join("/");

        if (wikidataMainWiki != "null") {
            let requestURL = wikichoice + "/api/rest_v1/page/html/" + wikidataMainWiki + "?redirect=true"
            $.support.cors = true;
            $.ajax({
                url: requestURL,
                headers: { 'Api-User-Agent': "admin@invisible-voice.com"}

            }).done(function(data) {
                var tempObj = document.createElement("div")
                tempObj.innerHTML = data
                var tempElement = tempObj.getElementsByClassName("infobox")[0]
                console.log(tempObj)
                wikicardframe.innerHTML = ""
                wikicardframe.appendChild(tempElement)
                tempObj.getElementsByTagName("link")[2].remove()
                wikifirstframe.innerHTML = ""
                wikifirstframe.appendChild(tempObj)

                // for (let x in data.remaining.sections) {
                //     let section = data.remaining.sections[x];
                //     if (!section.anchor) continue;
                //     if (skipsections.includes(section.anchor)) continue;
                //     text += `<p id="${section.anchor}"><h2>${section.line}</h2>` + 
                //         `${(section.text != '\n') ? `<div>${section.text.replace(/href=\"/g, 'href=\"' + wikichoice)}</div></p>` : '\n'}`;
                // }
                wikifirstframe.innerHTML = wikifirstframe.innerHTML.replace(/<img/g,'<img loading=lazy ');

                // for (var i = wikifirstframe.children.length; i-- > 0;){
                //     let child = wikifirstframe.children[i];
                //     if (child.classList.contains("infobox") || child.classList.contains("infobox_v2")) {
                //         wikicardframe.innerHTML = "";
                //         wikicardframe.appendChild(child);
                //     }
                // }
                // i18n, id, title, inId, innerHTML, icon, onclick
                var cardVars = [ 'w.companyinfo', 'profile-card', "Company Info", 'wikipedia-page', wikicardframe.innerHTML, "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'%3e%3cpath stroke='%23343434' d='M12.5 8.5h16v7h-16z'/%3e%3cpath stroke='%23343434' d='M10.5 6.5h20v27h-20z'/%3e%3cpath stroke='%23343434' d='M12.5 27.5h16v4h-16zM14 17.5h3M14 21.5h3M14 25.5h3M14 19.5h3M14 23.5h3M19 17.5h8M19 21.5h8M19 25.5h8M19 19.5h8M19 23.5h8'/%3e%3c/svg%3e", "loadWikipediaCard()"];
                var wikiVars = [ 'w.wikipedia', 'company-info', "Wikipedia", 'wikipedia-know', wikifirstframe.innerHTML, "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'%3e%3cpath stroke='%23343434' stroke-linecap='round' stroke-linejoin='round' d='M6 11.75S8.1 9 13 9s7 2.75 7 2.75V31s-2.1-1.375-7-1.375S6 31 6 31V11.75Zm14 0S22.1 9 27 9s7 2.75 7 2.75V31s-2.1-1.375-7-1.375S20 31 20 31V11.75Z'/%3e%3c/svg%3e", "loadWikipediaPage()"];
                var fullWikiUrl = `${wikichoice}/wiki/${wikidataMainWiki}`;
                [ cardVars, wikiVars ].forEach(function(itemArray){
                        var tempEl = `<h2 class='sectionTitle' id='${itemArray[1]}' data-i18n='${itemArray[0]}'>${itemArray[2]}</h2>
                                      <div class='scoreText'><div id='${itemArray[3]}' class='hideInSmall'>
                                      ${itemArray[4]}</div></div><img src="${itemArray[5]}" class='iconclass' />
                                      <a href='${fullWikiUrl}' class='source'>WIKIPEDIA</a>
                                      <button type='button' onclick='${itemArray[6]}' class='fullView' data-i18n='common.fullview'>FULL-VIEW</button>`;
                        contentsLength = document.getElementsByClassName("content").length;
                        lastContent = document.getElementsByClassName("content")[contentsLength - 1];
                        if (itemArray[1] == "profile-card") {
                            wikicardframe.innerHTML = tempEl.replace(/<img/g,'<img loading=lazy ');
                            lastContent.appendChild(wikicardframe);
                        }
                        if (itemArray[1] == "company-info") {
                            wikifirstframe.innerHTML = tempEl.replace(/<img/g,'<img loading=lazy ');
                            lastContent.appendChild(wikifirstframe);
                        }
                })

                // var profiletext = "<h2 class='sectionTitle' data-i18n='w.companyinfo' id='profile-card'>Company Info</h2>" +
                //                   "<div class='scoreText'><div id='wikipedia-page' class='hideInSmall'>" + 
                //                   `${wikicardframe.innerHTML}</div></div><img src='/icon/profile.svg' class='iconclass' />` + 
                //                   `<a href='${fullWikiUrl}' class='source blanksource'>WIKIPEDIA</a>`;
                // wikicardframe.innerHTML = profiletext.replace(/<img/g,'<img loading=lazy ');

                // var companyinfotext = "<h2 class='sectionTitle' id='company-info' data-i18n='w.wikipedia'>Wikipedia</h2>" +
                //                       "<div class='scoreText'><div id='wikipedia-know' class='hideInSmall'>" +
                //                       `${wikifirstframe.innerHTML}</div></div><img src='/icon/info.svg' class='iconclass' />` +
                //                       `<a href='${fullWikiUrl}' class='source'>WIKIPEDIA</a>`+
                //                       "<button type='button' onclick='loadWikipediaPage()' class='fullView' data-i18n='common.fullview'>FULL-VIEW</button>";

                // wikifirstframe.innerHTML = companyinfotext.replace(/<img/g,'<img loading=lazy ');

                lastContent.appendChild(wikifirstframe);
                lastContent.appendChild(wikicardframe);
                wikifirstframe.style.display = "";
                wikicardframe.style.display = "";
            }).fail(function() {
                console.log("oh no")
            });
        };
        contentsLength = document.getElementsByClassName("content").length;
        lastContent = document.getElementsByClassName("content")[contentsLength - 1];
        graphBox.innerHTML = `<h2 class='sectionTitle' id='graph-box-interior'>Network Graph</h2>
                             <img src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'%3e%3ccircle cx='16.5' cy='14.5' r='7' stroke='%23343434'/%3e%3ccircle cx='30.5' cy='9.5' r='3' stroke='%23343434'/%3e%3ccircle cx='10' cy='26' r='3.5' stroke='%23343434'/%3e%3ccircle cx='19' cy='31' r='2.5' stroke='%23343434'/%3e%3ccircle cx='29' cy='28' r='4.5' stroke='%23343434'/%3e%3cpath stroke='%23343434' d='m23.154 12.271 4.571-1.632M21.195 19.86l4.597 4.95M11.316 22.749l1.431-2.453M24.739 29.343 21 30.5'/%3e%3c/svg%3e" class='iconclass'/>
                             <a href='https://wikidata.org/wiki/${wikidataid}' class='source blanksource'>WIKIDATA</a>`;
        lastContent.appendChild(graphBox);
        if (graphBox.style.display == "none") graphBox.style.display = "";
        l1list = [];
        try {
            var matchingObjects = getObjectsBySource(wikidataid, graphCon);
            for (object in matchingObjects){
                personType = matchingObjects[object].type;
                enlabel = getNodeById(matchingObjects[object].target, graphNod)[0].label;
                l1list.push({"type": personType, "label": enlabel, "id": matchingObjects[object].target});
            }
        } catch(e) {
            var matchingObjects = getObjectsBySource(wikidataidbackup, graphCon);
            for (object in matchingObjects){
                personType = matchingObjects[object].type;
                enlabel = getNodeById(matchingObjects[object].target, graphNod)[0].label;
                l1list.push({"type": personType, "label": enlabel, "id": matchingObjects[object].target});
            }
        }
        sortedl1list = l1list.sort(sort_byg("id", true, String));
        l1list_ids = [];
        var list = document.createElement('div');
        list.setAttribute('class', 'graphList');
        graphBox.childNodes[0].classList.add("noShowTitle");
        graphBox.getElementsByTagName('img')[0].classList.add("graphIconOffset");
        for (item in sortedl1list){
            itemData = sortedl1list[item];
            if (!l1list_ids.includes(itemData.id)){
            listItem = document.createElement('li');
            listItem.innerHTML = 
                    `<div class="graphListName" >${itemData.label}</div>` + 
                    `<i>${itemData.type.replaceAll('_', ' ').replaceAll(' of', '')}</i>`;
            list.appendChild(listItem);
            l1list_ids.push(itemData.id);
            }
        }
        graphBox.appendChild(list)
    };


    var circles = node.append("a").attr("href", function(d) {
            var wikidataWiki = "";
            wikidataWiki = langArray.indexOf(langPref) ? d[`${langPref}wiki`] : d.enwiki;
            if (wikidataWiki.includes("wikipedia.org")) wikidataWiki = wikidataWiki.split('/').slice(4).join("/");
            return (wikidataWiki != "null") ? wikichoice + "/wiki/" + wikidataWiki : "https://wikidata.org/wiki/" + d.id;
        }).attr("target", "_blank")
        .on('click', function(d, i) {
            document.getElementById("graphButtons").setAttribute("style", "")
            var wikidataWiki;
            wikidataWiki = langArray.indexOf(langPref) ? i[`${langPref}wiki`] : d.enwiki;
            if (wikidataWiki == "null") return
            if (wikidataWiki.includes("wikipedia.org")) wikidataWiki = wikidataWiki.split('/').slice(4).join("/");

            d.preventDefault();
            // console.log("clicking on", this, wikidataWiki);
            let requestURL = `${wikichoice}/api/rest_v1/page/mobile-sections/${wikidataWiki}?redirect=true`;
            if (wikiframe.style.display == "none") {
                wikiframe.style.display = "block";
                titlebar.style.transform = "translate(0, -200px)";
                keyDiv.style.transform = "translate(0, -200px)";
                wikiframe.classList.add("floating")
                wikiframeclose.style.display = "block";
            }
            $.ajax({
                url: requestURL,
                dataType: "jsonp",
                headers: { 'Api-User-Agent': "admin@invisible-voice.com"}
            }).done(function(data) {
                var text = data.lead.sections[0].text.replace(/href=\"/g, 'href=\"' + wikichoice);
                for (let x in data.remaining.sections) {
                    let section = data.remaining.sections[x];
                    if (!section.anchor) continue;
                    if (skipsections.includes(section.anchor)) {
                        continue;
                    }
                    let item = '<p id="' +
                        section.anchor +
                        '"><h2>' +
                        section.line +
                        '</h2><div>' +
                        section.text.replace(/href=\"/g, 'href=\"' + wikichoice) +
                        '</div></p>';
                    text += item;

                }
                var title = '<div class="sectionTitle" style="font-variation-settings:\'wght\'500;">' + data.lead.normalizedtitle + '</div>';
                wikiframe.innerHTML = title + text;
            }).fail(function() {
                console.log("oh no")
            });

        })

    var rects = circles.append("rect")
        .attr("fill", function(d) {
            return (d.id == wikidataid) ? "var(--c-background)" : "var(--c-light-text)";
        })
        .attr("ry", "4")
        .attr("rx", "4")
        .attr("text-anchor", "center")
        .attr("class", function(d) {
            return d.groups.toString().replace(/,/g, ' ');
        });

    var lables = circles.append("text")
        .attr("class", "label-text")
        .attr("text-anchor", "middle")
        .attr("fill", function(d) {
            return (d.id == wikidataid) ? "var(--c-light-text)" : "var(--c-background)";
        })
        .attr("z-index", function(d) {
            return (d.groups.includes("Q5")) ? "100" : "101";
        })
        .attr("font-size", function(d) {
            if (d.id == wikidataid) return "18px";
            return (d.groups.includes("Q5")) ? "6px" : "10px";
        })
        .text(function(d) {
            return d.label;
        });


    node.selectAll('rect')
    .attr('width', function(d) { return (document.getElementById(d.id).getBBox().width) + 32; })
    .attr('height', function(d) { return (document.getElementById(d.id).getBBox().height) + 16; })
    .attr('x', function(d) { 
        return document.getElementById(d.id).getBBox().x - 16; 
    })
    .attr('y', function(d) { 
        return document.getElementById(d.id).getBBox().y - 8; 
    }).style("stroke", function(d) { 
        return ( d.id == wikidataid ) ? "var(--c-light-text)" : linkColors[d.id]; 
    });

    // Create a drag handler and append it to the node object instead
    var drag_handler = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged);
    // .on("end", dragended);

    drag_handler(node);

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked)

    simulation.force("link")
        .links(graph.links);

    function ticked(){
        link.attr("d", linkArc)
        // node.attr("transform", function(d) {
        //     var b = document.getElementById(d.id).getBBox();

		//     var diffX = d.x - b.x;
		//     var diffY = d.y - b.y;
		//     var dist = Math.sqrt(diffX * diffX + diffY * diffY);
		//     var shiftX = b.width * (diffX - dist) / (dist * 2);
		//     var shiftY = b.height * (diffY - dist) / (dist * 2);
        //     return "translate(" + (shiftX+d.x) + "," + (shiftY+d.y) + ")";
        // })
        node.attr("transform", function(d) { 
		 			return "translate(" + d.x + "," + d.y + ")";});
    };
});

function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
    d.fixed = true;
}

// function dragended(event,d) {
//   if (!event.active) simulation.alphaTarget(0);
//   d.fx = null;
//   d.fy = null;
// }
function linkArc(d) {
    //const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    const r = 0;
    return `
        M${d.source.x},${d.source.y}
        A${r},${r} 0 0,1 ${(d.source.x+d.target.x)/2},${(d.source.y+d.target.y)/2}
        M${(d.source.x+d.target.x)/2},${(d.source.y+d.target.y)/2}
        A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
      `;
}
