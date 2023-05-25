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


wikiframeclose.onclick = function() {
    wikiframe.style.display = "none";
    wikiframeclose.style.display = "none";
    wikiframeclose.style.display = "none";
    wikiframe.classList.remove("floating")
    titlebar.style.transform = "";
    keyDiv.style.transform = "";
    document.getElementById("graphButtons").setAttribute("style", "top: 12px;")
};

function getMyCentroid(element) {
    var bbox = element.getBBox();
    return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
}

function getMostCommon(array) {
    var count = {};
    array.forEach(function(a) {
        count[a] = (count[a] || 0) + 1;
    });
    // console.log(count);
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

d3.json(graphLoc).then(function(graph) {
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


    var urls = [];
    for (var i = document.links.length; i-- > 0;)
        if (document.links[i].hostname.match(/wikidata/))
            urls.push(document.links[i].href)

    var ids = [];
    for (var i = urls.length; i-- > 0;)
        ids.push(urls[i].replace(/#.*/g, "").replace(/.*\//, ""))

    var wikidataid = getMostCommon(ids)[0];
    if (wikidataid == "Q") wikidataid = getMostCommon(ids);
    var wikidataidbackup = getMostCommon(ids)[1];
    if (wikidataidbackup == "Q") wikidataidbackup = getMostCommon(ids);
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
    var wikichoice;
    switch (localStorage.preferred_language) {
        case "en":
            wikichoice = "https://en.wikipedia.org"
            break;
        case "fr":
            wikichoice = "https://fr.wikipedia.org";
            break;
        case "ar":
            wikichoice = "https://ar.wikipedia.org";
            break;
        case "es":
            wikichoice = "https://es.wikipedia.org";
            break;
        case "eo":
            wikichoice = "https://eo.wikipedia.org";
            break;
        case "zh":
            wikichoice = "https://zh.wikipedia.org";
            break;
        case "de":
            wikichoice = "https://de.wikipedia.org";
            break;
        case "hi":
            wikichoice = "https://hi.wikipedia.org";
            break;
        default:
            wikichoice = "https://en.wikipedia.org";
    }

    if (wikidataid) {
        var main = d3.select("#" + wikidataid);
        // console.log(wikidataid)
        var wikidataMainWiki;
        try {
        switch (localStorage.preferred_language) {
            case "hi":
                wikidataMainWiki = main._groups[0][0].__data__.hiwiki;
                break;
            case "fr":
                wikidataMainWiki = main._groups[0][0].__data__.frwiki;
                break;
            case "ar":
                wikidataMainWiki = main._groups[0][0].__data__.arwiki;
                break;
            case "zh":
                wikidataMainWiki = main._groups[0][0].__data__.zhwiki;
                break;
            case "en":
                wikidataMainWiki = main._groups[0][0].__data__.enwiki;
                break;
            case "es":
                wikidataMainWiki = main._groups[0][0].__data__.eswiki;
                break;
            case "eo":
                wikidataMainWiki = main._groups[0][0].__data__.eowiki;
                break;
            default:
                wikidataMainWiki = main._groups[0][0].__data__.enwiki;
        }
         } catch (e){
            // console.log(e);
            wikidataid = wikidataidbackup;
            // console.log(wikidataidbackup);
            main = d3.select("#" + wikidataid);
            switch (localStorage.preferred_language) {
                case "hi":
                    wikidataMainWiki = main._groups[0][0].__data__.hiwiki;
                    break;
                case "fr":
                    wikidataMainWiki = main._groups[0][0].__data__.frwiki;
                    break;
                case "ar":
                    wikidataMainWiki = main._groups[0][0].__data__.arwiki;
                    break;
                case "zh":
                    wikidataMainWiki = main._groups[0][0].__data__.zhwiki;
                    break;
                case "en":
                    wikidataMainWiki = main._groups[0][0].__data__.enwiki;
                    break;
                case "es":
                    wikidataMainWiki = main._groups[0][0].__data__.eswiki;
                    break;
                case "eo":
                    wikidataMainWiki = main._groups[0][0].__data__.eowiki;
                    break;
                default:
                    wikidataMainWiki = main._groups[0][0].__data__.enwiki;
            }
         }

        if (wikidataMainWiki == 'null') {
            wikidataid = wikidataidbackup;
            // console.log(wikidataidbackup);
            main = d3.select("#" + wikidataid);
            switch (localStorage.preferred_language) {
                case "hi":
                    wikidataMainWiki = main._groups[0][0].__data__.hiwiki;
                    break;
                case "fr":
                    wikidataMainWiki = main._groups[0][0].__data__.frwiki;
                    break;
                case "ar":
                    wikidataMainWiki = main._groups[0][0].__data__.arwiki;
                    break;
                case "zh":
                    wikidataMainWiki = main._groups[0][0].__data__.zhwiki;
                    break;
                case "en":
                    wikidataMainWiki = main._groups[0][0].__data__.enwiki;
                    break;
                case "es":
                    wikidataMainWiki = main._groups[0][0].__data__.eswiki;
                    break;
                case "eo":
                    wikidataMainWiki = main._groups[0][0].__data__.eowiki;
                    break;
                default:
                    wikidataMainWiki = main._groups[0][0].__data__.enwiki;
            }
        };
        if (wikidataMainWiki.includes("wikipedia.org")) {
            wikidataMainWiki = wikidataMainWiki.split('/').slice(4).join("/");
        };
        if (wikidataMainWiki != "null") {
            let requestURL = wikichoice + "/api/rest_v1/page/mobile-sections/" + wikidataMainWiki + "?redirect=true"
            let skipsections = ["See_also", "References", "Further_reading", "External_links", "Sources", "undefined"];
            $.ajax({
                url: requestURL
            }).done(function(data) {
                var text = "";
                text += data.lead.sections[0].text.replace(/href=\"/g, 'href=\"' + wikichoice);
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
                        '</h2>'
                    if (section.text != '\n') {
                        item += '<div>' +
                            section.text.replace(/href=\"/g, 'href=\"' + wikichoice) +
                            '</div></p>';
                    };
                    text += item;
                }
                wikifirstframe.innerHTML = text.replace(/<img/g,'<img loading=lazy ');
                for (var i = wikifirstframe.children.length; i-- > 0;){
                    if (wikifirstframe.children[i].classList.contains("infobox")) {
                        // console.log(wikifirstframe.children[i])
                        wikicardframe.innerHTML = "";
                        wikicardframe.appendChild(wikifirstframe.children[i]);
                    }
                    if (wikifirstframe.children[i].classList.contains("infobox_v2")) {
                        // console.log(wikifirstframe.children[i])
                        wikicardframe.innerHTML = "";
                        wikicardframe.appendChild(wikifirstframe.children[i]);
                    }
                }
                var profiletext = "<h2 class='sectionTitle' data-i18n='w.companyinfo' id='profile-card'>Company Info</h2><div class='scoreText'><div id='wikipedia-page' class='hideInSmall'>";
                profiletext += wikicardframe.innerHTML + "</div></div><img src='/icon/profile.svg' class='iconclass' /><table><td><a href='" + wikichoice + "/wiki/" + wikidataMainWiki + "' class='source blanksource'>WIKIPEDIA</a></td></table>";
                wikicardframe.innerHTML = profiletext.replace(/<img/g,'<img loading=lazy ');
                var companyinfotext = "<h2 class='sectionTitle' id='company-info' data-i18n='w.wikipedia'>Wikipedia</h2><div class='scoreText'><div id='wikipedia-know' class='hideInSmal'>";
                companyinfotext += wikifirstframe.innerHTML + "</div></div><img src='/icon/info.svg' class='iconclass' /><table><td><a href='" + wikichoice + "/wiki/" + wikidataMainWiki + "' class='source'>WIKIPEDIA</a></td></table><button type='button' onclick='loadWikipediaPage()' class='fullView' data-i18n='common.fullview'>FULL-VIEW</button>";
                wikifirstframe.innerHTML = companyinfotext;
            }).fail(function() {
                console.log("oh no")
            });
            contentsLength = document.getElementsByClassName("content").length;
            lastContent = document.getElementsByClassName("content")[contentsLength - 1];

            lastContent.appendChild(wikifirstframe);
            lastContent.appendChild(wikicardframe);
            if (wikifirstframe.style.display == "none") {
                wikifirstframe.style.display = "";
            }
            if (wikicardframe.style.display == "none") {
                wikicardframe.style.display = "";
            }
        };
        contentsLength = document.getElementsByClassName("content").length;
        lastContent = document.getElementsByClassName("content")[contentsLength - 1];
        graphBox.innerHTML = "<h2 class='sectionTitle' id='graph-box-interior'>Network Graph</h2><img src='/icon/network.svg' class='iconclass'/><table><td><a href='https://wikidata.org/wiki/" + wikidataid + "' class='source blanksource'>WIKIDATA</a></td></table";
        lastContent.appendChild(graphBox);
        if (graphBox.style.display == "none") {
            graphBox.style.display = "";
        }

    };


    var circles = node.append("a").attr("href", function(d) {
            var wikidataWiki = "";
            switch (localStorage.preferred_language) {
                case "hi":
                    wikidataWiki = d.hiwiki;
                    break;
                case "zh":
                    wikidataWiki = d.zhwiki;
                    break;
                case "en":
                    wikidataWiki = d.enwiki;
                    break;
                case "de":
                    wikidataWiki = d.dewiki;
                    break;
                case "es":
                    wikidataWiki = d.eswiki;
                    break;
                case "ar":
                    wikidataWiki = d.arwiki;
                    break;
                case "fr":
                    wikidataWiki = d.frwiki;
                    break;
                case "eo":
                    wikidataWiki = d.eowiki;
                    break;
                default:
                    wikidataWiki = d.enwiki;
            };
            if (wikidataWiki.includes("wikipedia.org")) {
                wikidataWiki = wikidataWiki.split('/').slice(4).join("/");
            };
            if (wikidataWiki != "null") {
                return wikichoice + "/wiki/" + wikidataWiki;
            } else {
                return "https://wikidata.org/wiki/" + d.id;
            }
            return "#"
        }).attr("target", "_blank")
        .on('click', function(d, i) {
            document.getElementById("graphButtons").setAttribute("style", "")
            var wikidataWiki;
            switch (localStorage.preferred_language) {
                case "hi":
                    wikidataWiki = i.hiwiki;
                    break;
                case "zh":
                    wikidataWiki = i.zhwiki;
                    break;
                case "de":
                    wikidataWiki = i.dewiki;
                    break;
                case "en":
                    wikidataWiki = i.enwiki;
                    break;
                case "es":
                    wikidataWiki = i.eswiki;
                    break;
                case "fr":
                    wikidataWiki = i.frwiki;
                    break;
                case "ar":
                    wikidataWiki = i.arwiki;
                    break;
                case "eo":
                    wikidataWiki = i.eowiki;
                    break;
                default:
                    wikidataWiki = i.enwiki;
            };
            if (wikidataWiki.includes("wikipedia.org")) {
                wikidataWiki = wikidataWiki.split('/').slice(4).join("/");
            };
            if (wikidataWiki == "null") {
                return
            }
            d.preventDefault();
            // console.log("clicking on", this, wikidataWiki);
            let requestURL = wikichoice + "/api/rest_v1/page/mobile-sections/" + wikidataWiki + "?redirect=true"
            let skipsections = ["See_also", "References", "Further_reading", "External_links", "Sources", "undefined"];
            if (wikiframe.style.display == "none") {
                wikiframe.style.display = "block";
                titlebar.style.transform = "translate(0, -200px)";
                keyDiv.style.transform = "translate(0, -200px)";
                wikiframe.classList.add("floating")
                wikiframeclose.style.display = "block";
            }
            $.ajax({
                url: requestURL
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
            if (d.id == wikidataid) {
                return "var(--c-background)";
            } else {
                return "var(--c-light-text)";
            }

        })
    //     .attr("stroke", function(d) {
    //         if (d.id == wikidataid) {
    //             return "var(--c-background)";
    //         } else {
    //             return "var(--c-light-text)";
    //         }

    //     })
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
            if (d.id == wikidataid) {
                return "var(--c-light-text)";
            } else {
                return "var(--c-background)";
            }

        })
        .attr("z-index", function(d) {
            if (d.groups.includes("Q5")) {
                return "100";
            } else {
                return "101";
            }
        })
        .attr("font-size", function(d) {
            if (d.id == wikidataid){
                return "18px";
            } else {
                if (d.groups.includes("Q5")) {
                    return "6px";
                } else {
                    return "10px";
                }
            }
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
        if ( d.id == wikidataid ){
            return "var(--c-light-text)";
        }
        return linkColors[d.id]; 
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
