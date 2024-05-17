let debug
const pageHost = `${window.location.protocol}//${window.location.host}`
const assetsURL = `https://assets.reveb.la`
const dataURL = `https://test.reveb.la`

const languages = ["ar", "fr", "eo", "en", "es", "de", "zh", "hi", "ca"];
const translator = new Translator({
    persist: true,
    // debug: true,
    filesLocation: `${pageHost}/i18n`
});

let backButton;
let settingsButton;
let closeButton;
var loginButtonEl;
let roundelButton;
let boyButton;
let voteButtons;
let wikidataid;
let pageLocation;
let pageHash;
let connectionsFile;

let loggedIn = false;

let settingsState;

const keyconversion = {
    "b": 'bcorp',
    "c": 'connections',
    "l": 'glassdoor',
    "g": 'goodonyou',
    "i": 'isin',
    "m": 'mbfc',
    "o": 'osid',
    // "a": 'polalignment',
    // "q": 'polideology',
    "y": 'yahoo',
    "p": 'tosdr-link',
    "s": 'trust-scam',
    "t": 'trust-pilot',
    "e": 'lobbyeu',
    "w": 'wbm',
    // "z": 'wikidata_id'
}
const ratingColorArray = {
    "success": "var(--c-main)",
    "danger": "red",
    "neutral": "grey",
    "warning": "amber",
};

const translate = {
    "cta": "cta.title",
    "wikipedia-first-frame": "w.wikipedia",
    "networkgraph": "graph.title",
    "small-wikidata": "w.companyinfo",
    "mbfc": "mbfc.title",
    "trust-pilot": "trustpilot.title",
    "yahoo": "esg.title",
    "opensec": "os.title",
    "carbon": "carbon.title",
    "lobbyeu": "lb.title",
    "post": "user.moduletitle",
    "wbm-automotive-data": "wbm.automotive-data",
    "wbm-gender-benchmark": "wbm.gender-benchmark",
    "wbm-just-transition-assessment": "wbm.just-transition-assessment",
    "wbm-just-transition-assessment-social": "wbm.just-transition-assessment-social",
    "wbm-seeds-index-esa": "wbm.seeds-index-esa",
    "wbm-seeds-index-ssea": "wbm.seeds-index-ssea",
    "wbm-seeds-index-wc-africa": "wbm.seeds-index-wc-africa",
    "wbm-chumanrightsb": "wbm.chumanrightsb",
    "wbm-financial-system-benchmark": "wbm.financial-system-benchmark",
    "wbm-social-transformation": "wbm.social-transformation",
    "wbm-transport-benchmark": "wbm.transport-benchmark",
    "wbm-buildings-benchmark": "wbm.buildings-benchmark",
    "wbm-digital-inclusion": "wbm.digital-inclusion",
    "wbm-electric-utilities": "wbm.electric-utilities",
    "wbm-food-agriculture-benchmark": "wbm.food-agriculture-benchmark",
    "wbm-nature-benchmark": "wbm.nature-benchmark",
    "wbm-oil-gas-benchmark": "wbm.oil-gas-benchmark",
    "wbm-seafood-stewardship": "wbm.seafood-stewardship",
    "political-wikidata": "w.political",
    "politicali-wikidata": "wikidata.polideology",
    "goodonyou": "goy.section-title",
    "bcorp": "bcorp.title",
    "tosdr-link": "tos.title",
    "glassdoor": "glassdoor.title",
    "similar-site-wrapper": "similar.title",
    "social-wikidata": "w.socialmedia",
    "trust-scam": "trustsc.title",
    "wbm": "wbm.title",
};
const defaultestOrder = Object.keys(translate);
const defaultOrder = [];
const defaultOrderWbm = [];
for (item in defaultestOrder) {
    if (defaultestOrder[item].startsWith("wbm")) {
        defaultOrderWbm.push(defaultestOrder[item])
    } else {
        defaultOrder.push(defaultestOrder[item])
    }
}
defaultOrder.push("wbm")
const defaultOrderString = defaultOrder.join('|');
const defaultOrderStringWbm = defaultOrderWbm.join('|');

const availableNotifications = "beglmstwp";

const defaultUserPreferences = {
    "l": { type: "range", min: 0, max: 10 },
    "b": { type: "range", min: 0, max: 300 },
    "w": { type: "multiRange", min: 0, max: 100 },
    "g": { type: "range", min: 0, max: 5 },
    "p": { type: "range", min: 1, max: 6 },
    "s": { type: "range", min: 0, max: 100 },
    "t": { type: "range", min: 0, max: 100 },
    "m": {
        type: "label", labels: ["conspiracy-pseudoscience", "left",
            "left-center", "pro-science", "right", "right-center", "satire",
            "censorship", "conspiracy", "failed-fact-checks", "fake-news", "false-claims",
            "hate", "imposter", "misinformation", "plagiarism", "poor-sourcing", "propaganda", "pseudoscience"
        ]
    },
};

const defaultSettingsState = {
    "preferred_language": "en",
    "loggedIn": false,
    "debugMode": false,
    "darkMode": false,
    "keepOnScreen": false,
    "dissmissedNotifications": [],
    "userPreferences": defaultUserPreferences,
    "bobbleOverride": false,
    "notifications": false,
    "notificationsTags": availableNotifications,
    "listOrder": defaultOrderString,
    "listOrder-wbm": defaultOrderStringWbm,
    "experimentalFeatures": false,
};

let oldSettings;

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

Hash = {
    get hash() {
        let value = '';
        if (window.location.hash.length !== 0)
            window.location.hash.replace(/#+([^\?]+)/gi, (hash) => {
                value = hash.replace('#', '');
            })
        return value
    }
}
translator.fetch(languages).then(() => {
    translator.translatePageTo();
    registerLanguageToggle();
});

const optionRegex = /&.*/ig;
function pageSetup() {
    const currentLocation = window.location.href.replaceAll('?', '&').replace(optionRegex, "")
    pageLocation = Url.get.site ? `/db/${Url.get.site}.json` : false;
    addToolsSection()
    resetSettings(false)
    loadPageCore(pageLocation)
    addSettings()
    scrollIntoPlace()
    notificationsDraw();
    forceAllLinksNewTab();
    translator.translatePageTo();
    recalculateList();
    send_message("IVSettingsReq", true);
}


function resetSettings(change = true) {
    settingsState = defaultSettingsState;
    if (change) settingsStateChange()
}

let firstShot = false;
function settingsStateApply(newSettingsState = defaultSettingsState) {
    if (typeof (oldSettings) === 'undefined') {
        oldSettings = JSON.parse(JSON.stringify(settingsState));
        firstShot = true;
    }
    settingsState = newSettingsState;

    changed = []
    for (item in settingsState) {
        if (settingsState[item] != oldSettings[item] && item != 'userPreferences') {
            changed.push(item)
        }
    }

    if (debug) console.log(changed)
    if (changed.includes("loggedIn"))
        loggedIn = settingsState.loggedIn

    if (changed.includes("experimentalFeatures")) {
        if (settingsState.experimentalFeatures)
            loginCheck(true);
        loadPageExternal(pageLocation)
    }

    if (firstShot) {
        document.getElementById("notifications-shade").getElementsByTagName("input")[0].checked = settingsState["notifications"]
        for (const toggle in toggles) {
            toggleEl = document.getElementById(toggle)
            if (toggleEl !== null && toggle != 'notificationsContainer') {
                toggleEl.getElementsByTagName("input")[0].checked = settingsState[toggles[toggle]];
            }
        }
    }


    if (newSettingsState.debugMode == true) {
        document.lastChild.classList.add("debugColors");
    } else {
        document.lastChild.classList.remove("debugColors");
    }

    if (newSettingsState.darkMode == true) {
        document.lastChild.classList.add('dark-theme');
        document.getElementById('backButton').style.backgroundImage = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTciIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNyAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExLjgzMzMgMTMuMzMzNEw2LjUgOC4wMDAwNEwxMS44MzMzIDIuNjY2NzEiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIvPgo8L3N2Zz4K')";
    } else {
        document.lastChild.classList.remove('dark-theme');
    }

    if (settingsState["dissmissedNotifications"].length > 0) {
        dissmissedNotificationsDraw();
    }


    slist();
    recalculateList()
    translator.translatePageTo(settingsState.preferred_language);
    notificationsDraw();

    debug = settingsState.debugMode
    oldSettings = JSON.parse(JSON.stringify(settingsState));
    firstShot = false;
}



function settingsStateChange() {
    if (debug) console.log("Settings state changed")
    if (debug) console.log(settingsState);
    send_message("IVSettingsChange", settingsState);
    settingsStateApply(settingsState)
}


function registerLanguageToggle() {
    const select = document.getElementById("langselect");
    for (let i = 0, len = select.childElementCount; i < len; ++i) {
        if (select.children[i].value == settingsState.preferred_language)
            select.selectedIndex = i;
    }
    select.addEventListener("change", evt => {
        const language = evt.target.value;
        if (language == "-") { return; };
        translator.translatePageTo(language);
        settingsState.preferred_language = language;
        settingsStateChange();
    });
}

function dissmissedNotificationsDraw() {
    const container = document.getElementById("dismissedContainer");
    if (settingsState["dissmissedNotifications"].length == 0) {
        document.getElementById("dissmissedNotifications").style.display = "none";
        container.innerHTML = ""
        return
    }
    document.getElementById("dissmissedNotifications").style.display = "block";
    container.innerHTML = ""
    for (const item in settingsState["dissmissedNotifications"]) {
        site = settingsState["dissmissedNotifications"][item]
        container.innerHTML += `<li onclick="removeSiteFromDimissed(this)" style="display:inline;">${site}</li>`

    }
}
function removeSiteFromDimissed(el) {
    site = el.innerText;
    settingsState["dissmissedNotifications"].pop(site);
    dissmissedNotificationsDraw();
    settingsStateChange();
}

const scrollIntoPlace = async () => {
    if (Hash.hash.length !== 0) {
        const scrollPlace = document.getElementById(Hash.hash);
        if (scrollPlace) {
            scrollPlace.scrollIntoView()
        }
    }
}

let moduleData;
const localModules = ["political", "social"]
const loadPageCore = async (coreFile, localX = false, localY = false, wikidataid = null) => {
    try {
        console.log(dataURL)
        console.log(coreFile)
        const dataf = await fetch(dataURL + coreFile)
        const response = await dataf.json()
        const currentDomain = document.getElementsByClassName("co-name")[0].innerText.replace(".", "")
        localString = ''
        moduleData = await response;

        const siteDataSendable = {
            "siteData": response.data,
            "domainKey": currentDomain,
        }
        if (moduleData.title) {
            const coName = document.getElementsByClassName('co-name')[0];
            coName.innerText = moduleData.title
            const pageTitle = document.getElementById("pageTitle");
            pageTitle.innerText = `Invisible Voice - ${moduleData.title}`
        }
        if (moduleData.connections) {
            loadGraphEls(moduleData.connections, moduleData.wikidata_id);
            pageHash = moduleData.connections.split('/')[2].replace('.json', '');
            if (Url.get.vote == 'true') {
                voteLoad();
            }
            connectionsFile = dataURL + moduleData.connections;
            if (typeof (addNewFile) == 'function') {
                addNewFile(`${dataURL}${moduleData.connections}`, false, localX, localY, wikidataid)
            }
        }

        contentSections = document.getElementsByClassName("content")[0].getElementsByClassName("contentSection")
        while (contentSections.length > 0) {
            contentSections[0].remove()
        }
        for (module of response.core) {
            if (module.url != 'local') {
                await addModule(type = module.type, url = `${dataURL}/ds/${module.url}`)
                    .then((string) => localString += string);
            }
        }
        for (const item in localModules)
            localString += (localModules[item] in response) ? await addLocalModule(localModules[item], response[localModules[item]]) : '';
        content.innerHTML += localString
        recalculateList()
        translator.translatePageTo()
    } catch (e) {
        console.error(e)
    }
}
function loadGraphEls(connections, wikidataIdList = false) {
    if (wikidataIdList) {
        wikidataidarray = wikidataIdList.join(",").replaceAll("Q", "").split(",");
        wikidataidarray.sort((a, b) => a - b);
        wikidataid = `Q${wikidataidarray[0]}`
    }
    // content.insertBefore()
    if (!document.getElementById("graph-box")) {
        const graphBox = document.createElement("section")
        graphBox.classList.add("contentSection")
        graphBox.id = "graph-box"
        body.insertBefore(graphBox, content)
    }
    if (!document.getElementById("graph-container")) {
        const graphContainer = document.createElement("div")
        graphContainer.id = "graph-container"
        graphContainer.classList.add("contentSection")
        graphContainer.innerHTML = `
        <h2 class="sectionTitle" data-i18n="graph.title" >Network Graph</h2>
    <div id="wikipedia-frame" style="display: none" >
        loading...
    </div>
    <div id="wikipedia-frame-close" style="display: none"></div>
    <div id="graphButtons">
        <button type="button" id="graphZoomIn"></button>
        <button type="button" id="graphZoomOut"></button>
        <button type="button" id="graphZoomReset"></button>
    </div>
    <div id="sigma-container"></div>`
        body.insertBefore(graphContainer, content)
    }

    if (document.getElementById("graphScript")) {
        return;
    }
    const graphScript = document.createElement("script")
    graphScript.src = "/js/d3-graph.js"
    graphScript.id = "graphScript"
    graphScript.setAttribute("defer", '')
    body.insertBefore(graphScript, content)
}

function postUpdate(data, topLevel = false) {
    if (data.comment) {
        moduleUpdate(data, true)
        return
    }
    if (debug) console.log(`topLevel ${topLevel}`)
    if (topLevel == true) {
        if (!document.getElementById("post")) {
            addLocalModule(type = "post", data = data).then((htmlString) => {
                content.innerHTML += htmlString
            })
            if (data.top_comment) {
                send_message("IVGetPost", data.top_comment);
            }
        }
    } else {
        if (debug) console.log(data)
        if (data.location.startsWith("db")) {
            document.getElementById("post").remove()
            addLocalModule(type = "post", data = data).then((htmlString) => {
                content.innerHTML += htmlString
            })
            if (data.top_comment) {
                send_message("IVGetPost", data.top_comment);
            }
        }
    }
}

const loadPageExternal = async (location) => {
    if (document.getElementById("post")) {
        document.getElementById("post").remove()
    }
    if (!settingsState.experimentalFeatures) return;
    postLocation = `${location.replace(".json", "").replace('/db', 'db')}`
    send_message("IVGetPost", postLocation)
}

var loginButtonEl;
function loginCheck() {
    if (document.getElementById("loginButton")) {
        document.getElementById("loginButton").remove()
    }
    if (!settingsState.experimentalFeatures) return;
    loginButtonEl = document.createElement("button");
    loginButtonEl.innerHTML = "<div></div>"
    loginButtonEl.id = "loginButton";
    loginButtonEl.classList.add("squareButton")
    loginButtonEl.setAttribute("type", "button");
    loginButtonEl.setAttribute("onclick", "loginButtonAction()");
    settingsButton.parentNode.insertBefore(loginButtonEl, settingsButton);

    if (Url.get.username)
        settingsState.loggedIn = true;
}
// load modules for matching data

const types = {
    "trustscore": { "id": "trust-scam", "label": "Trust Scam", "translate": "trustsc.title", "subname": true },
    "mbfc": { "id": "mbfc", "label": "Media Bias", "translate": "mbfc.title", "subname": true },
    "glassdoor": { "id": "glassdoor", "label": "Employee Rating", "translate": "glassdoor.title", "subname": true },
    "similar": { "id": "similar-site-wrapper", "label": "Similar Sites", "translate": "similar.title", "subname": false },
    "tosdr": { "id": "tosdr-link", "label": "Privacy", "translate": "tosdr.title", "subname": true },
    "trustpilot": { "id": "trust-pilot", "label": "Trust Pilot", "translate": "trustpilot.title", "subname": true },
    "yahoo": { "id": "yahoo", "label": "Esg Rating", "translate": "esg.title", "subname": true },
    "post": { "id": "post", "label": "User Added", "translate": "user.moduletitle", "subname": true },
    "bcorp": { "id": "bcorp", "label": "Bcorp Rating", "translate": "bcorp.title", "subname": true },
    "goodonyou": { "id": "goodonyou", "label": "Goodonyou Rating", "translate": "goy.title", "subname": true },
    "wbm": { "id": "wbm", "label": "WBM", "translate": "wbm.title", "subname": true },
    "cta": { "id": "cta", "label": "Call to Action", "translate": "cta.title", "subname": true },
    "opensecrets": { "id": "opensec", "label": "OpenSecrets", "translate": "os.title", "subname": true },
    "lobbyeu": { "id": "lobbyeu", "label": "LobbyFacts.eu", "translate": "lb.title", "subname": true },
    "post": { "id": "post", "label": "User Content", "translate": "user.moduletitle", "subname": true },
    "social": { "id": "social-wikidata", "label": "Social Media", "translate": "social.title", "subname": false },
    "political": { "id": "political-wikidata", "label": "Political Leanings", "translate": "political.title", "subname": true },
    "politicali": { "id": "politicali-wikidata", "label": "Political Ideology", "translate": "wikidata.polideology", "subname": true },
}

function tableRow(item) {
    return `<tr><th data-i18n="${item[0]}">${item[1]}</th><td>${item[2]}</td></tr>`
}
function sourceStringClose(href, text) {
    return `</div></div><a target="_blank" class="hideInSmall source" href='${href}'>${text}</a>`
}
function miniSource(href) {
    return `<a class="minisource" target="_blank" href="${href}"></a>`
}

var localString = ''

function moduleString(id, i18n, label, subname = false, scoreText = false, scoreClass = false, dataLoc = false) {
    subnameString = subname ? `<div class='subname'>(${subname})</div>` : '';
    scoreClassString = scoreClass ? `${scoreClass}` : 'scoreText';
    scoreTextString = scoreText ? `<div class="${scoreClass}">${scoreText}` : '';
    dataLocationString = dataLoc ? `data-location="${dataLoc}"` : '';
    return `<section class="contentSection" id="${id}" ${dataLocationString}>
            <h2 class="sectionTitle"><div data-i18n="${i18n}">${label}</div>${subnameString}
            <div class="squareButton hovertext hideInSmall"><div>?</div></div><div class="hidetext"><h3 data-i18n="title.${id}"> </h3><p data-i18n="desc.${id}"></div></h2>
              ${scoreTextString}`
}

function notPieString(data, trans = false, scoreClass = false, icon = false, outOf = false, reviews = false) {
    transString = trans == false ? '' : ` data-i18n="${trans}"`;
    scoreClassString = scoreClass == false ? 'biaslink' : scoreClass;
    iconString = icon == false ? '' : `<img class="iconclass" src="${icon}">`;
    ratingsString = reviews == false ? '' : `<div class="ratingCount">${reviews} <span data-i18n="glassdoor.reviews"></span></div>`;
    outOfString = outOf == false ? '' : ` style="--outOf:'${outOf}';" `;
    return `<div class="notPieContainer"><div>${iconString}
        <score class="${scoreClassString}"${transString}${outOfString}>${data}</score>
        ${ratingsString}
        </div>
		</div>`
}
function pieString(data, trans = false, scoreClass = false, percent = false, outOf = false, reviews = false, pieColour = false, inline = false) {
    transString = trans == false ? '' : ` data-i18n="${trans}"`;

    scoreClassString = scoreClass == false ? 'biaslink' : scoreClass
    ratingsString = reviews == false ? '' : `<div class="ratingCount">${reviews} <span data-i18n="glassdoor.reviews"></span></div>`;
    percentString = percent == false ?
        '' : `<div class="pie hideTilExpanded animate" style="--c:var(--chart-fore);--p:${percent};"></div>`;
    outOfString = outOf == false ? '' : ` style="--outOf:'${outOf}';" `;
    containerClass = (inline) ? "inlinePieContainer" : "pieContainer";
    pieColourString = pieColour == false ? '' : ` style='--c:${pieColour};'`;
    return `<div class="${containerClass}"><div>
        <div class="pie hideTilExpanded"${pieColourString}></div>
        ${percentString}
        <score class="${scoreClassString}"${transString}${outOfString}>${data}</score>
        ${ratingsString}
        </div>
		</div>`
}

function addToolsSection() {
    titleBar.innerHTML += `
<button id="roundelButton" type="button" onclick="spinRoundel()" ></button>
<button class="squareButton" id="backButton" type="button" onclick="justSendBack()" ><div></div></button>
<button class="squareButton" id="settingsButton" type="button" onclick="loadSettings()" ><div></div></button>
<button class="squareButton" id="closeButton" type="button" onclick="closeIV()" ><div></div></button>
    `
    const currentDomain = document.getElementsByClassName("co-name")[0].innerText
    content.innerHTML += `
    <section id="carbon">
        <div class="iconarray">
            <div><a href="https://www.websitecarbon.com/website/${currentDomain}"><i alt="Website Carbon Calculator"><div style="background-image:var(--image-carbon);" ></div></i></a></div>
            <div><a href="https://themarkup.org/blacklight?url=${currentDomain}"> <i alt="Blacklight"><div style="background-image:var(--image-lightning);"></div></i></a></div>
        </div>
    </section>
    <section id="Invisible-vote" class="hideInSmall hide">
    <section id="Invisible-like" onclick="vote('up')" style="--count:'0';" data-i18n="vote.like">Like</section>
    <section id="Invisible-dislike" onclick="vote('down')" style="--count:'0';" data-i18n="vote.dislike">Dislike</section>
    </section>
    <section id="Invisible-boycott" onclick="boycott()" data-i18n="vote.boycott" class="hideInSmall hide">Boycott</section>
    `
    backButton = document.getElementById('backButton');
    closeButton = document.getElementById('closeButton');
    roundelButton = document.getElementById('roundelButton');
    settingsButton = document.getElementById('settingsButton');
    voteButtons = document.getElementById('Invisible-vote');
    boyButton = document.getElementById('Invisible-boycott');


    if (Url.get.exhibit) {
		blur = 'blur(3px)';
        body.parentNode.setAttribute("style", "--c-background: transparent; --c-light-text:#111; --c-background-units: #fff6; background-color: transparent;");
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '.content > .contentSection').style.backgroundColor = '#fff8';
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '.content > .contentSection').style.backdropFilter = blur;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#disclaimer').style.backdropFilter = blur;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#disclaimer').style.backgroundColor = '#fff8';
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#disclaimer').style.top = 'calc(100vh - 190px)';
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#disclaimer').style.position = 'sticky';
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#titlebar').style.backgroundColor = '#fff8';
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#titlebar').style.backdropFilter = blur;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#carbon').style.backgroundColor = '#fff8';
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#carbon').style.backdropFilter = blur;
        body.setAttribute("style", "background-color: transparent;")
        closeButton.style.visibility = "hidden";
        settingsButton.style.visibility = "hidden";
        backButton.classList.add("hide")
        console.log("exhibitMode")

    }
    if (Url.get.app) {
        if (debug) console.log("[ Invisible Voice ]: phone mode");
        document.getElementsByClassName("content")[0].classList.add("mobile");
        body.classList.add("mobile");
        closeButton.style.visibility = "hidden";
    }
    if (!Url.get.app) {
        backButton.classList.add("show");
        closeButton.classList.add("closeExtention");
        document.getElementsByClassName("content")[0].classList.add("desktop");
        body.classList.add("desktop");
    }

    if (debug) console.log("[ IV ] Page load")
    if (Url.get.vote == 'true') {
        body.classList.add("topBar");
        boyButton.classList.toggle("hide");
        voteButtons.classList.toggle("hide");
        if (!Url.get.app) content.classList.add("padOnSmall");
        //voteLoad();
    } else {
        boyButton.style.visibility = "hidden";
        voteButtons.style.visibility = "hidden";
    }
    if (Url.get.expanded && Url.get.app) {
        document.getElementById(Url.get.expanded).classList.add("expanded")
        content.classList.add('somethingIsOpen');
    }

}

async function addLocalModule(type = undefined, data = undefined) {
    if (type == undefined || data == undefined) return;
    if (!(type in types)) { return; }

    // Genericising needed
    // console.log(data)
    if (type == "social") {
        htmlString = `${moduleString(types[type].id, types[type].translate, types[type].label, false)}
                        <section id="social-wikidata-links" class="fullBleed"><table>`
        for (label in data)
            for (item in data[label]) {
                htmlString += `<tr><th>${label.replaceAll(" id", "").replaceAll(" username", "")}</th>
                    <td><a class="spacelinks" href="${data[label][item].url}">${data[label][item].url}</a>${miniSource("https://wikidata.org")}</td>
                </tr>`
            }
        htmlString += `</table></section></section>`
    }
    if (type == "political") {
        lang = "enlabel"
        polString = ''
        for (label in data) {
            labelId = (label == "polalignment") ? "political-wikidata" : "politicali-wikidata";
            actLabel = (label == "polalignment") ? "Political Alignments" : "Political Ideologies";
            polString += moduleString(labelId, `wikidata.${label}`, actLabel, false, " ", "fullBleed")
            polString += '<div><ul>'
            for (item in data[label]) {
                itemObj = data[label][item]
                dataId = itemObj.dataId
                miniSourceHref = `https://wikidata.org/wiki/${dataId}`
                polString += `<li><h3>${itemObj.sourceLabels[lang]} <a class="spacelinks" href="https://wikidata.org/wiki/${dataId}">${itemObj.data[lang]}</a></h3>${miniSource(miniSourceHref)}</li>`
            }
            sourceString = sourceStringClose(`https://wikidata.org/wiki/${data[label][item].dataId}`, "WIKIDATA")
            polString += `</ul>${sourceString}</section>`
        }
        htmlString = polString
    }
    if (type == 'post') {
        postContent = $('<div/>').html(data.content).text()
        dataLocationString = data.uid.replace(dataURL, "").replace("/ds/", "").replace(".json", "");
        htmlString = `
		${moduleString(types[type].id, "user.moduletitle", "User Content", data.location, ' ', "fullBleed userText", dataLocationString)}
        <div>${postContent}
             ${sourceStringClose("https://assets.reveb.la/#user", data.author)}
			 ${voteBox(data.uid, data, "smallVoteBox bottomLeftOfModule hideInSmall")}
        </section>`

    }
    return htmlString
}

function voteBox(location_str, dataObj, styles = false) {
    classString = styles ? `class="${styles}"` : '';
    return `<ul ${classString}>
				<li><a target="_blank" data-i18n="vote.like" onclick="postalVote('up','${location_str}', '${dataObj.voteStatus}')" >Up</a><div>(${dataObj.up_total})</div></li>
				<li><a target="_blank" data-i18n="vote.dislike" onclick="postalVote('down','${location_str}', '${dataObj.voteStatus}')" >Down</a><div>(${dataObj.down_total})</div></li>
            	<li><a target="_blank" data-i18n="vote.comment" onclick="postalVote('comment','${location_str}', '${dataObj.voteStatus}')" >Comment</a><div>(${dataObj.comment_total})</div></li>
            </ul>`
}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

function opsTd(r) {
    return `<td style="--size: calc(${r.percent.replace("%", "")}/100);">
            <span class="data">${r.entity}</span>
            <span class="tooltip">${r.entity}<br>
                (${r.amount})</span>
            </td>`
}

function boldP(bold, text, styles = false) {
    classString = styles ? `class="${styles}"` : '';
    return `<p ${classString}><b>${bold}</b> ${text}</p>`
}

async function addModule(type = undefined, url = undefined) {
    if (type == undefined || url == undefined) return;
    // needs some mechanic for caching when we switch to graph mode
    const moduleData = await fetch(url);
    const moduleResponse = await moduleData.json()
    //console.log(moduleResponse)
    dataLocationString = url.replace(dataURL, "").replace("/ds/", "").replace(".json", "");
    if (!(type in types)) { return; }
    typeDef = types[type]
    // Genericising needed
    moduleSource = (typeDef.subname) ? moduleResponse.source : false;
    htmlString = moduleString(typeDef.id, typeDef.translate, typeDef.label, moduleSource, false, false, dataLocationString)

    if (type == "opensecrets") {
        //console.log(moduleResponse)
        htmlString += `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/charts.css/dist/charts.min.css">`
        if ("bill_most_heading" in moduleResponse) {
            htmlString += ` ${boldP(moduleResponse.bill_most_heading, '', "flavourText")}
            <p class="flavourText"><a href='${moduleResponse.bill_most_url}'>${moduleResponse.bill_most_title} (${moduleResponse.bill_most_code})</a></p>`
        }
        htmlString += '<div class="fullBleed"><div><p data-i18n="os.disclaimer"></p><br>'
        if ("cycle_year" in moduleResponse) {
            htmlString += `<p>Data is true of the ${moduleResponse.cycle_year} cycle</p> <table>`
            const ranks = ["contributions_rank", "contributions_amount", "lobbying_rank"];
            for (const rank in ranks) {
                if (ranks[rank] in moduleResponse)
                    htmlString += tableRow(["", toTitleCase(ranks[rank].replace("_", " ")), moduleResponse[ranks[rank]]])
            }

            htmlString += '</table><div class="charts">'
            if ("bars" in moduleResponse) {
                bars = moduleResponse.bars;
                const charts = {
                    "recipients_of_funds": "Recipients of Funds",
                    "sources_of_funds": "Sources of Funds",
                    "sources_of_funds_to_candidates": "Sources of Funds to Candidates"
                };

                for (const chartType in charts) {
                    if (chartType in bars) {
                        htmlString += `
                        <h3 data-i18n="opensec.${chartType}">${charts[chartType]}</h3>
                        <table class="charts-css multiple stacked bar show-heading"><tbody><tr>`;
                        for (const item in bars[chartType]) {
                            htmlString += opsTd(bars[chartType][item]);
                        }
                        htmlString += "</tr></tbody></table>";
                    }
                }
            }
            if ("charts" in moduleResponse) {
                charts = moduleResponse.charts;
                commonString = `<h4 style="color:red !important;" data-i18n="opensec.republicans">Republicans</h4>
                            <h4 style="color:blue !important;" data-i18n="opensec.democrats">Democrats</h4>
                            <table class="charts-css line multiple hide-data show-labels show-primary-axis show-data-on-hover" style="--color-1: blue;--color-2:red;">
                            <thead>
                                <tr>
                                <th data-i18n="opensec.year"        scope="col">Year</th>
                                <th data-i18n="opensec.democrats"   scope="col">Democrats</th>
                                <th data-i18n="opensec.republicans" scope="col">Republicans</th>
                                </tr>
                            </thead><tbody>`
                for (chartType in charts) {
                    house = charts[chartType]
                    houseDems = house.Dems.all_years
                    houseRepubs = house.Repubs.all_years
                    heightThou = [].concat(houseDems, houseRepubs).sort((a, b) => a - b).reverse()[0] / 1000
                    if (heightThou > 0) {
                        htmlString += `<h3 data-i18n="opensec.${chartType.toLowerCase()}">${chartType}</h3>${commonString}`
                        lastD = 0
                        lastR = 0
                        for (year in house.all_data) {
                            dataD = house.all_data[year].Dems;
                            dataR = house.all_data[year].Repubs;
                            tD = dataD / (heightThou * 1000)
                            tR = dataR / (heightThou * 1000)
                            htmlString += `
                                <tr><th scope="row">${year}</th>
                                    <td style="--start:${lastD}; --size:${tD};"><span class="data">${dataD}</span></td>
                                    <td style="--start:${lastR}; --size:${tR};"><span class="data">${dataR}</span></td>
                                </tr>
                            `
                            lastD = tD;
                            lastR = tR;

                        }
                        htmlString += "</tbody></table>"
                    }

                }
                htmlString += "</div>"

            }

            if ("lobbycards" in moduleResponse) {
                htmlString += "<div class='fullBleed'><h3 data-i18n='opensec.lobbying'> Lobbying </h3>"
                for (card of moduleResponse.lobbycards) {
                    htmlString += `
                            <div class="openSecLobbyCardContainer"><h4>${card.year}</h4><h5>${card.dollars}</h5>
							<table>
							${tableRow(["opensec.Lobbyistingov", "Lobbyists who worked in government", `${card.held.count} (${card.held.percent})`])}
							${tableRow(["opensec.Lobbyistnotingov", "Lobbyists who havent worked in government", `${card.notheld.count} (${card.notheld.percent})`])}
							</table>
                            </div>
                    `
                }
                htmlString += "</div>"
            }

        }
        sourceUrl = `https://www.opensecrets.org/orgs/name/summary?id=${moduleResponse.osid}`
        htmlString += `
                ${sourceStringClose(sourceUrl, "OPENSECRETS")}
                </div>
                `
    }

    if (type == "wbm") {
        source = "https://www.worldbenchmarkingalliance.org/research/"
        htmlString += "<div class='fullBleed'><div class=''>"
        for (module in moduleResponse.modules) {
            pieItem = ''
            file = moduleResponse.modules[module].file;
            trans = file.split("_").slice(1).join("-").toLowerCase()
            year = file.split("_")[0]
            fileName = file.split("_").slice(1).join(" ")
            dataLocationString = url.replace(dataURL, "").replace("/ds/", "").replace(".json", "");
            htmlString += `<div class='submodule' data-location="${dataLocationString}-${trans}"><h2 class="subModuleTitle"><span data-i18n="wbm.${trans}" style="--year:'${year}';">${fileName}</span>
            <div class="squareButton hovertext hideInSmall"><div>?</div></div><div class="hidetext"><h3 data-i18n="title.wbm-${trans}"> </h3><p data-i18n="desc.wbm-${trans}"></div></h2>
                </h2><table>`
            for (item of Object.keys(moduleResponse.modules[module])) {
                if (item.includes("Total Score")) {
                    if (!item.includes("Raw")) {
                        outOf = Number(item.split("(")[1].replace(")", ""))
                        itemLabel = item.split("(")[0]
                        score = Number(moduleResponse.modules[module][item])
                        percent = (score / outOf) * 100
                        pieItem += pieString(score, false, "ratingOutOf", percent, `/ ${outOf}`, false, false, true)
                    }
                } else if (item != "file" && item != "Company Scorecard") {
                    itemLabel = item.split("(")[0]
                    itemTrans = itemLabel.trim().toLowerCase().replaceAll(" ", "-").replaceAll(/;|'|:|’|,/g, "").replaceAll("--", "-").replaceAll("/", "").replaceAll(".", "")
                    if (item.includes("(")) {
                        outOf = item.split("(")[1].replace(")", "")
                        htmlString += `<tr><th data-i18n='wbm.${itemTrans}'>${itemLabel}</th>
                    <td style="--outOf:'/ ${outOf}';" class="ratingOutOf" >${moduleResponse.modules[module][item]}</td></tr>`
                    } else {
                        htmlString += `<tr><th data-i18n='${itemTrans}'>${item}</th> 
                    <td style="--outOf:'';" >${moduleResponse.modules[module][item]}</td></tr>`
                    }
                }
            }
            htmlString += `</table>${pieItem}${miniSource(fileName)}</div>`
        }
        htmlString += sourceStringClose(source, "WBM")

        if (settingsState.experimentalFeatures)
            htmlString += `<button type='button' data-i18n="vote.loadinfo" class='loadInfoButton hideInSmall bottomLeftOfModule' onclick="postLoad(this)"> Load info</button>`
        htmlString += "</section>"

    }
    if (type == "cta") {
        positiveString = ''
        negativeString = ''
        for (link in moduleResponse.links) {
            if (moduleResponse.links[link].type == "positive") {
                positiveString += `<div><a href='${moduleResponse.links[link].url}'>${moduleResponse.links[link].label}</a></div>`
            } else {
                negativeString += `<div><a href='${moduleResponse.links[link].url}'>${moduleResponse.links[link].label}</a></div>`
            }
        }
        htmlString += `
        <div class="fullBleed">
        <div>
        <p>${moduleResponse.description}</p>
        </div>
		<div><div><h4> Positive </h4>${positiveString}</div><div><h4> Negative </h4> ${negativeString}</div>${sourceStringClose("https://assets.reveb.la/", moduleResponse.author)}`
    }
    if (type == "lobbyeu") {
        rating = moduleResponse
        options = [["lb.transparency_id", "Transparency ID:", moduleResponse.eu_transparency_id],
        ["lb.hq_countries", "HQ Country:", moduleResponse.head_country],
        ["lb.eu_country", "EU Office Country:", moduleResponse.be_country],
        ["lb.lobby_count", "Lobbyist Count:", moduleResponse.lobbyist_count],
        ["lb.lobby_fte", "Lobbyist FTE:", moduleResponse.lobbyist_fte],
        ["lb.calculated_cost", "Calculated Total Cost:", moduleResponse.calculated_cost],
        ["lb.meeting_count", "Meetings with the EU:", moduleResponse.meeting_count],
        ["lb.passes_count", "Lobbyist Passes Count:", moduleResponse.passes_count]]
        htmlString += `<div class="fullBleed"><div> <table>`
        for (item in options) {
            htmlString += tableRow(options[item])
        }
        sourceUrl = `https://lobbyfacts.eu/datacard/org?rid=${moduleResponse.eu_transparency_id}`
        htmlString += `</table>${sourceStringClose(sourceUrl, "EU Transparency register via LobbyFacts.eu")}`
    }
    if (type == "goodonyou") {
        rating = (moduleResponse.rating / 5) * 100
        lrating = Math.floor(moduleResponse.labourRating / 4)
        arating = Math.floor(moduleResponse.animalRating / 4)
        erating = Math.floor(moduleResponse.environmentRating / 4)
        sourceUrl = `https://directory.goodonyou.eco/brand/${moduleResponse.source.split("/")[1]}`
        htmlString += `
        ${pieString(moduleResponse.rating, false, "ratingOutOf", rating, '/5', false)}
<div class="scoreText">
    <div>
<table class="dataTable">
<tr><th data-i18n="goy.lr">Labour Rating</th><td class="ratingOutOf" style="--outOf:'/5';">${lrating}</td></tr>
<tr><th data-i18n="goy.ar">Animal Rating</th><td class="ratingOutOf" style="--outOf:'/5';">${arating}</td></tr>
<tr><th data-i18n="goy.evr">Environment Rating</th><td class="ratingOutOf" style="--outOf:'/5';">${erating}</td></tr>
<tr><th data-i18n="goy.p">Price</th><td class="ratingOutOf" style="--outOf:'/4';">${moduleResponse.price}</td></tr>
</table>
${sourceStringClose(sourceUrl, "GOODONYOU.ECO")}
        `
    }

    if (type == "bcorp") {

        sourceUrl = `https://www.bcorporation.net/en-us/find-a-b-corp/company/${moduleResponse.slug}`
        iconUrl = `${dataURL}/icon/bcorp.svg`;

        htmlString += `${notPieString(moduleResponse.score, false, "ratingOutOf", iconUrl, "/140+")}
    <div class="scoreText"><div>
    <table class="dataTable">
    <tr><th data-i18n="common.industry_average">Industry Average Score</th><td class="ratingOutOf" style="--outOf:'/140+'">${moduleResponse.score_industryAverage}</td></tr>
    <tr><th data-i18n="bcorp.governance"></th><td class="ratingOutOf">${moduleResponse.Governance}</td></tr>
    <tr><th data-i18n="bcorp.workers"></th><td class="ratingOutOf">${moduleResponse.Workers}</td></tr>
    <tr><th data-i18n="bcorp.community"></th><td class="ratingOutOf">${moduleResponse.Community}</td></tr>
    <tr><th data-i18n="bcorp.environment"></th><td class="ratingOutOf">${moduleResponse.Environment}</td></tr>
    <tr><th data-i18n="bcorp.customers"></th><td class="ratingOutOf">${moduleResponse.Customers}</td></tr>
    </table>
    ${sourceStringClose(sourceUrl, "BCORP")}`
    }


    if (type == 'yahoo') {
        formatting = [["Negligible", "0 - 9.9 "], ["Low", "10 - 19.9"], ["Medium", "20 - 29.9"], ["High", "30 - 39.9"], ["Severe", "40+      "]]

        biasString = '<div class="fullBleed"><div class="esgKey"><h3 data-i18n="esg.gradingscale">Grading Scale</h3><table class="esgKey">'
        for (item in formatting) {
            biasString += `<tr><th><div data-i18n="esg.${formatting[item][0].toLowerCase()}" class="biaslink">${formatting[item][0]}</div></th><td>${formatting[item][1]}</td></tr>`
        }

        scores = [['esg.environmental', 'Environmental Risk Score', moduleResponse.environmentScore],
        ['esg.governance', 'Governance Risk Score', moduleResponse.governanceScore],
        ['esg.social', 'Social Risk Score', moduleResponse.socialScore],
        ['esg.total', 'Total ESG', moduleResponse.totalEsg]]

        tableString = '<div class="scoreText"><div><table>'
        for (item in scores) {
            tableString += `<tr><th data-i18n='${scores[item][0]}'>${scores[item][1]}</th><td style="--outOf:'/ 40+';">${scores[item][2]}</td></tr>`
        }
        sourceUrl = `https://finance.yahoo.com/quote/${moduleResponse.ticker}/sustainability`
        htmlString += `
        ${pieString(moduleResponse.totalEsg, false, "ratingOutOf", false, '/40+')}
        ${tableString}
        </table>
        </div>
        </div>
        ${biasString}
        </table>
${sourceStringClose(sourceUrl, "SUSTAINALYTICS, INC VIA YAHOO! FINANCE")}`
    }
    if (type == 'trustscore') {
        sourceUrl = `https://trustscam.com/${moduleResponse.source}`
        htmlString += `
		${pieString(moduleResponse.score, false, false, false, false, false, ratingColorArray[moduleResponse.rating])}
        <div class="scoreText">
            <div>
                <h3>${moduleResponse.score}</h3>
                <p data-i18n="trustsc.${moduleResponse.rating}">${moduleResponse.rating}</p>
                ${sourceStringClose(sourceUrl, "TRUSTSCAM")}`;
    }

    if (type == 'mbfc') {
        questionableString = ''
        for (tag in moduleResponse.questionable) {
            questionableString += `<span class="questionable">${toTitleCase(moduleResponse.questionable[tag].replaceAll('-', ' '))}</span>`
        }
        htmlString += `
		${pieString(moduleResponse.bias, `bias.${moduleResponse.bias}`)}
        <div class="scoreText">
            <div>
                <h3 data-i18n="bias.${moduleResponse.bias}"></h3>
                <p>${moduleResponse.description}</p>
				<table>
                ${tableRow(["bias.popularity", "Popularity:", moduleResponse.popularity])}
                ${tableRow(["bias.credibility", "Credibility:", moduleResponse.credibility])}
                ${tableRow(["bias.reporting", "Reporting:", moduleResponse.reporting])}
				</table>
				<div><h4 data-i18n="bias.questionable">Reasons for Questionable:</h4><div class="questionableContainer"> ${questionableString}</div></div>
                ${sourceStringClose(moduleResponse.url, "MEDIA BIAS FACT CHECK")}`;
    }

    if (type == 'glassdoor') {
        percentValue = (parseFloat(moduleResponse.glasroom_rating.ratingValue) / 5) * 100;
        htmlString += `
			${pieString(moduleResponse.glasroom_rating.ratingValue, false, "ratingOutOf", percentValue, "/5", moduleResponse.glasroom_rating.ratingCount)}
            <div class="scoreText">
                <div>
            <div class="ratingCount">${moduleResponse.glasroom_rating.ratingCount} <emphasis class="ratingCount" data-i18n="glassdoor.reviews"></emphasis></div>
            <table class="dataTable">
            <tr><th data-i18n="common.industry_average">Industry Average Score</th><td class="ratingOutOf glass" style="--outOf:'/5'">${moduleResponse.score_industryAverage}</td></tr>
            <tr><th data-i18n="glassdoor.companyt"></th><td class="ratingOutOf glass" data-i18n="glassdoor.${moduleResponse.type.toLowerCase().replace(" - ", "_").replace(" ", "_")}">${moduleResponse.type}</td></tr>
            <tr><th data-i18n="glassdoor.headquarters"></th><td class="ratingOutOf glass">${moduleResponse.headquarters}</td></tr>
            <tr><th data-i18n="glassdoor.founded"></th><td class="ratingOutOf glass">${moduleResponse.founded}</td></tr> 
            <tr><th data-i18n="glassdoor.industry"></th><td class="ratingOutOf glass">${moduleResponse.industry}</td></tr> 
            <tr><th data-i18n="glassdoor.revenue"></th><td class="ratingOutOf glass">${moduleResponse.revenue}</td></tr>
            <tr><th data-i18n="glassdoor.size"></th><td class="ratingOutOf glass">${moduleResponse.size}</td></tr>
            </table>
            ${sourceStringClose(moduleResponse.url, "GLASSDOOR")}`;
    }

    if (type == 'tosdr') {
        rated = moduleResponse.rated;
        sourceUrl = `https://tosdr.org/en/service/${moduleResponse.id}`
        htmlString += `
			${pieString(rated)}
            <div class="scoreText">
                <div>
            <h3><div data-i18n="tos.wordGrade" style="display:inline;">Grade</div> ${rated}</h3>
            <p data-i18n="tos.${rated.toLowerCase()}"></p>
            ${sourceStringClose(sourceUrl, "TOS;DR")}`;
    }

    if (type == 'trustpilot') {
        starString = ''
        numberOfStars = Math.floor(moduleResponse.score);
        remainingStar = moduleResponse.score - numberOfStars;
        sourceUrl = `https://trustpilot.com/review/${moduleResponse.domain}`
        for (let i = 0; i < 5; i++) {
            division = (numberOfStars > i) ? 1 : 0;
            division = (numberOfStars == i) ? remainingStar : division;
            starString += `<span class="coolStar" style="--division:${division};"></span>`
        }
        htmlString += `
        ${notPieString(moduleResponse.score, false, "ratingOutOf", false, '/5', moduleResponse.reviews.total)}
         <div class="scoreText">
             <div>
         <div class="stars">
         ${starString}
         </div>
         <table id="trustChart">
             <tr><th data-i18n="trustpilot.total">Total Reviews</th><td>${moduleResponse.reviews.total}</td></tr>
             <tr><th data-i18n="trustpilot.one">One Star</th><td>${moduleResponse.reviews.oneStar}</td></tr>
             <tr><th data-i18n="trustpilot.two">Two Star</th><td>${moduleResponse.reviews.twoStars}</td></tr>
             <tr><th data-i18n="trustpilot.three">Three Star</th><td>${moduleResponse.reviews.threeStars}</td></tr>
             <tr><th data-i18n="trustpilot.four">Four Star</th><td>${moduleResponse.reviews.fourStars}</td></tr>
             <tr><th data-i18n="trustpilot.five">Five Star</th><td>${moduleResponse.reviews.fiveStars}</td></tr>
         </table>
        ${sourceStringClose(sourceUrl, "TRUST PILOT")}`
    }
    if (type == 'similar') {
        sourceUrl = `https://similarsites.com/site/${moduleResponse.domain}`
        similarString = ''
        for (site in moduleResponse.similar) {
            ssite = moduleResponse.similar[site].s
            p = Math.floor(moduleResponse.similar[site].p * 100)
            similarString += `<section class="similar-site">
            <a target="_blank" alt="${ssite}" href="https://${ssite}">
                ${ssite}</a><div class="percent">${p}</div></section>`;
        }

        htmlString += `
        <div class="fullBleed"><div>
        <section id="similar-sites" class="hideInSmall">
        ${similarString}
        </section>
        ${sourceStringClose(sourceUrl, "SIMILARSITES.COM")}
        `;

    }
    if (type != 'wbm') {
        if (settingsState.experimentalFeatures) {
            htmlString += `<button type='button' data-i18n="vote.loadinfo" class='loadInfoButton hideInSmall bottomLeftOfModule' onclick="postLoad(this)"> Load info</button>`
        }
        htmlString += "</section>"
    }
    return htmlString
}


function commentDiagOpen(location = hash) {
    // Location, post_type, content
    if (diagOpen) return;
    diagOpen = true;
    if (location == hash) {
        var leader = `${Url.get.username} is posting on ${document.getElementsByClassName("co-name")[0].innerText}`;
    } else {
        var leader = `${Url.get.username} is posting on ${location}`;
    }
    floatDiag = document.createElement("div");
    floatDiag.id = "floatDiag"
    floatDiag.textContent = "oh"
    floatDiag.classList.add("recolorOutlineOnOpen")
    floatDiag.setAttribute("style", "--start:0px;--end:400px;")
    floatDiag.innerHTML = `
    <div id="diag_type" class="commentLeader">${leader}</div><br/>
    <div style="display:none;" id="diag_tag">${location}</div><br/>
    <div class="commentBox">
		<textarea id="commentBoxInput" name="commentBoxInput" maxlength="512" type="text" ></textarea>
    </div>
    <div onclick="commentClose(true)" class="commentButton commentPost">Post</div>
	<div class="squareButton" onclick="commentClose()" class="commentButton commentClose"><div></div></div>`
    body.appendChild(floatDiag)
    body.classList.add("somethingIsOpen");
    console.log(leader)
    body.style.overflowY = "hidden";
    titleBar.style.visibility = "hidden";
    body.style.height = "100vh";
}

function commentClose(post = false) {
    diagOpen = false;
    floatDiag = document.getElementById("floatDiag");
    if (post) {
        diagTag = document.getElementById("diag_tag").textContent;
        comment_content = document.getElementById("commentBoxInput").value
        if (diagTag.length == "32") {
            console.log("page")
            diagTag = `${document.getElementById('location-url').textContent.replace(".json", "").replace('/db', 'db')}`
        } else {
            console.log("module")
        }
        comment = {
            location: diagTag,
            content: comment_content,
            post_type: "text"
        }
        send_message("IVMakePost", comment)
        console.log(comment_content)
    }
    body.classList.remove("somethingIsOpen");
    body.style.overflowY = "";
    titleBar.style.visibility = "";
    body.style.height = "";
    floatDiag.remove()
}

function loginButtonAction() {
    if (Url.get.username) {
        commentDiagOpen();
        return
    }
    window.open(`${assetsURL}/auth/login`, '_blank').focus()
}


function send_message(type, data) {
    const msg = { type, data };
    if (parent) {
        try {
            parent.postMessage(msg, "*");
        } catch (e) {
            console.error(e);
        }
    } else {
        console.error("parent not found");
    }
}

function forceAllLinksNewTab() {
    document.querySelectorAll('a').forEach(el => {
        el.setAttribute("target", "_blank");
    });
}

let noOpen = false;
const titleBar = document.getElementById('titlebar');
const fullPage = document.documentElement;
const content = document.getElementsByClassName('content')[0];
const body = document.body;
const settings = document.getElementById('settings');
function closeIV() { send_message("IVClose", "closeButton"); };


function spinRoundel() {
    roundelButton.animate(
        [{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }],
        { duration: 500, iterations: 1 })
}


const settingsOffset = settings.firstElementChild.clientHeight;
function setBack(x = false) {
    const networkGraph = document.getElementById('graph-container');
    if (x == false) {
        backButton.style.backgroundColor = '';
        backButton.style.borderColor = '';
        closeButton.style.display = "";
        roundelButton.style.opacity = '';

        settings.firstElementChild.style.top = `-${settingsOffset}`;
        settings.style.bottom = "200vh";
        settings.style.top = "";

        settingsButton.style.display = 'block';

        titleBar.style.backgroundColor =
            titleBar.style.display =
            titleBar.style.position =
            titleBar.style.top = "";
    }

    if (networkGraph != null && x != "closeNetworkGraph()") networkGraph.style.visibility = 'hidden';
    if (Url.get.app) backButton.classList.remove("show");
    if (settingsState.experimentalFeatures) loginButtonEl.style.display = 'block';

    backAction = (x == false) ? "justSendBack()" : x;
    if (x != false) {
        backButton.classList.add("show");
        settingsButton.style.display = 'none';
        if (settingsState.experimentalFeatures)
            loginButtonEl.style.display = 'none';
        roundelButton.style.opacity = '0';
    }
    backButton.setAttribute("onclick", backAction);

    window.scrollTo(0, 0);
}

let userPreferences = {}
let buttonState = {}
function toggleButton(buttonId) {
    buttonState[buttonId] = !buttonState[buttonId];
    document.getElementById(`label-${buttonId}`).classList.toggle("pushedButton");
}

let diagOpen = false;
function notificationDialog(el) {
    if (diagOpen) return;
    setBack("notificationCloseAndSave(false)")
    console.log(el.id)
    id = el.id;
    diagOpen = true;
    const loadedPreferences = settingsState.userPreferences == {} ? {} : settingsState.userPreferences;
    const mergedPreferences = { ...defaultUserPreferences, ...loadedPreferences };
    settingsState.userPreferences = mergedPreferences;
    userPreferences = mergedPreferences;

    notid = id.replace("-dialog", "")
    if (debug) console.log(notid)
    defaults = defaultUserPreferences[notid]
    floatDiag = document.createElement("div");
    floatDiag.id = "floatDiag"
    if (defaults.type == "range") {
        floatDiag.textContent = `${id} min:${defaults.min} max:${defaults.max}`
        floatDiag.innerHTML = `
        <div id="diag_type">${defaults.type}</div><br/>
        <div id="diag_tag">${notid}</div><br/>
        <div class="rangeslider">
            <input class="min" name="range_1" type="range" min="${defaults.min}" max="${defaults.max}" value="${userPreferences[notid].min}" />
            <input class="max" name="range_1" type="range" min="${defaults.min}" max="${defaults.max}" value="${userPreferences[notid].max}" />
            <span class="range_min light left">${userPreferences[notid].min}</span>
            <span class="range_max light right">${userPreferences[notid].max}</span>
        </div>
        <div id="floatDiagSave">Save and Close</div>`
    } else {
        let htmlString = "";
        buttonState = {};
        defaults.labels.forEach((str) => {
            // Use backticks to create a template string with the button HTML
            if (userPreferences[notid].labels.includes(str)) {
                htmlString += `<button id="label-${str}" onclick="toggleButton('${str}')" class="pushedButton">${str}</button>`;
                buttonState[str] = true;
            } else {
                htmlString += `<button id="label-${str}" onclick="toggleButton('${str}')">${str}</button>`;
                buttonState[str] = false;
            }

        });

        floatDiag.innerHTML = `
        <div id="diag_type">${defaults.type}</div><br/>
        <div id="diag_tag">${notid}</div><br/>
        <div>${id}</div>
        ${htmlString}
        <div id="floatDiagSave">Save and Close</div>
        `
    }
    body.appendChild(floatDiag);
    (() => {

        function addSeparator(nStr) {
            nStr += '';
            const x = nStr.split('.');
            let x1 = x[0];
            const x2 = x.length > 1 ? `.${x[1]}` : '';
            const rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1.$2');
            }
            return x1 + x2;
        }

        function rangeInputChangeEventHandler(e) {
            const minBtn = $(this).parent().children('.min');
            const maxBtn = $(this).parent().children('.max');
            const range_min = $(this).parent().children('.range_min');
            const range_max = $(this).parent().children('.range_max');
            var minVal = parseInt($(minBtn).val());
            var maxVal = parseInt($(maxBtn).val());
            const origin = e.originalEvent.target.className;

            if (origin === 'min' && minVal > maxVal - 1) {
                $(minBtn).val(maxVal - 1);
            }
            var minVal = parseInt($(minBtn).val());
            $(range_min).html(addSeparator(minVal));


            if (origin === 'max' && maxVal - 1 < minVal) {
                $(maxBtn).val(1 + minVal);
            }
            var maxVal = parseInt($(maxBtn).val());
            $(range_max).html(addSeparator(maxVal));
        }

        $('input[type="range"]').on('input', rangeInputChangeEventHandler);
    })();

}

function notificationCloseAndSave(save = true) {
    if (save) {
        diagOpen = false;
        floatDiag = document.getElementById("floatDiag");
        diagType = document.getElementById("diag_type").textContent;
        diagTag = document.getElementById("diag_tag").textContent;
        if (diagType == "range") {
            newMin = floatDiag.getElementsByClassName("range_min")[0].textContent;
            newMax = floatDiag.getElementsByClassName("range_max")[0].textContent;
            userPreferences[diagTag].min = parseInt(newMin);
            userPreferences[diagTag].max = parseInt(newMax);
        } else {
            const activeButtons = defaultUserPreferences[diagTag].labels.filter((buttonId) => buttonState[buttonId]);
            userPreferences[diagTag].labels = activeButtons;
        }
        settingsState.userPreferences = userPreferences;
        settingsStateChange();
    }
    floatDiag.remove()
    setBack();
}

function notificationsDraw() {
    if (debug) console.log(` notification set to ${settingsState["notifications"]}`)
    if (settingsState["notifications"]) {
        for (const tag of availableNotifications) {
            if (document.getElementById(`${tag}-bell`) == null) {
                currEl = document.querySelector(`[data-id="${keyconversion[tag]}"]`);
                toggleContainer = document.createElement("div");
                toggleContainer.classList.add("tagToggleContainer");

                toggleDialog = `<img id="${tag}-dialog" class="notificationDialog" onclick="notificationDialog(this)">
                    <div id="${tag}-bell" class="notificationBell">
                        <label class="switch">
                            <input type="checkbox">
                            <span class="slider round">
                            </span>
                        </label>
                    </div>`;
                toggleContainer.innerHTML += toggleDialog;
                currEl.appendChild(toggleContainer);
            }
            document.getElementById(`${tag}-bell`).getElementsByTagName("input")[0].checked = settingsState["notificationsTags"].includes(tag);
        }
        cacheButton = document.getElementById("notificationsCache");
        cacheButton.style.display = "block";
        return;
    }
    // check for if toggles are there already, remove them if they are 
    document.querySelectorAll(".notificationBell").forEach(x => x.remove());
    document.querySelectorAll(".notificationDialog").forEach(x => x.remove());
}

function settingTemplate(id, i18n, title, state = "skip") {
    const el = document.createElement("div");
    el.id = id
    el.classList.add("switchItem")
    el.innerHTML = `
        <h2 data-i18n="${i18n}">${title}</h2>
            <label class="switch">
                <input type="checkbox">
            <span class="slider round"></span>
        </label> `
    if (state != "skip") {
        el.getElementsByTagName("input")[0].checked = state;
    }
    settings.appendChild(el)
}


function addSettings() {
    // Language Picker
    const languagePicker = document.createElement("label");
    languagePicker.classList.add("languageSelect")
    let languagePickerOptions = `<option value="-">-</option>`
    for (lang in languages) {
        languagePickerOptions += `<option value="${languages[lang]}">${languages[lang].toUpperCase()}</option>`
    }
    languagePicker.innerHTML = `<h2 data-i18n="common.language">Language</h2>
                                <select id="langselect" title="Language Picker">${languagePickerOptions}</select>`

    settings.appendChild(languagePicker)

    settingTemplate("onScreen", "settings.dashboard", "Keep dashboard on screen", settingsState.keepOnScreen)
    settingTemplate("permaDark", "settings.darkMode", "Dark Mode", settingsState.darkMode)
    settingTemplate("bobbleDisable", "settings.bobbleDisabled", "Disable Bobble", settingsState.bobbleOverride)
    settingTemplate("debug-banner", "settings.debugBanner", "Debug Mode", settingsState.debugMode)
    settingTemplate("externalPosts-banner", "settings.externalPosts", "Experimental Features", settingsState.experimentalFeatures)

    // Dismissed Notifications
    const dissmissedNotifications = document.createElement("div");
    dissmissedNotifications.id = "dissmissedNotifications";
    dissmissedNotifications.innerHTML = `<h2>You have dismissed the following</h2>
        <ul style="display:inline;" id="dismissedContainer"></ul>`
    dissmissedNotifications.style.display = "none";
    dissmissedNotifications.classList.add("switchItem");
    settings.appendChild(dissmissedNotifications);

    // Notifications
    const notifications = document.createElement("div");
    notifications.id = "notifications-shade";
    notifications.classList.add("switchItem");
    notifications.innerHTML = `<h2 data-i85n="settings.notifications">Notifications</h2>
        <div id="notificationsContainer" style="display:flex;">
        <img id="notificationsCache" style="display:none;width:24px;height:24px;position:relative;transform:translate(-20px,13px);">
        <label class="switch"><input type="checkbox"><span class="slider round"></span></label></div></div>`
    settings.appendChild(notifications);

    if (settingsState["notifications"]) {
        cacheButton = document.getElementById("notificationsCache");
        cacheButton.style.display = "block";
        tagList = settingsState["notificationsTags"] || "";
    }

    const priorityList = document.createElement("div");
    priorityList.id = "priority-list";
    listString = ''
    wbmListString = ''
    for (item in translate) {
        if (!item.startsWith("wbm")) {
            listString += `<li data-id="${item}"><i class="priority-list-handle"></i><span>${translate[item]}</span></li>`
        } else if (item == "wbm") {
            listString += `<li data-id="${item}"><i class="priority-list-handle"></i><span>${translate[item]}</span><div id="sortlist-wbm">${wbmListString}</div></li>`
        } else {
            wbmListString += `<div data-id="${item}"><i class="priority-list-handle-wbm"></i><span>${translate[item]}</span></div>`
        }
    }
    priorityList.innerHTML = `
     <h2 data-i18n="settings.priorityTitle">Prioritise Modules</h2>
     <div data-i18n="settings.priorityOrder">Drag to re-order modules</div>
       <ul id="sortlist" class="slist">
       ${listString}
        </ul>`;
    settings.appendChild(priorityList)
}

function loadSettings(x) {
    const coName = document.getElementsByClassName('co-name')[0];
    body.classList.add("settingsOpen");
    if (settings.style.bottom == "0px") {
        closeSettings();
        send_message("IVClicked", "unsettings");
        setBack();
        return;
    }
    settings.style.bottom = "0";
    settings.style.top = `${settingsOffset}`;
    if (Url.get.app) {
        backButton.style.visibility = "visible";
        backButton.style.display = "inherit";
        backButton.style.order = "unset";
    } else {
        closeButton.style.display = "none";
    }
    settings.firstElementChild.style.top = "0";
    backButton.style.backgroundColor = 'var(--c-secondary-background)';
    backButton.style.borderColor = 'var(--c-light-text)';
    coName.style.opacity = "0%";
    fullPage.style.overflow = "hidden";

    notificationsDraw();
    send_message("IVClicked", "settings");
    setBack('closeSettings()');
}

function loadNetworkGraph(x) {
    const networkGraph = document.getElementById('graph-container');
    const sigmacontainer = document.getElementById('sigma-container');
    const graphButtons = document.getElementById('graphButtons');
    backButton.style.borderColor = 'var(--c-border-color)';
    backButton.style.backgroundColor = 'var(--c-background)';
	backButton.classList.remove("hide")
    networkGraph.style.visibility = 'visible';
    sigmacontainer.style.visibility = 'visible';
    sigmacontainer.style.width = "100vw";
    sigmacontainer.style.height = "100vh";
    sigmacontainer.style.position = "fixed";
    sigmacontainer.style.zIndex = "4";
    networkGraph.classList.add("expanded");
    body.classList.add('somethingIsOpen');
    if (Url.get.app) {
        noOpen = true;
    } else {
        closeButton.style.display = "none";
    }
    titleBar.style.position = "";
    titleBar.style.top = "0";
    graphButtons.style.top = "12px";
    window.scrollTo(0, 0);
    document.getElementsByTagName('content');
    send_message("IVClicked", "antwork");
    setBack('closeNetworkGraph()');
}

function closeNetworkGraph(x) {
    const networkGraph = document.getElementById('graph-container');
    const sigmacontainer = document.getElementById('sigma-container');
    const graphButtons = document.getElementById('graphButtons');
    networkGraph.style.visibility = 'hidden';
    body.classList.remove('somethingIsOpen');
    if (Url.get.app) {
        noOpen = false;
    }
	if (Url.get.exhibit){
		backButton.classList.add("hide")
	}
    sigmacontainer.style.width = "1px";
    sigmacontainer.style.height = "1px";
    networkGraph.classList.remove("expanded");
    graphButtons.style.top = "";
    send_message("IVClicked", "unwork");
    setBack();
}

function justSendBack(x) {
    bw = backButton.getBoundingClientRect().width;
    send_message("IVClicked", "back");
}


function openGenericPage(x) {
    if (noOpen) {
        return;
    }
    content.classList.add('somethingIsOpen');
    body.classList.add('somethingIsOpen');
    noOpen = true;
    backButton.style.backgroundColor = 'var(--c-background)';
    if (x == "wikipage" || x == "infocard") {
        if (x == "infocard") {
            const infoCard = document.getElementById('wikipedia-infocard-frame');
            window.scrollTo(0, 0);
            send_message("IVClicked", "wikipedia-infocard-frame");
            infoCard.classList.add('expanded');
        } else {
            window.scrollTo(0, 0);
            const wikipediaPage = document.getElementById('wikipedia-first-frame');
            wikipediaPage.classList.add('expanded');
            send_message("IVClicked", "wikipedia-first-frame");
        }
    } else {
        element = document.getElementById(x)
        const bb = element.getBoundingClientRect();
        const startW = bb.width;
        element.style.width = `${startW}px`;
        element.style.transform = `translate( -${bb.x}px, -${bb.y}px)`;
        element.style.top = `${bb.y - 60}px`;
        element.style.left = `${bb.x}px`;
        element.classList.add('expanded');
    }
    voteButtons.style.visibility = "hidden";
    boyButton.style.visibility = "hidden";

    setBack(`closeGenericPage("${x}")`);
}

function closeGenericPage(x) {
    switch (x) {
        case "wikipage":
            const wikipediaPage = document.getElementById('wikipedia-first-frame');
            wikipediaPage.classList.remove('expanded');
            break;
        case "infocard":
            const infoCard = document.getElementById('wikipedia-infocard-frame');
            infoCard.classList.remove('expanded');
            break;
        default:
            element = document.getElementById(x)
            element.style.height =
                element.style.width =
                element.style.transform =
                element.style.top =
                element.style.left = "";
            element.classList.remove('expanded');
            break;
    }
    content.classList.remove('somethingIsOpen');
    body.classList.remove('somethingIsOpen');
    voteButtons.style.visibility = "visible";
    boyButton.style.visibility = "visible";
    noOpen = false;
    setBack();
}

function closeSettings(x) {
    const coName = document.getElementsByClassName('co-name')[0];
    body.classList.remove("settingsOpen");
    if (Url.get.app) {
        backButton.style.order = "2";
    }
    coName.style.opacity = "100%";
    fullPage.style.overflow = "";
    setBack();
}

function toggleNotifications(value) {
    //if (settingsState["notifications"] === value) return;
    settingsState["notifications"] = !value;
    // if (settingsState["notifications"] === false) return;
    cacheButton = document.getElementById("notificationsCache");
    cacheButton.style.display = !value === "true" ? "block" : "none";
    send_message("IVNotifications", !value);
    settingsStateChange();
    console.log(`notifications ${settingsState["notifications"]}`);
}

function notificationBell(ppId) {
    console.log(ppId)
    if (ppId == "cacheClear") {
        settingsState.userPreferences = defaultUserPreferences;
        settingsStateChange();
        return
    }
    tagList = "";
    document.querySelectorAll(".notificationBell").forEach((x) => {
        state = x.getElementsByTagName("input")[0].checked;
        if ((x.id === ppId && !state) || (x.id !== ppId && state))
            tagList += x.id.replace(/-bell/, "");
    });
    console.log(tagList);
    send_message("IVNotificationsTags", tagList);
    settingsState["notificationsTags"] = tagList;
    settingsStateChange()
}

function slist() {
    // (A) SET CSS + GET ALL LIST ITEMS
    $('#sortlist-wbm').sortable({
        group: 'iv-list-wbm',
        animation: 150,
        multiDrag: true,
        selectedClass: 'selected',
        ghostClass: "sortghost",
        store: {
            /**
             * Get the order of elements. Called once during initialization.
             * @param   {Sortable}  sortable
             * @returns {Array}
             */
            get(sortable) {
                const order = settingsState["listOrder-wbm"] == defaultOrderStringWbm ? defaultOrderWbm : settingsState["listOrder-wbm"].split('|');
                const missingItems = defaultOrderWbm.filter(item => !order.includes(item));
                // Add missing items to IVListOrder
                return order.concat(missingItems);
            },

            /**
             * Save the order of elements. Called onEnd (when the item is dropped).
             * @param {Sortable}  sortable
             */
            set(sortable) {
                const order = sortable.toArray();
                settingsState["listOrder-wbm"] = order.join('|');
                settingsStateChange();
            }
        }
    });
    $('#sortlist').sortable({
        group: 'iv-list',
        animation: 150,
        multiDrag: true,
        selectedClass: 'selected',
        handle: '.priority-list-handle',
        ghostClass: "sortghost",
        store: {
            /**
             * Get the order of elements. Called once during initialization.
             * @param   {Sortable}  sortable
             * @returns {Array}
             */
            get(sortable) {
                const order = settingsState.listOrder.split("|");
                orderClean = []
                for (item in order) {
                    if (!order[item].includes('[')) {
                        orderClean.push(order[item])
                    }
                }
                const missingItems = defaultOrder.filter(item => !orderClean.includes(item));
                // Add missing items to IVListOrder
                orderClean = orderClean.concat(missingItems);
                settingsState.listOrder = orderClean.join('|');
                if (debug) console.log(orderClean);
                return orderClean;
            },

            /**
             * Save the order of elements. Called onEnd (when the item is dropped).
             * @param {Sortable}  sortable
             */
            set(sortable) {
                const order = sortable.toArray();
                settingsState.listOrder = order.join('|');
                if (settingsState.listOrder.startsWith('|')) {
                    settingsState.listOrder = settingsState.listOrder.replace("|", "")
                }
                if (settingsState["notifications"]) {
                    tagList = "";
                    document.querySelectorAll(".notificationBell").forEach((x) => {
                        if (x.getElementsByTagName("input")[0].checked)
                            tagList += x.id.replace(/-bell/, "");
                    })
                    send_message("IVNotificationsTags", tagList);
                }
                settingsStateChange();
            }
        }
    });
    //if (debug) console.log($('#sortlist').sortable('toArray'));


}

function toggleToggle(type) {
    console.log(`setting ${type}`)
    if (type == "notificationsContainer") {
        toggleNotifications(settingsState["notifications"])
    } else {
        settingsState[type] = !settingsState[type];
        console.log(`setting ${type} ${settingsState[type]}`)
    }
    settingsStateChange()
}

// {value: items[it].value, label: items[it].innerHTML}
function recalculateList() {
    if (debug) console.log("Recalculating List ...")
    const propertyOrder = $("#sortlist").sortable('toArray');

    for (let x = 0; x < propertyOrder.length; x++) {
        const value = propertyOrder[x];
        const item = $(`[data-id='${value}']`)[0];
        if (item !== undefined) {
            item.getElementsByTagName("span")[0].setAttribute("data-i18n", translate[value]);
            item.setAttribute("data-id", value);
            if (value == "wbm") {
                wbmlist = document.getElementById("sortlist-wbm").children;
                for (child in wbmlist) {
                    const currentChild = wbmlist[child]
                    if (typeof (currentChild) === 'object') {
                        const childValue = currentChild.getAttribute("data-id");
                        currentChild.getElementsByTagName("span")[0].setAttribute("data-i18n", translate[childValue]);
                    }
                }
            }
            if (value == "networkgraph") {
                if (document.getElementById("graph-box")) {
                    [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#graph-box').style.order = x + 5;
                }
                if (document.getElementById("wikipedia-infocard-frame")) {
                    [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#wikipedia-infocard-frame').style.order = x + 5;
                }
            } else {
                [...document.styleSheets[3].cssRules].find(y => y.selectorText == `#${value}`).style.order = x + 5;
                if (document.getElementById(value)) {
                    thiselement = document.getElementById(value);
                    if (value != "carbon" && Url.get.app) thiselement.setAttribute('onclick', `openGenericPage("${value}")`);
                }
            }
        }
    };

    if (debug) console.log("sorted")
    if (document.getElementById('graph-box') != null) {
        document.getElementById('graph-box').setAttribute("onclick", "loadNetworkGraph()");
    }
    if (document.getElementById("wikipedia-infocard-frame")) {
        document.getElementById("wikipedia-infocard-frame").setAttribute('onclick', `openGenericPage("infocard")`);
    }
    if (document.getElementById("wikipedia-first-frame")) {
        document.getElementById("wikipedia-first-frame").setAttribute('onclick', `openGenericPage("wikipage")`);
    }
    const wbmOrder = $("#sortlist-wbm").sortable('toArray');
    for (let x = 0; x < wbmOrder.length; x++) {
        const value = String(wbmOrder[x]);
        const item = $(`[data-location$="${value.replace("wbm-", "")}"]`)[0]
        if (item !== undefined) {
            item.style.order = x;
        }

    }

}


const toggles = {
    "bobbleDisable": "bobbleOverride",
    "externalPosts-banner": "experimentalFeatures",
    "permaDark": "darkMode",
    "onScreen": "keepOnScreen",
    "debug-banner": "debugMode",
    "notificationsContainer": "notificationsContainer",
}

document.addEventListener('mouseup', (event) => {
    if (event.target.matches("html")) return;
    if (event.target.matches("#floatDiag")) return;
    if (event.target.matches("#floatDiagSave")) {
        notificationCloseAndSave()
        return
    };

    const tid = event.target.id;

    console.log(`clicked ${tid}`)
    if (tid == 'indexRefresh') send_message("IVIndexRefresh", "please");
    if (tid == 'notificationsCache') notificationBell("cacheClear")
    if (tid == 'backButton') send_message("IVClicked", event.target.parentElement.id);

    if (event.target.classList.contains('invisible-disclaimer-title')) send_message("IVClicked", "disclaimer");
    if (event.target.classList.contains('sectionTitle') || event.target.classList.contains('iconclass') || event.target.classList.contains('scoreText')) {
        send_message("IVClicked", event.target.parentElement.id);
        if (event.target.parentElement.id == "wikipedia-first-frame") openGenericPage("wikipage");
        if (event.target.parentElement.id == "wikipedia-infocard-frame") openGenericPage("infocard")
        event.target.scrollIntoView();
    }

    if (event.target.matches('#profile-card')) {
        send_message("biggen", "big");
        if (debug) console.log("bigg");
    }

    if (event.target.parentElement.parentElement == null) return;
    const ppId = event.target.parentElement.parentElement.id;

    if (event.target.parentElement.parentElement.matches('.notificationBell'))
        notificationBell(ppId)

    if (ppId in toggles) toggleToggle(toggles[ppId])

}, false);

window.addEventListener('message', (e) => {
    if (e.data.message === undefined) return
    console.log(e.data);
    const decoded = e.data
    switch (decoded.message) {
        case "VoteUpdate":
            voteUpdate(decoded)
            break;
        case "ModuleUpdate":
            moduleUpdate(decoded);
            break;
        case "PostUpdate":
            postUpdate(decoded);
            break;
        case "PostUpdateTL":
            postUpdate(decoded, true);
            break;
        case "SettingsUpdate":
            settingsStateApply(decoded.data);
            break;
    }
});

function postalVote(direction, location, status) {
    if (direction == status) direction = "un";
    if (debug) console.log(direction)
    if (direction == "up") directionType = "IVPostVoteUp"
    if (direction == "down") directionType = "IVPostVoteDown"
    if (direction == "un") directionType = "IVPostVoteUnvote"
    if (direction == "comment") {
        commentDiagOpen(location)
    } else {
        send_message(directionType, location)
    }

}

function moduleUpdate(mesg, comment = false) {
    location_str = mesg.location;
    let elmt = $(`[data-location='${location_str}']`)[0];
    if (typeof (elmt) == 'undefined') {
        elmt = $(`[data-location='${mesg.uid}']`)[0];
    }
    if (typeof (elmt) == 'undefined') {
        if (debug) console.log(mesg)
        return
    }
    if (comment) {
        data = mesg
        sVB = elmt.getElementsByClassName("smallVoteBox")[0]
        if (typeof (sVB) == 'undefined') return
        contentText = $('<div/>').html(data.content).text()
        if (debug) console.log(contentText)
        if (elmt.getElementsByClassName("smallCommentBox").length > 0) {
            elmt.getElementsByClassName("smallCommentBox")[0].remove()
        }
        commentBox = document.createElement("div")
        commentBox.classList.add("smallCommentBox")
        commentBox.setAttribute("data-location", mesg.uid)
        commentBox.innerHTML = `
		<div>${contentText}<a class="tinysource" target="_blank" href="https://assets.reveb.la/#user" >${data.author}</a></div>
        ${voteBox(data.uid, data, "smallerVoteBox hideInSmall")}`

        sVB.parentNode.insertBefore(commentBox, sVB)
        recalculateList()
        translator.translatePageTo()
        return
    }

    if (location_str.length == 36 && elmt.tagName != "SECTION") {
        className = "smallerVoteBox hideInSmall"
        if (debug) console.log(mesg)
        if (debug) console.log(elmt)
    } else {
        className = "smallVoteBox bottomLeftOfModule hideInSmall"
    }
    if (elmt.getElementsByClassName("loadInfoButton").length > 0) {
        elmt.getElementsByClassName("loadInfoButton")[0].remove();
    } else {
        elmt.getElementsByClassName(className.split(" ")[0])[0].remove();
    }


    elmt.innerHTML += voteBox(location_str, mesg, className)

    if (mesg.comment_total > 0) {
        send_message("IVGetPost", mesg.top_comment)
    }
    recalculateList()
    translator.translatePageTo()
}

var hash;

function vote(direction, thisOne = false) {
    // First look for hash
    site = document.getElementsByClassName("co-name")[0].textContent.replace(".", "")
    voteRequest(pageHash, direction)
}

async function voteLoad() {
    site = document.getElementsByClassName("co-name")[0].textContent.replace(".", "")
    console.log(pageHash)
    send_message("IVVoteStuff", pageHash);
}
async function voteRequest(hash, direction) {
    if (debug) console.log(`vote request: ${hash} ${direction}`);
    send_message("IVVoteStuff", direction)
}
function voteUpdate(decoded = false) {
    if (!decoded) { return }
    if (debug) console.log(decoded)
    const IVLike = document.getElementById('Invisible-like');
    const IVDislike = document.getElementById('Invisible-dislike');

    direction = decoded.voteStatus;

    dc = lc = "";

    if (direction == "up") lc = "green";
    if (direction == "down") dc = "green";

    IVLike.setAttribute("style", `--count:'${decoded.utotal.toString()}';color:${lc};`);
    IVDislike.setAttribute("style", `--count:'${decoded.dtotal.toString()}';color:${dc};`);
    lF = (decoded.voteStatus == "up") ? "vote('un')" : "vote('up')";
    dF = (decoded.voteStatus == "down") ? "vote('un')" : "vote('down')";
    IVLike.setAttribute("onclick", lF)
    IVDislike.setAttribute("onclick", dF)
}

function boycott() {
    send_message("IVBoycott", "please");
    console.log("Boycott")
}

function postLoad(el) {
    elementId = el.parentElement.getAttribute("data-location").replace(dataURL, "").replace("/ds/", "").replace(".json", "");
    send_message("IVPostStuff", elementId);
}

function sort_by(field, reverse, primer) {
    const key = primer ?
        (x) => primer(x[field]) :
        (x) => x[field];
    reverse = reverse ? -1 : 1;
    return (a, b) => (a = key(a), b = key(b), reverse * ((a > b) - (b > a)))
}



pageSetup();
content.addEventListener("DOMNodeInserted", (event) => {
    scrollIntoPlace()
});
