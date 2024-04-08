let debug
Url = {
    get get() {
        const vars = {};
        if (window.location.search.length !== 0)
            window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
                key = decodeURIComponent(key);
                vars[key] = typeof vars[key] === "undefined" ? decodeURIComponent(value) : [].concat(vars[key], decodeURIComponent(value));
            });
        return vars;
    }
};
if (Url.get.debug == 'true') {
    debug = true;
}
let mode = 0;
const phoneRegexG = /Mobile/i;

if (phoneRegexG.test(navigator.userAgent)) {
    mode = 1;
    if (debug) console.log("[ Invisible Voice ]: phone mode");
    // document.getElementsByClassName("content")[0].classList.add("mobile");
}

const wikiframe = document.getElementById("wikipedia-frame");
const titlebar = document.getElementById("titlebar");
const wikiframeclose = document.getElementById("wikipedia-frame-close");
let wikicardframe = document.getElementById("wikipedia-infocard-frame");
let wikifirstframe = document.getElementById("wikipedia-first-frame");
let graphBox = document.getElementById("graph-box");
const currentDomain = `${window.location.protocol}//${window.location.host}`;
const graphLoc = document.getElementById('graphLoc').innerHTML;
const langArray = ["en", "fr", "ar", "es", "eo", "zh", "de", "hi"];
const langPref = localStorage.preferred_language;
const wikichoice = langArray.indexOf(langPref) ? `https://${langPref}.wikipedia.org` : "https://en.wikipedia.org";
let wikidataid;

wikidataidarray = JSON.parse(document.getElementById("wikidataid").textContent.replaceAll(" ", ",").replaceAll("Q", ""));
wikidataidarray.sort((a, b) => a - b);
wikidataid = `Q${wikidataidarray[0]}`

const skipsections = ["See_also", "References", "Further_reading", "External_links",
    "Sources", "undefined", "Notes", "Notes_et_références",
    "Source_de_l'entreprise", "Sources_externes", "Annexes",
    "Articles_connexes", "Liens_externes", "Referencias", "Véase_también",
    "Enlaces_externos", "Referencoj", "Eksteraj_ligiloj", "Literatur",
    "Rundfunkberichte", "Weblinks", "Einzelnachweise", "參見", "注释",
    "參考資料", "外部連結", "सन्दर्भ", "बाहरी_कड़ियाँانظر_أيضًا", "مراجع",
    "وصلات_خارجية", "انظر_أيضًا"];

function removeSectionsWithMatchingId() {
    skipsections.forEach((section) => {
        const matchingh2 = document.getElementById(section);
        if (matchingh2 != undefined) {
            matchingh2.parentNode.remove();
        }
    });
}

// Initialize Sigma.js
const container = document.getElementById("sigma-container");
container.style.order = "0";
container.style.width = "1px";
container.style.height = "1px";
const graph = new MultiDirectedGraph();
const renderer = new Sigma(graph, container, initialSettings = {
    defaultEdgeType: "arrow",
    defaultEdgeSize: 3,
    renderEdgeLabels: true,
    enableEdgeHoverEvents: "debounce",
    zIndex: 3,
});
const layout = new FA2Layout(graph, {
    "settings": {
        "gravity": 0.04,
        "scalingRatio": 1,
        "outboundAttractionDistribution": true,
        "strongGravityMode": true,
        "adjustSizes": true,
    }
});
renderer.camera.ratio = 0.69;
layout.start()

function reset() {
    renderer.camera.animate({ x: 0.5, y: 0.5, ratio: 0.69 }, { duration: 150 });
}
function zoomIn() {
    renderer.camera.animatedZoom();
}
function zoomOut() {
    renderer.camera.animatedUnzoom();
}

addNewFile(graphLoc, true, 0, 0, wikidataid)

let draggedNode;
let isDragging = false;
// On mouse down on a node
//  - we enable the drag mode
//  - save in the dragged node in the state
//  - highlight the node
//  - disable the camera so its state is not updated
renderer.on("downNode", (e) => {
    isDragging = true;
    draggedNode = e.node;
    graph.setNodeAttribute(draggedNode, "highlighted", true);
});

renderer.on("enterNode", ({ node }) => {
    graph.forEachDirectedEdge((edge) => graph.setEdgeAttribute(edge, "size", "0"))
    graph.forEachEdge(node,
        (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
            graph.setEdgeAttribute(edge, "color", "red");
            graph.setEdgeAttribute(edge, "size", 3);
        });
})

renderer.on("leaveNode", ({ node }) => {
    graph.forEachDirectedEdge((edge) => graph.setEdgeAttribute(edge, "size", ""))
    graph.forEachEdge(node,
        (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
            graph.setEdgeAttribute(edge, "color", "");
        });
})

// On mouse move, if the drag mode is enabled, we change the position of the draggedNode
renderer.getMouseCaptor().on("mousemovebody", (e) => {
    if (!isDragging || !draggedNode) return;

    // Get new position of node
    const pos = renderer.viewportToGraph(e);

    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);

    // Prevent sigma to move camera:
    e.preventSigmaDefault();
    e.original.preventDefault();
    e.original.stopPropagation();
});

// On mouse up, we reset the autoscale and the dragging mode
renderer.getMouseCaptor().on("mouseup", () => {
    if (draggedNode) {
        graph.removeNodeAttribute(draggedNode, "highlighted");
        const defSite = graph.getNodeAttribute(draggedNode, "defSite");
        const localX = graph.getNodeAttribute(draggedNode, "x");
        const localY = graph.getNodeAttribute(draggedNode, "y");
        const wiki = graph.getNodeAttribute(draggedNode, "wiki");
        if (defSite == "null" || typeof(defSite) == 'undefined') {
            if (debug) console.log(wiki)
            wikipediaPanel(draggedNode)
        } else {
            getDocumentIndex(defSite, localX, localY, draggedNode);
            if (debug) console.log(draggedNode)
        }
    }
    isDragging = false;
    draggedNode = null;
    layout.start()
});

// Disable the autoscale at the first down interaction
renderer.getMouseCaptor().on("mousedown", () => {
    if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
    layout.stop()
});

function blankWikiBoxes() {
    graphBox = document.createElement("section");
    graphBox.id = "graph-box";
    graphBox.style.display = "none";
    graphBox.classList.add("contentSection")
    graphBox.textContent = "loading..."
    graphBox.onclick = "loadNetworkGraph()"
    document.getElementsByClassName("content")[0].appendChild(graphBox)
}

function getDocumentIndex(documentIndex, localX = 0, localY = 0, wikidataid = null) {
    $.ajax({
        url: `${currentDomain}/db/${documentIndex}/index.json`,
        type: 'GET',
    }).done((data) => {
        if (debug) console.log(data)
        if ('core' in data || 'connections' in data) {
            document.getElementsByClassName("co-name")[0].innerHTML = data.title;
            contentSections = document.getElementsByClassName("content")[0].getElementsByClassName("contentSection")
            while (contentSections.length > 0) {
                contentSections[0].remove()
            }
        }
        if ('core' in data)
            for (module of data.core) {
                if (module.url == 'local') {
                    if (debug) console.log(module);
                } else {
                    addModule(type = module.type, url = `${pageHost}/ds/${module.url}`);
                }
            }
        blankWikiBoxes();
        if ('connections' in data)
            addNewFile(`${currentDomain}${data.connections}`, false, localX, localY, wikidataid)

    })
}

wikiframeclose.onclick = () => {
    wikiframe.style.display = "none";
    wikiframeclose.style.display = "none";
    wikiframeclose.style.display = "none";
    wikiframe.classList.remove("floating")
    titlebar.style.transform = "";
    document.getElementById("graphButtons").setAttribute("style", "top: 12px;")
};

const sort_byg = (field, reverse, primer) => {
    const key = primer ? (x) => primer(x[field]) : (x) => x[field];
    reverse = reverse ? -1 : 1;
    return (a, b) => (a = key(a), b = key(b), reverse * ((a > b) - (b > a)));
};


function getObjectsBySource(sourceValue, connectionList) {
    return connectionList.filter((connection) => connection.source === sourceValue);
}

function getNodeById(sourceValue, nodeList) {
    return nodeList.filter((node) => node.id === sourceValue);
}

function loadJSON(url, callback) {
    const xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open("GET", url, true);
    xobj.onreadystatechange = () => {
        if (xobj.readyState === 4 && xobj.status === 200) {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
}

// var langArray = ["en", "fr", "ar", "es", "eo", "zh", "de", "hi"];
function getLabel(node, lang = langPref) {
    // if (typeof(node) != typeof(list))
    label = (lang == "en") ? node.label : node[`${lang}label`];
    if (label == 'null') {
        possibleLabels = []
        for (lang of langArray) {
            lc = (lang == "en") ? "" : lang;
            if (node[`${lc}label`] != 'null') {
                if (debug) console.log([node[`${lc}label`], lang, "label"])
                possibleLabels.push(node[`${lc}label`])
            }
        }
        return possibleLabels.length == 0 ? "null" : possibleLabels[0];
    }
    return label
}
function getWiki(node, lang = langPref) {
    // if (typeof(node) != typeof(list))
    wiki = node[`${lang}wiki`];
    if (wiki == 'null') {
        possibleWiki = []
        for (lang of langArray) {
            if (node[`${lang}wiki`] != 'null') {
                if (debug) console.log([node[`${lang}wiki`], lang, "wiki"])
                possibleWiki.push(`https://${lang}.wikipedia.org/wiki/${node[`${lang}wiki`].replaceAll(" ", "%20")}`)
            }
        }
        if (possibleWiki.length == 0) {
            return "null"
        } else {
            if (debug) console.log(possibleWiki[0])
            return possibleWiki[0]
        }
        return;
    }
    return `${wikichoice}/wiki/${wiki.replaceAll(" ", "%20")}`
}

function addNewFile(jsonloc, original = false, localX = 0, localY = 0, wikidataid = null) {
    if (debug) console.log(wikidataid)
    loadJSON(jsonloc, (data) => {
        const links = data.links;
        const nodes = data.nodes;

        const newNodes = [];
        // Iterating through nodes
        if (debug) console.log("Nodes:");
        nodes.forEach((node) => {
            if (graph.hasNode(node.id)) {
                return;
            }
            label = getLabel(node)
            wiki = getWiki(node)

            let color;
            if (node.defSite == 'null' || typeof(node.defSite) == 'undefined') {
                color = (original) ? "teal" : "green";
            } else { color = (original) ? "red" : "magenta"; }

            console.log(node)
            if (label == 'null' && debug) console.log(`No label for ${node.id}`)
            graph.addNode(node.id, {
                x: localX + (Math.random()),
                y: localY + (Math.random()),
                size: 5,
                label,
                color,
                defSite: node.defSite,
                wiki,
                groups: node.groups,
            });
            newNodes.push(node.id);
        });
        // Iterating through links
        if (debug) console.log("Links:");
        links.forEach((link) => {
            //console.log(link);
            if ((newNodes.includes(link.source) || newNodes.includes(link.target)) && graph.hasNode(link.target)) {
                graph.addDirectedEdge(link.source, link.target, { site: 5, label: link.type.replaceAll("_", " ") })

            }
        });
        if (wikidataid != null)
            getWikipediaPage(wikidataid);
    });
}


function getWikipediaPage(id) {
    const node = graph.getNodeAttributes(id)
    const wikiPage = node.wiki.split('/').slice(4)
    const rootWiki = node.wiki.split('/').reverse().slice(-3)[0]
    const requestURL = `https://${rootWiki}/api/rest_v1/page/html/${wikiPage}?redirect=true`
    const wikichoice = `https://${rootWiki}`
    if (wikiPage[0]) {
        if (debug) console.log(wikiPage)
        if (debug) console.log(requestURL)
        $.support.cors = true;
        $.ajax({
            url: requestURL,
            headers: { 'Api-User-Agent': "admin@invisible-voice.com" }

        }).done((data) => {
            if (document.getElementById("wikipedia-infocard-frame")) {
               wikicardframe = document.getElementById("wikipedia-infocard-frame");
            } else {
                wikicardframe = document.createElement("section")
                wikicardframe.id = "wikipedia-infocard-frame"
                wikicardframe.classList.add("contentSection")
            }
            if (document.getElementById("wikipedia-first-frame")) {
                wikifirstframe = document.getElementById("wikipedia-first-frame");
            } else {
                wikifirstframe = document.createElement("section")
                wikifirstframe.id = "wikipedia-first-frame"
                wikifirstframe.classList.add("contentSection")
            }
        
            const tempObj = document.createElement("div");
            tempObj.innerHTML = data
            const tempElement = tempObj.getElementsByClassName("infobox")[0];
            if (debug) console.log(tempObj)
            wikicardframe.innerHTML = ""
            wikicardframe.appendChild(tempElement)
            tempObj.getElementsByTagName("link")[2].remove()
            wikifirstframe.innerHTML = ""
            wikifirstframe.appendChild(tempObj)
            wikifirstframe.innerHTML = wikifirstframe.innerHTML.replace(/<img/g, '<img loading=lazy ');

            // i18n, id, title, inId, innerHTML, icon, onclick
            const cardVars = ['w.companyinfo', 'profile-card', "Company Info", 'wikipedia-page', wikicardframe.innerHTML, "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'%3e%3cpath stroke='%23343434' d='M12.5 8.5h16v7h-16z'/%3e%3cpath stroke='%23343434' d='M10.5 6.5h20v27h-20z'/%3e%3cpath stroke='%23343434' d='M12.5 27.5h16v4h-16zM14 17.5h3M14 21.5h3M14 25.5h3M14 19.5h3M14 23.5h3M19 17.5h8M19 21.5h8M19 25.5h8M19 19.5h8M19 23.5h8'/%3e%3c/svg%3e", "loadWikipediaCard()"];
            const wikiVars = ['w.wikipedia', 'company-info', "Wikipedia", 'wikipedia-know', wikifirstframe.innerHTML, "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'%3e%3cpath stroke='%23343434' stroke-linecap='round' stroke-linejoin='round' d='M6 11.75S8.1 9 13 9s7 2.75 7 2.75V31s-2.1-1.375-7-1.375S6 31 6 31V11.75Zm14 0S22.1 9 27 9s7 2.75 7 2.75V31s-2.1-1.375-7-1.375S20 31 20 31V11.75Z'/%3e%3c/svg%3e", "loadWikipediaPage()"];
            const fullWikiUrl = `${wikichoice}/wiki/${wikiPage}`;
            [cardVars, wikiVars].forEach((itemArray) => {
                const tempEl = `<h2 class='sectionTitle' id='${itemArray[1]}' data-i18n='${itemArray[0]}'>${itemArray[2]}</h2>
                              <div class='scoreText'><div id='${itemArray[3]}' class='hideInSmall'>
                              ${itemArray[4]}</div></div><img src="${itemArray[5]}" class='iconclass' />
                              <a href='${fullWikiUrl}' class='source'>WIKIPEDIA</a>`;
                contentsLength = document.getElementsByClassName("content").length;
                lastContent = document.getElementsByClassName("content")[contentsLength - 1];
                if (itemArray[1] == "profile-card") {
                    wikicardframe.innerHTML = tempEl.replace(/<img/g, '<img loading=lazy ');
                    lastContent.appendChild(wikicardframe);
                }
                if (itemArray[1] == "company-info") {
                    wikifirstframe.innerHTML = tempEl.replace(/<img/g, '<img loading=lazy ');
                    lastContent.appendChild(wikifirstframe);
                }
            })
            lastContent.appendChild(wikifirstframe);
            lastContent.appendChild(wikicardframe);
            removeSectionsWithMatchingId();
            wikifirstframe.style.display = "";
            wikicardframe.style.display = "";
        }).fail(() => {
            if (debug) console.log("oh no")
        });
    }

    contentsLength = document.getElementsByClassName("content").length;
    lastContent = document.getElementsByClassName("content")[contentsLength - 1];
    graphBox.innerHTML = `<h2 class='sectionTitle' id='graph-box-interior'>Network Graph</h2>
                         <img src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'%3e%3ccircle cx='16.5' cy='14.5' r='7' stroke='%23343434'/%3e%3ccircle cx='30.5' cy='9.5' r='3' stroke='%23343434'/%3e%3ccircle cx='10' cy='26' r='3.5' stroke='%23343434'/%3e%3ccircle cx='19' cy='31' r='2.5' stroke='%23343434'/%3e%3ccircle cx='29' cy='28' r='4.5' stroke='%23343434'/%3e%3cpath stroke='%23343434' d='m23.154 12.271 4.571-1.632M21.195 19.86l4.597 4.95M11.316 22.749l1.431-2.453M24.739 29.343 21 30.5'/%3e%3c/svg%3e" class='iconclass'/>
                         <a href='https://wikidata.org/wiki/${wikidataid}' class='source blanksource'>WIKIDATA</a>`;
    lastContent.appendChild(graphBox);
    if (graphBox.style.display == "none") graphBox.style.display = "";
    l1list = [];
    entities = {}
    graph.forEachEdge(id,
        (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
            if (source == id) {
                l1list.push({
                    "type": attributes.label.replace(" of", ""),
                    "label": targetAttributes.label,
                    "id": target
                })
            }
            if (target == id) {
                // console.log(`${attributes["label"]} ${sourceAttributes["label"]}`)
            }
        });

    sortedl1list = l1list.sort(sort_byg("id", true, String));
    l1list_ids = [];
    const list = document.createElement('div');
    list.setAttribute('class', 'graphList');
    graphBox.childNodes[0].classList.add("noShowTitle");
    graphBox.getElementsByTagName('img')[0].classList.add("graphIconOffset");
    for (item in sortedl1list) {
        itemData = sortedl1list[item];
        if (!l1list_ids.includes(itemData.id)) {
            listItem = document.createElement('li');
            listItem.innerHTML =
                `<div class="graphListName" >${itemData.label}</div>` +
                `<i>${itemData.type.replaceAll('_', ' ').replaceAll(' of', '')}</i>`;
            list.appendChild(listItem);
            l1list_ids.push(itemData.id);
        }
    }
    graphBox.appendChild(list)
}

function wikipediaPanel(id) {
    const node = graph.getNodeAttributes(id)
    const wikiPage = node.wiki.split('/').slice(4)
    const rootWiki = node.wiki.split('/').reverse().slice(-3)[0]
    const requestURL = `https://${rootWiki}/api/rest_v1/page/html/${wikiPage}?redirect=true`
    if (debug) console.log(requestURL)
    document.getElementById("graphButtons").setAttribute("style", "")
    if (wikiframe.style.display == "none") {
        wikiframe.style.display = "block";
        titlebar.style.transform = "translate(0, -200px)";
        wikiframe.classList.add("floating")
        wikiframeclose.style.display = "block";
    }
    $.support.cors = true;
    $.ajax({
        url: requestURL,
        headers: { 'Api-User-Agent': "admin@invisible-voice.com" }
    }).done((data) => {
        const tempObj = document.createElement("div");
        tempObj.innerHTML = data
        tempObj.getElementsByTagName("link")[2].remove()
        wikiframe.innerHTML = ""
        wikiframe.appendChild(tempObj)
        removeSectionsWithMatchingId();
    }).fail(() => {
        if (debug) console.log("oh no")
    });
}
