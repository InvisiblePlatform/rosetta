//const nestleDataUrl = "https://test.reveb.la/connections/1e9c237af78d1f98d18e4d9e7b001b13.json"
const root = document.createElement('div')
root.id = 'root'
document.body.appendChild(root)
let cy;
let currentStateOfNodes = {}
let currentChangeSet = []
let graphDocDataStoreCache = {
    "connections": {},
    "dbFiles": {},
}
const layoutCy = {
    name: 'elk',
    elk: {
        algorithm: 'stress',
        "stress.desiredEdgeLength": 200,
        "alignment": "BOTTOM",
        //"layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        //"layered.layering.strategy": "COFFMAN_GRAHAM",
        //"layered.layering.coffmanGraham.layerBound": 10,
        //"layered.mergeEdges": true,
        //"layered.crossingMinimization.strategy": "LAYER_SWEEP",
        //"layered.spacing.nodeNodeBetweenLayers": 50,
    },
}
const networkColours = {
    '1': '#B65FD4',
    '2': '#7775ED',
    '3': '#2795D3',
    '4': '#48BCB5',
    '5': '#66926D',
    '6': '#C5DD2E',
    '7': '#F7DE00',
    '8': '#FD7B1D',
    '9': '#E75C7D',
    '10': '#95B8C3',
}
const edgeTypeMappings = {
    'author_of': {
        'colour': 3,
        'label': 'Author of',
        'id': 1,
    },
    'board_member_of': {
        'colour': 6,
        'label': 'Board member of',
        'id': 2,
    },
    'chairperson_of': {
        'colour': 8,
        'label': 'Chairperson of',
        'id': 3,
    },
    'chief_executive_officer': {
        'colour': 9,
        'label': 'Chief Executive Officer',
        'id': 4,
    },
    'creator_of': {
        'colour': 9,
        'label': 'Creator of',
        'id': 5,
    },
    'director_of': {
        'colour': 2,
        'label': 'Director of',
        'id': 6,
    },
    'division_of': {
        'colour': 2,
        'label': 'Division of',
        'id': 7,
    },
    'editor-in-chief_of': {
        'colour': 4,
        'label': 'Editor-in-Chief of',
        'id': 8,
    },
    'editor_of': {
        'colour': 5,
        'label': 'Editor of',
        'id': 9,
    },
    'executive_producer_of': {
        'colour': 10,
        'label': 'Executive Producer of',
        'id': 10,
    },
    'film_editor_of': {
        'colour': 6,
        'label': 'Film Editor of',
        'id': 11,
    },
    'founder_of': {
        'colour': 10,
        'label': 'Founder of',
        'id': 12,
    },
    'funder_of': {
        'colour': 7,
        'label': 'Funder of',
        'id': 13,
    },
    'head_coach_of': {
        'colour': 5,
        'label': 'Head Coach of',
        'id': 14,
    },
    'invested_in': {
        'colour': 7,
        'label': 'Invested in',
        'id': 15,
    },
    'owner_of': {
        'colour': 1,
        'label': 'Owner of',
        'id': 16,
    },
    'parent_company': {
        'colour': 3,
        'label': 'Parent Company',
        'id': 17,
    },
    'parent_organisation': {
        'colour': 5,
        'label': 'Parent Organisation',
        'id': 18,
    },
    'partnered_with': {
        'colour': 3,
        'label': 'Partnered with',
        'id': 19,
    },
    'presentor_of': {
        'colour': 1,
        'label': 'Presentor of',
        'id': 20,
    },
    'producer_of': {
        'colour': 8,
        'label': 'Producer of',
        'id': 21,
    },
    'production_designer_of': {
        'colour': 1,
        'label': 'Production Designer of',
        'id': 22,
    },
    'publisher_of': {
        'colour': 7,
        'label': 'Publisher of',
        'id': 23,
    },
    'subsidary_of': {
        'colour': 1,
        'label': 'Subsidary of',
        'id': 24,
    },
    "sponser_of": {
        'colour': 7,
        'label': 'Sponser of',
        'id': 0,
    },
}


const typeIdToEdgeTypeName = {
    '0': "sponser_of",
    '1': "author_of",
    '2': "board_member_of",
    '3': "chairperson_of",
    '4': "chief_executive_officer",
    '5': "creator_of",
    '6': "director_of",
    '7': "division_of",
    '8': "editor-in-chief_of",
    '9': "editor_of",
    '10': "executive_producer_of",
    '11': "film_editor_of",
    '12': "founder_of",
    '13': "funder_of",
    '14': "head_coach_of",
    '15': "invested_in",
    '16': "owner_of",
    '17': "parent_company",
    '18': "parent_organisation",
    '19': "partnered_with",
    '20': "presentor_of",
    '21': "producer_of",
    '22': "production_designer_of",
    '23': "publisher_of",
    '24': "subsidary_of",
}

let edgeMappings = []
const filterBar = document.getElementById('neoGraphFilterBar')
for (const type in edgeTypeMappings) {
    const typeButton = document.createElement('button')
    typeButton.classList.add('filterButton')
    typeButton.innerHTML = `${edgeTypeMappings[type].label.replace(/ of$/, '')}`
    typeButton.setAttribute('data-type', type)
    typeButton.type = 'checkbox'
    typeButton.classList.add(type)
    typeButton.onclick = function (evt) {
        // all of the buttons should start active
        // when we click for the first time we should deactivate all other buttons
        // and then activate this button
        var activeButtons = document.querySelectorAll('.filterButton:checked')
        if (activeButtons.length === filterBar.children.length) {
            activeButtons.forEach(button => {
                button.toggleAttribute('checked')
            })
        }
        evt.target.toggleAttribute('checked')

        // we then go through all the buttons to see which ones are active
        // and we can then filter the edges based on the active buttons
        const activeTypes = []
        activeButtons = document.querySelectorAll('.filterButton:checked')
        activeButtons.forEach(button => {
            activeTypes.push(button.getAttribute('data-type'))
        })
        cy.startBatch()
        cy.elements().edges().forEach(edge => {
            if (activeTypes.includes(edge.data().edgeType)) {
                edge.removeClass('faded')
            } else {
                edge.addClass('faded')
            }
        })
        cy.endBatch()
    }

    // typeButton.style.backgroundColor = networkColours[edgeTypeMappings[type].colour]
    filterBar.appendChild(typeButton)
    typeButton.toggleAttribute('checked')
    edgeMappings.push(
        {
            selector: `edge.${type}`,
            style: {
                'taxi-direction': function (edge) {
                    return 'vertical'
                },
                'z-index': 12,
                'z-index-compare': 'manual',
                'line-color': networkColours[edgeTypeMappings[type].colour],
                'target-arrow-color': networkColours[edgeTypeMappings[type].colour],
            }
        },
        {
            selector: `edge.${type}[label]`,
            style: {
                'text-background-color': networkColours[edgeTypeMappings[type].colour],
                'text-background-shape': 'roundrectangle',
                'text-background-padding': 5,
                'text-background-opacity': 1,
                'text-border-opacity': 0,
                'text-outline-opacity': 0,
            }
        }
    )
}
// From the above mappings, we can see that the type is the key and the value is the colour
// we can use this to set the colour of the edges
// {
//     selector: 'edge.owner_of',
//     style: {
//         'line-color': networkColours['1'],
//         'target-arrow-color': networkColours['1'],
//     }
// }
const taxiDirections = [
    'upward',
    'downward',
    'leftward',
    'rightward'
]
seenNodes = []
const mistakenGroups = ["Q196600", "Q1186399", "Q1186399", "Q5398426"]
let nodes = {}
let ignorableNodes = []
function addNodeToNodes(node) {
    if (seenNodes.includes(node.id)) {
        return []
    }
    // if any of the mistaken groups are in the groups, we need to skip this node
    if (mistakenGroups.some(group => node.groups.includes(group))) {
        ignorableNodes.push(node.id)
        return []
    }
    seenNodes.push(node.id);
    nodes[node.id] = node;
    labelLength = node.label.length;
    node.labelSize = labelLength * 12
    return [
        {
            data: node,
            classes: node.groups.concat("realNode"),
        }]
}

function convertLinkToEdge(edge) {
    if (!seenNodes.includes(edge.source) || !seenNodes.includes(edge.target)
        || ignorableNodes.includes(edge.source) || ignorableNodes.includes(edge.target)) {
        return []
    }
    retObject = []
    portInfo = edgeTypeMappings[edge.type.toLowerCase()]
    portId = portInfo.id
    targetInfo = nodes[edge.source]
    sourceInfo = nodes[edge.target]

    ourNodes = [edge.source, edge.target]
    ourNodes.forEach((node) => {
        if (nodes[node].ports === undefined) {
            nodes[node].ports = [portId]
        } else {
            nodes[node].ports.push(portId)
        }
        // also make and add the port to the node
        retObject.push({
            data: {
                id: `${node}-${portId}`,
                parent: node,
                label: portId,
                portId,
            },
            nodeLayoutOptions: {
                //"layered.nodePlacement.strategy": "INTERACTIVE",
            },
            classes: 'aux-node',
            selectable: false,
            grabbable: false,
        })

    })
    edgeId = `${edge.source}-${edge.target}-${edge.type}`;
    retObject.push({
        data: {
            target: edge.source,
            targetLabel: targetInfo.label,
            targetGroups: targetInfo.groups,
            source: edge.target,
            sourceLabel: sourceInfo.label,
            sourceGroups: sourceInfo.label,
            id: edgeId,
            edgeType: edge.type,
            auxId: `${edgeId}-aux`,
        },
        classes: 'realEdge',
    }, {
        data: {
            target: `${edge.source}-${portId}`,
            source: `${edge.target}-${portId}`,
            id: `${edgeId}-aux`,
            edgeType: edge.type,
            label: edge.type.replace(/_of$/, "").replaceAll("_", " "),
        },
        classes: edge.type.toLowerCase(),
    })
    return retObject
}

layoutTest = {
    name: 'null',
}

function startCY(url, wikidataid) {
    console.log(url)
    data = fetch(url)
        .then(response => response.json())
        .then(data => {
            // the data we collect is organised like {"nodes": [], "edges": []}
            // so we need to convert it to the format that cytoscape expects
            elements = []
            console.log(data)
            data.nodes.forEach(node => {
                const retObject = addNodeToNodes(node)
                elements.push(...retObject)
            });
            data.links.forEach(edge => {
                const retObject = convertLinkToEdge(edge);
                elements.push(...retObject)
            });

            // if a node has no ports just remove it
            Object.keys(nodes).forEach(node => {
                if (nodes[node].ports === undefined) {
                    delete nodes[node]
                    // and from the elements
                    elements = elements.filter(element => {
                        return element.data.id !== node
                    })
                }
            })

            const nodeCount = Object.keys(nodes).length;
            const desiredEdgeLength = Math.max(200, Math.min(nodeCount * 20, 600));
            layoutCy.elk["stress.desiredEdgeLength"] = desiredEdgeLength
            // we also need to make a style object
            cy = cytoscape({
                container: document.getElementById('root'),
                elements,
                layout: layoutTest,
                nodeDimensionsIncludeLabels: true,
                // textureOnViewport: true,
                // hideEdgesOnViewport: true,
                animate: true,
                maxZoom: 1,
                minZoom: 0.1,
                style: [
                    {
                        selector: 'edge',
                        style: {
                            'curve-style': 'taxi',
                            //'curve-style': 'bezier',
                            'target-arrow-shape': 'triangle',
                            'arrow-scale': 0.95,
                            'width': 6,
                            'z-index-compare': 'manual',
                            'target-distance-from-node': function (edge) {
                                if (edge.target().isChild()) {
                                    offset = edge.target().parent().height() / 2
                                    return `${offset}px`
                                }
                                return '0px'
                            },
                            'source-text-offset': function (edge) {
                                if (edge.source().selected()) {
                                    return `200px`
                                }
                                return `50px`
                            }
                        },
                    },
                    {
                        selector: 'edge.realEdge',
                        style: { 'opacity': 0 }
                    },
                    {
                        selector: 'edge[label]:selected',
                        style: {
                            'source-label': 'data(source-label)',
                            // 'edge-text-rotation': 'autorotate',
                            'text-background-color': 'white',
                            'text-background-shape': 'roundrectangle',
                            'text-background-opacity': 1,
                            'text-border-color': 'black',
                            'text-border-width': 1,
                            'text-border-opacity': 1,
                            'font-size': 10,
                            'height': 20,
                        }
                    },
                    {
                        style: {
                            'background-color': '#313131',
                            'text-wrap': 'wrap',
                            'color': 'white',
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'font-size': 10,
                            'shape': 'roundrectangle',
                            'corner-radius': 200,
                            'padding': 12,
                            'border-width': 2,
                            'border-color': 'black',
                            'font-size': '20px',
                            'font-family': ['Space Grotesk', 'sanserif'],
                            'text-background-padding': 10,
                            'text-background-shape': 'roundrectangle',
                            'min-width': 'data(labelSize)',
                            'z-index': 10,
                            'z-index-compare': 'manual',
                            'z-compound-depth': 'top',
                        },
                        selector: 'node.realNode',
                    },
                    {
                        selector: 'node.aux-node',
                        style: {
                            'width': 1,
                            'height': 1,
                            'font-size': 0,
                            'label': ' ',
                            'padding': 0,
                            'z-index': 0,
                            'opacity': 0,
                            'shape': 'rectangle',
                        }
                    },
                    {
                        selector: 'node.Q5',
                        style: {
                            'border-width': 2,
                            'border-color': 'black',
                            'shape': 'rectangle',
                        }
                    },
                    {
                        selector: '.faded',
                        style: {
                            'line-color': '#ddd',
                            'target-arrow-color': '#ddd',
                            'z-index-compare': 'manual',
                            'z-index': -2,
                            'opacity': 0.5,
                        }
                    },
                    {
                        selector: 'edge.highlightEdge',
                        style: {
                            'line-color': 'red',
                            'target-arrow-color': 'red',
                            'z-index-compare': 'manual',
                            'z-index': 10,
                            'opacity': 1,
                        }
                    },
                    {
                        selector: 'node.realNode:selected',
                        style: {
                            "shape": "round-rectangle",
                            "text-background-shape": "round-rectangle",
                            "corner-radius": 1000,
                            'min-width': 'data(labelSize)',
                            'border-color': 'black',
                            'border-width': 6,
                        }
                    },
                    ...edgeMappings
                ],
            })
            // cy.edgeConnections({
            //     maxPasses: 20,
            // }).addEdges(edges);

            cy.layout(layoutCy).run()
            selectANodeCy(wikidataid)
            resetNodeInternalsOnTimeoutCy()

            // when a given node is clicked, we want to display the extra information
            cy.on('tap', 'node', function (evt) {
                const node = evt.target
                if (node.classes().includes('aux-node')) {
                    return
                }
                const data = node.data()

                if (graphDocDataStoreCache.dbFiles[data.defSite] == undefined) {
                    dbUrl = `${dataURL}/db/${data.defSite}.json`
                    fetch(dbUrl).then(response => response.json()).then(dataDb => {
                        graphDocDataStoreCache.dbFiles[data.defSite] = dataDb
                        if (dataDb.connections !== undefined) {
                            connectionsFile = dataDb["connections"].split("/")[2]
                            if (graphDocDataStoreCache.connections[connectionsFile] == undefined) {
                                connectionsUrl = `${dataURL}${dataDb.connections}`
                                fetch(connectionsUrl).then(response => response.json()).then(dataCn => {
                                    graphDocDataStoreCache.connections[connectionsFile] = dataCn
                                    // Stub for adding the connections to the graph
                                    console.log(`adding connections file ${connectionsFile}`)
                                    addConnectionsFileToGraph(dataCn, data.id);
                                    return;
                                })
                            }

                        }
                    })
                }
                rearrangeRelatedNodesToNodeForExtraDisplay(data.id)
                putNodeInfoInExtraDisplay(data.id)


            })
            // after deselection of a node, rerun resetNodeInternals on its neighbourhood
            // cy.on('unselect', function (evt) {
            //     if (evt.target.isNode()) {
            //         resetNodeInternalsOnTimeoutCy(evt.target.neighborhood(), 1000, false)
            //     }
            // })

            // when we click the background we want to remove the extra information
            // and reset any changes we made to the layout
            // cy.on('tap', function (evt) {
            //     if (evt.target === cy) {
            //         const extraDisplay = document.getElementById('extraDisplay')
            //         extraDisplay.innerHTML = ''
            //         document.body.classList.remove("activeExtra");
            //         cy.startBatch()
            //         cy.filter('.faded').removeClass('faded')
            //         // we need to reset the positions of the nodes to the positions we stored in currentStateOfNodes
            //         cy.elements().nodes().forEach(node => {
            //             node.position(currentStateOfNodes[node.id()])
            //         })
            //         cy.endBatch()
            //         cy.filter('.realNode').union(cy.filter(".realEdge")).layout(layoutCy).run()
            //         currentChangeSet = []
            //         currentStateOfNodes = {}

            //     }
            // })

        })


}

function resetNodeInternalsOnTimeoutCy(collection = false, timeout = 3000, doLayout = false) {
    if (collection) {
        collectionObj = collection
    } else {
        collectionObj = cy.elements()
    }
    setTimeout(() => {
        //if (doLayout) {
        //    collectionObj.layout(layoutCy).run()
        //}
        cy.startBatch()
        collectionObj.filter('.realNode').forEach(node => {
            if (node.children().length > 1) {
                // we need to distribute the children as a line
                parentNodePosition = node.position()
                numberOfEdgeConnections = node.connectedEdges().length
                tauDivisor = node.width() / node.children().length
                let divisor
                if (tauDivisor < numberOfEdgeConnections) {
                    divisor = numberOfEdgeConnections
                } else {
                    divisor = tauDivisor + numberOfEdgeConnections * 2
                }
                if (collection) {
                    divisor = tauDivisor;
                }
                xOffset = 0
                node.children().forEach(
                    child => {
                        x = xOffset
                        child.position({
                            x: x + parentNodePosition.x,
                            y: parentNodePosition.y,
                        })
                        xOffset += divisor
                    }
                )
            }
        })
        collectionObj.filter('.aux-node').forEach(node => {
            // if the node has many edges that its the source of
            // and target is only child of its parent, arrange targetNodes 
            // such that they are x-aligned with this node, but offset-y by num of edges
            if (node.connectedEdges().targets().length > 3) {
                xOffset = node.position().x + 50
                yOffset = node.position().y + 100

                node.connectedEdges().targets().forEach(subnode => {
                    if (subnode.parent().connectedEdges().length > 1) {
                        return
                    }
                    subnode.parent().position({
                        x: xOffset,
                        y: yOffset,
                    })
                    yOffset += 50
                })
            }

        })
        cy.elements().flashClass('faded', 10)
        cy.endBatch()
    }, timeout)

}

function selectANodeCy(wikidataid, timeout = 1000) {
    console.log(wikidataid)
    if (cy.getElementById(wikidataid)) {
        setTimeout(() => {
            cy.getElementById(wikidataid).select()
            cy.getElementById(wikidataid).addClass('originalNode')
            // pan and zoom to the selected node
            cy.fit(cy.getElementById(wikidataid), 10)
            console.log(cy.getElementById(wikidataid).position())
        }, timeout)
    }
}

function addConnectionsFileToGraph(data, startNodeId) {
    console.log(data)
    let elements = []
    data.nodes.forEach(node => {
        const retObject = addNodeToNodes(node)
        elements.push(...retObject)
    })
    data.links.forEach(edge => {
        const retObject = convertLinkToEdge(edge);
        elements.push(...retObject)
    })
    cy.startBatch()
    cy.add(elements)
    cy.layout(layoutCy).run()
    cy.endBatch()
    selectANodeCy(startNodeId, 2000)
    // rearrangeRelatedNodesToNodeForExtraDisplay(startNodeId, 0, true)
    putNodeInfoInExtraDisplay(startNodeId)
}

// document.addEventListener('mouseover', function (event) {
//     if (event.target.classList.contains('relation')) {
//         // we need to highlight all edges of this type, that arent also faded
//         classlist = [...event.target.classList]
//         classlist.pop('relation')
//         if (!classlist.includes("faded")) {
//             cy.elements().edges().filter(classlist[0]).addClass('highlightEdge')
//         }
//     }
// })

function putNodeInfoInExtraDisplay(nodeId) {
    const node = cy.getElementById(nodeId)
    const data = node.data()
    const extraDisplay = document.getElementById('extraDisplay')
    const relatedEdges = node.connectedEdges()
    let miniModules = []
    if (graphDocDataStoreCache.dbFiles[data.defSite] == undefined) {
        const url = `${dataURL}/db/${data.defSite}.json`
        fetch(url).then(response => response.json()).then(dataDb => {
            graphDocDataStoreCache.dbFiles[data.defSite] = dataDb
        })
    }

    miniModulesString = ""
    if (graphDocDataStoreCache.dbFiles[data.defSite] !== undefined) {
        // we need to get the data from the db file and add modules to the display
        for (const module of graphDocDataStoreCache.dbFiles[data.defSite].core) {
            miniModules.push(module)
        }
        if (graphDocDataStoreCache.dbFiles[data.defSite].political !== undefined) {
            miniModules.push({ "type": "political", "url": "local", "data": graphDocDataStoreCache.dbFiles[data.defSite].political })

        }
        if (graphDocDataStoreCache.dbFiles[data.defSite].social !== undefined) {
            miniModules.push({ "type": "social", "url": "local", "data": graphDocDataStoreCache.dbFiles[data.defSite].social })
        }
    }

    extraDisplay.innerHTML = `
    <h2>${data.label}</h2>
    <ol>
    `
    document.body.classList.add("activeExtra");
    for (const edge of relatedEdges) {
        const edgeData = edge.data()
        const sourceInfo = {
            label: edgeData.sourceLabel,
            groups: edgeData.sourceGroups,
        }
        const targetInfo = {
            label: edgeData.targetLabel,
            groups: edgeData.targetGroups,
        }
        if (edgeData.source === nodeId) {
            extraDisplay.innerHTML += `
        <li class="relRow ${edgeData.edgeType.toLowerCase()}">
        <div class="sourceNode highlight ${sourceInfo.groups}" data-id="${edgeData.source}">${sourceInfo.label}</div>
        <div class="relation ${edgeData.edgeType.toLowerCase()}">${edgeData.edgeType.replace(/ of$/, '').replaceAll('_', ' ')}</div>
        <div class="targetNode ${targetInfo.groups}" data-id="${edgeData.target}">${targetInfo.label}</div></li>`
        } else {
            extraDisplay.innerHTML += `
        <li class="relRow ${edgeData.edgeType.toLowerCase()}">
        <div class="sourceNode ${sourceInfo.groups}" data-id="${edgeData.source}">${sourceInfo.label}</div>
        <div class="relation ${edgeData.edgeType.toLowerCase()}">${edgeData.edgeType.replace(/ of$/, '').replaceAll('_', ' ')}</div>
        <div class="targetNode highlight ${targetInfo.groups}" data-id="${edgeData.target}">${targetInfo.label}</div></li>`
        }
    }
    extraDisplay.innerHTML += `</ol><section id="miniModules"></section>`
    loadPageCore(data.defSite, false, false, false, "miniModules", true)
    //arrangeForTabs("miniModules", "tabContainer", "tabContent", "tabButtonArea", mtabbedContent);
    //arrangePreviews(currentMiniState, "_minipreview");
}

function rearrangeRelatedNodesToNodeForExtraDisplay(nodeId) {
    const node = cy.getElementById(nodeId)
    // we should store a copy of the current postions of all nodes if we havent already
    if (Object.keys(currentStateOfNodes).length !== cy.elements().nodes().length) {
        cy.elements().nodes().forEach(node => {
            currentStateOfNodes[node.id()] = node.json().position
        })
        console.log(currentStateOfNodes)
    }
    // when we click the node it would be good to select its connections and 
    // adjust the layout just for those nodes so they are closer together temporarily. Colouring 
    // all other edges to grey then fitting and zooming the node + related nodes
    // onto the display
    // since relatedNodes doesnt seem to work, we need to get the related nodes from the edges
    cy.startBatch()
    relatedElements = cy.collection()
    relatedElements = relatedElements.add(node)
    relatedElements = relatedElements.union(node.connectedEdges().targets())
    relatedElements = relatedElements.union(node.connectedEdges().sources())
    //relatedElements = node.connectedEdges().targets().union(node.connectedEdges().sources()).union(node).union(node.connectedEdges())
    // we should add any interconnected edges too between the nodes we found
    relatedElements.connectedEdges().forEach(edge => {
        if (relatedElements.contains(edge.source()) && relatedElements.contains(edge.target())) {
            relatedElements = relatedElements.union(edge)
        }
    })
    relatedElements.edges().forEach(edge => {
        auxEdge = cy.getElementById(edge.data().auxId)
        relatedElements = relatedElements.union(auxEdge)
    })
    relatedElements = relatedElements.union(relatedElements.descendants())

    cy.elements().removeClass('faded')
    cy.elements().addClass('faded')
    relatedElements.removeClass('faded')

    // First if we have made changes to the layout we need to reset them
    // so we will use the currentNodesState to reset the positions of the nodes
    // using a preset layout
    if (currentChangeSet.length > 0) {
        nodesToReset = cy.collection()
        currentChangeSet.forEach(node => {
            nodesToReset = nodesToReset.add(cy.getElementById(node.id))
        })
        nodesToReset.layout({
            name: 'preset',
            positions: function (node) {
                return currentStateOfNodes[node.id()]
            }
        }).run()
    }
    cy.endBatch()
    // change the layout of only the related nodes are closer to the node we clicked 
    // but with the node we clicked in the middle of the display, then fit the display
    // to the related nodes
    // since these are small graphs we need to adjust the desiredEdgeLength
    // on a curve of some sort, so setting a min and max desiredEdgeLength

    const desiredEdgeLength = Math.max(200, Math.min(relatedElements.length * 10, 500));

    relatedElements.layout({
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: true,
        name: 'elk',
        elk: {
            algorithm: 'stress',
            "stress.desiredEdgeLength": desiredEdgeLength,
            "edgeLabels.inline": true,
            "nodeSize.constraints": "NODE_LABELS",
            "nodeLabels.placementBetweenLayers": "[H_CENTER, V_TOP, INSIDE]",
            "direction": "RIGHT",
            "layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
            "layered.layering.strategy": "COFFMAN_GRAHAM",
            "layered.layering.coffmanGraham.layerBound": 10,
            //"layered.mergeEdges": true,
            "layered.nodePlacement.bk.fixedAlignment": "BALANCED",
            //"layered.nodePlacement.networkSimplex.nodeFlexibility.default": "NODE_SIZE",
            //"layered.crossingMinimization.strategy": "LAYER_SWEEP",
            "layered.spacing.nodeNodeBetweenLayers": 10,
        },
        fit: true,
    }).run()

    resetNodeInternalsOnTimeoutCy(relatedElements)
    cy.fit(relatedElements, 100)


    // we should store the changes we made to the layout so we can reset them later
    currentChangeSet = []
    relatedElements.forEach(node => {
        currentChangeSet.push({
            id: node.id(),
            position: node.position(),
        })
    })
    console.log(relatedElements)


}

function zoomByFactor(factor) {
    cy.zoom(cy.zoom() * factor)
}