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
const content = document.getElementById("content");

let backButton;
let settingsButton;
let closeButton;
let boyButton;
let wikidataid;
let pageLocation;
let pageHash;
let connectionsFile;

let userPreferences = {}
let buttonState = {}
let diagOpen = false;
let loggedIn = false;
let settingsState;
let oldSettings;

let firstShot = false;
const localModules = ["political", "social"]

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

const tabable = [
    "opensec", "mbfc", "glassdoor", "goodonyou", "yahoo", "tosdr-link", "bcorp", "lobbyeu", "wbm",
]

const translate = {
    "cta": "cta.title",
    "wikipedia-first-frame": "w.wikipedia",
    "networkgraph": "graph.title",
    "wikipedia-infocard-frame": "w.companyinfo",
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
let defaultOrder = [];
let defaultOrderWbm = [];
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
    "disabledModules": [],
};

let currentModuleState = {};
let currentModules = Object.keys(currentModuleState)
let tabbedContent = {};
let addNewFilesToGraph = false;
let knownPosts = {};
let knownPostsByLocation = {};

const currenturl = window.location.href;
const containsSpeedcam = currenturl.includes("speedcam.html");
const isSpeedcam = containsSpeedcam ? true : false;

Url = {
    get get() {
        const vars = {};
        if (window.location.search.length !== 0) {
            window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
                key = decodeURIComponent(key);
                vars[key] = typeof vars[key] === "undefined" ? decodeURIComponent(value) : [].concat(vars[key], decodeURIComponent(value));
            });
        }
        return vars;
    },
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
function debugLogging(message, data = false) {
    if (debug) console.log(message)
    if (debug && data) console.log(data)
}

function setSearchParam(key, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, null, url.toString());
}

function manualSetup(site) {
    backButton.classList.toggle("hide", site === '' || site === undefined);
    setSearchParam("site", site);
    pageSetup();
}

function pageSetup() {
    pageLocation = Url.get.site ? Url.get.site : false;
    addToolsSection()
    resetSettings(false)
    if (Url.get.site) {
        loadPageCore(pageLocation)
        addSettings()
        scrollIntoPlace()
        notificationsDraw();
        forceAllLinksNewTab();
        translator.translatePageTo();
        recalculateList();
        send_message("IVSettingsReq", true);
    }
    translator.translatePageTo();
}

function resetSettings(change = true) {
    settingsState = defaultSettingsState;
    if (change) settingsStateChange()
}

function settingsStateApply(newSettingsState = defaultSettingsState) {
    if (typeof (oldSettings) === 'undefined') {
        oldSettings = JSON.parse(JSON.stringify(settingsState));
        firstShot = true;
    }
    if (Url.get.debug) debug = true;

    settingsState = newSettingsState;

    changed = []
    for (item in settingsState) {
        if (settingsState[item] != oldSettings[item] && item != 'userPreferences') {
            changed.push(item)
        }
    }

    debugLogging(changed)
    if (changed.includes("loggedIn"))
        loggedIn = settingsState.loggedIn

    if (changed.includes("experimentalFeatures")) {
        if (settingsState.experimentalFeatures) {
            loginCheck(true);
            buttonString = `<button type='button' data-i18n="vote.loadinfo" class='loadInfoButton hideInSmall bottomLeftOfModule' onclick="postLoad(this)"> Load info</button>`
        }
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

    if (newSettingsState.debugMode || debug) {
        document.lastChild.classList.add("debugColors");
    } else {
        document.lastChild.classList.remove("debugColors");
    }

    if (newSettingsState.darkMode) {
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

    debugLogging("Settings state updated", settingsState);
    addPopover("Settings Updated", true);
}

function settingsStateChange() {
    debugLogging("Settings state changed", settingsState);
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
const loadPageCore = async (coreFile, localX = false, localY = false, wikidataid = null) => {
    if (coreFile === false) return;
    coreFile = coreFile.split("?")[0]
    coreFile = coreFile.startsWith("/db/") ? coreFile : `/db/${coreFile}`;
    coreFile = coreFile.endsWith(".json") ? coreFile : `${coreFile}.json`;
    try {
        let wikidataIdList = [];
        debugLogging("loadPageCore", coreFile)
        let appendTimeout = 0;
        const content = document.getElementById("content");
        if (wikidataid) {
            explode(true)
            appendTimeout = 1000;
        } else {
            contentSections = content.getElementsByClassName("contentSection")
            while (contentSections.length > 0) {
                contentSections[0].remove()
            }
        }

        setTimeout(async () => {
            const dataf = await fetch(dataURL + coreFile);
            const response = await dataf.json();
            const currentDomain = document.getElementsByClassName("co-name")[0].innerText.replace(".", "");
            const { title = false, connections = false, wikidata_id = false, core = false, political = false, social = false } = await response;
            wikidataIdList = wikidata_id;
            document.getElementsByClassName('co-name')[0].innerText = (title) ? title : "Invisible Voice";
            document.getElementById("pageTitle").innerText = (title) ? `Invisible Voice - ${title}` : "Invisible Voice";

            if (connections) {
                loadGraphEls(wikidata_id).then((item) => {
                    const { wikidataid, fulllist } = item;
                    pageHash = connections.split('/')[2].replace('.json', '');
                    if (Url.get.vote == 'true') voteLoad();
                    if (addNewFilesToGraph) {
                        addNewFile(`${dataURL}${connections}`, false, localX, localY, wikidataid, fulllist);
                    } else {
                        addNewFile(`${dataURL}${connections}`, true, localX, localY, wikidataid, fulllist);
                        addNewFilesToGraph = true;
                    }
                });
            }
            if (political) {
                core.push({ "type": "political", "url": "local", "data": political })
            }
            if (social) {
                core.push({ "type": "social", "url": "local", "data": social })
            }
            currentModuleState = {}
            let localString = '';
            await Promise.all(core.map(async (module) => {
                if (module.url !== 'local') {
                    const string = await addModule(module.type, `${dataURL}/ds/${module.url}`);
                    localString += string;
                } else {
                    const string = await addLocalModule(module.type, module.data);
                    localString += string;
                }
            }));

            content.innerHTML += localString

            for (const tab of tabable) {
                for (const item in tabbedContent[tab]) {
                    if (document.getElementById(tab)) {
                        const tabContainer = document.getElementById(tab).getElementsByClassName("tabContainer")[0];
                        tabContainer.innerHTML += tabbedContent[tab][item];
                    } else {
                        content.innerHTML += tabbedContent[tab][item];
                    }
                }
                if (document.getElementById(tab)) {
                    const tabContainer = document.getElementById(tab).getElementsByClassName("tabContainer")[0];
                    const tabContent = tabContainer.getElementsByClassName("tabContent");
                    const tabButtonArea = document.getElementById(tab).getElementsByClassName("tabButtonArea")[0];
                    for (let i = 0; i < tabContent.length; i++) {
                        const subname = tabContent[i].getAttribute("data-tabLabel");
                        tabButtonArea.innerHTML += `<button class="tabButton${(i == 0) ? ' active' : ''}" data-tab="${i}" onclick="tabChange(${i}, '${tab}')">${subname}</button>`
                    }
                }

            }

            for (const item in currentModuleState) {
                if (currentModuleState[item].hasOwnProperty("_preview")) {
                    document.getElementById(item).getElementsByClassName("previewContainer")[0].innerHTML = currentModuleState[item]["_preview"];
                } else if (item.startsWith("political")) {
                    for (const internal in currentModuleState[item]) {
                        if (currentModuleState[item][internal].hasOwnProperty("_preview")) {
                            document.getElementById(item).getElementsByClassName("previewContainer")[0].innerHTML = currentModuleState[item][internal]["_preview"];
                        }
                    }
                }
            }
            if (!Url.get.exhibit && !isSpeedcam) {
                content.innerHTML += `
                <section id="carbon" class="contentSection overridden">
                    <div class="iconarray">
                        <div><a href="https://www.websitecarbon.com/website/${currentDomain}"><i alt="Website Carbon Calculator"><div style="background-image:var(--image-carbon);"></div></i></a></div>
                        <div><a href="https://themarkup.org/blacklight?url=${currentDomain}"> <i alt="Blacklight"><div style="background-image:var(--image-lightning);"></div></i></a></div>
                    </div>
                </section>
            `;
                currentModuleState["carbon"] = { "carbon": currentDomain }
            }

            recalculateList()
            translator.translatePageTo()
            unexplode()
        }, appendTimeout)
    } catch (e) {
        console.error(e)
    }
}
async function loadGraphEls(wikidataIdList = false) {
    if (wikidataIdList) {
        let wikidataidarray = wikidataIdList.join(",").replaceAll("Q", "").split(",");
        wikidataidarray.sort((a, b) => a - b);
        return { wikidataid: `Q${wikidataidarray[0]}`, fulllist: wikidataIdList }
    }
}

function postUpdate(data, topLevel = false) {
    const { comment = false, top_comment = false } = data;
    debugLogging(`postUpdate, topLevel ${topLevel}`, data)

    if (comment) {
        moduleUpdate(data, true);
        return;
    }
    const content = document.getElementById("content");
    if (topLevel == true) {
        if (!document.getElementById("post")) {
            addLocalModule(type = "post", data = data).then((htmlString) => {
                content.innerHTML += htmlString
            }).then(() => {
                recalculateList()
            })
            if (top_comment) {
                send_message("IVGetPost", top_comment);
            }
        }
    } else {
        if (data.location.startsWith("db")) {
            document.getElementById("post")?.remove()
            addLocalModule(type = "post", data = data).then((htmlString) => {
                content.innerHTML += htmlString
            }).then(() => {
                recalculateList()
            })
            if (data) {
                send_message("IVGetPost", top_comment);
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
    if (!postLocation.startsWith("db/") && (!postLocation.includes("/") && postLocation.length != 32)) {
        postLocation = `db/${postLocation}`
    }
    console.log(`loadPageExternal ${postLocation}`)
    send_message("IVGetPost", postLocation)
}

function loginCheck() {
    if (isSpeedcam) return;
    if (document.getElementById("loginButton")) {
        document.getElementById("loginButton").remove()
    }
    if (!settingsState.experimentalFeatures) return;
    const titleBar = document.getElementById("titlebar");
    titleBar.innerHTML += buttonTemplate("loginButton", "loginButtonAction");

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

function tableRow(...lists) {
    let rows = '';
    lists.forEach(list => {
        if (Array.isArray(list) && list.length === 3) {
            const [dataI18n, value, label] = list;
            rows += `<tr><th data-i18n="${dataI18n}">${value}</th><td>${label}</td></tr>`;
        }
    });
    return rows;
}

const sourceStringClose = (href, text) => `</div></div><a target="_blank" class="hideInSmall source" href='${href}'>${text}</a>`;
const miniSource = (href) => `<a class="minisource" target="_blank" href="${href}"></a>`;
const buttonTemplate = (id, functionName) => `<button type="button" class="squareButton" onclick="${functionName}()" id="${id}"><div></div></button>`;
const opsTd = (r) => `<td style="--size: calc(${r.percent.replace("%", "")}/100);">
    <span class="data">${r.entity}</span><span class="tooltip">${r.entity}<br>(${r.amount})</span></td>`;
const hoverTitleString = (trans) => `<div class="squareButton hovertext hideInSmall"><div>?</div></div>
            <div class="hidetext"><h3 data-i18n="title.${trans}"> </h3><p data-i18n="desc.${trans}"></p></div>`

var localString = ''

function tabChange(tab, id) {
    const tabContent = document.getElementById(id).getElementsByClassName("tabContent");
    const tabButtons = document.getElementById(id).getElementsByClassName("tabButton");
    const tabButtonArea = document.getElementById(id).getElementsByClassName("tabButtonArea")[0];
    const currentlyActive = tabButtonArea.getElementsByClassName("active")[0].getAttribute("data-tab");
    for (let i = 0; i < tabContent.length; i++) {
        if (i == tab) {
            tabContent[i].style.display = "grid";
            tabContent[i].classList.remove("inactiveRight");
            tabContent[i].classList.remove("inactiveLeft");
            tabButtons[i].classList.add("active");
            if (currentlyActive > tab) {
                tabContent[i].classList.add("activeRight");
            } else {
                tabContent[i].classList.add("activeLeft");
            }
        } else {
            tabContent[i].style.display = "none";
            tabContent[i].classList.remove("activeRight");
            tabContent[i].classList.remove("activeLeft");
            if (tab < i) {
                tabContent[i].classList.add("inactiveRight");
            } else {
                tabContent[i].classList.add("inactiveLeft");
            }
            tabButtons[i].classList.remove("active");
        }
    }
}

function sectionTitleString(i18n, label, id, dataLoc, subname = false, tab = false) {
    const subnameString = subname ? `<div class='subname'>(${subname})</div>` : '';
    const previewContainer = `<div class="previewContainer"></div>`;
    const noTabDataLoc = (tab !== false) ? '' : dataLoc;
    const sectionHeaderString = `<section class="contentSection" ${noTabDataLoc} id='${id}'>
        <h2 class="sectionTitle" data-i18n="${i18n}">${label}</h2>${previewContainer}`;

    if (tab !== false) {
        if (tab == 0) {
            return `${sectionHeaderString}${hoverTitleString(id)}<div class="tabButtonArea"></div><div class="tabContainer">
                <div class="tabContent activeLeft" ${dataLoc} data-tab="0" data-tabLabel="${subname}" style="display: grid;">${buttonString}`
        } else {
            return `<div class="tabContent inactiveRight" ${dataLoc} data-tab="${tab}" data-tabLabel="${subname}" style="display: none;">${buttonString}`
        }
    }
    return `${sectionHeaderString}${subnameString}${hoverTitleString(id)}`

}


function moduleString(id, i18n, label, subname = false, scoreText = false, scoreClass = false, dataLoc = false, tab = false) {
    scoreClassString = scoreClass ? `${scoreClass}` : 'scoreText';
    scoreTextString = scoreText ? `<div class="${scoreClass}">${scoreText}` : '';
    dataLocationString = dataLoc ? `data-location="${dataLoc}"` : '';
    return `${sectionTitleString(i18n = i18n, label = label, id = id, dataLoc = dataLocationString, subname = subname, tab = tab)}
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
        '' : `<div class="pie animate" style="--c:var(--chart-fore);--p:${percent};"></div>`;
    outOfString = outOf == false ? '' : ` style="--outOf:'${outOf}';" `;
    containerClass = (inline) ? "inlinePieContainer" : "pieContainer";
    pieColourString = pieColour == false ? '' : ` style='--c:${pieColour};'`;
    return `<div class="${containerClass}"><div>
        <div class="pie"${pieColourString}></div>
        ${percentString}
        <score class="${scoreClassString}"${transString}${outOfString}>${data}</score>
        ${ratingsString}
        </div>
		</div>`
}


function addToolsSection() {
    titleBar.innerHTML += buttonTemplate("backButton", "justSendBack");
    titleBar.innerHTML += buttonTemplate("settingsButton", "loadSettings");
    titleBar.innerHTML += buttonTemplate("closeButton", "closeIV");
    const currentDomain = document.getElementsByClassName("co-name")[0].innerText;
    body.innerHTML += `
        <section id="Invisible-interaction" class="hideInSmall hide">
            <section id="Invisible-like" onclick="vote('up')" style="--count:'0';" data-i18n="vote.like">Like</section>
            <section id="Invisible-dislike" onclick="vote('down')" style="--count:'0';" data-i18n="vote.dislike">Dislike</section>
            <section id="Invisible-boycott" onclick="boycott()" data-i18n="vote.boycott">Boycott</section>
        </section>
    `;
    backButton = document.getElementById('backButton');
    closeButton = document.getElementById('closeButton');
    settingsButton = document.getElementById('settingsButton');
    const voteButtons = document.getElementById('Invisible-interaction');

    if (isSpeedcam || Url.get.exhibit) {
        body.parentNode.setAttribute("style", "--scroll-width: 0px; --c-background: transparent; --c-background-units: #0009; background-color: transparent;");
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#content > .contentSection').style.backdropFilter = blur;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#disclaimer').style.backdropFilter = blur;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#disclaimer').style.top = 'calc(100vh - 190px)';
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#disclaimer').style.position = 'sticky';
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#titlebar').style.backdropFilter = blur;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#carbon').style.backdropFilter = blur;
        body.setAttribute("style", "background-color: transparent;");
        closeButton.style.visibility = "hidden";
        settingsButton.style.visibility = "hidden";
        debugLogging("exhibitMode");
    }
    if (Url.get.app || isSpeedcam || /Mobile/i.test(navigator.userAgent)) {
        debugLogging("phone mode");
        document.getElementById("content").classList.add("mobile");
        body.classList.add("mobile");
        closeButton.style.visibility = "hidden";
    }
    if (!Url.get.app || !isSpeedcam) {
        backButton.classList.add("show");
        closeButton.classList.add("closeExtention");
        document.getElementById("content").classList.add("desktop");
        body.classList.add("desktop");
    }

    if (Url.get.vote == 'true') {
        body.classList.add("topBar");
        voteButtons.classList.toggle("hide");
    } else {
        voteButtons.style.visibility = "hidden";
    }
    if (Url.get.expanded && Url.get.app) {
        document.getElementById(Url.get.expanded).classList.add("expanded");
        body.classList.add('somethingIsOpen');
        explode();
    }
}

function moduleSocial(data, typeId, typeTranslate, typeLabel, subname = false) {
    let tableString = ''
    let linkCount = 0;
    if (currentModuleState[typeId] == undefined) currentModuleState[typeId] = {};
    currentModuleState[typeId][typeLabel] = data;
    for (const label in data) {
        for (const item in data[label]) {
            linkCount++;
            const cleanLabel = label.replaceAll(" id", "").replaceAll(" username", "");
            const labelUrl = data[label][item].url;
            tableString += `<tr><th>${cleanLabel}</th>
                <td><a class="spacelinks" href="${labelUrl}">${labelUrl}</a>
                ${miniSource("https://wikidata.org")}</td>
            </tr>`;
        }
    }
    return `${moduleString(typeId, typeTranslate, typeLabel, subname)} 
        <section id="social-wikidata-links" class="fullBleed"><details>
        <summary><div>${linkCount} <div class="detailsSubString">Social Media Links</div></div></summary>
        <table>${tableString}</table></details></section></section>`;
}

function modulePolitical(data) {
    const lang = "enlabel";
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf ratingText">@</span></div>`;
    return Object.keys(data).filter(label => data[label].length > 0).map(label => {
        const labelId = (label == "polalignment") ? "political-wikidata" : "politicali-wikidata";
        const actLabel = (label == "polalignment") ? "Political Alignments" : "Political Ideologies";

        if (currentModuleState[labelId] == undefined) currentModuleState[labelId] = {};
        currentModuleState[labelId][label] = data[label];

        let itemString = `${moduleString(labelId, `wikidata.${label}`, actLabel, false, " ", "fullBleed")}<div><ul>`;
        data[label].forEach(itemObj => {
            const itemLabel = itemObj.data[lang];
            const dataId = itemObj.dataId;
            const sourceLabel = itemObj.sourceLabels[lang];
            const miniSourceHref = `https://wikidata.org/wiki/${dataId}`;
            currentModuleState[labelId][label]["_preview"] = previewTemplate.replace("@", itemLabel).replace("&", sourceLabel);
            itemString += `<li><h3>${itemObj.sourceLabels[lang]} <a class="spacelinks" href="${miniSourceHref}">${itemLabel}</a></h3>${miniSource(miniSourceHref)}</li>`;
        });
        itemString += `</ul>${sourceStringClose(`https://wikidata.org/wiki/${data[label][0].dataId}`, "WIKIDATA")}</section>`;
        return itemString;
    })
}

function modulePost(data, typeId, typeTranslate, typeLabel, dataURL, subname = false) {
    const postContent = data.content;
    const dataLocationString = (data.uid) ? data.uid : false;
    if (currentModuleState[typeId] == undefined) currentModuleState[typeId] = {};
    currentModuleState[typeId][dataLocationString] = data;
    knownPosts[dataLocationString] = data;
    knownPostsByLocation[data.location] = data;
    return `
        ${moduleString(id = typeId, i18n = typeTranslate, label = typeLabel, subname = subname, scoreText = false, scoreClass = false, dataLoc = dataLocationString, tab = false)}
        <div class="postContent hideInSmall">${postContent}
             ${sourceStringClose("https://assets.reveb.la/#user", data.author)}
             ${voteBox(data.uid, data, "smallVoteBox bottomLeftOfModule hideInSmall")}
        </section>`;
}


function voteBox(location_str, dataObj, styles = false) {
    classString = styles ? `class="${styles}"` : '';
    const { voteStatus, up_total, down_total, comment_total } = dataObj;
    return `<ul ${classString}>
				<li><a target="_blank" data-i18n="vote.like" onclick="postalVote('up','${location_str}', '${voteStatus}')" >Up</a><div>(${up_total})</div></li>
				<li><a target="_blank" data-i18n="vote.dislike" onclick="postalVote('down','${location_str}', '${voteStatus}')" >Down</a><div>(${down_total})</div></li>
            	<li><a target="_blank" data-i18n="vote.comment" onclick="postalVote('comment','${location_str}', '${voteStatus}')" >Comment</a><div>(${comment_total})</div></li>
            </ul>`
}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

const boldP = (bold, text, styles = false) => {
    const classString = styles ? `class="${styles}"` : '';
    return `<p ${classString}><b>${bold}</b> ${text}</p>`;
};



function moduleOpensecrets(data) {
    const { cycle_year, contributions_rank, contributions_amount, lobbying_rank, bars, charts, osid, lobbycards, bill_most_code, bill_most_heading, bill_most_title, bill_most_url } = data;
    let htmlString = '';
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf ratingText">@</span></div>`;
    if (currentModuleState["opensec"]["_preview"] == undefined) currentModuleState["opensec"]["_preview"] = '';
    htmlString += `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/charts.css/dist/charts.min.css">`;
    if (bill_most_heading) {
        const flavourText = `${bill_most_heading} (${bill_most_code})`
        htmlString += `${boldP(bill_most_heading, '', "flavourText heading")}
            <p class="flavourText flavourContent"><a href='${bill_most_url}'>${flavourText}</a></p>`;

        currentModuleState["opensec"]["_preview"] += previewTemplate.replace("@", flavourText).replace("&", data.source);
    }
    htmlString += '<div class="fullBleed"><div><p data-i18n="os.disclaimer"></p><br>';
    if (cycle_year) {
        htmlString += `<p>Data is true of the ${cycle_year} cycle</p> <table>`;
        const ranks = ["contributions_rank", "contributions_amount", "lobbying_rank"];

        for (const rank in ranks)
            if (ranks[rank] in data)
                htmlString += tableRow(["", toTitleCase(ranks[rank].replace("_", " ")), data[ranks[rank]]]);

        htmlString += '</table><div class="charts">';
        if (bars) {
            const charts = {
                "recipients_of_funds": "Recipients of Funds",
                "sources_of_funds": "Sources of Funds",
                "sources_of_funds_to_candidates": "Sources of Funds to Candidates"
            };
            for (const [chartType, chartLabel] of Object.entries(charts)) {
                const chartData = bars[chartType];
                if (chartData) {
                    htmlString += `
                        <h3 data-i18n="opensec.${chartType}">${chartLabel}</h3>
                        <table class="charts-css multiple stacked bar show-heading">
                            <tbody>
                                <tr>
                                    ${Object.values(chartData).map(opsTd).join('')}
                                </tr>
                            </tbody>
                        </table>`;
                }
            }
        }
        if (charts) {
            const commonString = `<h4><span style="background-color: rgba(240,50,50,.75)!important;" data-i18n="opensec.republicans">Republicans</span>
                            <span style="background-color: rgba(90,165,255,.75) !important;" data-i18n="opensec.democrats">Democrats</span></h4>
                            <table class="charts-css column show-data-axes multiple hide-data show-labels show-primary-axis show-data-on-hover" style="--color-2: var(--color-5);">
                            <thead>
                                <tr>
                                <th data-i18n="opensec.year"        scope="col">Year</th>
                                <th data-i18n="opensec.democrats"   scope="col">Democrats</th>
                                <th data-i18n="opensec.republicans" scope="col">Republicans</th>
                                </tr>
                            </thead><tbody>`;
            for (const chartType in charts) {
                const house = charts[chartType];
                if (Object.keys(house) || house == undefined) continue;
                const houseDems = house.Dems.all_years;
                const houseRepubs = house.Repubs.all_years;
                const heightThou = Math.max(...[].concat(houseDems, houseRepubs)) / 1000;
                if (heightThou > 0) {
                    htmlString += `<h3 data-i18n="opensec.${chartType.toLowerCase()}">${chartType}</h3>${commonString}`;
                    for (const year in house.all_data) {
                        const dataD = house.all_data[year].Dems;
                        const dataR = house.all_data[year].Repubs;
                        const tD = dataD / (heightThou * 1000);
                        const tR = dataR / (heightThou * 1000);
                        htmlString += `
                            <tr>
                                <th scope="row">${year}</th>
                                <td style="--size:${tR};">
                                    <span class="data">${dataR}</span>
                                    <span class="tooltip">$${dataR}</span>
                                </td>
                                <td style="--size:${tD};">
                                    <span class="data">${dataD}</span>
                                    <span class="tooltip">$${dataD}</span>
                                </td>
                            </tr>
                        `;
                    }
                    htmlString += "</tbody></table>";
                }
            }
            if (lobbycards.length > 0) {
                htmlString += "<div class='fullBleed'><h3 data-i18n='opensec.lobbying'> Lobbying </h3>"
                for (card of lobbycards) {
                    htmlString += `
                            <div class="openSecLobbyCardContainer"><h4>${card.year}</h4><h5>${card.dollars}</h5>
							<table>
							${tableRow(["opensec.Lobbyistingov", "Lobbyists who worked in government", `${card.held.count} (${card.held.percent})`],
                        ["opensec.Lobbyistnotingov", "Lobbyists who havent worked in government", `${card.notheld.count} (${card.notheld.percent})`])}
							</table>
                            </div>
                    `
                }
                htmlString += "</div>"
            }
            htmlString += `${sourceStringClose(`https://www.opensecrets.org/orgs/name/summary?id=${osid}`, "OPENSECRETS")}</div>`
        }
    }
    return htmlString;
}

function dataToTable(data, ratingOutOf = false, tranlationModuleTag = '') {
    let tableString = '<table>';
    let rowClassAndStyleString = (ratingOutOf) ? ` class="ratingOutOf" style="--outOf:'@';"` : '';
    tableString += Object.values(data).map(([label, translate, value, outOf]) => {
        outOfString = outOf ? `/ ${outOf}` : '';
        return `<tr><th data-i18n="${tranlationModuleTag}.${translate}">${label}</th>
            <td${rowClassAndStyleString.replace("@", outOfString)}>${value}</td></tr>`;
    }).join('');
    tableString += '</table>';
    return tableString;
}

function spanString(label, translation, style = false) {
    classString = style ? `class="${style}"` : '';
    return `<span ${classString} data-i18n="${translation}">${label}</span>`
}

function moduleWbm(data, dataLocationString) {
    let htmlString = `<div class='fullBleed'><div class=''>`;
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf" style="--outOf:'/ %'">@</span></div>`;
    for (const module in data.modules) {
        const { file } = data.modules[module];
        const trans = file.split("_").slice(1).join("-").toLowerCase();
        const year = file.split("_")[0];
        const fileName = file.split("_").slice(1).join(" ");
        let pieItem = '';
        if (currentModuleState["wbm"]["_preview"] == undefined) currentModuleState["wbm"]["_preview"] = '';
        const tableData = Object.keys(data.modules[module])
            .filter(item => !["file", "Company Scorecard", "Total Score (Raw)"].includes(item))
            .map(item => {
                const [itemLabel, itemOutOf] = item.split("(").map(x => x.trim().replace(")", ""));
                const itemTrans = itemLabel.trim().replaceAll(" ", "-").replaceAll(':', "").toLowerCase();
                const outOf = itemOutOf || '';
                const score = data.modules[module][item];
                if (item.includes("Total Score") && !item.includes("Raw")) {
                    const percent = (Number(score) / Number(outOf)) * 100;
                    currentModuleState["wbm"]["_preview"] += previewTemplate.replace("@", score).replace("%", outOf).replace("&", `${fileName} (${year})`);
                    pieItem += pieString(score, false, "ratingOutOf", percent, `/ ${outOf}`, false, false, true);
                }
                tempScore = Number(score);
                if (!tempScore)
                    return [itemLabel, itemTrans, score, outOf];
                return [itemLabel, itemTrans, Number(score).toFixed(1).toString().replace(".0", ''), outOf];
            });

        htmlString += `<div class='submodule' data-location="${dataLocationString}-${trans}">
            <h2 class="subModuleTitle">
                ${spanString(fileName, `wbm.${trans}`, `--year:'${year}';`)}
                ${hoverTitleString(`wbm-${trans}`)}
            </h2> 
            ${dataToTable(tableData, true, "wbm")}
            ${pieItem}
            ${miniSource(fileName)}</div>`;
    }
    htmlString += sourceStringClose("https://www.worldbenchmarkingalliance.org/research/", "WBM");
    if (settingsState.experimentalFeatures) {
        htmlString += `<button type='button' data-i18n="vote.loadinfo" class='loadInfoButton hideInSmall bottomLeftOfModule' onclick="postLoad(this)"> Load info</button>`;
    }
    htmlString += "</section>";
    return htmlString;
}

async function addLocalModule(type = undefined, data = undefined) {
    if (!type || !data) return;
    if (!(type in types)) return;

    const { id, translate, label } = types[type];
    if (currentModuleState[id] == undefined) currentModuleState[id] = {};
    switch (type) {
        case "social":
            return moduleSocial(data, id, translate, label, false);
        case "political":
            return modulePolitical(data, id, translate, label, false);
        case "post":
            return modulePost(data, id, translate, label, dataURL, false);
        default:
            return '';
    }
}

function moduleCta(data) {
    let positiveString = ''
    let negativeString = ''
    for (link in data.links) {
        if (data.links[link].type == "positive") {
            positiveString += `<div><a href='${data.links[link].url}'>${data.links[link].label}</a></div>`
        } else {
            negativeString += `<div><a href='${data.links[link].url}'>${data.links[link].label}</a></div>`
        }
    }
    return `<div class="fullBleed">
        <div>
            <p>${data.description}</p>
        </div>
        <div>
            <div>
                <h4> Positive </h4>
                ${positiveString}
            </div>
            <div>
                <h4> Negative </h4>
                ${negativeString}
            </div>
            ${sourceStringClose("https://assets.reveb.la/", data.author)}
        </div>
    </div>`;
}

function moduleLobbyEu(data) {
    const sourceUrl = `https://lobbyfacts.eu/datacard/org?rid=${data.eu_transparency_id}`;
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf ratingText">@ FTE lobbyists</span></div>`;
    if (currentModuleState["lobbyeu"]["_preview"] == undefined) currentModuleState["lobbyeu"]["_preview"] = '';
    currentModuleState["lobbyeu"]["_preview"] += previewTemplate.replace("@", data.lobbyist_fte).replace("&", data.source);
    const dataForTable = [
        ["Transparency ID", "transparency_id", data.eu_transparency_id, false],
        ["HQ Country", "hq_countries", data.head_country, false],
        ["EU Office Country", "eu_country", data.be_country, false],
        ["Lobbyist Count", "lobby_count", data.lobbyist_count, false],
        ["Lobbyist FTE", "lobby_fte", data.lobbyist_fte, false],
        ["Calculated Total Cost", "calculated_cost", data.calculated_cost, false],
        ["Meetings with the EU", "meeting_count", data.meeting_count, false],
        ["Lobbyist Passes Count", "passes_count", data.passes_count, false],
    ]
    return `<div class="fullBleed"><div>
            ${dataToTable(dataForTable, false, "lb")}
            ${sourceStringClose(sourceUrl, "EU Transparency register via LobbyFacts.eu")}`;
}

function moduleGoodOnYou(data) {
    const sourceUrl = `https://directory.goodonyou.eco/brand/${data.location.split("/")[1]}`;
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf" style="--outOf:'/ 5';">@</span></div>`;
    if (currentModuleState["goodonyou"]["_preview"] == undefined) currentModuleState["goodonyou"]["_preview"] = '';
    currentModuleState["goodonyou"]["_preview"] += previewTemplate.replace("@", data.rating).replace("&", data.brand);
    const rating = (data.rating / 5) * 100;
    const lrating = Math.floor(data.labourRating / 4);
    const arating = Math.floor(data.animalRating / 4);
    const erating = Math.floor(data.environmentRating / 4);
    const dataForTable = [
        ["Labour Rating", "lr", lrating, 5],
        ["Animal Rating", "ar", arating, 5],
        ["Environment Rating", "er", erating, 5],
        ["Price", "p", data.price, 4],
    ]
    return `${pieString(data.rating, false, "ratingOutOf", rating, '/5', false)}
            <div class="scoreText"><div>
            ${dataToTable(dataForTable, true, "g")}
            ${sourceStringClose(sourceUrl, "GOODONYOU.ECO")}`
}

function moduleBcorp(data) {
    const sourceUrl = `https://www.bcorporation.net/en-us/find-a-b-corp/company/${data.slug}`
    const iconUrl = `${dataURL}/icon/bcorp.svg`;
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf" style="--outOf:'/ 140+'">@</span></div>`;
    if (currentModuleState["bcorp"]["_preview"] == undefined) currentModuleState["bcorp"]["_preview"] = '';
    const dataForTable = [
        ["Industry Average Score", "industry_average", data.score_industryAverage, "140+"],
        ["Governance", "governance", data.Governance, false],
        ["Workers", "workers", data.Workers, false],
        ["Community", "community", data.Community, false],
        ["Environment", "environment", data.Environment, false],
        ["Customers", "customers", data.Customers, false],
    ]
    currentModuleState["bcorp"]["_preview"] += previewTemplate.replace("@", data.score).replace("&", data.slug);

    return `${notPieString(data.score, false, "ratingOutOf", iconUrl, "/140+")}
            <div class="scoreText"><div>
            ${dataToTable(dataForTable, true, "bcorp")}
            ${sourceStringClose(sourceUrl, "BCORP")}`
}

function moduleYahoo(data) {
    const sourceUrl = `https://finance.yahoo.com/quote/${data.symbol}/sustainability/`
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf">@</span></div>`;
    if (currentModuleState["yahoo"]["_preview"] == undefined) currentModuleState["yahoo"]["_preview"] = '';
    if (data.totalEsg > 0) currentModuleState["yahoo"]["_preview"] += previewTemplate.replace("@", data.totalEsg).replace("&", data.symbol);

    const formatting = [
        ["Negligible", "0 - 9.9 "],
        ["Low", "10 - 19.9"],
        ["Medium", "20 - 29.9"],
        ["High", "30 - 39.9"],
        ["Severe", "40+      "]
    ]
    let biasString = '<div class="fullBleed"><div class="esgKey"><h3 data-i18n="esg.gradingscale">Grading Scale</h3><table class="esgKey">'
    for (item in formatting) {
        biasString += `<tr><th><div data-i18n="esg.${formatting[item][0].toLowerCase()}" class="biaslink">${formatting[item][0]}</div></th><td>${formatting[item][1]}</td></tr>`
    }

    const dataForTable = [
        ["Environmental Risk Score", "environmental", data.environmentScore, "40+"],
        ["Governance Risk Score", "governance", data.governanceScore, "40+"],
        ["Social Risk Score", "social", data.socialScore, "40+"],
        ["Total ESG", "total", data.totalEsg, "40+"],
    ]
    return `${pieString(data.totalEsg, false, "ratingOutOf", false, '/40+')}
    <div class="scoreText"><div>
        ${dataToTable(dataForTable, true, "esg")}
            </div>
            </div>
            ${biasString}
            </table>
            ${sourceStringClose(sourceUrl, "SUSTAINALYTICS, INC VIA YAHOOFINACE")}`
}

function moduleTrustScore(data) {
    const sourceUrl = `https://trustscam.com/${data.source}`
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf" style="--outOf:'/ 10';">@</span></div>`;
    if (currentModuleState["trust-scam"]["_preview"] == undefined) currentModuleState["trust-scam"]["_preview"] = '';
    currentModuleState["trust-scam"]["_preview"] += previewTemplate.replace("@", data.score).replace("&", data.source);
    return `${pieString(data.score, false, "ratingOutOf", false, false, false, ratingColorArray[data.rating])}
            <div class="scoreText"><div>
            <h3>${data.score}</h3>
            <p data-i18n="trustsc.${data.rating}">${data.rating}</p>
            ${sourceStringClose(sourceUrl, "TRUSTSCAM")}`
}

function moduleMbfc(data) {
    const { questionable, source, bias, popularity, credibility, reporting, description } = data;
    const sourceUrl = `https://mediabiasfactcheck.com/${source}`
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf ratingText">@</span></div>`;
    if (currentModuleState["mbfc"]["_preview"] == undefined) currentModuleState["mbfc"]["_preview"] = '';
    currentModuleState["mbfc"]["_preview"] += previewTemplate.replace("@", bias).replace("&", source);
    let questionableString = ''
    if (questionable.length > 0) {
        questionableString = '<div><h4 data-i18n="bias.questionable">Reason for Questionable:</h4><div class="questionableContainer"> '
        questionableString += questionable.map(tag => {
            return `<span class="questionable">${toTitleCase(tag.replaceAll('-', ' '))}</span>`
        })
        questionableString += '</div></div>'
    }

    const dataForTable = [
        ["Popularity", "popularity", popularity, false],
        ["Credibility", "credibility", credibility, false],
        ["Reporting", "reporting", reporting, false],
    ]
    return `${pieString(bias, `bias.${bias}`)}
            <div class="scoreText">
            <div>
                <h3 data-i18n="bias.${bias}"></h3>
                <p>${description}</p>
                ${dataToTable(dataForTable, false, "bias")}
                ${questionableString}
                ${sourceStringClose(sourceUrl, "MEDIA BIAS FACT CHECK")}`
}

function moduleGlassdoor(data) {
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf" style="--outOf:'/ 5';">@</span></div>`;
    if (currentModuleState["glassdoor"]["_preview"] == undefined) currentModuleState["glassdoor"]["_preview"] = '';
    currentModuleState["glassdoor"]["_preview"] += previewTemplate.replace("@", data.glasroom_rating.ratingValue).replace("&", data.source);
    const percentValue = (parseFloat(data.glasroom_rating.ratingValue) / 5) * 100;
    const typeClean = data.type.toLowerCase().replace(" - ", "_").replace(" ", "_")
    return `${pieString(data.glasroom_rating.ratingValue, false, "ratingOutOf", percentValue, "/5", data.glasroom_rating.ratingCount)}
            <div class="scoreText">
            <div class="">
            <div class="ratingCount mobileOnly">${data.glasroom_rating.ratingCount} <emphasis data-i18n="glassdoor.reviews"></emphasis></div>
            <table class="dataTable">
            <tr><th data-i18n="common.industry_average">Industry Average Score</th><td class="ratingOutOf glass" style="--outOf:'/5'">${data.score_industryAverage}</td></tr>
            <tr><th data-i18n="glassdoor.companyt"></th><td class="ratingOutOf glass" data-i18n="glassdoor.${typeClean}">${data.type}</td></tr>
            <tr><th data-i18n="glassdoor.headquarters"></th><td class="ratingOutOf glass">${data.headquarters}</td></tr>
            <tr><th data-i18n="glassdoor.founded"></th><td class="ratingOutOf glass">${data.founded}</td></tr> 
            <tr><th data-i18n="glassdoor.industry"></th><td class="ratingOutOf glass">${data.industry}</td></tr>
            <tr><th data-i18n="glassdoor.revenue"></th><td class="ratingOutOf glass">${data.revenue}</td></tr>
            <tr><th data-i18n="glassdoor.size"></th><td class="ratingOutOf glass">${data.size}</td></tr>
            </table>
            ${sourceStringClose(data.url, "GLASSDOOR")}`;
}

function moduleTosdr(data) {
    const sourceUrl = `https://tosdr.org/en/service/${data.id}`
    const previewTemplate = `<div class='previewScore'><span class="ratingOutOf">@</span></div>`;
    if (currentModuleState["tosdr-link"]["_preview"] == undefined) currentModuleState["tosdr-link"]["_preview"] = '';
    currentModuleState["tosdr-link"]["_preview"] += previewTemplate.replace("@", data.rated);
    const rated = data.rated;
    return `${pieString(rated)}
            <div class="scoreText">
            <div class="">
            <h3><div data-i18n="tos.wordGrade" style="display:inline;">Grade</div> ${rated}</h3>
            <p class="" data-i18n="tos.${rated.toLowerCase()}"></p>
            ${sourceStringClose(sourceUrl, "TOS;DR")}`;
}

function moduleTrustpilot(data) {
    const sourceUrl = `https://trustpilot.com/review/${data.domain}`
    const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf" style="--outOf:'/ 5';">@</span></div>`;
    if (currentModuleState["trust-pilot"]["_preview"] == undefined) currentModuleState["trust-pilot"]["_preview"] = '';
    currentModuleState["trust-pilot"]["_preview"] += previewTemplate.replace("@", data.score).replace("&", data.domain);
    let starString = ''
    const numberOfStars = Math.floor(data.score);
    const remainingStar = data.score - numberOfStars;
    for (let i = 0; i < 5; i++) {
        let division = (numberOfStars > i) ? 1 : 0;
        division = (numberOfStars == i) ? remainingStar : division;
        starString += `<span class="coolStar" style="--division:${division};"></span>`
    }
    return `${notPieString(data.score, false, "ratingOutOf", false, '/5', data.reviews.total)}
            <div class="scoreText">
            <div>
            <div class="stars">
            ${starString}
            </div>
            <table class="" id="trustChart">
            <tr><th data-i18n="trustpilot.total">Total Reviews</th><td>${data.reviews.total}</td></tr>
            <tr><th data-i18n="trustpilot.one">One Star</th><td>${data.reviews.oneStar}</td></tr>
            <tr><th data-i18n="trustpilot.two">Two Star</th><td>${data.reviews.twoStars}</td></tr>
            <tr><th data-i18n="trustpilot.three">Three Star</th><td>${data.reviews.threeStars}</td></tr>
            <tr><th data-i18n="trustpilot.four">Four Star</th><td>${data.reviews.fourStars}</td></tr>
            <tr><th data-i18n="trustpilot.five">Five Star</th><td>${data.reviews.fiveStars}</td></tr>
            </table>
            ${sourceStringClose(sourceUrl, "TRUST PILOT")}`;
}

function moduleSimilar(data) {
    const sourceUrl = `https://similarsites.com/site/${data.domain}`
    // const previewTemplate = `<div class='previewScore previewSubname' style="--subname:'&'"><span class="ratingOutOf" style="--outOf:'/ 100';">@</span></div>`; 
    // if (currentModuleState["similar"]["_preview"] == undefined) currentModuleState["similar"]["_preview"] = '';
    // currentModuleState["similar"]["_preview"] += previewTemplate.replace("@", data.score).replace("&", data.domain);
    let similarString = ''
    for (site in data.similar) {
        ssite = data.similar[site].s
        p = Math.floor(data.similar[site].p * 100)
        similarString += `<section class="similar-site">
        <a target="_blank" alt="${ssite}" href="https://${ssite}">
            ${ssite}</a><div class="percent">${p}</div></section>`;
    }
    return `<div class="fullBleed"><div>
    <section id="similar-sites" class="hideInSmall">
    ${similarString}
    </section>
    ${sourceStringClose(sourceUrl, "SIMILARSITES.COM")}`;
}

async function addModule(type = undefined, url = undefined, src = undefined) {
    if (type == undefined || url == undefined) return;
    // needs some mechanic for caching when we switch to graph mode
    const moduleData = await fetch(url);
    const moduleResponse = await moduleData.json()
    const dataLocationString = url.replace(dataURL, "").replace("/ds/", "").replace(".json", "");
    if (!(type in types)) { return; }
    const typeDef = types[type]
    // Genericising needed
    const moduleSource = (typeDef.subname) ? moduleResponse.source : false;
    if (currentModuleState[typeDef.id] == undefined) currentModuleState[typeDef.id] = {};
    currentModuleState[typeDef.id][dataLocationString] = moduleResponse;
    if (src) currentModuleState[typeDef.id][dataLocationString].src = src;

    let tab = false;
    if (tabable.includes(typeDef.id)) {
        tab = Object.keys(currentModuleState[typeDef.id]).filter(x => !x.startsWith("_")).length - 1;
    }

    htmlString = moduleString(typeDef.id, typeDef.translate, typeDef.label, moduleSource, false, false, dataLocationString, tab)

    // Set module state
    switch (type) {
        case "opensecrets":
            htmlString += moduleOpensecrets(moduleResponse);
            break;
        case "wbm":
            htmlString += moduleWbm(moduleResponse, dataLocationString);
            break;
        case "cta":
            htmlString += moduleCta(moduleResponse);
            break;
        case "lobbyeu":
            htmlString += moduleLobbyEu(moduleResponse);
            break;
        case "goodonyou":
            htmlString += moduleGoodOnYou(moduleResponse);
            break;
        case "bcorp":
            htmlString += moduleBcorp(moduleResponse);
            break;
        case "yahoo":
            htmlString += moduleYahoo(moduleResponse);
            break;
        case "trustscore":
            htmlString += moduleTrustScore(moduleResponse);
            break;
        case "mbfc":
            htmlString += moduleMbfc(moduleResponse);
            break;
        case "glassdoor":
            htmlString += moduleGlassdoor(moduleResponse);
            break;
        case "tosdr":
            htmlString += moduleTosdr(moduleResponse);
            break;
        case "trustpilot":
            htmlString += moduleTrustpilot(moduleResponse);
            break;
        case "similar":
            htmlString += moduleSimilar(moduleResponse);
            break;

    }
    if (type != 'wbm' && !tabable.includes(typeDef.id)) {
        htmlString += `${buttonString}</section>`
    }
    if (tabable.includes(typeDef.id)) {
        if (Object.keys(currentModuleState[typeDef.id]).filter(x => !x.startsWith("_")).length > 1) {
            htmlString += `</div>`
            debugLogging("tabable")
            if (tab == 0) {
                tabbedContent[typeDef.id] = [htmlString]
            }
            tabbedContent[typeDef.id].push(htmlString)

            return ''
        } else {
            htmlString += `</div></div></section>`
            tabbedContent[typeDef.id] = [htmlString]
            debugLogging("tabableclosed", currentModuleState[typeDef.id])
            return ""
        }
    }
    return htmlString
}

function commentStyle(style) {
    const commentBox = document.getElementById("commentBoxInput");
    const commentPreview = document.getElementById("commentPreview");
    const selection = window.getSelection().toString();
    const start = commentBox.selectionStart;
    const end = commentBox.selectionEnd;
    const before = commentBox.value.substring(0, start);
    const after = commentBox.value.substring(end);
    const selected = commentBox.value.substring(start, end);
    let newSelection = '';
    switch (style) {
        case "bold":
            newSelection = `[b]${selected}[/b]`;
            break;
        case "italic":
            newSelection = `[i]${selected}[/i]`;
            break;
        case "underline":
            newSelection = `[u]${selected}[/u]`;
            break;
        case "strike":
            newSelection = `[s]${selected}[/s]`;
            break;
        case "link":
            newSelection = `[url=${selected}]${selected}[/url]`;
            break;
        case "code":
            newSelection = `[code]${selected}[/code]`;
            break;
        case "quote":
            newSelection = `[quote]${selected}[/quote]`;
            break;
    }
    commentBox.value = `${before}${newSelection}${after}`;
    const html = new bbcode.Parser().toHTML(commentBox.value);
    commentPreview.innerHTML = html;
}

function renderBBCode() {
    const commentBox = document.getElementById("commentBoxInput");
    const commentPreview = document.getElementById("commentPreview");
    if (commentBox.value == "") return;

    const bbcodeContent = commentBox.value;
    const html = new bbcode.Parser().toHTML(bbcodeContent);

    commentPreview.innerHTML = html;
}

function commentDiagOpen(plocation = pageHash) {
    // Location, post_type, content
    const floatDiag = document.createElement("div");
    if (plocation == pageHash) {
        plocation = document.getElementsByClassName("co-name")[0].innerText.replace(".", "").replace(" ", "").toLowerCase();
        plocation = `${plocation}`
    }
    const leader = (plocation == pageHash) ? `${Url.get.username} is posting on ${document.getElementsByClassName("co-name")[0].innerText}` : `${Url.get.username} is posting on ${plocation}`;
    floatDiag.id = "comment"
    let currentPostContents = ''


    if (Object.keys(knownPostsByLocation).includes(plocation)) {
        currentPost = knownPostsByLocation[plocation]
        if (currentPost.author.toLowerCase() === Url.get.username.toLowerCase()) {
            currentPostContents = currentPost.unformated_content ? currentPost.unformated_content : currentPost.content;
        }
    }
    floatDiag.innerHTML = `
    <div style="display:none;" id="diag_tag">${plocation}</div><br/>
    <div class="commentBox">
        <div class="commentButtons">
            <div onclick="commentStyle('bold')" class="commentStyleButton commentBold">Bold</div>
            <div onclick="commentStyle('italic')" class="commentStyleButton commentItalic">Italic</div>
            <div onclick="commentStyle('underline')" class="commentStyleButton commentUnderline">Underline</div>
            <div onclick="commentStyle('strike')" class="commentStyleButton commentStrike">Strike</div>
            <div onclick="commentStyle('link')" class="commentStyleButton commentLink">Link</div>
            <div onclick="commentStyle('code')" class="commentStyleButton commentCode">Code</div>
            <div onclick="commentStyle('quote')" class="commentStyleButton commentQuote">Quote</div>
        </div>
		<textarea id="commentBoxInput" name="commentBoxInput" maxlength="512" type="text" oninput="renderBBCode()">${currentPostContents}</textarea>
        <div id="commentPreview"></div>
    </div>
    <div onclick="commentClose(true, '${plocation}')" class="commentButton commentPost">Post</div>
	<div onclick="commentClose()" class="commentButton commentClose">Cancel</div>`

    createGenericPopoverMenu(floatDiag.outerHTML, {
        id: "commentPopover",
        title: leader,
        screenLocation: "center",
        darkenBackground: true,
        closeButton: true,
    })
    renderBBCode()
    //body.classList.add("somethingIsOpen");
    //explode();
    //debugLogging("commentDiagOpen", leader)
    //titleBar.style.visibility = "hidden";
}

function commentClose(post = false, plocation = false) {
    if (post && plocation) {
        const comment_content = document.getElementById("commentBoxInput").value
        comment = {
            location: plocation,
            content: comment_content,
            post_type: "text"
        }
        send_message("IVMakePost", comment)
        debugLogging("commentClose-makePost", comment)
    }
    body.classList.remove("somethingIsOpen");
    body.style.height = "";
    body.style.overflowY = "";
    titleBar.style.visibility = "";
    const floatDiag = document.getElementById("commentPopover");
    floatDiag.hidePopover()
    floatDiag.remove()
}

function loginButtonAction() {
    if (Url.get.username) {
        pageLocation = Url.get.site ? Url.get.site : false;
        locationString = pageLocation ? `db/${pageLocation}` : hash;
        if (Object.keys(knownPostsByLocation).includes(locationString)) {
            commentDiagOpen(locationString);
        } else {
            commentDiagOpen();
        }
        return
    }
    window.open(`${assetsURL}/auth/login`, '_blank').focus()
}


function send_message(type, data) {
    const msg = { type, data };
    try {
        parent?.postMessage(msg, "*");
        console.debug(`Data: ${data}`);
    } catch (e) {
        console.error(`Failed to send message: ${type}`);
        return;
    }
}
function closeIV() { send_message("IVClose", "closeButton"); };
function boycott() { send_message("IVBoycott", "please"); }

function forceAllLinksNewTab() {
    document.querySelectorAll('a').forEach(el => {
        el.setAttribute("target", "_blank");
    });
}

let noOpen = false;
const titleBar = document.getElementById('titlebar');
const body = document.body;
let buttonString = ''
const settingsOffset = settings.firstElementChild.clientHeight;

function setBack(x = false) {
    const networkGraph = document.getElementById('graph-container');
    const backButton = document.getElementById('backButton');
    console.log(`setBack(${x})`)
    if (x == false) {
        backButton.style.backgroundColor = '';
        backButton.style.borderColor = '';
        closeButton.style.display = "";

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
    if (isSpeedcam || Url.get.app) backButton.classList.remove("show");
    backAction = (x == false) ? "justSendBack()" : x;
    if (x != false) {
        backButton.classList.add("show");
        settingsButton.style.display = 'none';
        if (settingsState.experimentalFeatures)
            document.getElementById("loginButton").style.display = 'none';
    }
    backButton.setAttribute("onclick", backAction);
    window.scrollTo(0, 0);
}

function toggleButton(buttonId) {
    buttonState[buttonId] = !buttonState[buttonId];
    const label = document.getElementById(`label-${buttonId}`);
    label.classList.toggle("pushedButton");
}

function notificationDialog(el) {
    if (diagOpen) return;
    setBack("notificationCloseAndSave(false)")
    id = el.id;
    diagOpen = true;
    const loadedPreferences = settingsState.userPreferences == {} ? {} : settingsState.userPreferences;
    const mergedPreferences = { ...defaultUserPreferences, ...loadedPreferences };
    settingsState.userPreferences = mergedPreferences;
    userPreferences = mergedPreferences;

    notid = id.replace("-dialog", "")
    debugLogging("notificationDialog", notid)
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
        const floatDiag = document.getElementById("floatDiag");
        const diagType = document.getElementById("diag_type").textContent;
        const diagTag = document.getElementById("diag_tag").textContent;
        if (diagType == "range") {
            userPreferences[diagTag] = {
                ...userPreferences[diagTag],
                ...{
                    min: parseInt(floatDiag.getElementsByClassName("range_min")[0].textContent),
                    max: parseInt(floatDiag.getElementsByClassName("range_max")[0].textContent)
                }
            }
        } else {
            userPreferences[diagTag].labels = defaultUserPreferences[diagTag].labels.filter((buttonId) => buttonState[buttonId]);
        }
        settingsState.userPreferences = userPreferences;
        settingsStateChange();
    }
    floatDiag.remove()
    setBack();
}

function notificationsDraw() {
    debugLogging("notificationsDraw", settingsState["notifications"])
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
    settingTemplate("externalPosts-banner", "settings.externalPosts", "Experimental Features", settingsState.experimentalFeatures)
    settingTemplate("debug-banner", "settings.debugBanner", "Debug Mode", settingsState.debugMode)
    settingTemplate("allowDisableModules", "settings.allowDisableModules", "Allow Disabling Modules", settingsState.allowDisableModules)

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
    const settingsButton = document.getElementById('settingsButton');
    const closeButton = document.getElementById('closeButton');
    body.classList.add("settingsOpen");
    if (settings.style.bottom == "0px") {
        closeSettings();
        send_message("IVClicked", "unsettings");
        setBack();
        return;
    }
    settings.style.bottom = "0";
    settings.style.top = `${settingsOffset}`;
    if (isSpeedcam || Url.get.app) {
        backButton.style.visibility = "visible";
        backButton.style.display = "inherit";
        backButton.style.order = "unset";
    }
    settings.firstElementChild.style.top = "0";
    backButton.style.backgroundColor = 'var(--c-secondary-background)';
    backButton.style.borderColor = 'var(--c-light-text)';
    coName.style.opacity = "0%";
    document.documentElement.style.overflow = "hidden";

    settingsButton.classList.add("hide");
    closeButton.classList.add("hide");

    notificationsDraw();
    send_message("IVClicked", "settings");
    setBack('closeSettings()');
}

function loadNetworkGraph(x) {
    const networkGraph = document.getElementById('graph-container');
    const sigmacontainer = document.getElementById('sigma-container');
    const graphButtons = document.getElementById('graphButtons');
    const settingsButton = document.getElementById('settingsButton');
    const closeButton = document.getElementById('closeButton');
    const titleBar = document.getElementById('titlebar');
    backButton.style.borderColor = 'var(--c-border-color)';
    backButton.style.backgroundColor = 'var(--c-background)';
    backButton.classList.remove("hide")

    settingsButton.classList.add("hide")
    closeButton.classList.add("hide")
    titleBar.style.width = "calc(100vw - 100px)";

    networkGraph.style.visibility = 'visible';
    sigmacontainer.style.visibility = 'visible';
    sigmacontainer.style.width = "100vw";
    sigmacontainer.style.height = "100vh";
    sigmacontainer.style.position = "fixed";
    sigmacontainer.style.zIndex = "4";
    networkGraph.classList.add("expanded");
    body.classList.add('somethingIsOpen');
    if (Url.get.app || isSpeedcam) {
        noOpen = true;
    }
    titleBar.style.position = "";
    titleBar.style.top = "0";
    graphButtons.style.top = "12px";
    window.scrollTo(0, 0);
    send_message("IVClicked", "antwork");
    resetNodeStyles();
    setBack('closeNetworkGraph()');
}

function closeNetworkGraph(x) {
    const networkGraph = document.getElementById('graph-container');
    const sigmacontainer = document.getElementById('sigma-container');
    const graphButtons = document.getElementById('graphButtons');
    const settingsButton = document.getElementById('settingsButton');
    const closeButton = document.getElementById('closeButton');
    const titleBar = document.getElementById('titlebar');
    networkGraph.style.visibility = 'hidden';
    body.classList.remove('somethingIsOpen');
    if (Url.get.app || isSpeedcam) {
        noOpen = false;
    }

    titleBar.style.width = "";
    settingsButton.classList.remove("hide");
    closeButton.classList.remove("hide");
    //if (Url.get.exhibit){
    //	backButton.classList.add("hide")
    //}
    sigmacontainer.style.width = "1px";
    sigmacontainer.style.height = "1px";
    networkGraph.classList.remove("expanded");
    graphButtons.style.top = "";
    send_message("IVClicked", "unwork");
    setBack();
}

function justSendBack(x) {
    bw = backButton.getBoundingClientRect().width;
    if (body.classList.contains("somethingIsOpen")) {
        document.getElementsByClassName("expanded")[0].classList.remove("expanded");
        body.classList.remove("somethingIsOpen");
        unexplode()
    }
    send_message("IVClicked", "back");
}


function openGenericPage(x) {
    if (noOpen) {
        return;
    }
    const voteButtons = document.getElementById('Invisible-interaction');
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
        const element = document.getElementById(x);
        element.classList.add('expanded');
    }
    voteButtons.style.visibility = "hidden";
    explode();
    setBack(`closeGenericPage("${x}")`);
}

function closeGenericPage(x) {
    const voteButtons = document.getElementById('Invisible-interaction');
    switch (x) {
        case "wikipage":
            document.getElementById('wikipedia-first-frame').classList.remove('expanded');
            break;
        case "infocard":
            document.getElementById('wikipedia-infocard-frame').classList.remove('expanded');
            break;
        default:
            document.getElementById(x).classList.remove('expanded');
            break;
    }
    body.classList.remove('somethingIsOpen');
    voteButtons.style.visibility = "visible";
    noOpen = false;
    unexplode();
    setBack();
}

function closeSettings(x) {
    const settingsButton = document.getElementById('settingsButton');
    const closeButton = document.getElementById('closeButton');
    body.classList.remove("settingsOpen");
    document.getElementsByClassName('co-name')[0].style.opacity = "100%";
    if (Url.get.app || isSpeedcam) {
        backButton.style.order = "2";
    }
    settingsButton.classList.remove("hide");
    closeButton.classList.remove("hide");

    document.documentElement.style.overflow = "";
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
    debugLogging("toggleNotifications", settingsState["notifications"])
}

function notificationBell(ppId) {
    debugLogging(`notificationBell(${ppId})`)
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
    debugLogging("notificationBell", tagList)
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
            get(sortable) {
                const order = settingsState["listOrder-wbm"] == defaultOrderStringWbm ? defaultOrderWbm : settingsState["listOrder-wbm"].split('|');
                const missingItems = defaultOrderWbm.filter(item => !order.includes(item));
                // Add missing items to IVListOrder
                return order.concat(missingItems);
            },
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
        ghostClass: "sortghost",
        store: {
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
                debugLogging("slist", orderClean)
                return orderClean;
            },
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


}

function toggleToggle(type) {
    debugLogging(`toggleToggle(${type})`)
    if (type == "notificationsContainer") {
        toggleNotifications(settingsState["notifications"])
    } else {
        settingsState[type] = !settingsState[type];
        debugLogging(`setting ${type} ${settingsState[type]}`)
    }
    settingsStateChange()
}

// {value: items[it].value, label: items[it].innerHTML}
const singleColumnModulesDesktop = ["wikipedia-infocard-frame", "graph-box", "networkgraph"];
const excludeSingleColumnModulesApp = ["carbon"];
const singleColumnModulesApp = [...defaultOrder.filter(x => !excludeSingleColumnModulesApp.includes(x)), "graph-box", "networkgraph"];
function recalculateList() {
    debugLogging("recalculateList")
    const propertyOrder = $("#sortlist").sortable('toArray');

    currentModules = Object.keys(currentModuleState)
    missingModules = defaultOrder.filter(x => !currentModules.includes(x))

    let seenModulesApp = [];
    let seenModulesDesktop = [];

    let gridTemplateAreasDesktop = "";
    let gridAutoRowsDesktop = "";
    let blanksDesktop = 0;

    let gridTemplateAreasApp = "";
    let gridAutoRowsApp = "";
    let blanksApp = 0;

    let gridTemplateAreasSmall = "";
    let gridAutoRowsSmall = "";

    //propertyOrder.forEach((value, index) => {
    let filteredPropertyOrder = []
    const content = document.getElementById("content");

    for (let index = 0; index < propertyOrder.length; index++) {
        value = propertyOrder[index];
        if (value == "networkgraph") {
            value = "graph-box"
        }
        if (document.getElementById(value)) {
            const el = document.getElementById(value);
            filteredPropertyOrder.push(value)
            el.onclick = function () {
                if (content.classList.contains("mobile")) {
                    openGenericPage(value);
                }
            }

        }
    }
    const contentChildren = content.children;
    const contentChildrenArray = Array.from(contentChildren);
    for (let index = contentChildrenArray.length - 1; index >= 0; index--) {
        const element = contentChildrenArray[index];
        if (element.classList.contains("blank")) {
            element.remove();
        }
    }

    for (let index = 0; index < filteredPropertyOrder.length; index++) {
        value = filteredPropertyOrder[index];
        if (singleColumnModulesDesktop.includes(value)) {
            if (singleColumnModulesDesktop.includes(filteredPropertyOrder[index + 1]) && !seenModulesDesktop.includes(value)) {
                gridTemplateAreasDesktop += `"${value} ${filteredPropertyOrder[index + 1]}" `;
                gridAutoRowsDesktop += "120px "
                seenModulesDesktop.push(filteredPropertyOrder[index + 1])
                seenModulesDesktop.push(value)
            } else if (seenModulesDesktop.includes(value)) {
            } else {
                blanksDesktop++;
                gridTemplateAreasDesktop += `"${value} blank${blanksDesktop}" `
                gridAutoRowsDesktop += "120px "
            }
        } else {
            gridTemplateAreasDesktop += `"${value} ${value}" `
            gridAutoRowsDesktop += "auto "
        }

        if (singleColumnModulesApp.includes(value)) {
            if (singleColumnModulesApp.includes(filteredPropertyOrder[index + 1]) && !seenModulesApp.includes(value)) {
                gridTemplateAreasApp += `"${value} ${filteredPropertyOrder[index + 1]}" `;
                gridAutoRowsApp += "120px "
                seenModulesApp.push(filteredPropertyOrder[index + 1])
                seenModulesApp.push(value)
            } else if (seenModulesApp.includes(value)) {
            } else {
                blanksApp++;
                gridTemplateAreasApp += `"${value} blank${blanksApp}" `
                gridAutoRowsApp += "120px "
            }
        } else {
            gridTemplateAreasApp += `"${value} ${value}" `
            gridAutoRowsApp += "auto "
        }

        gridAutoRowsSmall += "auto "
        gridTemplateAreasSmall += `"${value}" `
        document.getElementById(value).style.order = index;
    }

    debugLogging(`Desktop ${gridTemplateAreasDesktop}`)
    debugLogging(`App ${gridTemplateAreasApp}`)
    // create the blanks
    // Count the blanks that are needed between app&desktop then create them
    // If there are no blanks needed, remove all blanks
    // and add the correct gridTemplateAreas and gridAutoRows if there are blanks not included the grid stuff
    let numberOfBlanks = 0;
    if (blanksDesktop >= blanksApp) {
        numberOfBlanks = blanksDesktop;
    } else {
        numberOfBlanks = blanksApp;
    }
    for (let index = 0; index < numberOfBlanks; index++) {
        const blank = document.createElement("div");
        blank.classList.add("blank");
        blank.id = `blank${index}`;
        blank.style = `grid-area: blank${index}`;
        content.appendChild(blank);
    }
    //document.getElementById("content").style.gridTemplateAreas = gridTemplateAreas;
    //document.getElementById("content").style.gridAutoRows = gridAutoRows;
    const styleMode = true;
    if (styleMode) {
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#content').style.gridTemplateAreas = gridTemplateAreasDesktop;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#content').style.gridAutoRows = gridAutoRowsDesktop;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#content.mobile').style.gridTemplateAreas = gridTemplateAreasApp;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#content.mobile').style.gridAutoRows = gridAutoRowsApp;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#content.small').style.gridTemplateAreas = gridTemplateAreasSmall;
        [...document.styleSheets[3].cssRules].find(y => y.selectorText == '#content.small').style.gridAutoRows = gridAutoRowsSmall;
    } else {
        if (Object.values(content.classList).includes("small")) {
            debugLogging("small")
            content.style = `grid-template-areas: ${gridTemplateAreasSmall}; grid-auto-rows: ${gridAutoRowsSmall};`
        } else if (Object.values(content.classList).includes("mobile")) {
            debugLogging("app")
            content.style = `grid-template-areas: ${gridTemplateAreasApp}; grid-auto-rows: ${gridAutoRowsApp};`
        } else {
            content.style = `grid-template-areas: ${gridTemplateAreasDesktop}; grid-auto-rows: ${gridAutoRowsDesktop};`
            debugLogging("desktop")
        }
    }

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
            if (value != "networkgraph") {
                if (document.getElementById(value)) {
                    thiselement = document.getElementById(value);
                    if (value != "carbon" && (Url.get.app || isSpeedcam)) thiselement.setAttribute('onclick', `openGenericPage("${value}")`);
                }
            }
        }
    };

    debugLogging("recalculateList", propertyOrder)
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
    // TODO: Figure out why these nodes are happening and fix it properly
    const contentChildNodes = content.childNodes;
    for (const node of contentChildNodes) {
        if (node.nodeName == "#text")
            node.remove();
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
    if (!event.target.matches) return;
    if (event.target.matches("html")) return;
    if (event.target.matches("#floatDiag")) return;
    if (event.target.matches("#floatDiagSave")) {
        notificationCloseAndSave()
        return
    };
    const tid = event.target.id;
    debugLogging(`clicked ${tid}`)

    if (tid == 'indexRefresh') send_message("IVIndexRefresh", "please");
    if (tid == 'notificationsCache') notificationBell("cacheClear")
    if (tid == 'backButton') send_message("IVClicked", event.target.parentElement.id);
    if (tid == 'wikipedia-first-frame') {
        send_message("IVClicked", "wikipedia-first-frame");
        openGenericPage("wikipage");
        event.target.scrollIntoView();
    }

    if (event.target.classList.contains('invisible-disclaimer-title')) send_message("IVClicked", "disclaimer");
    if (event.target.classList.contains('sectionTitle') || event.target.classList.contains('iconclass') || event.target.classList.contains('scoreText')) {
        send_message("IVClicked", event.target.parentElement.id);
        if (event.target.parentElement.id == "wikipedia-first-frame") {
            openGenericPage("wikipage");
        } else if (event.target.parentElement.id == "wikipedia-infocard-frame") {
            openGenericPage("infocard")
        }
        event.target.scrollIntoView();
    }

    if (event.target.matches('#profile-card')) {
        send_message("biggen", "big");
        debugLogging("profile-card biggen")
    }

    if (event.target.parentElement.parentElement == null) return;
    const ppId = event.target.parentElement.parentElement.id;

    if (event.target.parentElement.parentElement.matches('.notificationBell'))
        notificationBell(ppId)

    if (ppId in toggles) toggleToggle(toggles[ppId])

}, false);

window.addEventListener('message', (e) => {
    if (e.data.message === undefined) return
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
    direction = (direction == status) ? "un" : direction;
    let directionType = (direction == "un") ?
        "IVPostVoteUnvote" : `IVPostVote${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
    if (direction == "comment") {
        commentDiagOpen(location);
        return;
    }
    debugLogging("postalVote", direction);
    send_message(directionType, location);
}

function moduleUpdate(mesg, comment = false) {
    location_str = mesg.location;
    let elmt = $(`[data-location='${location_str}']`)[0];
    if (typeof (elmt) == 'undefined') {
        elmt = $(`[data-location='${mesg.uid}']`)[0];
    }
    if (typeof (elmt) == 'undefined') {
        debugLogging("moduleUpdate undefined element", mesg)
        return
    }
    if (comment) {
        data = mesg
        sVB = elmt.getElementsByClassName("smallVoteBox")[0]
        if (typeof (sVB) == 'undefined') return
        debugLogging("moduleUpdate comment", contentText)
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
    debugLogging("moduleUpdate", mesg)
    debugLogging("moduleUpdate emnt", elmt)
    if (location_str.length == 36 && elmt.tagName != "SECTION" && !elmt.classList.contains("tabContent")) {
        className = "smallerVoteBox hideInSmall"
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
    debugLogging(`voteLoad: ${pageHash} ${site}`)
    send_message("IVVoteStuff", pageHash);
}
async function voteRequest(hash, direction) {
    debugLogging(`vote request: ${hash} ${direction}`);
    send_message("IVVoteStuff", direction)
}
function voteUpdate(decoded = false) {
    if (!decoded) { return }
    debugLogging("voteUpdate", decoded)
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

function addPopover(contentString, isDebug = false) {
    if (!settingsState.debugMode && isDebug) return;
    const notification = document.createElement("div");
    notification.classList.add("notification");
    if (isDebug) {
        notification.style.backgroundColor = "red";
    }
    notification.innerHTML = `<div id="notification-content">${contentString}</div>`;
    notification.popover = "manual";
    const existingNotifications = document.getElementsByClassName("notification");
    const offset = existingNotifications.length * 30;
    const popArea = document.getElementById("popArea") || document.body;
    popArea.appendChild(notification);
    notification.style.top = `${offset}px`;
    notification.showPopover();
    setTimeout(() => {
        notification.hidePopover();
        notification.remove();
        const existingNotifications = document.getElementsByClassName("notification");
        for (let i = 0; i < existingNotifications.length; i++) {
            existingNotifications[i].style.top = `${i * 30}px`;
        }
    }, 100);
}
function handleSizeChange(size, removeSize1, removeSize2, target) {
    const content = document.getElementById("content");
    const currentState = !target.checked;
    content.classList.toggle(size);
    content.classList.remove(removeSize1);
    content.classList.remove(removeSize2);

    document.querySelector('#smallSize').checked = false;
    document.querySelector('#mediumSize').checked = false;
    document.querySelector('#mobileSize').checked = false;
    switch (size) {
        case "small":
            document.querySelector('#smallSize').checked = currentState;
            break;
        case "medium":
            document.querySelector('#mediumSize').checked = currentState;
            break;
        case "mobile":
            document.querySelector('#mobileSize').checked = currentState;
            break;
    }
};

function createPopoverOptions() {
    const popoverDiv = document.createElement("div");
    popoverDiv.classList.add("popOptions");
    popoverDiv.innerHTML = `
        <div> <h3> Size Options </h3> <form>
                <label for="smallSize">Small Size</label>
                <input type="checkbox" id="smallSize" name="smallSize" onchange='handleSizeChange("small", "medium", "mobile", this)'></br>
                <label for="mediumSize">Medium Size</label>
                <input type="checkbox" id="mediumSize" name="medumSize" onchange='handleSizeChange("medium", "small", "mobile", this)'>
                </br>
                <label for="mobileSize">Mobile Size</label>
                <input type="checkbox" id="mobileSize" name="mobileSize" onchange='handleSizeChange("mobile", "small", "medium", this)'>
                </br></form>
        </div>
        <div> <h3> Graph Options </h3>
            <h4> Graph Gravity </h4><form>
                    <label for="gravity">Gravity</label>
                    <input type="range" onchange="adjustGravity(this.value)" id="gravity" name="gravity" min="0.04" max="1" step="0.01" value="0.04">
            </form>
            <h4> Graph Link Length </h4><form>
                <label for="linkLength">Link Length</label>
                <input type="range" onchange="adjustLinkLength(this.value)" id="linkLength" name="linkLength" min="10" max="200" step="10" value="100">
                </form>
        </div>
        <div><h3> Manual Controls </h3>
            <button id="recaclulateList" onclick="recalculateList()">Recalculate List</button>
                <h4>Load Page Core</h4>
                <input type="text" id="loadPageCoreFeild" name="loadPageCore" value="" onsubmit="e.preventDefault();loadPageCore(this.value)">
                <button id="loadPageCoreButton" onclick="loadPageCore(document.getElementById('loadPageCoreFeild').value)">Load Page Core</button>
        </div>`;

    let currentModuleLocations = []
    for (let x in currentModuleState) {
        Object.keys(currentModuleState[x]).forEach((y) => {
            if (y !== '_preview' && y.includes('/'))
                currentModuleLocations.push(y);
        })
    }

    popoverDiv.innerHTML += `<div><h3> Module Locations </h3>
            <h4> Current Module Locations </h4>
            <ul>
                ${currentModuleLocations.map(x => `<li>${x}</li>`).join("")}
            </ul>
        </div>`;

    createGenericPopoverMenu(popoverDiv.outerHTML, { id: "popOptions", title: "Options", screenLocation: "center", darkenBackground: true, closeButton: true });
}



function createGenericPopoverMenu(contentString, options = { id: false, title: false, screenLocation: false, darkenBackground: false, closeButton: false }) {
    const popArea = document.getElementById("popArea");
    if (!popArea) {
        return;
    }
    const { id = false, title = false, screenLocation = false, darkenBackground = false, closeButton = false } = options;
    const popoverDiv = document.createElement("div");
    popoverDiv.popover = "auto";
    popoverDiv.classList.add("popOverMenu");
    popoverDiv.classList.add(`popOverMenu-${screenLocation}`)
    if (id) popoverDiv.id = id;

    if (title) popoverDiv.innerHTML += `<h2>${title}</h2>`;
    if (contentString) popoverDiv.innerHTML += `<div id="popover-content">${contentString}</div>`;
    const popWidth = "640px"
    popoverDiv.style.paddingInline = "1em";
    popoverDiv.style.borderColor = "var(--c-border-color)";
    if (screenLocation) {
        switch (screenLocation) {
            case "top":
                break;
            case "bottom":
                break;
            case "left":
                popoverDiv.style.width = popWidth;
                popoverDiv.style.height = "100vh";
                popoverDiv.style.transform = `translateX(calc(${popWidth}/2 - 50vw))`;
                popoverDiv.style.borderLeft = "1px solid";
                break;
            case "right":
                popoverDiv.style.width = popWidth;
                popoverDiv.style.height = "100vh";
                popoverDiv.style.transform = `translateX(calc(-1 * (${popWidth}/2 - 50vw)))`;
                popoverDiv.style.borderLeft = "1px solid";
                break;
            case "center":
                popoverDiv.style.borderRadius = "1em";
                popoverDiv.style.width = popWidth;
                popoverDiv.style.minHeight = popWidth;
                popoverDiv.style.border = "1px solid";
                break;
        }
    }

    if (darkenBackground) {
        //popoverDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        // popoverDiv.style.backdropFilter = "blur(5px), darken(0.5)";
    }

    if (closeButton) {
        const close = document.createElement("button");
        close.classList.add("squareButton")
        close.classList.add("closeButton")
        close.style = "z-index: 100; position: absolute; top: 0; right: 0; margin: 0.5em; width: 40px; height: 40px; background-color: var(--c-background); color: var(--c-light-text); border: 1px solid var(--c-border-color);";
        const closeInteriorDiv = document.createElement("div");
        close.setAttribute("onclick", "this.parentElement.style.transform = 'scale(0)'; setTimeout(() => {this.parentElement.hidePopover(); this.parentElement.remove();}, 100)");
        close.appendChild(closeInteriorDiv);

        popoverDiv.appendChild(close);
    }
    popArea.addEventListener('click', (event) => {
        if (event.target !== popoverDiv && !popoverDiv.contains(event.target)) {
            popoverDiv.style.transform = "scale(0)";
            setTimeout(() => {
                popoverDiv.hidePopover();
                popoverDiv.remove();
            }, 100);
        }
    });
    popArea.appendChild(popoverDiv);
    popoverDiv.showPopover();
}

function unexplode() {
    const content = document.getElementById("content");
    const contentChildren = content.children;
    content.style = "";
    for (child of contentChildren) {
        child.style.transform = "";
        child.style.display = "";
        child.style.position = "";
        child.style.opacity = "";
        child.classList.remove("exploading");
    }
}

function explode(andRemove = false) {
    const content = document.getElementById("content");
    const contentChildren = Array.from(content.children);
    contentChildren.forEach((child, i) => {
        child.classList.add("exploading")
        if (child.classList.contains("expanded")) {
            const expandedChild = child.id;
            content.style = `grid-template-areas: "${expandedChild}"; grid-auto-rows: auto;`;
            return;
        }
        const childRect = child.getBoundingClientRect();
        const leftOrRight = i % 2 === 0 ? -1 : 1;
        if (childRect.y < window.innerHeight / 2) {
            child.style.transform = `translate(${leftOrRight * 100}vw, -100vh)`;
            child.style.position = "absolute";
            child.style.opacity = "0";
            child.style.display = "none";
        }
        if (childRect.y >= window.innerHeight / 2) {
            child.style.transform = `translate(${leftOrRight * 100}vw, 100vh)`;
            child.style.position = "absolute";
            child.style.opacity = "0";
            child.style.display = "none";
        }
        if (andRemove) {
            setTimeout(() => {
                child.remove();
                debugLogging(`removed ${child.id}`)
            }, 500)
        }

    });
}

function checkPageSize() {
    const content = document.getElementById("content");
    const isMobile = content.classList.contains("mobile");
    const isSmall = content.classList.contains("small");
    const windowWidth = window.innerWidth;
    if (!isMobile) {
        if (windowWidth <= 161 && !isSmall) {
            content.classList.add("small");
        } else if (windowWidth > 161 && isSmall) {
            content.classList.remove("small");
        }
    }

}

const detectDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches


translator.fetch(languages).then(() => {
    translator.translatePageTo();
    if (!Url.get.exhibit || isSpeedcam) {
        registerLanguageToggle();
    }
});

window.addEventListener('keypress', (e) => {
    if (e.key === "q") {
        createPopoverOptions();
    }
    if (e.key === "w") {
        addPopover("This is a test notification");
    }
    if (e.key === "e") {
        addPopover("This is a test notification", true);
    }
});

window.addEventListener('resize', () => {
    checkPageSize();
});

window.addEventListener('load', () => {
    checkPageSize();
});
// class Module {
//     constructor(type, url) {
//         this.type = type;
//         this.urls = [url];
//         this.data = [];
//         this.dataLocation = [];
//     }
//     async fetchData(x) {
//         const moduleData = await fetch(this.urls[x]);
//         if (moduleData.status !== 200) return;
//         if (this.urls.length == this.data.length) return;
//         this.data.push(await moduleData.json());
//         this.dataLocation.push(this.urls[x].replace(dataURL, "").replace("/ds/", "").replace(".json", ""));
//     }
//     async add(x) {
//         if (!this.type || !this.data[x]) return;
//         if (!(this.type in types)) return;
// 
//         const { id, translate, label } = types[this.type];
//         switch (this.type) {
//             case "social":
//                 return moduleSocial(this.data[x], id, translate, label, false);
//             case "political":
//                 return modulePolitical(this.data[x], id, translate, label, false);
//             case "post":
//                 return modulePost(this.data[x], id, translate, label, this.urls[x], false);
//             default:
//                 return '';
//         }
//     }
// 
// }
pageSetup();