if (Url.get.debug == 'true') {
    debug = true;
}

const wikiframe = document.getElementById("wikipedia-frame");
const titlebar = document.getElementById("titlebar");
const wikiframeclose = document.getElementById("wikipedia-frame-close");
let wikicardframe = document.getElementById("wikipedia-infocard-frame");
let wikifirstframe = document.getElementById("wikipedia-first-frame");
let graphBox = document.getElementById("graph-box");
const currentDomain = `${window.location.protocol}//${window.location.host}`;
const langArray = ["en", "fr", "ar", "es", "eo", "zh", "de", "hi"];
const langPref = localStorage.preferred_language;
const wikichoice = langArray.indexOf(langPref) ? `https://${langPref}.wikipedia.org` : "https://en.wikipedia.org";

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
const graph = new MultiDirectedGraph();
const renderer = new Sigma(graph, container, initialSettings = {
    minEdgeThickness: 1,
    renderEdgeLabels: true,
    enableEdgeHoverEvents: "debounce",
    allowInvalidContainer: true,
    defaultEdgeType: "straight",
    edgeProgramClasses: {
        curved: EdgeCurvedArrowProgram,
        straight: EdgeArrowProgram,
    },
    labelColor: { attribute: "labelColorOveride" },
    edgeLabelColor: { color: "lightgrey" },
    zIndex: 3,
    hideLabelsOnMove: true,
    hideEdgesOnMove: true,
});
const layout = new FA2Layout(graph, {
    settings: {
        gravity: 0.04,
        scalingRatio: 1,
        outboundAttractionDistribution: true,
        strongGravityMode: false,
        linlogMode: true,
        adjustSizes: true,
        slowDown: 0.1,
    }
});
renderer.camera.ratio = 0.69;

function zoomReset() {
    renderer.camera.animate({ x: 0.5, y: 0.5, ratio: 0.69 }, { duration: 150 });
}
function zoomIn() {
    renderer.camera.animatedZoom();
}
function zoomOut() {
    renderer.camera.animatedUnzoom();
}

//addNewFile(connectionsFile, true, 0, 0, wikidataid)

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
    actualNode = node
    graph.forEachNode((node) => {
        if (node != actualNode && !graph.areDirectedNeighbors(actualNode, node)) {
            graph.mergeNodeAttributes(node, {
                color: "transparent",
                size: 0,
                labelColorOveride: "transparent",
            });
        }
    });
    graph.forEachEdge(
        (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
            graph.mergeEdgeAttributes(edge, {
                size: (source == actualNode || target == actualNode) ? 1 : 0,
                color: (source == actualNode || target == actualNode) ? "orangered" : "transparent",
            })
        });
    resetColorOfNode(node, true);
    layout.stop()

})

renderer.on("leaveNode", ({ node }) => {
    graph.forEachDirectedEdge(edge => graph.mergeEdgeAttributes(edge, { size: 1, color: "lightgrey" }))
    resetNodeStyles();
    layout.start()
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
        const { x, y, defSite, wiki } = graph.getNodeAttributes(draggedNode);
        debugLogging(`Clicked on ${draggedNode} ${defSite} ${wiki}`)
        if (defSite == "null" || typeof (defSite) == 'undefined') {
            wikipediaPanel(draggedNode)
        } else {
            getDocumentIndex(defSite, x, y, draggedNode);
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
    document.getElementById("content")[0].appendChild(graphBox)
}

function getDocumentIndex(documentIndex, localX = 0, localY = 0, wikidataid = null) {
    loadPageCore(`/db/${documentIndex}.json`, localX, localY, wikidataid)
}


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
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error(error));
}

function calculateNodeSize(neighborsLength, divisor = 4, minSize = 4) {
    return minSize + (neighborsLength / divisor);
};

function changeNodeScale(divisor, minSize = 4) {
    resetNodeStyles(divisor, minSize);
}

// var langArray = ["en", "fr", "ar", "es", "eo", "zh", "de", "hi"];
function getLabel(node, lang = langPref) {
    if (lang === "en") {
        return node.label;
    } else {
        const label = node['labels'][lang];
        if (label !== 'null') {
            return label;
        } else {
            for (const langCode of langArray) {
                if (langCode !== "en") {
                    const lc = langCode;
                    const possibleLabel = node['labels'][lc];
                    if (possibleLabel !== 'null') {
                        return possibleLabel;
                    }
                }
            }
        }
    }
    return "null";
}
function getWiki(node, lang = langPref) {
    const wiki = node['wiki'][`${lang}wiki`];
    if (typeof wiki === 'undefined') return;
    if (wiki == 'null') {
        const possibleWiki = langArray.map((lang) => {
            if (node['wiki'][`${lang}wiki`] != 'null')
                return `https://${lang}.wikipedia.org/wiki/${node['wiki'][`${lang}wiki`].replaceAll(" ", "%20")}`;
        }).filter(Boolean);
        return possibleWiki.length == 0 ? "null" : possibleWiki[0];
    }
    return `${wikichoice}/wiki/${wiki.replaceAll(" ", "%20")}`;
}

function getCurvature(index, maxIndex) {
    if (maxIndex <= 0) throw new Error("Invalid maxIndex");
    if (index < 0) return -getCurvature(-index, maxIndex);
    const amplitude = 3.5;
    const maxCurvature = amplitude * (1 - Math.exp(-maxIndex / amplitude)) * 0.25;
    return (maxCurvature * index) / maxIndex;
}

const mistakenGroups = ["Q196600", "Q1186399", "Q1186399", "Q5398426"]
function addNewFile(jsonloc, original = false, localX = 0, localY = 0, wikidataid = null, fulllist = null) {
    if (debug) console.log(`addNewFile ${jsonloc}`)
    loadJSON(jsonloc, (data) => {
        const { nodes, links } = data;
        // Iterating through nodes
        const numberOfNodes = nodes.length;
        const labelColorOveride = (detectDarkMode) ? "#FFF" : "#000";
        const defSiteColor = (original ? "#FF0000" : "#FF00FF");
        const defSiteColorAlt = (original ? "#008080" : "#008000");
        let nodesToAdd = []
        nodes.map((node) => {
            const { id, defSite, groups } = node;
            if (graph.hasNode(id)) return;
            if (mistakenGroups.some(group => groups.includes(group))) {
                debugLogging(`Skipping ${id} ${groups}`);
                return;
            }
            const label = getLabel(node)
            const wiki = getWiki(node)
            const color = (defSite == 'null' || typeof (defSite) == 'undefined') ? defSiteColorAlt : defSiteColor;
            if (label == 'null' && debug) console.log(`No label for ${id}`)
            nodesToAdd.push({
                key: id, attributes: {
                    id, original,
                    x: localX + (Math.random() * numberOfNodes) - numberOfNodes / 4,
                    y: localY + (Math.random() * numberOfNodes) - numberOfNodes / 4,
                    size: 1,
                    label, color, labelColorOveride,
                    defSite, wiki, groups, originalNodeColor: color
                }
            })
        });
        graph.import(data = {
            nodes: nodesToAdd
        }, merge = true)
        // Iterating through links
        links.map((link) => {
            const { source, target, type } = link;
            if (graph.hasNode(source) && graph.hasNode(target)) {
                const label = type.replaceAll("_", " ")
                let potentialEdge = graph.hasDirectedEdge(source, target);
                if (!potentialEdge) {
                    graph.addDirectedEdge(source, target, {
                        size: 1, label,
                        color: "lightgrey"
                    })
                } else {
                    //     potentialEdge = graph.getDirectedEdgeAttributes(link.source, link.target);
                    //     if (potentialEdge.label != label) {
                    //         graph.addDirectedEdge(link.source, link.target, {
                    //             size: 1, label,
                    //             color: "lightgrey"
                    //         })
                    //     }
                }

            }
        });
        graph.forEachNode((nodeId) => {
            const neighbors = graph.neighbors(nodeId);
            if (neighbors.length == 0) {
                graph.dropNode(nodeId);
                return
            }
            if (neighbors.length == 1) {
                const singleNeighbourId = graph.neighbors(nodeId)[0]
                const { x, y, size } = graph.getNodeAttributes(singleNeighbourId)
                graph.mergeNodeAttributes(nodeId, {
                    x: x + 1 + size, y: y + 1 + size
                })
                return
            }
            graph.setNodeAttribute(nodeId, "size", calculateNodeSize(neighbors.length));
        });
        settingsReset = forceAtlas2.inferSettings(graph);

        layout.settings = { ...layout.settings, ...settingsReset }

        indexParallelEdgesIndex(graph, {
            edgeIndexAttribute: "parallelIndex",
            edgeMinIndexAttribute: "parallelMinIndex",
            edgeMaxIndexAttribute: "parallelMaxIndex",
        });

        graph.forEachEdge((edge, { parallelIndex, parallelMinIndex, parallelMaxIndex }) => {
            let type;
            if (typeof parallelMinIndex == "number") {
                type = parallelIndex == 0 ? "straight" : "curved";
            } else if (typeof parallelIndex == "number") {
                type = "curved";
            } else {
                graph.mergeEdgeAttributes(edge, {
                    type: "straight",
                    size: 1,
                });
                return
            }
            graph.mergeEdgeAttributes(edge, {
                type,
                curvature: getCurvature(parallelIndex, parallelMaxIndex),
                size: 1,
            });
        });
        getWikipediaPage(wikidataid, fulllist)
    });
}
function resetColorOfNode(nodeId, invert = false) {
    const node = graph.getNodeAttributes(nodeId);
    const labelColorSwitch = (detectDarkMode) ? !invert : invert;
    graph.mergeNodeAttributes(nodeId, {
        color: node.originalNodeColor,
        labelColorOveride: labelColorSwitch ? "#FFF" : "#000"
    });
}
function resetNodeStyles(divsor = 4, minSize = 4) {
    graph.forEachNode((nodeId) => {
        const neighbors = graph.neighbors(nodeId)
        const originalNodeColor = graph.getNodeAttribute(nodeId, "originalNodeColor");
        graph.mergeNodeAttributes(nodeId, {
            size: calculateNodeSize(neighbors.length, divsor, minSize),
            color: originalNodeColor,
            labelColorOveride: (detectDarkMode) ? "#FFF" : "#000"
        });
    });
}

function adjustGravity(newGravity) {
    layout.settings.gravity = newGravity;
    layout.start();
}

function adjustLinkLength(newLinkLength) {
    layout.settings.scalingRatio = newLinkLength;
    layout.start();
}

function getWikipediaPage(id, fulllist = false) {
    let node;
    console.log(`getWikipediaPage ${id} ${fulllist}`);
    try {
        node = graph.getNodeAttributes(id);
    } catch (e) {
        if (fulllist) {
            let currentChoice = '';
            let minNumber = Infinity;
            for (const nodeId of fulllist) {
                if (!graph.hasNode(nodeId)) continue;
                const asNumber = parseInt(nodeId.replace("Q", ""));
                if (asNumber && asNumber < minNumber) {
                    minNumber = asNumber;
                    currentChoice = nodeId;
                }
            }
            console.log(`newid ${currentChoice}`);
            node = graph.getNodeAttributes(currentChoice);
            id = currentChoice;
        } else {
            const numberList = graph.nodes().map(nodeId => parseInt(nodeId.replace("Q", ""))).filter(Number.isInteger).sort((a, b) => a - b);
            const newid = `Q${numberList[0]}`;
            node = graph.getNodeAttributes(newid);
            id = newid;
        }
    }
    const wikiPage = node.wiki.split('/').slice(4);
    const rootWiki = node.wiki.split('/').reverse().slice(-3)[0];
    const wikichoice = `https://${rootWiki}`;
    const requestURL = `${wikichoice}/api/rest_v1/page/html/${wikiPage}?redirect=true`;
    const content = document.getElementById("content");

    if (debug) console.log(node);
    if (wikiPage[0]) {
        let wikicardframe = document.getElementById("wikipedia-infocard-frame") || document.createElement("section");
        let wikifirstframe = document.getElementById("wikipedia-first-frame") || document.createElement("section");
        if (debug) console.log(wikiPage);
        if (debug) console.log(requestURL);
        fetch(requestURL, {
            headers: { 'Api-User-Agent': "admin@invisible-voice.com" },
            mode: 'cors',
        }).then(response => response.text()).then(data => {
            wikicardframe.id = "wikipedia-infocard-frame";
            wikicardframe.classList.add("contentSection");
            wikifirstframe.id = "wikipedia-first-frame";
            wikifirstframe.classList.add("contentSection");
            const tempObj = document.createElement("div");
            tempObj.innerHTML = data;
            const tempElement = tempObj.getElementsByClassName("infobox")[0];
            wikicardframe.innerHTML = "";
            let skipProfileCard = false;
            if (tempElement != undefined) {
                wikicardframe.appendChild(tempElement);
            } else {
                skipProfileCard = true;
            }
            const tagsToRemove = ["link", "meta", "base", "title", "script", "style"];
            tagsToRemove.forEach(tag => {
                while (tempObj.getElementsByTagName(tag).length > 0) {
                    tempObj.getElementsByTagName(tag)[0].remove();
                }
            });
            const tagsToRemoveEmpties = ["p", "div"];
            tagsToRemoveEmpties.forEach(tag => {
                const elements = tempObj.getElementsByTagName(tag);
                Array.from(elements).forEach((element) => {
                    if (element.innerText.trim() === "") element.remove();
                });
            });
            if (debug) console.log(tempObj);
            wikifirstframe.innerHTML = "";
            wikifirstframe.appendChild(tempObj);
            wikifirstframe.innerHTML = wikifirstframe.innerHTML.replace(/<img/g, '<img loading=lazy ');
            const cardVars = ['w.companyinfo', 'profile-card', "Company Info", 'wikipedia-page', wikicardframe.innerHTML, "", "loadWikipediaCard()"];
            const wikiVars = ['w.wikipedia', 'company-info', "Wikipedia", 'wikipedia-know', wikifirstframe.innerHTML, "", "loadWikipediaPage()"];
            const fullWikiUrl = `${wikichoice}/wiki/${wikiPage}`;
            [cardVars, wikiVars].forEach((itemArray) => {
                const tempEl = `<h2 class='sectionTitle' id='${itemArray[1]}' data-i18n='${itemArray[0]}'>${itemArray[2]}</h2>
                  <div class='scoreText'><div id='${itemArray[3]}' class='hideInSmall'>
                  ${itemArray[4]}</div></div><div class='iconclass'></div>
                  <a href='${fullWikiUrl}' target='_blank' class='source'>WIKIPEDIA</a>`.replace(/<img/g, '<img loading=lazy ');
                if (itemArray[1] == "profile-card" && !skipProfileCard) {
                    wikicardframe.innerHTML = tempEl;
                    content.appendChild(wikicardframe);
                }
                if (itemArray[1] == "company-info") {
                    wikifirstframe.innerHTML = tempEl;
                    content.appendChild(wikifirstframe);
                }
            });
            removeSectionsWithMatchingId();
            recalculateList();
        }).catch(() => {
            if (debug) console.log("oh no");
        });
    }

    graphBox.innerHTML = `<h2 class='sectionTitle' id='graph-box-interior'>Network Graph</h2>
                         <img  src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'%3e%3ccircle cx='16.5' cy='14.5' r='7' stroke='%23343434'/%3e%3ccircle cx='30.5' cy='9.5' r='3' stroke='%23343434'/%3e%3ccircle cx='10' cy='26' r='3.5' stroke='%23343434'/%3e%3ccircle cx='19' cy='31' r='2.5' stroke='%23343434'/%3e%3ccircle cx='29' cy='28' r='4.5' stroke='%23343434'/%3e%3cpath stroke='%23343434' d='m23.154 12.271 4.571-1.632M21.195 19.86l4.597 4.95M11.316 22.749l1.431-2.453M24.739 29.343 21 30.5'/%3e%3c/svg%3e" class='iconclass'/>
                         <a style="display:none" href='https://wikidata.org/wiki/${wikidataid}' class='source blanksource' target='_blank'>WIKIDATA</a>`;
    content.appendChild(graphBox);
    if (graphBox.style.display == "none") graphBox.style.display = "";
    let l1list = [];
    graph.forEachEdge(id, (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
        if (source == id) {
            l1list.push({
                "type": attributes.label.replace(" of", ""),
                "label": targetAttributes.label,
                "id": target
            });
        }
    });
    graphBox.childNodes[0].classList.add("noShowTitle");
    graphBox.getElementsByTagName('img')[0].classList.add("graphIconOffset");

    sortedl1list = l1list.sort(sort_byg("id", true, String));
    let l1list_ids = [];
    const list = document.createElement('div');
    list.setAttribute('class', 'graphList');
    const listNameLimit = '5';
    for (let i = 0; i < listNameLimit; i++) {
        const itemData = sortedl1list[i];
        if (!itemData) break;
        if (!l1list_ids.includes(itemData.id)) {
            const listItem = document.createElement('span');
            listItem.innerHTML =
                `<div class="graphListName" >${itemData.label}</div>` +
                `<div class="graphListRel">${itemData.type.replaceAll('_', ' ').replaceAll(' of', '')}</div>`;
            list.appendChild(listItem);
            l1list_ids.push(itemData.id);
        }
    }
    graphBox.appendChild(list);
    recalculateList();
}

function wikipediaPanel(id) {
    const node = graph.getNodeAttributes(id);
    const wikiPage = node.wiki.split('/').slice(4);
    const wikiPageTitle = decodeURIComponent(wikiPage[wikiPage.length - 1].replaceAll("_", " "));
    const rootWiki = node.wiki.split('/').reverse().slice(-3)[0];
    const requestURL = `https://${rootWiki}/api/rest_v1/page/html/${wikiPage}?redirect=true`;
    if (debug) {
        console.log(requestURL);
    }
    document.getElementById("graphButtons").setAttribute("style", "");
    fetch(requestURL, {
        headers: { 'Api-User-Agent': "admin@invisible-voice.com" },
        mode: 'cors',
    })
        .then(response => response.text())
        .then(data => {
            const tempObj = document.createElement("div");

            tempObj.innerHTML = data;
            const tagsToRemove = ["link", "meta", "base", "title", "script", "style"];
            tagsToRemove.forEach(tag => {
                while (tempObj.getElementsByTagName(tag).length > 0) {
                    tempObj.getElementsByTagName(tag)[0].remove();
                }
            });
            const tagsToRemoveEmpties = ["p", "div"];
            tagsToRemoveEmpties.forEach(tag => {
                const elements = tempObj.getElementsByTagName(tag);
                Array.from(elements).forEach((element) => {
                    if (element.innerText.trim() === "") element.remove();
                });
            });
            createGenericPopoverMenu(tempObj.outerHTML, {
                title: `${wikiPageTitle} - Wikipedia`,
                id: "wikipedia-frame",
                screenLocation: "right",
                darkenBackground: true,
                closeButton: true
            });
            removeSectionsWithMatchingId();
        })
        .catch(() => {
            if (debug) {
                console.error("oh no");
            }
        });
}
