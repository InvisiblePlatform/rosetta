if (Url.get.debug == 'true') {
    debug = true;
}
const langArray = ["en", "fr", "ar", "es", "eo", "zh", "de", "hi"];
const langPref = localStorage.preferred_language;
const wikichoice = langArray.indexOf(langPref) ? `https://${langPref}.wikipedia.org` : "https://en.wikipedia.org";
let wikidataid = '';

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

const graph = new MultiDirectedGraph();
function getDocumentIndex(documentIndex, localX = 0, localY = 0, wikidataid = null) {
    loadPageCore(`/db/${documentIndex}.json`, localX, localY, wikidataid)
}


const sort_byg = (field, reverse, primer) => {
    const key = primer ? (x) => primer(x[field]) : (x) => x[field];
    reverse = reverse ? -1 : 1;
    return (a, b) => (a = key(a), b = key(b), reverse * ((a > b) - (b > a)));
};

function loadJSON(url, callback) {
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error(error));
}
// var langArray = ["en", "fr", "ar", "es", "eo", "zh", "de", "hi"];
function getLabel(node, lang = langPref) {
    if (lang === "en") {
        return node.label;
    }
    const label = node.labels[lang];
    if (label === 'null') {
        for (const langCode of langArray) {
            if (langCode !== "en") {
                const possibleLabel = node.labels[langCode];
                if (possibleLabel !== 'null') {
                    return possibleLabel;
                }
            }
        }
    } else {
        return label;
    }
    return "null";
}
function getWiki(node, lang = langPref) {
    const wiki = node.wiki[`${lang}wiki`];
    if (typeof wiki === 'undefined') return;
    if (wiki == 'null') {
        const possibleWiki = langArray.map((lang) => {
            if (node.wiki[`${lang}wiki`] != 'null')
                return `https://${lang}.wikipedia.org/wiki/${node.wiki[`${lang}wiki`].replaceAll(" ", "%20")}`;
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

//const mistakenGroups = ["Q196600", "Q1186399", "Q1186399", "Q5398426"]
function addNewFile(jsonloc, original = false, localX = 0, localY = 0, wikidataid = null, fulllist = null, container = "content") {
    if (debug) console.log(`addNewFile ${jsonloc}`)
    loadJSON(jsonloc, (data) => {
        const { nodes, links } = data;
        // Iterating through nodes
        const nodesToAdd = []
        nodes.map((node) => {
            const { id, defSite, groups } = node;
            if (graph.hasNode(id)) return;
            if (mistakenGroups.some(group => groups.includes(group))) {
                debugLogging(`Skipping ${id} ${groups}`);
                return;
            }
            const label = getLabel(node)
            const wiki = getWiki(node)
            if (label == 'null' && debug) console.log(`No label for ${id}`)
            nodesToAdd.push({
                key: id, attributes: {
                    id, original,
                    x: 1,
                    y: 1,
                    size: 1,
                    label, wiki
                }
            })
        });
        graph.import(data = {
            nodes: nodesToAdd
        }, merge = true)
        // Iterating through links
        links.map((link) => {
            const { source, target, type } = link;
            if (!(graph.hasNode(source) && graph.hasNode(target))) {
                return;
            }
            const label = type.replaceAll("_", " ")
            graph.addDirectedEdge(source, target, {
                size: 1, label,
                color: "lightgrey"
            })
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
        });
        getWikipediaPage(wikidataid, fulllist, container)
    });
}
// module data format
// { "location": "url", "source": "source", "content": "content", "preview": "preview", "sourceUrl": "sourceUrl" }

function getWikipediaPage(id, fulllist = false, container = "content") {
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
    // { "location": "url", "source": "source", "content": "content", "preview": "preview", "sourceUrl": "sourceUrl" }

    const wikiPage = node.wiki.split('/').slice(4);
    const rootWiki = node.wiki.split('/').reverse().slice(-3)[0];
    const wikichoice = `https://${rootWiki}`;
    const requestURL = `${wikichoice}/api/rest_v1/page/html/${wikiPage}?redirect=true`;
    const content = document.getElementById(container);
    const wikiPageModuleObject = {
        location: `wikipage/${wikiPage}`, 
        source: wikiPage,
        content: undefined,
        preview: undefined,
        sourceUrl: "wikiurl", // full url 
    }
    const wikiCardModuleObject = {
        location: `wikicard/${wikiPage}`, 
        source: wikiPage, 
        content: undefined,
        preview: undefined,
        sourceUrl: "wikiurl", // full url 
    }
    if (wikiPage[0]) {
        const wikicardframe = document.createElement("section");
        const wikifirstframe = document.createElement("section");
        if (debug) console.log(wikiPage);
        if (debug) console.log(requestURL);
        fetch(requestURL, {
            headers: { 'Api-User-Agent': "admin@invisible-voice.com" },
            mode: 'cors',
        }).then(response => response.text()).then(data => {
            const tempObj = document.createElement("div");
            tempObj.innerHTML = data;
            const tempElement = tempObj.getElementsByClassName("infobox")[0];
            let skipProfileCard = false;
            if (tempElement == undefined) {
                skipProfileCard = true;
            } else {
                wikicardframe.appendChild(tempElement);
            }

            const pageTitle = tempObj.querySelector("title").innerText
            //wikiCardModuleObject.source = pageTitle;
            //wikiPageModuleObject.source = pageTitle;
            const queriesToRemove = ["link", "meta", "base", "title", "script", "style", "sup", "caption", ".thumb", ".tright", ".tleft", ".hatnote", ".nomobile"].join(", ");
            tempObj.querySelectorAll(queriesToRemove).forEach((e) => { e.remove() })
            if (!skipProfileCard) {
            tempElement.querySelectorAll(queriesToRemove).forEach((e) => { e.remove() })
            }
            const tagsToRemoveEmpties = ["p", "div"];
            tempObj.querySelectorAll("p, div").forEach((e) => { if (e.innerText.trim() === "") e.remove()})
            if (!skipProfileCard) tempElement.querySelectorAll("p, div").forEach((e) => { if (e.innerText.trim() === "") e.remove()})
            // We need to make all the href's absolute so they work, accounting for ./
            // we have to check via the attributes because the direct hrefs get rewritten

            tempObj.querySelectorAll("a[href^='/']").forEach((x) => { x.attributes.href.value = `${wikichoice}${x.attributes.href.value}`})
            tempObj.querySelectorAll("a[href^='./']").forEach((x) => { x.attributes.href.value = `${wikichoice}${x.attributes.href.value.slice(1)}`})

            if (!skipProfileCard) {
            tempElement.querySelectorAll("a[href^='/']").forEach((x) => { x.attributes.href.value = `${wikichoice}${x.attributes.href.value}`})
            tempElement.querySelectorAll("a[href^='./']").forEach((x) => { x.attributes.href.value = `${wikichoice}${x.attributes.href.value.slice(1)}`})
            }
            wikifirstframe.appendChild(tempObj);

            let firstHeader = "Company Info";
            let firstContent = "No data available";
            if (!skipProfileCard){
                // I need to get the data from the first row of infobox
                const infoboxRows = wikicardframe.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
                const infoboxData = [];
                Array.from(infoboxRows).forEach((row) => {
                    if (infoboxData.length > 0 ) return
                    const rowTitle = row.getElementsByTagName("th")[0];
                    const rowContent = row.getElementsByTagName("td")[0];
                    if (rowTitle && rowContent) {
                        if (!rowContent.children[0].classList.contains("plainlist"))
                            infoboxData.push([rowTitle.innerText, rowContent.innerText]);
                    }
                });

                firstHeader = infoboxData[0][0];
                firstContent = infoboxData[0][1];
            }

            firstFrameFirstP = wikifirstframe.querySelector("section[data-mw-section-id]").children[0].innerText

            const fullWikiUrl = `${wikichoice}/wiki/${wikiPage}`;
            wikiCardModuleObject.preview =`<div class='previewScore previewScoreWithTitle' style='--title:"${firstHeader}";'>${firstContent}</div>` 
            wikiCardModuleObject.content = wikicardframe.innerHTML.replace(/<img/g, '<img loading=lazy ');
            wikiCardModuleObject.sourceUrl = fullWikiUrl
            wikiCardModuleObject.source = pageTitle

            wikiPageModuleObject.preview =`<div class='previewScore previewPG'>${firstFrameFirstP}</div>` 
            wikiPageModuleObject.content = wikifirstframe.innerHTML.replace(/<img/g, '<img loading=lazy ');
            wikiPageModuleObject.sourceUrl = fullWikiUrl
            wikiPageModuleObject.source = pageTitle

            wikiCardModuleObject.content +=`<button class='scrollToTop squareButton' onclick='this.parentElement.children[0].children[0].scrollIntoView()'></button>`
            wikiPageModuleObject.content +=`<button class='scrollToTop squareButton' onclick='this.parentElement.children[0].children[0].scrollIntoView()'></button>`
            createAndAddGenericModule({ type: "wikipedia-first-frame", data: wikiPageModuleObject, container })
            createAndAddGenericModule({ type: "wikipedia-infocard-frame", data: wikiCardModuleObject, container })
            removeSectionsWithMatchingId();
            recalculateList();
        }).catch(() => {
            if (debug) console.log("oh no");
        });
    }

    const graphBoxModuleObject = {
        location: `graph/${id}`, // Should become graph/wid
        source: graph.getNodeAttributes(id).label,
        content: undefined,
        preview: undefined,
        sourceUrl: `https://www.wikidata.org/wiki/${id}`, // full url
    }
    const detailsObject = document.createElement("details");
    const summaryObject = document.createElement("summary");
    detailsObject.appendChild(summaryObject);
    const l1list = [];
    graph.forEachEdge(id, (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
        if (source == id) {
            l1list.push({
                "type": attributes.label.replace(" of", ""),
                "label": targetAttributes.label,
                "id": target
            });
        }
    });
    sortedl1list = l1list.sort(sort_byg("id", true, String));
    const l1list_ids = [];
    const list = document.createElement('div');
    list.setAttribute('class', 'previewContainer previewGraph');
    const listNameLimit = '5';
    for (let i = 0; i < listNameLimit; i++) {
        const itemData = sortedl1list[i];
        if (!itemData) break;
        if (!l1list_ids.includes(itemData.id)) {
            const listItem = document.createElement('span');
            listItem.innerHTML =
                `<div class="graphListName">${itemData.label}</div>` +
                `<div class="graphListRel relation ${itemData.type.toLowerCase().replace(" ","_")}_of">${itemData.type.replaceAll('_', ' ').replaceAll(' of', '')}</div>`;
            list.appendChild(listItem);
            l1list_ids.push(itemData.id);
            if (forCoNameRel == '') {
                forCoNameRel = `${itemData.type.replaceAll('_', ' ')}: ${itemData.label}`;
                document.getElementsByClassName('co-name')[0].setAttribute('data-rel', forCoNameRel)
            }
        }
    }

    graphBoxModuleObject.preview = list.outerHTML;

    // Need a list that includes total number of connections, types of connections, and number of subsidiaries in the graph
    // we are going to reuse the dataToTable function so things need to be formatted [[label, translation, value, outOf]...]
    // since we have no outOf we will just set that false, translation will be labels but with spaces replaced with underscores
    const dataForTable = [];
    const connectionTypes = [];
    const connectionCount = [];

    graph.forEachEdge((edge, attributes, source, target, sourceAttributes, targetAttributes) => {
        const type = attributes.label.replace(" of", "");
        if (!connectionTypes.includes(type)) {
            connectionTypes.push(type);
            connectionCount.push(1);
        } else {
            const index = connectionTypes.indexOf(type);
            connectionCount[index] += 1;
        }
    }
    );
    dataForTable.push(["Total Connections", "total_connections", connectionCount.reduce((a, b) => a + b, 0), false]);
    dataForTable.push(["Total direct relations", "total_direct_relations", sortedl1list.length, false]);
    connectionTypes.forEach((type, index) => {
        dataForTable.push([type, type.replaceAll(" ", "_"), connectionCount[index], false]);
    }
    );
    graphBoxModuleObject.content = dataToTable(dataForTable, false, "connections");
    graphBoxModuleObject.content += buttonTemplate("graphButton", `loadNetworkGraph(${wikidataid})`, false, `<div data-i18n="w.openGraph">Open Graph</div>`);

    createAndAddGenericModule({ type: "graph-box", data: graphBoxModuleObject, container });
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
            const allLinks = tempObj.getElementsByTagName("a");
            Array.from(allLinks).forEach((link) => {
                if (link.href.startsWith("/")) {
                    link.href = `${wikichoice}${link.href}`;
                }
                if (link.href.startsWith("./")) {
                    link.href = `${wikichoice}${link.href.slice(1)}`;
                }
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
