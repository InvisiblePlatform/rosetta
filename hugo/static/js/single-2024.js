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
let pageLocation;
let pageHash;

let userPreferences = {}
let buttonState = {}
let diagOpen = false;
let loggedIn = false;
let settingsState;
let oldSettings;
var forCoNameRel = '';

let firstShot = false;
const localModules = ["political", "social"]
let disabledModules = [];

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
    "opensecrets", "mbfc", "glassdoor", "goodonyou", "yahoo", "tosdrlink", "bcorp", "lobbyeu", "wbm",
]

const translate = {
    "cta": "cta.title",
    "wikipedia-first-frame": "w.wikipedia",
    "graph-box": "graph.title",
    "wikipedia-infocard-frame": "w.companyinfo",
    "mbfc": "mbfc.title",
    "trustpilot": "trustpilot.title",
    "yahoo": "esg.title",
    "opensecrets": "os.title",
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
    "tosdr": "tos.title",
    "glassdoor": "glassdoor.title",
    "similar": "similar.title",
    "social-wikidata": "w.socialmedia",
    "trustscore": "trustsc.title",
    "wbm": "wbm.title",
    "wikipedia-first-frame": "wikipedia.title",
    "wikipedia-infocard-frame": "wikipedia.infocard",
};

const industryAverageData = {};
const industryAverageLookup = {
    "goodonyou": [
        {
            "file": "glassdoor_average_ratings_by_category.json",
            "discriminator": "category",
            "value": "average_rating",
            "labelAffix": "Average Rating for"
        },
    ],
    "bcorp": [
        {
            "file": "bcorp_average_score_by_industry.json",
            "discriminator": "industry",
            "value": "average_score",
            "labelAffix": "Average Score for"
        },
    ],
    "glassdoor": [
        {
            "file": "glassdoor_average_ratings_by_industry.json",
            "discriminator": "industry",
            "value": "average_rating",
            "labelAffix": "Average Rating for"
        },
    ],
    "lobbyfacts": [
        {
            "file": "lobbyeu_average_calculated_cost_by_category.json",
            "discriminator": "category",
            "value": "average_cost",
            "labelAffix": "Average Cost for"
        },
        {
            "file": "lobbyeu_average_fte_by_category.json",
            "discriminator": "category",
            "value": "average_fte",
            "labelAffix": "Average FTE for"
        },
        {
            "file": "lobbyeu_average_meeting_count_by_category.json",
            "discriminator": "category",
            "value": "average_meeting_count",
            "labelAffix": "Average Meeting Count for"
        },
        {
            "file": "lobbyeu_average_lobbyist_count_by_category.json",
            "discriminator": "category",
            "value": "average_lobbyist_count",
            "labelAffix": "Average Lobbyist Count for"
        },
    ],
    "opensecrets": [
        {
            "file": "opensec_industries_contribution_amounts_averages.json",
            "discriminator": "industry",
            "value": "average_contribution",
            "labelAffix": "Average Contribution for"
        },
        {
            "file": "opensec_industries_lobbying_amounts_averages.json",
            "discriminator": "industry",
            "value": "average_lobbying",
            "labelAffix": "Average Lobbying for"
        },
        {
            "file": "opensec_industries_number_of_lobbyists_in_government_averages.json",
            "discriminator": "industry",
            "value": "average_lobbyists_in_government",
            "labelAffix": "Average Lobbyists in Government for"
        },
        {
            "file": "opensec_industries_number_of_lobbyists_not_in_government_averages.json",
            "discriminator": "industry",
            "value": "average_lobbyists_not_in_government",
            "labelAffix": "Average Lobbyists not in Government for"
        },
    ],
    "trustpilot": [
        {
            "file": "trustpilot_bottom_level_category_averages.json",
            "discriminator": "category",
            "value": "average_rating",
            "labelAffix": "Average Rating for"
        },
        {
            "file": "trustpilot_top_level_category_averages.json",
            "discriminator": "category",
            "value": "average_rating",
            "labelAffix": "Average Rating for"
        },
    ],
    "yahoo": [
        {
            "file": "yahoo_peer_group_averages.json",
            "discriminator": "industry",
            "value": "average_esg_score",
            "labelAffix": "Average ESG Score for"
        },
    ],
}
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

const splitModules = ["wbm"]

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
    "singleColumn": true,
    "monoChrome": false,
    "disabledModules": [],
};

let currentModuleState = {};
let currentMiniState = {};
let currentModules = Object.keys(currentModuleState)
const tabbedContent = {};
const mtabbedContent = {};
let addNewFilesToGraph = false;
const knownPosts = {};
const knownPostsByLocation = {};

const currenturl = window.location.href;
const containsSpeedcam = currenturl.includes("speedcam");
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
    // if the value is empty, remove the key
    if (value === '' || value === undefined || value === null || value === false || value === 'false' || value === 'undefined' || value === 'null') {
        url.searchParams.delete(key);
    } else {
        url.searchParams.set(key, value);
    }
    window.history.replaceState(null, null, url.toString());
}

function manualSetup(site, container = 'content') {
    if (!isSpeedcam) backButton.classList.toggle("hide", site === '' || site === undefined);
    setSearchParam("site", site);
    pageSetup(container);
}

function pageSetup(container = 'content') {
    pageLocation = Url.get.site ? Url.get.site : false;
    if (isSpeedcam) container = 'speedcontent'
    addToolsSection()
    if (!isSpeedcam) showDisclaimer()
    if (!isSpeedcam) showInteractions()
    resetSettings(false)
    fetchIndustryAverageData()
    if (Url.get.site) {
        loadPageCore(pageLocation, false, false, false, container)
        addSettings()
        // if there are settings in local storage, load them
        if (!isSpeedcam && localStorage.getItem("settingsState")) {
            console.log("loading settings from local storage")
            settingsState = JSON.parse(localStorage.getItem("settingsState"));
            settingsStateApply(settingsState);
        } else {
            settingsStateApply(defaultSettingsState);
        }
        scrollIntoPlace()
        notificationsDraw();
        forceAllLinksNewTab();
        translator.translatePageTo();
        recalculateList(container);
        send_message("IVSettingsReq", true);
    }
    translator.translatePageTo();
}

function resetSettings(change = true) {
    settingsState = defaultSettingsState;
    if (change) settingsStateChange()
}

function fetchIndustryAverageData() {
    for (const item in industryAverageLookup) {
        for (const file of industryAverageLookup[item]) {
            fetch(`${dataURL}/ds/${file.file}`).then(response => response.json()).then(data => {
                descriminator = file.discriminator;
                if (!industryAverageData.hasOwnProperty(item)) {
                    industryAverageData[item] = {};
                }
                if (!industryAverageData[item].hasOwnProperty(descriminator)) {
                    industryAverageData[item][descriminator] = {};
                }
                industryAverageData[item][descriminator][file.labelAffix] = data;
            });
        }
    }
}

function checkExtensionVersion(currentVersion = false) {
    const manifestLocationUrl = 'https://raw.githubusercontent.com/InvisiblePlatform/extension/unstable/manifest.json'
    const updateUrl = 'https://github.com/InvisiblePlatform/extension/'
    if (isSpeedcam || Url.get.app) return;
    fetch(manifestLocationUrl).then(response => response.json()).then(data => {
        const version = data.version;
        if (version === currentVersion) {
            addPopover(`Current version: ${version}`, true);
        } else {
            addPopover(`New version available: ${version} (current: ${currentVersion})`, false, updateUrl);
        }
        //const currentVersion = chrome.runtime.getManifest().version;
        //if (version !== currentVersion) {
        //    addPopover(`New version available: ${version}`, true);
        //}
    })
}

function settingsStateApply(newSettingsState = defaultSettingsState, fromMessage = false) {
    if (typeof (oldSettings) === 'undefined') {
        oldSettings = JSON.parse(JSON.stringify(settingsState));
        firstShot = true;
    }
    if (Url.get.debug) debug = true;

    settingsState = newSettingsState;

    if (fromMessage) {
        checkExtensionVersion(settingsState.extension_version);
    }
    changed = []
    for (item in settingsState) {
        if (settingsState[item] != oldSettings[item] && item != 'userPreferences') {
            changed.push(item)
        }
    }

    debugLogging(changed)
    if (changed.includes("loggedIn"))
        loggedIn = settingsState.loggedIn

    loginCheck(true);
    loadPageExternal(pageLocation)

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

    if (newSettingsState.singleColumn) {
        document.lastChild.classList.add('single-column');
    } else {
        document.lastChild.classList.remove('single-column');
    }

    if (newSettingsState.monoChrome) {
        document.lastChild.classList.add('mono-chrome');
    } else {
        document.lastChild.classList.remove('mono-chrome');
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

    localStorage.setItem("settingsState", JSON.stringify(settingsState));

    addPopover("Settings Updated", true);
}

function settingsStateChange() {
    debugLogging("Settings state changed", settingsState);
    send_message("IVSettingsChange", settingsState);
    settingsStateApply(settingsState)
}

function moduleRender({ type, container }) {
    if (splitModules.includes(type)) {
        for (const item in currentModuleState[container].modules[type]) {
            if (currentModuleState[container].modules[type][item].content != '') {
                newData = structuredClone(currentModuleState[container].modules[type][item])
                newData._split = type
                createAndAddGenericModule({ type: `${item.replace(/\//g, '_')}`, container, data: newData })
            }
        }
        return
    }
    moduleStartString({ type, container })
    moduleCloseString({ type, container })
    recalculateList()
}

function registerLanguageToggle() {
    if (isSpeedcam) return;
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

const dataObjectDictionary = {};
const loadPageCore = async (coreFile, localX = false, localY = false, wikidataid = null, container = 'content', skipCY = false) => {
    if (coreFile === false) return;
    coreFile = coreFile.split("?")[0]
    coreFile = coreFile.startsWith("/db/") ? coreFile : `/db/${coreFile}`;
    coreFile = coreFile.endsWith(".json") ? coreFile : `${coreFile}.json`;
    forCoNameRel = '';
    try {
        let wikidataIdList = [];
        debugLogging("loadPageCore", coreFile)
        let appendTimeout = 0;
        console.log(container)
        const content = document.getElementById(container);
        if (wikidataid) {
            explode(true)
            appendTimeout = 1000;
        } else {
            contentSections = content.getElementsByClassName("contentSection")
            while (contentSections.length > 0) {
                contentSections[0].remove()
            }
        }

        let response;
        setTimeout(async () => {
            if (dataObjectDictionary.hasOwnProperty(coreFile)) {
                response = dataObjectDictionary[coreFile];
            } else {
                const dataf = await fetch(dataURL + coreFile);
                response = await dataf.json();
                dataObjectDictionary[coreFile] = response;
            }
            const currentDomain = document.getElementsByClassName("co-name")[0].innerText.replace(".", "");
            const { title = false, connections = false, wikidata_id = false, core = false, political = false, social = false } = await response;
            wikidataIdList = wikidata_id;
            document.getElementsByClassName('co-name')[0].innerText = (title) ? title : "Invisible Voice";
            document.getElementById("neoGraphTitle").style.setProperty("--subname", (title) ? `"${title}"` : "Invisible Voice");
            document.getElementById("pageTitle").innerText = (title) ? `Invisible Voice - ${title}` : "Invisible Voice";

            if (connections) {
                loadGraphEls(wikidata_id).then((item) => {
                    const { wikidataid, fulllist } = item;
                    pageHash = connections.split('/')[2].replace('.json', '');
                    if (Url.get.vote == 'true') voteLoad();
                    if (addNewFilesToGraph) {
                        addNewFile(`${dataURL}${connections}`, false, localX, localY, wikidataid, fulllist, container);
                    } else {
                        if (!skipCY) {
                            startCY(`${dataURL}${connections}`, wikidataid);
                        }
                        addNewFile(`${dataURL}${connections}`, true, localX, localY, wikidataid, fulllist, container);
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
            // We should presort the core array so that they are added close to in order, taking 
            // the order from settingsState.listOrder
            if (settingsState.listOrder) {
                const order = settingsState.listOrder.split("|");
                core.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
            }

            console.log(core)
            await Promise.all(core.map(async (module) => {
                const urlString = (module.url === 'local') ? false : `${dataURL}/ds/${module.url}`;
                await addModule(container, module.type, module.data, urlString);
            }));

            for (const type in currentModuleState[container].modules) {
                moduleRender({ type, container })
            }

            content.innerHTML += localString;
            if (!Url.get.exhibit && !isSpeedcam) {
                //    content.innerHTML += `
                //    <section id="carbon" class="contentSection overridden">
                //        <div class="iconarray">
                //            <div><a href="https://www.websitecarbon.com/website/${currentDomain}"><i alt="Website Carbon Calculator"><div style="background-image:var(--image-carbon);"></div></i></a></div>
                //            <div><a href="https://themarkup.org/blacklight?url=${currentDomain}"> <i alt="Blacklight"><div style="background-image:var(--image-lightning);"></div></i></a></div>
                //        </div>
                //    </section>
                //`;
                //    currentModuleState.carbon = { "carbon": currentDomain }
            }
            recalculateList()
            translator.translatePageTo()
        }, appendTimeout)
    } catch (e) {
        console.error(e)
    }
}

function arrangeForTabs(container = "content", tabContainerClass = "tabContainer", tabContentClass = "tabContent", tabButtonAreaClass = "tabButtonArea", tabbedContent = undefined) {
    const content = document.getElementById(container);
    for (const tab of tabable) {
        for (const item in tabbedContent[tab]) {
            if (document.getElementById(tab)) {
                const tabContainer = document.getElementById(tab).getElementsByClassName(tabContainerClass)[0];
                tabContainer.innerHTML += tabbedContent[tab][item];
            } else {
                content.innerHTML += tabbedContent[tab][item];
            }
        }
        if (document.getElementById(tab) && document.getElementById(tab).getElementsByClassName(tabContentClass).length > 1) {
            const tabContainer = document.getElementById(tab).getElementsByClassName(tabContainerClass)[0];
            const tabContent = tabContainer.getElementsByClassName(tabContentClass);
            const tabButtonArea = document.getElementById(tab).getElementsByClassName(tabButtonAreaClass)[0];
            document.getElementById(tab).setAttribute("data-location", tabContent[0].getAttribute("data-location"));
            for (let i = 0; i < tabContent.length; i++) {
                const subname = tabContent[i].getAttribute("data-tabLabel");
                tabButtonArea.innerHTML += `<button class="tabButton${(i == 0) ? ' active' : ''}" data-tab="${i}" onclick="tabChange(${i}, '${tab}')">${subname}</button>`
            }
        }

    }
}

const sourceStringLookup = {
    "cta": "cta.title",
    "wikipedia-first-frame": "wikipedia.title",
    "graph-box": "wikidata.title",
    "wikipedia-infocard-frame": "wikipedia.title",
    "mbfc": "mbfc.title",
    "trustpilot": "trustpilot.title",
    "yahoo": "esg.title",
    "opensecrets": "os.title",
    "lobbyeu": "lb.title",
    // "post": false,
    "political-wikidata": "wikidata.title",
    "politicali-wikidata": "wikidata.title",
    "goodonyou": "goy.title",
    "bcorp": "bcorp.title",
    "tosdr": "tos.title",
    "glassdoor": "glassdoor.title",
    "similar": "similar.title",
    "social-wikidata": "wikidata.title",
    "trustscore": "trustsc.title",
    "wbm": "wbm.title",
}


function arrangePreviews(state = currentModuleState, previewAccess = "_preview") {
    for (const item in state) {
        const itemElement = document.querySelector(`[data-module = "${item}"]`)
        if (state[item].hasOwnProperty(previewAccess)) {
            // if the preview is a string, it's a single module, if it's an object, it's a multi module
            // so add each preview seperately and add an id to the div inside, so it can be targeted when switching tabs
            const previewContainer = itemElement.getElementsByClassName("previewContainer")[0];
            if (typeof state[item][previewAccess] === "string") {
                previewContainer.innerHTML = state[item][previewAccess];
                // get the first non-_preview object in the module and use the source value as the subname
                const nonPreview = Object.keys(state[item]).filter(key => key !== previewAccess)[0];
                const subname = item == "similar-site-wrapper" ? state[item][nonPreview].domain : state[item][nonPreview].source;
                if (subname) {
                    previewContainer.classList.add("tabbed")
                    previewContainer.style.setProperty("--subnamePreview", `'(${subname}'`);
                    previewContainer.style.setProperty("--companyCount", `')'`);
                }
            } else {
                let dataTabId = 0;
                for (const internal in state[item][previewAccess]) {
                    let tabPreviewContent = state[item][previewAccess][internal];
                    tabPreviewContent = tabPreviewContent.replace(/<div/, `<div data-tab="${dataTabId}" style="display:none;"`);
                    if (dataTabId == 0) {
                        tabPreviewContent = tabPreviewContent.replace("previewScore", "previewScore activeLeft active");
                        tabPreviewContent = tabPreviewContent.replace("none", "");
                    } else {
                        tabPreviewContent = tabPreviewContent.replace("previewScore", "previewScore inactiveRight");
                    }
                    previewContainer.innerHTML += tabPreviewContent;
                    dataTabId++;
                }
                // we also want to add a subname and company count -1 as css vars into the previewContainer style, so we can use it in the css
                // we also should add a class so we can add these values to the previewContainer
                // to get the first subname, we can just get it from the first element in tabContainer
                previewContainer.classList.add("tabbed")
                currentSourceUrl = previewContainer.getElementsByClassName("previewScore")[0].getAttribute("data-source-url");
                console.log(item)
                if (itemElement.getElementsByClassName("sourceAnchor")[0]) {
                    itemElement.getElementsByClassName("sourceAnchor")[0].setAttribute("href", currentSourceUrl);

                    const subname = itemElement.getElementsByClassName("tabContainer")[0].getElementsByClassName("tabContent")[0].getAttribute("data-tabLabel");
                    previewContainer.style.setProperty("--companyCount", `') +${dataTabId}'`);
                    previewContainer.style.setProperty("--subnamePreview", `'(${subname}'`);
                }

            }
        } else if (item.startsWith("political")) {
            for (const internal in state[item]) {
                if (state[item][internal].hasOwnProperty(previewAccess)) {
                    itemElement.getElementsByClassName("previewContainer")[0].innerHTML = state[item][internal][previewAccess];
                }
            }
        }
        // While we are in this loop we may as well add the source string to the module
        if (sourceStringLookup.hasOwnProperty(item) && itemElement) {
            itemElement.getElementsByClassName("sourceAnchor")[0].innerText = sourceStringLookup[item];
            itemElement.getElementsByClassName("sourceAnchor")[0].setAttribute("data-i18n", sourceStringLookup[item]);
            // as well as grabbing the href from the data-source-url attribute of the first previewScore if there isnt one already
            if (!itemElement.getElementsByClassName("sourceAnchor")[0].getAttribute("href")) {
                if (itemElement.getElementsByClassName("previewScore")[0]) {
                    sourceUrl = itemElement.getElementsByClassName("previewScore")[0].getAttribute("data-source-url");
                    itemElement.getElementsByClassName("sourceAnchor")[0].setAttribute("href", sourceUrl);
                }
            }

        }
    }
}


async function loadGraphEls(wikidataIdList = false) {
    if (!wikidataIdList) {
        return;
    }
    const wikidataidarray = wikidataIdList.join(",").replaceAll("Q", "").split(",");
    wikidataidarray.sort((a, b) => a - b);
    return { wikidataid: `Q${wikidataidarray[0]}`, fulllist: wikidataIdList }
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
    } else if (data.location.startsWith("db")) {
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

const loadPageExternal = async (location) => {
    if (document.getElementById("post")) {
        document.getElementById("post").remove()
    }
    postLocation = `${location.replace(".json", "").replace('/db', 'db')}`
    if (!postLocation.startsWith("db/") && (!postLocation.includes("/") && postLocation.length != 32)) {
        postLocation = `db/${postLocation}`
    }
    console.log(`loadPageExternal ${postLocation}`)
    send_message("IVGetPost", postLocation)
}

function loginCheck() {
    if (isSpeedcam) return;
    // if (!settingsState.experimentalFeatures) return;
    if (Url.get.username)
        settingsState.loggedIn = true;
}
// load modules for matching data

const types = {
    "bcorp": { "id": "bcorp", "label": "Bcorp Rating", "translate": "bcorp.title", "subname": true },
    "cta": { "id": "cta", "label": "Call to Action", "translate": "cta.title", "subname": true },
    "glassdoor": { "id": "glassdoor", "label": "Employee Rating", "translate": "glassdoor.title", "subname": true },
    "goodonyou": { "id": "goodonyou", "label": "Goodonyou Rating", "translate": "goy.title", "subname": true },
    "lobbyeu": { "id": "lobbyeu", "label": "LobbyFacts.eu", "translate": "lb.title", "subname": true },
    "mbfc": { "id": "mbfc", "label": "Media Bias", "translate": "mbfc.title", "subname": true },
    "opensecrets": { "id": "opensec", "label": "OpenSecrets", "translate": "os.title", "subname": true },
    "political": { "id": "political-wikidata", "label": "Political Leanings", "translate": "political.title", "subname": true },
    "politicali": { "id": "politicali-wikidata", "label": "Political Ideology", "translate": "wikidata.polideology", "subname": true },
    "post": { "id": "post", "label": "User Content", "translate": "user.moduletitle", "subname": true },
    "similar": { "id": "similar-site-wrapper", "label": "Similar Sites", "translate": "similar.title", "subname": false },
    "social": { "id": "social-wikidata", "label": "Social Media", "translate": "social.title", "subname": false },
    "tosdr": { "id": "tosdr-link", "label": "Privacy", "translate": "tosdr.title", "subname": true },
    "trustpilot": { "id": "trust-pilot", "label": "Trust Pilot", "translate": "trustpilot.title", "subname": true },
    "trustscore": { "id": "trust-scam", "label": "Trust Scam", "translate": "trustsc.title", "subname": true },
    "wbm": { "id": "wbm", "label": "WBM", "translate": "wbm.title", "subname": true },
    "yahoo": { "id": "yahoo", "label": "Esg Rating", "translate": "esg.title", "subname": true },
    "wikipedia-first-frame": { "id": "wikipedia-first-frame", "label": "Wikipedia", "translate": "w.wikipedia", "subname": true },
    "wikipedia-infocard-frame": { "id": "wikipedia-infocard-frame", "label": "Wikipedia", "translate": "w.companyinfo", "subname": true },
    "graph-box": { "id": "graph-box", "label": "Network Graph", "translate": "graph.title", "subname": true },
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

const miniSource = (href) => `<a class="minisource" target="_blank" href="${href}"></a>`;
function buttonTemplate(id, functionName, interaction = false, replacementDiv = '<div></div>') {
    const idString = interaction ? "" : `id="${id}"`;
    const classString = interaction ? `class="squareButton invert ${id} interactionButton"` : `class="invert squareButton"`;
    const functionString = functionName.match(/[()]/) ? `${functionName}` : `${functionName}()`;
    return `<button type="button" ${classString} onclick="${functionString}" ${idString} >${replacementDiv}</button>`;
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


var localString = ''

function tabChange(tab, container, type) {
    const contain = document.getElementById(container)
    const ourModule = contain.querySelector(`[data-module='${type}']`)
    const tabContent = ourModule.getElementsByClassName("tabContent");
    const tabButtons = ourModule.getElementsByClassName("tabButton");
    const tabButtonArea = ourModule.getElementsByClassName("tabButtonArea")[0];
    const tabPreviewContent = ourModule.getElementsByClassName("previewScore");
    const currentlyActive = ourModule.dataset.tab;

    for (let i = 0; i < tabContent.length; i++) {
        if (i == tab) {
            tabContent[i].style.display = "grid";
            tabContent[i].classList.remove("inactiveRight");
            tabContent[i].classList.remove("inactiveLeft");
            tabButtons[i].classList.add("active");
            tabPreviewContent[i].style.display = "";
            tabPreviewContent[i].classList.remove("inactiveRight");
            tabPreviewContent[i].classList.remove("inactiveLeft");
            tabPreviewContent[i].classList.add("active");
            if (currentlyActive > tab) {
                tabContent[i].classList.add("activeRight");
                tabPreviewContent[i].classList.add("activeRight");
            } else {
                tabContent[i].classList.add("activeLeft");
                tabPreviewContent[i].classList.add("activeLeft");
            }
            // we need to set the subname of the previewContainer to the subname of the tabButton, getting the company count from the previewContainer
            const subname = tabButtons[i].innerText;
            ourModule.getElementsByClassName("previewContainer")[0].style.setProperty("--subnamePreview", `'(${subname}`);

            // we need to update the data-location of the main element to the data-location of the tabContent
            ourModule.setAttribute("data-location", tabContent[i].getAttribute("data-location"));
            ourModule.getElementsByClassName("sourceAnchor")[0].setAttribute("href", tabContent[i].getAttribute("data-source-url"));
        } else {
            tabContent[i].style.display = "none";
            tabContent[i].classList.remove("activeRight");
            tabContent[i].classList.remove("activeLeft");
            tabPreviewContent[i].style.display = "none";
            tabPreviewContent[i].classList.remove("activeRight");
            tabPreviewContent[i].classList.remove("activeLeft");
            if (tab < i) {
                tabContent[i].classList.add("inactiveRight");
                tabPreviewContent[i].classList.add("inactiveRight");
            } else {
                tabContent[i].classList.add("inactiveLeft");
                tabPreviewContent[i].classList.add("inactiveLeft");
            }
            tabButtons[i].classList.remove("active");
            tabPreviewContent[i].classList.remove("active");
        }
    }
}



function moduleStartString({ type, container }) {
    const data = currentModuleState[container].modules[type];
    let i18n = '';
    if (types.hasOwnProperty(type)) {
        i18n = types[type].translate;
    } else {
        i18n = data[Object.keys(data)[0]].data.trans
    }
    const label = toTitleCase(type);
    let dataLoc = ''; let subname = ''; let companyCount = 0;
    if (data) {
        dataLoc = Object.keys(data)[0];
        subname = data[Object.keys(data)[0]].data.source;
        companyCount = (type != "wbm") ? Object.keys(data).length : false;
    } else {
        return false; // we dont want to create a section if there is no data
    }
    if (Object.keys(data).length > 1) tabbed = true;
    let contentSection = document.createElement("section");
    contentSection.classList.add("contentSection");
    contentSection.setAttribute("data-location", dataLoc);
    contentSection.setAttribute("data-module", type);
    if (data[Object.keys(data)[0]]._split != undefined) {
        contentSection.setAttribute("data-split-from", data[Object.keys(data)[0]]._split);
    }
    let details = document.createElement("details");
    let summary = document.createElement("summary");
    let h2 = document.createElement("h2");
    h2.classList.add("sectionTitle");
    h2.setAttribute("data-i18n", i18n);
    h2.innerText = label;
    summary.appendChild(h2);

    let previewContainer = document.createElement("div");
    previewContainer.classList.add("previewContainer");
    if (types.hasOwnProperty(type) && types[type].subname) {
        previewContainer.style.setProperty("--subnamePreview", companyCount > 1 ? `"(${subname}) + ${companyCount}"` : `"(${subname})"`);
        //previewContainer.style.setProperty("--companyCount", companyCount > 1 ? `") +${companyCount}"` : '")"');
    } else if (data[Object.keys(data)[0]].data.subname) {
        previewContainer.style.setProperty("--subnamePreview", `"(${data[Object.keys(data)[0]].data.subname})"`);
    }
    for (const preview in data) {
        previewContainer.innerHTML += data[preview].preview;
    }
    summary.appendChild(previewContainer);
    details.appendChild(summary);
    let tabbedContentContainer = document.createElement("div");
    if (companyCount > 1) {
        let tabButtonArea = document.createElement("div");
        tabButtonArea.classList.add("tabButtonArea");
        contentSection.dataset.tab = 0;
        previewContainer.classList.add("tabbed")
        currentTab = 0;
        for (const child of previewContainer.children) {
            if (currentTab == 0) {
                child.style.display = "grid";
                child.classList.add("active");
                child.classList.add("activeLeft");
                child.dataset.tab = currentTab;
            } else {
                child.style.display = "none";
                child.classList.add("inactiveRight");
                child.dataset.tab = currentTab;
            }
            let tabButton = document.createElement("button");
            tabButton.classList.add("tabButton");
            tabButton.setAttribute("data-tab", currentTab);
            tabButton.setAttribute("onclick", `tabChange("${currentTab}", "${container}", "${type}")`);
            if (currentTab == 0) tabButton.classList.add("active")
            tabButton.innerText = data[Object.keys(data)[currentTab]].data.source;
            tabButtonArea.appendChild(tabButton);

            let tabContent = document.createElement("div");
            tabContent.classList.add("tabContent");
            if (currentTab == 0) {
                tabContent.classList.add("activeLeft")
                tabContent.style.setProperty("display", "grid")
            } else {
                tabContent.classList.add("inactiveRight")
                tabContent.style.setProperty("display", "none")
            }

            tabContent.setAttribute("data-location", Object.keys(data)[currentTab]);
            let sourceUrl = undefined;
            if (data[Object.keys(data)[currentTab]].sourceUrl != undefined) {
                tabContent.setAttribute("data-source-url", data[Object.keys(data)[currentTab]].sourceUrl);
                sourceUrl = data[Object.keys(data)[currentTab]].sourceUrl;
            }
            if (sourceUrl == undefined) {
                try {
                    sourceUrl = previewContainer.getElementsByClassName("previewScore")[currentTab].getAttribute("data-source-url");
                    tabContent.setAttribute("data-source-url", sourceUrl);
                } catch (e) {
                    console.log(e)
                }
            }

            if (sourceUrl == undefined) {
                try {

                    sourceUrl = data[Object.keys(data)[currentTab]].sourceHref;
                } catch (e) {
                    console.log(e)
                }
            }

            tabContent.innerHTML = data[Object.keys(data)[currentTab]].content;
            tabContent.dataset.tabLabel = Object.keys(data)[currentTab];
            tabbedContentContainer.appendChild(tabContent);

            currentTab++;
        }
        summary.appendChild(tabButtonArea);
    } else {
        let tabbedContent = document.createElement("div");
        tabbedContent.classList.add("tabContent");
        tabbedContent.innerHTML = data[Object.keys(data)[0]].content;
        tabbedContent.setAttribute("data-location", data[Object.keys(data)[0]].dataLocation);
        tabbedContent.setAttribute("data-source-url", data[Object.keys(data)[0]].sourceUrl);
        tabbedContentContainer.appendChild(tabbedContent);
    }
    details.appendChild(tabbedContentContainer);
    details.addEventListener("toggle", (ev) => { console.log(ev); recalculateList() });
    contentSection.appendChild(details);
    document.getElementById(container).appendChild(contentSection);
    //let fakeButtonEl = document.createElement("div");
    //fakeButtonEl.outerHTML = `<div class="squareButton hovertext hideInSmall"><div>?</div></div>
    //        <div class="hidetext"><h3 data-i18n="title.${type}"> </h3><p data-i18n="desc.${type}"></p></div>`
    // summary.appendChild(fakeButtonEl);
}

function createAndAddGenericModule({ type, container, data }) {
    console.log(type, container, data)
    // This function is used to create a generic module, it will create the module, add the preview and the source
    // it will also add the module to the currentModuleState object
    // The data object should be in the following format
    // { "location": "url", "source": "source", "content": "content", "preview": "preview", "sourceUrl": "sourceUrl" }
    if (!currentModuleState[container].modules.hasOwnProperty(type)) {
        currentModuleState[container].modules[type] = {};
    }
    if (data.location == undefined) {
        data.location = data.data.location;
    }
    if (data.data !== undefined) {
        currentModuleState[container].modules[type][data.location] = data
    } else {
        currentModuleState[container].modules[type][data.location] = {
            "data": data, "preview": data.preview, "content": data.content,
            "sourceUrl": data.sourceUrl
        };
    }

    moduleRender({ type, container })
    recalculateList(container)
}


const sourceStringClose = (href, text) => `</div></div><a target="_blank" class="hideInSmall source" href='${href}'>${text}</a>`;

function moduleCloseString({ type, container }) {
    const contentSection = document.getElementById(container).querySelector(`[data-module="${type}"]`);
    const sourceUrl = currentModuleState[container].modules[type][Object.keys(currentModuleState[container].modules[type])[0]].sourceUrl;
    const sourceText = sourceStringLookup[type];
    const interactionBar = document.createElement("div");
    interactionBar.classList.add("interactionBar");
    const interactionButtons = document.createElement("div");
    interactionButtons.classList.add("interactionButtons");
    interactionButtons.innerHTML = `
        ${buttonTemplate("commentButton", "commentButtonAction", true)}
        ${buttonTemplate("likeButton", "likeModule", true)}
        ${buttonTemplate("dislikeButton", "dislikeModule", true)}
        ${buttonTemplate("aboutButton", "aboutButtonAction", true)}`
    interactionBar.appendChild(interactionButtons);
    const sourceLink = document.createElement("a");
    sourceLink.classList.add("hideInSmall");
    sourceLink.classList.add("source");
    sourceLink.classList.add("sourceAnchor");
    sourceLink.setAttribute("href", sourceUrl);
    sourceLink.setAttribute("target", "_blank");
    sourceLink.setAttribute("data-i18n", sourceStringLookup[type]);
    sourceLink.innerText = sourceText;
    interactionBar.appendChild(sourceLink);
    contentSection.appendChild(interactionBar);
}

function dataToTable(data, ratingOutOf = false, tranlationModuleTag = '', hyperlink = false) {
    // data should be an object with the following structure
    // [[label, translation, value, outOf], ...]
    // ratingOutOf is a boolean, if true, the table will be styled as a rating out of table
    // tranlationModuleTag is the tag that the translation should be in
    // hyperlink is a boolean, if true, the value will be wrapped in an a tag, with the href being the value
    //let tableString = '<table>';
    let tableString = '<ol class="fakeTable">';
    const rowClassAndStyleString = (ratingOutOf) ? ` class="ratingOutOf" style="--outOf:'@';"` : '';
    tableString += Object.values(data).map(([label, translate, value, outOf]) => {
        outOfString = outOf ? `/ ${outOf}` : '';
        // Some links may end in a / so we need to remove that
        if (hyperlink) {
            value = value.endsWith("/") ? value.slice(0, -1) : value;
            value = `<a href="${value}">
                    ${value.replace("http://", "").replace("https://", "").replace("www.", "").replace("mailto:", "")}
                    </a>`;
        }
        // return value ? `<tr><th data-i18n="${tranlationModuleTag}.${translate}">${label.replace(":", "")}</th>
        // <td${rowClassAndStyleString.replace("@", outOfString)}>${value}</td></tr>` : '';
        return value ? `<li><span data-i18n="${tranlationModuleTag}.${translate}">${label.replace(":", "")}</span>
            <span${rowClassAndStyleString.replace("@", outOfString)}>${value}</span></li>` : '';
    }).join('');
    // tableString += '</table>';
    tableString += '</ol>';
    return tableString;
}

function spanString(label, translation, style = false) {
    classString = style ? `class="${style}"` : '';
    return `<span ${classString} data-i18n="${translation}">${label}</span>`
}

function lineGraphString(title, score, outOf, colourMe = false, averageScore = false, extraInfo = false, threshold = false, labelOverride = false, addKey = false) {
    // Create a line that is an svg with a line and a circle
    // If averageScore is true, then the line get a second circle
    // If colourMe is true, then the line and circle are coloured
    // the circles are placed along the line relative to the score and outOf
    // we want another circle that is placed at threshold/outOf * 100, this is to show the threshold
    // that circle should be white with a black border
    // we also need 2 circles to round off the line and a second line that is coloured to fill the line up to the score
    let scoreNum = (score / outOf) * 100;
    let lineString = `<div class="lineGraph">
    <h4>${title}</h4>
    <svg viewBox="-1 0 102 10" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="5" x2="100" y2="5" stroke="var(--score-unset)" stroke-width="1" />`
    lineString += scoreNum < 100 ? `<circle cx="100" cy="5" r=".5" fill="var(--score-unset)" />` : `<circle cx="100" cy="5" r=".5" fill="black" />`;
    if (isNaN(scoreNum)) {
        scoreNum = 0;
    }
    lineString += `
    <circle cx="0" cy="5" r=".5" fill="black" />
    <line x1="0" y1="5" x2="${scoreNum}" y2="5" stroke="black" stroke-width="1" />
    <circle class="lineGraphDot"  cx="${scoreNum}" cy="5" r="1.1" fill="black" />
    <text x="${scoreNum}" y="3" fill="transparent" style="z-index:-1;" font-size="0.2em" text-anchor="middle">${score}</text>
    `;

    if (colourMe) {
        // if colour me is true, we want to colour the line and the circle
        // this should set the colours to the floor(score/rating * 100 / 10),
        // so that we can user that in a css variable to colour the line and circle
        const colour = Math.floor(scoreNum / 10);
        if (typeof scoreNum != "number") color = "unset";
        lineString = lineString.replaceAll("black", `var(--score-${colour})`);
    }
    if (averageScore) {
        const averageScoreNum = (averageScore / outOf) * 100;
        lineString += `<circle class="lineGraphDot" cx="${averageScoreNum}" cy="5" r="1.1" fill="black" />`;
        lineString += `<text x="${averageScoreNum}" y="3" fill="transparent" style="z-index:-1;" font-size="0.2em" text-anchor="middle">${averageScore}</text>`;
    }
    if (extraInfo) {
        //lineString += `<text x="100" y="5" fill="black" font-size="0.2em" text-anchor="end">${extraInfo}</text>`;
    }
    if (threshold) {
        const thresholdNum = (threshold / outOf) * 100;
        lineString += `<circle class="lineGraphDot" cx="${thresholdNum}" cy="5" r="1.1" fill="white" stroke="black" stroke-width=".5" />`;
        lineString += `<text x="${thresholdNum}" y="3" fill="transparent" style="z-index:-1;" font-size="0.2em" text-anchor="middle">${threshold}</text>`;
    }
    label = labelOverride ? labelOverride : outOf;
    lineString += `</svg>
    <p class="score" style="--outOf:'/${label}';">${score.toString().replace(/.0$/, "")}</p>
    </div>`;
    if (addKey) {
        // Add a key to the line graph, this is a div with a span each item
        // addKey should be a list of tuples, each tuple should be [label, data-i18n], 
        // the label is the text that is displayed and the data-i18n is the translation key
        // the order of the tuples is the order of the keys, from average, to threshold. No need to include the score
        // but we do need a circle that represents the things we are keying, that corresponds to the order of the keys
        let keyString = `<ol class="lineGraphKey">`;
        for (const key in addKey) {
            keyString += `<li><span class="lineGraphKeyCircle"></span>${addKey[key][0]}</li>`;
        }
        keyString += `</ol>`;
        lineString += keyString
    }
    return lineString;
}

function dotGridChartString(title, score, outOf, colourMe = false, numberOfDotsWide = 5, averageScore = false, extraClass = false) {
    // Create a dot grid chart, this is a grid of dots that are coloured based on the score
    // the dots are placed in a grid that is numberOfDotWide by 5
    // the dots are coloured based on the score, if colourMe is true using our colour scheme
    // if the dots are uncoloured they are grey, all dots up to the score are coloured
    // if averageScore is true, then the dot representing the average score is given a stroke

    let scoreNum = (score / outOf) * 100;
    if (typeof scoreNum != "number") scoreNum = 0;
    const viewBoxDimentions = numberOfDotsWide * 13;
    const numberOfDots = numberOfDotsWide * 5;
    const adjustedScoreColor = Math.floor((score / outOf) * 10);
    const classString = extraClass ? `class="${extraClass} dotGridChart"` : 'class="dotGridChart"';
    let dotString = `<div ${classString}>
    <p class="score" style="--outOf:'/${outOf}';">${score}</p>
    <svg viewBox="-12 -12 ${viewBoxDimentions} 65" xmlns="http://www.w3.org/2000/svg">`;
    for (let i = 0; i < numberOfDots; i++) {
        // we want to place the dots in a grid, so we need to calculate the x and y
        const x = (i % numberOfDotsWide) * 12;
        const y = Math.floor(i / numberOfDotsWide) * 12;
        const adjustedScore = (i / numberOfDots) * 100;
        let fill = (adjustedScore < scoreNum) ? "black" : "var(--score-unset)";
        if (colourMe) {
            //let colour = Math.floor(adjustedScore / 10);
            fill = fill.replace("black", `var(--score-${adjustedScoreColor})`);
        }
        dotString += averageScore && i == Math.floor((averageScore / outOf) * numberOfDots) ? `<circle cx="${x}" cy="${y}" r="4" fill="black"/>` : `<circle cx="${x}" cy="${y}" r="4" fill="${fill}" />`;
    }
    dotString += `</svg></div>`;
    return dotString;
}

function segmentedArcString(title, score, outOf, colourMe = false, segments = 5, averageScore = false, preciseDots = false, showRatingText = true, labelOverride = false) {
    // Create a segmented arc chart, this is an arc from 0 to 180deg that is segmented into a number of segments
    // we can make 2 lines, one grey and one black that represent the arc. Then simulate the segments
    // by masking off the segments with a white line that is the same width as the arc, angled to the segment.
    // we then colour the segments based on the score, if colourMe is true we use our colour scheme
    // if averageScore is true, then the segment representing the average score is given a stroke
    // if preciseDots is true, then we add a dot on the arc that represents the score
    // if showRatingText is true, then we add the score as text below the arc
    if (typeof score != "number") score = 0;
    let scoreNum = (score / outOf) * 100;
    if (typeof scoreNum != "number") scoreNum = 0;
    // figure out which segment the score is in
    const scoreSegment = Math.floor((score / outOf) * segments);
    const adjustedScoreColor = 10 - Math.floor(scoreNum / 10);
    let arcString = `<div class="segmentedArcChart">
    <span class="chartInner">
    <svg width = "142" height = "72" viewBox = "10 7 122 65" style = "transform:scaleX(-1);" fill = "none" xmlns = "http://www.w3.org/2000/svg" >`;
    const segmentAngle = 180 / segments;
    let scoreColour = (colourMe) ? `var(--score-${adjustedScoreColor})` : "black";

    const gapAngle = 3;
    const roundedSegments = true;
    const outer = 60;
    const inner = 50;
    for (let i = 0; i < segments; i++) {
        const startAngle = segmentAngle * i;
        const endAngle = i == segments - 1 ? segmentAngle * (i + 1) : segmentAngle * (i + 1) - gapAngle;
        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;
        const startXMultiplier = Math.cos(startAngleRad);
        const startYMultiplier = Math.sin(startAngleRad);
        const endXMultiplier = Math.cos(endAngleRad);
        const endYMultiplier = Math.sin(endAngleRad);

        const x1 = 71 + outer * startXMultiplier;
        const y1 = 71 - outer * startYMultiplier;
        const x2 = 71 + outer * endXMultiplier;
        const y2 = 71 - outer * endYMultiplier;

        const x3 = 71 + inner * startXMultiplier;
        const y3 = 71 - inner * startYMultiplier;
        const x4 = 71 + inner * endXMultiplier;
        const y4 = 71 - inner * endYMultiplier;

        if (i >= scoreSegment) {
            scoreColour = "var(--score-unset)";
        }

        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        if (roundedSegments) {
            // if roundedSegments is true, we want to round off the segment corners by 
            // adding another 2 lines that are curved to the segment
            const startCurveAngleRad = ((startAngle + gapAngle) * Math.PI) / 180;
            const endCurveAngleRad = ((endAngle - gapAngle) * Math.PI) / 180;
            const startCurveXMultiplier = Math.cos(startCurveAngleRad);
            const startCurveYMultiplier = Math.sin(startCurveAngleRad);
            const endCurveXMultiplier = Math.cos(endCurveAngleRad);
            const endCurveYMultiplier = Math.sin(endCurveAngleRad);

            const x5 = 71 + (outer + gapAngle) * startCurveXMultiplier;
            const y5 = 71 - (outer + gapAngle) * startCurveYMultiplier;
            const x6 = 71 + (outer + gapAngle) * endCurveXMultiplier;
            const y6 = 71 - (outer + gapAngle) * endCurveYMultiplier;

            const x7 = 71 + (inner - gapAngle) * startCurveXMultiplier;
            const y7 = 71 - (inner - gapAngle) * startCurveYMultiplier;
            const x8 = 71 + (inner - gapAngle) * endCurveXMultiplier;
            const y8 = 71 - (inner - gapAngle) * endCurveYMultiplier;

            arcString += `<path d="M${x1},${y1} A7,7 0 0,0 ${x5},${y5} A${outer},${outer} 0 0,0 ${x6},${y6} A7,7 0 0,0 ${x2},${y2} L${x4},${y4} 
                            A7,7 0 0,0 ${x8},${y8} A${inner},${inner} 0 0,1 ${x7},${y7} A7,7 0 0,0 ${x3},${y3}
                            Z" fill="${scoreColour}"/>`;
        } else {
            arcString += `<path d="M${x1},${y1} A70,70 0 ${largeArcFlag},0 ${x2},${y2} L${x4},${y4} A50,50 0 ${largeArcFlag},1 ${x3},${y3} Z" fill="${scoreColour}"/>`;
        }
    }
    if (preciseDots) {
        const x = 10 * Math.sin((scoreNum * Math.PI) / 180);
        const y = 10 * Math.cos((scoreNum * Math.PI) / 180);
        arcString += `<circle cx="${x}" cy="${y}" r=".5" fill="black" />`;
        if (averageScore) {
            const averageScoreNum = (averageScore / outOf) * 100;
            const x = 10 * Math.sin((averageScoreNum * Math.PI) / 180);
            const y = 10 * Math.cos((averageScoreNum * Math.PI) / 180);
            arcString += `<circle cx="${x}" cy="${y}" r=".5" fill="black" />`;
        }
    }
    arcString += `</svg>`;
    label = labelOverride ? labelOverride : outOf;
    if (showRatingText) {
        arcString += `<p class="score" style="--outOf:'/${label}';">${score}</p>`;
        // if segments are 5 we also wants a "risk" label, this should be translated
        // HIGH, MEDIUM, LOW, NEGLIGIBLE, SEVERE
        if (segments == 5) {
            riskArray = ["negligible", "low", "medium", "high", "severe"];
            arcString += `<p class="risk" data-i18n="esg.${riskArray[scoreSegment]}">
            ${riskArray[scoreSegment]}</p>`;
        }
    }
    arcString += `</span></div>`;
    return arcString;
}

function thickLineGraphString(title, score, outOf, colourMe = false, averageScore = false, labelOverride = false) {
    // Create a thick line graph, this is a line that is thicker than the line graph
    // we dont use a circle to represent the score, but we colour the line up to the score
    // if averageScore is true, then we add a line at that point
    // we should add the relevent circles to the ends of the line
    let scoreNum = (score / outOf) * 100;
    if (typeof scoreNum != "number") scoreNum = 0;

    let lineString = `<div class="thickLineGraph">
    <svg viewBox="-2 0 104 10" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="5" x2="100" y2="5" stroke="var(--score-unset)" stroke-width="3" />`;
    if (scoreNum < 100) {
        lineString += `<line x1="${scoreNum}" y1="5" x2="100" y2="5" stroke="var(--score-unset)" stroke-width="3" />
        <circle cx="100" cy="5" r="1.5" fill="var(--score-unset)" />`;
    }
    lineString += `<line x1="0" y1="5" x2="${scoreNum}" y2="5" stroke="black" stroke-width="3" />
        <circle cx="0" cy="5" r="1.5" fill="black" />`;
    if (scoreNum = 100) {
        lineString += `<circle cx="0" cy="5" r="1.5" fill="black" />`;
    }
    if (averageScore) {
        const averageScoreNum = (averageScore / outOf) * 100;
        lineString += `<line x1="${averageScoreNum}" y1="5" x2="${averageScoreNum}" y2="5" stroke="black" stroke-width="3" />`;
    }
    if (colourMe) {
        const colour = Math.floor(scoreNum / 10);
        if (typeof scoreNum != "number") color = "unset";
        lineString = lineString.replaceAll("black", `var(--score-${colour})`);
    }
    label = labelOverride ? labelOverride : outOf;
    lineString += `</svg>
    <p class="score" style="--outOf:'/${label}';">${score.toString().replace(".0", "")}</p>
    </div>`;
    return lineString;

}

function pieChartCardString(data, valuePrepend = false, valueAppend = false, title = false, displayPercent = false, displayTotal = false) {
    // create a card that has a pie chart in it, it should take in data that is formatted like this
    // [[label, translation, value, colour], ...], where the colour is a css variable name
    // valuePrepend and valueAppend are strings that are added to the value
    // title is a string that is added to the title of the card
    // we also want to add a key to the card, this should be made from the same data as the pie chart
    // if displayPercent is true, then we should display the percentage of the total that each slice is
    // by adding it to the key in brackets, inside the style attribute of the span
    // if displayTotal is true, then we should display the total of all the values next to the title
    let pieString = `<div class="pieChartCard">`;
    let keyString = `<ol class="pieChartKey">`;
    if (title) {
        pieString += `<h3>${title}</h3>`;
    }
    let total = 0;
    for (const [label, translation, value, colour] of data) {
        total += parseFloat(value);
    }
    if (displayTotal) {
        var newValue = total
        if (["$", "£", "€"].includes(valuePrepend)) {
            // if the value is a currency, we want to add a comma every 3 digits
            newValue = valuePrepend + newValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            if (valuePrepend) newValue = valuePrepend + newValue;
        }
        pieString += `<p class="total" data-i18n="total">${newValue}</p>`;
    }
    pieString += `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">`;
    // we should sort the data so that the highest value is first
    data.sort((a, b) => b[2] - a[2]);
    var outerRadius = 50;
    var innerRadius = 10;
    var currentRelCoords = [];
    for (const [label, translation, value, colour] of data) {
        var newValue = value
        if (["$", "£", "€"].includes(valuePrepend)) {
            // if the value is a currency, we want to add a comma every 3 digits
            newValue = newValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        if (valuePrepend) newValue = valuePrepend + newValue;
        if (valueAppend) newValue = newValue + valueAppend;
        const percent = (value / total) * 100;
        const percentTag = displayPercent ? `style="--percent:'(${percent.toFixed(1)}%)';"` : '';
        keyString += `<li><span class="pieChartKeyCircle" style="--c:var(--${colour});"></span>
                         <span class="pieChartKeyLabel" data-i18n="${translation}">${label}</span>
                         <span class="pieChartKeyValue" ${percentTag}>${newValue}</span></li>`;
        // we need to draw the arc as a path using M, A, L and Z. 
        // We are offsetting the points by -50
        // since our viewBox is -50 to 50, so the centre of the circle is at 0,0
        // we need to draw the outer arc first, then the edge of the slice, then the inner arc
        // we need to close the path by drawing a line to the starting point
        // we also need to add the fill colour to the slice

        if (value == 0) continue;
        // if percent is 100, we want to draw a full circle
        if (percent == 100) {
            pieString += `<circle cx="0" cy="0" r="${outerRadius}" fill="var(--${colour})" />
                          <circle cx="0" cy="0" r="${innerRadius}" fill="var(--s-primary)" />`;
            continue;
        }
        const startAngle = currentRelCoords.length == 0 ? 270 : currentRelCoords[currentRelCoords.length - 1];
        const endAngle = startAngle + (value / total) * 360;
        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;
        const startX = outerRadius * Math.cos(startAngleRad);
        const startY = outerRadius * Math.sin(startAngleRad);
        const endX = outerRadius * Math.cos(endAngleRad);
        const endY = outerRadius * Math.sin(endAngleRad);
        const innerStartX = innerRadius * Math.cos(endAngleRad);
        const innerStartY = innerRadius * Math.sin(endAngleRad);
        const innerEndX = innerRadius * Math.cos(startAngleRad);
        const innerEndY = innerRadius * Math.sin(startAngleRad);
        currentRelCoords.push(endAngle);
        pieString += `<path d="M0,0
                     L${startX},${startY}
                       A${outerRadius},${outerRadius} 0 ${endAngle - startAngle > 180 ? 1 : 0},1 ${endX},${endY} 
                       L${innerStartX},${innerStartY} 
                       A${innerRadius},${innerRadius} 0 ${endAngle - startAngle > 180 ? 1 : 0},0 ${innerEndX},${innerEndY} Z" fill="var(--${colour})" 
                       stroke="var(--s-primary)" stroke-width="2"
                       />`;
    }
    keyString += `</ol>`;
    pieString += `</svg>${keyString}</div>`;
    return pieString;
}

function verticalBarChartString(data, keys, title, displayTotals = false, displayKey = true) {
    // create a vertical bar chart, this is a chart that has bars placed along an axis
    // the bars are coloured based on the data, 
    // the data should be formatted like this: {$axisLabel: [value1, value2 ...], axisLabel2: [value1, value2 ...]...}
    // each axisLabel should have a list of values, all values should be used as bars and should be displayed over each other
    // the keys should be an array of the keys for the values in the data like {axisLabel1: color1, axisLabel2: color2 ...}
    // the title is a string that is added to the title of the card
    // if displayTotals is true, then we should display the total of each axisLabel under the bar
    // if displayKey is true, then we should display a key for the chart
    let barString = `<div class="verticalBarChart">`;
    if (title) {
        barString += `<h3>${title}</h3>`;
    }
    barString += `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">`;
    const axisLabels = Object.keys(data);
    const axisValues = Object.values(data);
    const axisKeys = Object.keys(keys);
    const axisColors = Object.values(keys);
    const axisCount = axisLabels.length;
    const barWidth = 100 / axisCount;
    const barGap = 1;
    const barWidthMinusGap = barWidth - barGap;
    const barHeight = 80;
    const barMax = Math.max(...axisValues.flat());

    for (let i = 0; i < axisCount; i++) {
        const axisLabel = axisLabels[i];
        const axisValue = axisValues[i];
        const axisKey = axisKeys[i];
        const barX = i * barWidth;
        for (let j = 0; j < axisValue.length; j++) {
            const barHeightPercent = (axisValue[j] / barMax) * 100;
            const axisColor = axisColors[j];
            const barY = 100 - barHeightPercent;
            barString += `<rect x="${barX}" y="${barY}" width="${barWidthMinusGap}" height="${barHeightPercent}" fill="var(--${axisColor})" class="bar-${j}" />`;
            // we should add the axisLabel to the bars, and rotate it so that it is readable
            // to get it on the bar correctly we need to align the end of the text with the end of the bar
            barString += `<text x="${barX + barWidthMinusGap / 2}" y="105" fill="black" font-size="0.2em" text-anchor="middle" transform="rotate(90 ${barX + barWidthMinusGap / 2} 105)">${axisLabel}</text>`;
        }
    }

    barString += `</svg>`;
    if (displayKey) {
        barString += `<ol class="verticalBarChartKey">`;
        for (const key in keys) {
            barString += `<li><span class="verticalBarChartKeyCircle" style="--c:var(--${keys[key]});"></span>
                            <span class="verticalBarChartKeyLabel" data-i18n="opensec.${key}">${key}</span></li>`;
        }
        barString += `</ol>`;
    }
    barString += `</div>`;

    return barString;
}

function starChartString(score, outOf, colourMe = false, averageScore = false) {
    // Create a series of stars that represent the score, the stars are coloured based on the score
    // we allow for divisions of stars so we should create 2 bars, one grey and one black/coloured
    // then we should put our stars in a mask that is the same width as the bar to then mask off the bar 
    // if averageScore is true, then we draw a star with a stroke at the star where the average score is
    // if colourMe is true, then we use our colour scheme to colour the stars

    let scoreNum = (score / outOf) * 100;
    if (typeof scoreNum != "number") scoreNum = 0;
    const viewBoxDimentions = 100;
    const numberOfStars = outOf;
    const adjustedScoreColor = Math.floor(scoreNum / 10);
    let averageScoreString = "<path d='";
    let averageScoreNum = 0;
    let starString = `<div class="starChart">
    <svg viewBox="-10 0 ${viewBoxDimentions} 20" xmlns="http://www.w3.org/2000/svg">`;
    // first the bars
    let fill = colourMe ? `var(--score-${adjustedScoreColor})` : "black";
    // then the stars, opening the mask first
    starString += `<mask id="starMask" x="0" y="0" width="100" height="32">`;
    if (averageScore) {
        averageScoreNum = Math.ceil(averageScore / outOf)
    }
    const numberOfPoints = 5;
    const outerRadius = 10;
    const innerRadius = 4;
    for (let i = 0; i < numberOfStars; i++) {
        // we want to place the stars in a row, so we need to calculate the x and y
        const offsetx = i * 20;
        const offsety = 10;
        // we want to draw a star, so we need to calculate the points, we can do this by 
        // calulating the angle of each point, then using sin and cos to calculate the x and y
        // then do the same for the inner points
        // we then draw a line to the next point, and close the path
        let starPath = `M${offsetx},${offsety - outerRadius}`;
        if (averageScore && i == averageScoreNum) {
            averageScoreString += `M${offsetx},${offsety - outerRadius}`;
        }
        for (let j = 0; j < numberOfPoints; j++) {
            const angle = ((j * 2 * Math.PI) / numberOfPoints) - (Math.PI / 2);
            const x = outerRadius * Math.cos(angle);
            const y = outerRadius * Math.sin(angle);
            // then we add the inner point
            const innerAngle = ((j * 2 * Math.PI) / numberOfPoints) + (Math.PI / numberOfPoints) - (Math.PI / 2);
            const innerX = innerRadius * Math.cos(innerAngle);
            const innerY = innerRadius * Math.sin(innerAngle);
            starPath += ` L${x + offsetx},${y + offsety} L${innerX + offsetx},${innerY + offsety}`;
            if (averageScore && i == averageScoreNum) {
                averageScoreString += ` L${x + offsetx},${y + offsety} L${innerX + offsetx},${innerY + offsety}`;
            }
        }
        starPath += ` Z`;
        starString += `<path d="${starPath}" fill="white" />`;
        // starString += `<path d="${starPath}" fill="black" />`;


    }
    // the mask is closed and then we add the mask to the bars
    starString += `</mask>
    <rect x="-10" y="-10" width="100" height="32" fill="var(--score-unset)" mask="url(#starMask)" />
    <rect x="-10" y="-10" width="${scoreNum}" height="32" fill="${fill}" mask="url(#starMask)" />`;
    if (averageScore) {
        averageScoreString += ` Z' fill="none" stroke="black" stroke-width="1" />`;
        console.log(averageScoreString)
        starString += averageScoreString;
    }
    starString += `</svg></div>`;
    return starString;
}

function singleItemPieChartString(score, outOf, colourMe = false, displayScore = true) {
    // create a single item pie chart, this is a pie chart with a single slice, but shows
    // the score as a percentage of the total, the slice is coloured based on the score
    // and the rest of the circle is grey. The pie chart should be a full circle, but with a 
    // void in the middle that is masked out, and the score should be displayed in the middle
    // if it is set to true
    let scoreNum = (score / outOf) * 360;
    let innerRadius = 40;
    let outerRadius = 50;
    if (typeof scoreNum != "number") scoreNum = 0;
    const adjustedScoreColor = Math.floor(scoreNum / 36);
    console.log(adjustedScoreColor)
    let pieString = `<div class="singleItemPieChart"><svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">`;
    // First we should draw the mask, which is just a black circle
    pieString += `<mask id="pieMask" x="-50" y="-50" width="100" height="100">
                    <circle cx="0" cy="0" r="1000" fill="white" />
                    <circle cx="0" cy="0" r="${innerRadius}" fill="black" />
                    </mask>`;
    // then the grey circle
    pieString += `<circle cx="0" cy="0" r="${outerRadius}" fill="var(--score-unset)" mask="url(#pieMask)" />`;
    // then the coloured arc, starting from the top
    let endingX = 50 * Math.sin((scoreNum * Math.PI) / 180);
    let endingY = 50 * Math.cos((scoreNum * Math.PI) / 180);
    if (scoreNum === 180) {
        endingX = 0;
        endingY = 50;
    }
    bigArc = scoreNum > 180 ? 1 : 0;
    if (scoreNum === 360) {
        pieString += `<circle cx="0" cy="0" r="50" fill="var(--score-${adjustedScoreColor})" mask="url(#pieMask)"/>`;
    } else {
        pieString += `<path d="M0,-50 A50,50 0 ${bigArc},1 ${endingX},${endingY} L0,0 Z" fill="var(--score-${adjustedScoreColor})" mask="url(#pieMask)" />`;
    }

    pieString += `</svg>`
    // then the score in the middle
    if (displayScore) {
        pieString += `<span style="--score:'${score}';--outOf:'/ ${outOf}';" class="score">
        ${score}</span>`;
    }
    pieString += `</div>`;
    return pieString;

}


function addToolsSection() {
    if (!isSpeedcam) {
        titleBar.innerHTML += buttonTemplate("backButton", "justSendBack");
        titleBar.innerHTML += buttonTemplate("settingsButton", "loadSettings");
        titleBar.innerHTML += buttonTemplate("closeButton", "closeIV");
        titleBar.innerHTML += buttonTemplate("userButton", "loginButtonAction");
        titleBar.innerHTML += buttonTemplate("optionsButton", "loadSettings");
    }
    const currentDomain = document.getElementsByClassName("co-name")[0].innerText;
    backButton = document.getElementById('backButton');
    closeButton = document.getElementById('closeButton');
    settingsButton = document.getElementById('settingsButton');

    if (Url.get.app || /Mobile/i.test(navigator.userAgent)) {
        debugLogging("phone mode");
        body.classList.add("mobile");
        closeButton.style.visibility = "hidden";
    }
    if (!isSpeedcam && (/Mobile/i.test(navigator.userAgent) || Url.get.app)) {
        body.classList.add("optionsMode");
    }

    if (!Url.get.app && !isSpeedcam) {
        backButton.classList.add("show");
        closeButton.classList.add("closeExtention");
        document.getElementById("content").classList.add("desktop");
        body.classList.add("desktop");
    }

    if (!(Url.get.expanded && Url.get.app)) {
        return;
    }
    document.getElementById(Url.get.expanded).classList.add("expanded");
}

function addToModulePreview(container, moduleId, location, previewString) {
    try {
        currentModuleState[container].modules[moduleId][location].preview = previewString;
    } catch (e) {
        console.log(container, moduleId, location, previewString);
        console.log(e);
    }
}

function addToModuleContent(container, moduleId, location, contentString) {
    currentModuleState[container].modules[moduleId][location].content = contentString;
}

function checkAndSetModuleStateData(moduleId, label, data, miniMode = false) {
    if (miniMode) {
        if (currentMiniState[moduleId] == undefined) currentMiniState[moduleId] = {};
        currentMiniState[moduleId][label] = data;
    } else {
        if (currentModuleState[moduleId] == undefined) currentModuleState[moduleId] = {};
        currentModuleState[moduleId][label] = data;
    }
}


function moduleSocial(data, typeId, typeTranslate, typeLabel, subname = false, miniMode = false) {
    let linkCount = 0;
    checkAndSetModuleStateData(typeId, typeLabel, data, miniMode);
    let dataForTable = [];
    let countOfEachType = {};
    for (const label in data) {
        for (const item in data[label]) {
            linkCount++;
            countOfEachType[label] = countOfEachType[label] ? countOfEachType[label] + 1 : 1;
            const cleanLabel = label.replaceAll(" id", "").replaceAll(" username", "");
            const labelUrl = data[label][item].url;
            dataForTable.push([cleanLabel, label.replaceAll(" ", "_"), labelUrl]);
        }
    }
    const sourceUrl = `https://wikidata.org/wiki/${data.id}`;
    let previewTemplate = `<div class='previewScore previewSocial' data-source-url="${sourceUrl}" style="--number:'${linkCount}';" data-i18n="wikidata.socialmedia">`
    // for each type of link we want to add a logo to the preview, this will be done with css
    for (const type in countOfEachType) {
        if (countOfEachType[type] == 1) {
            previewTemplate += `<span class="socialIcon ${type.replaceAll(" ", "_").toLowerCase()}">
        ${type[0]}</span>`;

        } else {
            previewTemplate += `<span class="socialIcon ${type.replaceAll(" ", "_").toLowerCase()}" style="--count:'${countOfEachType[type]}';">
        ${type[0]}</span>`;
        }
    }
    previewTemplate += `</div>`;

    if (miniMode) {
        currentMiniState[typeId]._miniPreview = previewTemplate;
    } else {
        currentModuleState[typeId]._preview = previewTemplate;
    }
    return `${moduleStartString(typeId, typeTranslate, typeLabel, subname, false, "detailsSubString")} 
        ${dataToTable(dataForTable, false, "wikidata", true)}
        ${moduleCloseString(false, "social")}`;
}

function modulePolitical(data, miniMode = false) {
    const lang = "enlabel";
    const previewTemplate = `<div class='previewScore previewSubname' data-source-url="https://wikidata.org" style="--subname:'&'"><span class="ratingOutOf ratingText">@</span></div>`;
    return Object.keys(data).filter(label => data[label].length > 0).map(label => {
        const labelId = (label == "polalignment") ? "political-wikidata" : "politicali-wikidata";
        const actLabel = (label == "polalignment") ? "Political Alignments" : "Political Ideologies";

        checkAndSetModuleStateData(labelId, label, data[label], miniMode);

        let itemString = `${moduleStartString(labelId, `wikidata.${label}`, actLabel, false, " ", "fullBleed")}<div><ul>`;
        data[label].forEach(itemObj => {
            const itemLabel = itemObj.data[lang];
            const dataId = itemObj.dataId;
            const sourceLabel = itemObj.sourceLabels[lang];
            const miniSourceHref = `https://wikidata.org/wiki/${dataId}`;
            if (miniMode) {
                currentMiniState[labelId][label]._miniPreview = previewTemplate.replace("@", itemLabel).replace("&", sourceLabel);
            } else {
                currentModuleState[labelId][label]._preview = previewTemplate.replace("@", itemLabel).replace("&", sourceLabel);
            }
            itemString += `<li><h3>${itemObj.sourceLabels[lang]} <a class="spacelinks" href="${miniSourceHref}">${itemLabel}</a></h3>${miniSource(miniSourceHref)}</li>`;
        });
        itemString += `
        </ul> ${moduleCloseString(false, "political")} </section>
        `;
        return itemString;
    })
}

function modulePost(data, typeId, typeTranslate, typeLabel, dataURL, subname = false, miniMode = false) {
    const postContent = data.content;
    const dataLocationString = (data.uid) ? data.uid : false;
    checkAndSetModuleStateData(typeId, typeLabel, data, miniMode);
    knownPosts[dataLocationString] = data;
    knownPostsByLocation[data.location] = data;
    // ${moduleCloseString(true, true, "https://assets.reveb.la/#user", data.author)}
    return `
        ${moduleStartString(id = typeId, i18n = typeTranslate, label = typeLabel, subname = subname, scoreText = false, scoreClass = false, dataLoc = dataLocationString, tab = false)}
        <div class="postContent hideInSmall">${postContent}
        ${moduleCloseString(true, "post")}
        </section>`;
}

function moduleOpensecrets(container, data) {
    const { cycle_year, contributions_rank, lobbying_amounts, contributions_amount, lobbying_rank, bars, charts, osid, lobbycards, bill_most_code, bill_most_heading, bill_most_title, bill_most_url } = data;
    let htmlString = '';
    const sourceUrl = `https://www.opensecrets.org/orgs/name/summary?id=${osid}`;

    let dataToPlace = undefined;
    if (lobbying_amounts) {
        dataToPlace = lobbying_amounts.sort((a, b) => b[-1] - a[-1])[0];
    }
    if (!dataToPlace) {
        dataToPlace = cycle_year
    }
    const previewTemplate = `<div class='previewScore previewSecret' data-source-url="${sourceUrl}"><span class="ratingOutOf ratingText">${dataToPlace}</span></div>`;
    addToModulePreview(container, "opensecrets", data.location, previewTemplate);
    htmlString += '<p class="centeredRow" data-i18n="os.disclaimer"></p>';

    const idToColour = {
        "Lobbyistingov": "network-8",
        "Lobbyistnotingov": "network-5",
        "candidates": "network-10",
        "party_committees": "network-1",
        "leadership_pacs": "network-2",
        "outside_groups": "network-7",
        "527_groups": "network-4",
        "individuals": "network-6",
        "organizations": "network-5",
        "pacs": "network-2",
    }
    if (lobbycards.length > 0) {
        htmlString += "<h3 data-i18n='opensec.lobbying'> Lobbying </h3>"
        for (card of lobbycards) {
            htmlString += pieChartCardString([["Lobbyists who worked in government", "opensec.Lobbyistingov", card.held.count, idToColour["Lobbyistingov"]],
            ["Lobbyists who didnt work in government", "opensec.Lobbyistnotingov", card.notheld.count, idToColour["Lobbyistnotingov"]]], false, false, card.year, true, true);
        }
    }
    if (bill_most_heading) {
        const flavourText = `${bill_most_title} (${bill_most_code})`
        htmlString += `<p class="gRow"><span class="openSecBill">${bill_most_heading}</span><a href='${bill_most_url}'>${flavourText}</a></p>`;
    }
    if (cycle_year) {
        htmlString += `<p class="centeredRow">Data is true of the ${cycle_year} cycle</p> <table>`;
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
                    // chartdata is formatted like {"entity": x, "amount": y}
                    htmlString += pieChartCardString(chartData.map(x => [x.entity,
                    `opensec.${x.entity.replaceAll(" ", "_").toLowerCase()}`,
                    x.amount.replaceAll(",", "").replace("$", ""),
                    `${idToColour[x.entity.replaceAll(" ", "_").toLowerCase()]}`])
                        , "$", false, chartLabel, true, true);
                }
            }
        }
        if (charts) {
            // htmlString += `<h4><span style="background-color: rgba(240,50,50,.75)!important;" data-i18n="opensec.republicans">Republicans</span></h4>`;
            for (const chartType in charts) {
                const house = charts[chartType];
                if (!Object.keys(house) || house == undefined) continue;
                newData = {};
                for (const year in house.all_data) {
                    newData[year] = [house.all_data[year].Dems, house.all_data[year].Repubs];
                }

                htmlString += verticalBarChartString(newData, { "democrats": "network-3t", "republicans": "network-9t" }, chartType, true, true);
            }
        }
    }
    addToModuleContent(container, "opensecrets", data.location, htmlString);
}


function moduleWbm(container, data) {
    const sourceUrl = "https://worldbenchmarkingalliance.org/research/"
    for (const module in data.modules) {
        const { file } = data.modules[module];
        const trans = file.split("_").slice(1).join("-").toLowerCase();
        const year = file.split("_")[0];
        const fileName = file.split("_").slice(1).join(" ");
        const dataLocationString = data.location + "-" + trans;
        const tempDataObj = structuredClone(data.modules[module])
        tempDataObj.source = data.source;
        tempDataObj.year = year;
        tempDataObj.location = dataLocationString;
        tempDataObj.sourceHref = sourceUrl;
        tempDataObj.subname = year
        tempDataObj.trans = "wbm." + trans;
        addModuleToState(container, "wbm", dataLocationString, tempDataObj);
        const tableData = Object.keys(data.modules[module])
            .filter(item => !["file", "Company Scorecard", "Total Score (Raw)"].includes(item))
            .map(item => {
                const [itemLabel, itemOutOf] = item.split("(").map(x => x.trim().replace(")", ""));
                const itemTrans = itemLabel.trim().replaceAll(" ", "-").replaceAll(':', "").toLowerCase();
                const outOf = itemOutOf || '';
                const score = data.modules[module][item];
                if (item.includes("Total Score") && !item.includes("Raw")) {
                    // const percent = (Number(score) / Number(outOf)) * 100;
                    const previewTemplate = `<div class='previewScore previewSubname' data-source-url="${sourceUrl}">
                    ${singleItemPieChartString(score, outOf, true, true)}</div>`;
                    addToModulePreview(container, "wbm", dataLocationString, previewTemplate);
                }
                tempScore = Number(score);
                if (!tempScore)
                    return [itemLabel, itemTrans, score, outOf];
                return [itemLabel, itemTrans, Number(score).toFixed(1).toString().replace(".0", ''), outOf];
            });

        const htmlString = `${dataToTable(tableData, true, "wbm")}`
        addToModuleContent(container, "wbm", dataLocationString, htmlString);
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

function moduleLobbyEu(container, data) {
    const sourceUrl = `https://lobbyfacts.eu/datacard/org?rid=${data.eu_transparency_id}`;
    const previewTemplate = `<div class='previewCont' ><span class='previeuwTitle' data-source-url='${sourceUrl}'>${data.calculated_cost.toLocaleString()}</span></div>`
    addToModulePreview(container, "lobbyeu", data.location, previewTemplate);
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
    if (data.category != "" && industryAverageData.lobbyfacts != undefined) {
        const averages = industryAverageData.lobbyfacts.category;
        for (const item in averages) {
            if (averages[item].hasOwnProperty(data.category)) {
                dataForTable.push([`${item} ${data.category}`, "industry_average", averages[item][data.category], false])
            }
        }

    }
    addToModuleContent(container, "lobbyeu", data.location, dataToTable(dataForTable, false, "lb"))
}

function moduleGoodOnYou(container, data) {
    const sourceUrl = `https://directory.goodonyou.eco/brand/${data.location.split("/")[1]}`;
    const previewTemplate = `<div class='previewScore' data-source-url="${sourceUrl}">${thickLineGraphString("Rating", data.rating, 5, true, false, false, 80, "/5", false)}</div>`;
    addToModulePreview(container, "goodonyou", data.location, previewTemplate);
    const rating = (data.rating / 5) * 100;
    const lrating = Math.floor(data.labourRating / 4);
    const arating = Math.floor(data.animalRating / 4);
    const erating = Math.floor(data.environmentRating / 4);
    const categories = data.categories.map(x => x.name.toLowerCase());
    const dataForTable = [
        ["Labour Rating", "lr", lrating, 5],
        ["Animal Rating", "ar", arating, 5],
        ["Environment Rating", "er", erating, 5],
        ["Price", "p", data.price, 4],
    ]
    // We want to put the data for table in lineGraphString instead of the dataToTable
    let lineGraphTableString = '';
    for (const item in dataForTable) {
        lineGraphTableString += lineGraphString(dataForTable[item][0], dataForTable[item][2], dataForTable[item][3], true, false, false, 80, dataForTable[item][3], false)
    }
    if (industryAverageData["goodonyou"].category != undefined && false) {
        const averages = industryAverageData["goodonyou"].category;
        for (const category in categories) {
            for (const item in averages) {
                if (averages[item].hasOwnProperty(categories[category])) {
                    averages_for_category = averages[item][categories[category]]
                    formatted_averages_for_category = [
                        [`Ethical Rating Average for ${categories[category]}`, "ra", Math.floor(averages_for_category["ethicalRating"] / 4), 5],
                        [`Environment Rating Average for ${categories[category]}`, "era", Math.floor(averages_for_category["environmentRating"] / 4), 5],
                        [`Labour Rating Average for ${categories[category]}`, "lra", Math.floor(averages_for_category["labourRating"] / 4), 5],
                        [`Animal Rating Average for ${categories[category]}`, "ara", Math.floor(averages_for_category["animalRating"] / 4), 5],
                        [`Price Average for ${categories[category]}`, "pa", Math.floor(averages_for_category.price), 4]
                    ]
                    for (const average in formatted_averages_for_category) {
                        dataForTable.push(formatted_averages_for_category[average])
                    }
                }
            }
        }
    }
    addToModuleContent(container, "goodonyou", data.location, lineGraphTableString)
}

function moduleBcorp(container, data) {
    const sourceUrl = `https://www.bcorporation.net/en-us/find-a-b-corp/company/${data.slug}`
    const iconUrl = `${dataURL}/icon/bcorp.svg`;
    const previewTemplate = `<div class='previewScore' data-source-url="${sourceUrl}"> <span class="invert bcorp-logo"><img src="${iconUrl}"></span>`;
    const dataForTable = [
        ["Governance", "governance", data.Governance, false],
        ["Workers", "workers", data.Workers, false],
        ["Community", "community", data.Community, false],
        ["Environment", "environment", data.Environment, false],
        ["Customers", "customers", data.Customers, false],
    ]
    let industryAverage = false;
    addToModulePreview(container, "bcorp", data.location, previewTemplate);
    if (industryAverageData.bcorp) {
        const averages = industryAverageData.bcorp["industry"];
        for (const item in averages) {
            if (averages[item].hasOwnProperty(data.industry)) {
                dataForTable.push([`${item} ${data.industry}`, "industry_average", averages[item][data.industry], "140+"])
                industryAverage = averages[item][data.industry];
            }
        }
    }
    const adjustedMax = data.score > 140 ? data.score : 140;
    const htmlString = `${dataToTable(dataForTable, true, "bcorp")}
            ${lineGraphString("Total Score", data.score, adjustedMax, true, industryAverage, false, 80, "140+",
        [[`Average for ${data.industry}`, ""], ["Qualifies for B Corp Certification", "bcorp.certification"]])}`

    addToModuleContent(container, "bcorp", data.location, htmlString);
}

function moduleYahoo(container, data) {
    const sourceUrl = `https://finance.yahoo.com/quote/${data.symbol}/sustainability/`
    const previewTemplate = `<div class='previewScore' data-source-url="${sourceUrl}">
        ${segmentedArcString("ESG", data.totalEsg, 40, true, 5, false, true, true)}
    </div>`;
    addToModulePreview(container, "yahoo", data.location, previewTemplate);
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
    let averageRating = false;
    if (industryAverageData["yahoo"] != undefined) {
        const averages = industryAverageData.yahoo["industry"];
        for (const item in averages) {
            if (averages[item].hasOwnProperty(data.peerGroup)) {
                // to 2 decimal places
                averageRating = Math.round(averages[item][data.peerGroup] * 100) / 100;
                dataForTable.push([`${item} ${data.peerGroup}`, "industry_average", averageRating, "40+"])
            }
        }
    }
    const htmlString = `${lineGraphString("Total ESG", data.totalEsg, 40, true, averageRating, false, 80, "40+", false, false, true)}
        ${dataToTable(dataForTable, true, "esg")}`

    addToModuleContent(container, "yahoo", data.location, htmlString);
}

function moduleTrustScore(container, data) {
    const sourceUrl = `https://trustscam.com/${data.source}`
    const previewTemplate = `<div class='previewScore previewSubname' data-source-url="${sourceUrl}">
                            <span class="trustText" style="--outOf:'/ 100';">${data.score}
                            <span class="trustSymbol ${data.rating}"></span></span>
                            </div>`;
    const trustText = {
        "success": { "text": "This website is considered SAFE", 
                    "colour": "--score-10", 
                    "i18n": "trust.safe", 
                    "chosen": false,
                    "i18ndesc": "trust.safedesc" },
        "neutral": { "text": "This website is considered NEUTRAL",
                    "colour": "--score-unset", 
                    "i18n": "trust.neutral", 
                    "chosen": false,
                    "i18ndesc": "trust.neutraldesc" },
        "warning": { "text": "This website is flagged with a WARNING", 
                    "colour": "--score-2",
                    "i18n": "trust.warning", 
                    "chosen": false,
                    "i18ndesc": "trust.warningdesc" },
        "danger": { "text": "This website is deemed DANGEROUS", 
                    "colour": "--score-10",
                    "i18n": "trust.dangerous", 
                    "chosen": false,
                    "i18ndesc": "trust.dangerousdesc" },
    }
    // we will do this a bit like moduleTosdr where we have a list of ratings and then we will add the text
    // to the module content
    trustText[data.rating].chosen = true;
    const htmlString = Object.keys(trustText).map(rating => {
        return `<div class="trustRating ${trustText[rating].chosen ? "chosen" : ""}" style="--t:var(${trustText[rating].colour});">
            <span class="trustSymbol ${rating}"></span>
            <p data-i18n="${trustText[rating].i18ndesc}">${trustText[rating].text}</p>
        </div>`
    }).join("");


    addToModulePreview(container, "trustscore", data.location, previewTemplate);
    addToModuleContent(container, "trustscore", data.location, htmlString);

}

function moduleMbfc(container, data) {
    const { questionable, source, bias, popularity, credibility, reporting, description } = data;
    const sourceUrl = `https://mediabiasfactcheck.com/${source}`
    const previewTemplate = `<div class='previewScore' data-source-url="${sourceUrl}"><span class="ratingOutOf ratingText" data-i18n="bias.@">@</span></div>`;
    addToModulePreview(container, "mbfc", data.location, previewTemplate.replaceAll("@", bias))
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
    const htmlString = `<p class="genericText">${description}</p>
                ${dataToTable(dataForTable, false, "bias")}
                ${questionableString}`
    addToModuleContent(container, "mbfc", data.location, htmlString);
}

function moduleGlassdoor(container, data) {
    const score = parseFloat(data.glasroom_rating.ratingValue);
    const dataForTable = [
        //["Rating Count", "ratingCount", data.glasroom_rating.ratingCount, false],
        ["Company Type", "companyt", data.type, false],
        ["Headquarters", "headquarters", data.headquarters, false],
        ["Founded", "founded", data.founded, false],
        ["Industry", "industry", data.industry, false],
        ["Revenue", "revenue", data.revenue, false],
        ["Size", "size", data.size, false],
    ]
    let averageRating = false;
    if (industryAverageData["glassdoor"] != undefined) {
        const averages = industryAverageData["glassdoor"]["industry"];
        for (const item in averages) {
            if (averages[item].hasOwnProperty(data.industry)) {
                dataForTable.push([`${item} ${data.industry}`, "industry_average", averages[item][data.industry], false])
                averageRating = averages[item][data.industry];
            }
        }
    }

    const previewTemplate = `<div class='previewScore' data-source-url="${data.url}">
        ${dotGridChartString("glassdoor", score, 5, true, 10, averageRating, "large")}
        ${dotGridChartString("glassdoor", score, 5, true, 5, averageRating, "small")}
        </div>`;

    addToModulePreview(container, "glassdoor", data.location, previewTemplate)
    totalString = `<div class="centeredRow"><span class="num">${data.glasroom_rating.ratingCount} </span><span data-i18n="common.ratings">Ratings</span> </div>`

    const htmlString = `${totalString}
            ${dataToTable(dataForTable, false, "glassdoor")}
            ${lineGraphString("Rating", score, 5, true, averageRating, false, false, false, [[`${data.industry} Average`, "glassdoor.industry_average"]])}`

    addToModuleContent(container, "glassdoor", data.location, htmlString);
}

function moduleTosdr(container, data) {
    const sourceUrl = `https://tosdr.org/en/service/${data.id}`
    const ratingsColours = {
        "A": "--score-10",
        "B": "--score-8",
        "C": "--score-5",
        "D": "--score-2",
        "E": "--score-0",
        "X": "--score-unset"
    }
    const ratingsTextColour = {
        "A": "var(--c-primary)",
        "B": "var(--c-primary)",
        "C": "var(--c-primary)",
        "D": "var(--s-primary)",
        "E": "var(--s-primary)",
        "X": "var(--s-primary)"
    }
    const ratings = ["A", "B", "C", "D", "E", "X"];
    const previewTemplate = `<div class='previewScore' data-source-url="${sourceUrl}">
                            <span class="previewTos tosScore" style="--t:${ratingsTextColour[data.rated]};--c:var(${ratingsColours[data.rated]});">
                            ${data.rated}</span></div>`;
    addToModulePreview(container, "tosdr", data.location, previewTemplate);
    let ratingsString = `<ol class="tosRatings">`
    for (const rating in ratings) {
        ratingLetter = ratings[rating]
        ratingsString += (ratingLetter == data.rated) ? `<li style='--t:${ratingsTextColour[ratingLetter]};' class='tosActive'>` : "<li>"
        ratingsString += `<span class="tosScore" style="--c:var(${ratingsColours[ratingLetter]});">${ratingLetter}</span>
                            <span class="tosDesc" data-i18n="tos.${ratingLetter.toLowerCase()}"></span></li>`
    }
    ratingsString += `</ol>`
    addToModuleContent(container, "tosdr", data.location, ratingsString);
}

function moduleTrustpilot(container, data) {
    const sourceUrl = `https://trustpilot.com/review/${data.domain}`
    let starString = ''
    const numberOfStars = Math.floor(data.score);
    const remainingStar = data.score - numberOfStars;
    for (let i = 0; i < 5; i++) {
        let division = (numberOfStars > i) ? 1 : 0;
        division = (numberOfStars == i) ? remainingStar : division;
        starString += `<span class="coolStar" style="--division:${division};"></span>`
    }
    // const previewTemplate = `<div class='previewScore'>
    //                             <div class="stars" style="--rating:@;">${starString}</div>
    //                             </div>`;
    const previewTemplate = `<div class='previewScore' data-source-url="${sourceUrl}">${starChartString(data.score, 5, true, false)}</div>`;
    addToModulePreview(container, "trustpilot", data.location, previewTemplate)
    totalString = `<div class="centeredRow"><span class="num">${data.reviews.total} </span><span data-i18n="common.reviews">Reviews</span> </div>`
    const dataForTable = [
        // ["Total Reviews", "total", data.reviews.total, false],
        ["One Star", "one", data.reviews.oneStar, false],
        ["Two Star", "two", data.reviews.twoStars, false],
        ["Three Star", "three", data.reviews.threeStars, false],
        ["Four Star", "four", data.reviews.fourStars, false],
        ["Five Star", "five", data.reviews.fiveStars, false],
    ]
    if (industryAverageData["trust-pilot"]) {
        const averages = industryAverageData["trust-pilot"].category;
        for (const item in averages) {
            if (averages[item].hasOwnProperty(data.bottomLevelCategory) || averages[item].hasOwnProperty(data.topLevelCategory)) {
                dataForTable.push([item, "industry_average", averages[item][data.domain], false])
            }
        }
    }
    const htmlString = `${lineGraphString("Reviews", data.score, 5, true, false, extraInfo = `${data.reviews.total} reviews`)}
            ${totalString}
            ${dataToTable(dataForTable, false, "trustpilot")}`

    addToModuleContent(container, "trustpilot", data.location, htmlString);
}


function moduleSimilar(container, data) {
    const sourceUrl = `https://similarsites.com/site/${data.domain}`
    let similarString = '<ol>'
    let currentMostSimilar = [false, false]
    for (site in data.similar) {
        ssite = data.similar[site].s
        p = Math.floor(data.similar[site].p * 100)
        if (currentMostSimilar[1] < p) {
            currentMostSimilar = [ssite, p]
        }
        similarString += `<li class="similar-site">
        <a target="_blank" alt="${ssite}" href="https://${ssite}">
            ${ssite}</a><div class="percent">${p}</div></li>`;
    }
    similarString += `</ol>`
    const previewTemplate = `<div class='previewScore previewSubname previewSimilar' data-source-url="${sourceUrl}" style="--subname:'${currentMostSimilar[0]}'"><span class="ratingOutOf" style="--outOf:'%';">${currentMostSimilar[1]}</span></div>`;
    addToModulePreview(container, "similar", data.location, previewTemplate)
    htmlString = `<div class="fullBleed"><div>
    <section id="similar-sites" class="hideInSmall">
    ${similarString}
    </section>`
    addToModuleContent(container, "similar", data.location, htmlString);
}

async function addLocalModule(container = undefined, type = undefined, data = undefined) {
    return
    if (!type || !data) return;
    if (!(type in types)) return;

    const { id, translate, label } = types[type];
    if (currentModuleState[id] == undefined) currentModuleState[id] = {};
    switch (type) {
        case "social":
            return moduleSocial(data, id, translate, label, false, miniMode);
        case "political":
            return modulePolitical(data, id, translate, label, false, miniMode);
        case "post":
            return modulePost(data, id, translate, label, dataURL, false, miniMode);
        default:
            return '';
    }
}

function addModuleToState(container, type, location, data) {
    if (currentModuleState[container] == undefined) currentModuleState[container] = { "modules": {} };
    if (currentModuleState[container].modules[type] == undefined) currentModuleState[container].modules[type] = {};
    currentModuleState[container].modules[type][location] = {
        data,
        content: '',
        source: data.source || '',
        preview: '',
        sourceHref: data.sourceHref || '',
    }
}
async function addModule(container = undefined, type = undefined, data = undefined, urlString = undefined) {
    if (type == undefined || urlString == undefined) return;
    if (!urlString) {
        addLocalModule(container, data, type);
        return
    }
    // needs some mechanic for caching when we switch to graph mode
    const dataLocationString = urlString.replace(dataURL, "").replace("/ds/", "").replace(".json", "");
    let moduleResponse = false;
    if (dataObjectDictionary[dataLocationString]) {
        moduleResponse = dataObjectDictionary[dataLocationString];
    } else {
        const moduleData = await fetch(urlString);
        moduleResponse = await moduleData.json()
        dataObjectDictionary[dataLocationString] = moduleResponse;
    }
    if (moduleResponse == undefined) return;
    if (moduleResponse.error) return;
    if (!(type in types)) { return; }
    const typeDef = types[type]
    let tab = false;
    // Genericising needed
    addModuleToState(container, type, moduleResponse.location, moduleResponse);
    functionDict = {
        "tosdr": moduleTosdr,
        "opensecrets": moduleOpensecrets,
        "wbm": moduleWbm,
        "cta": moduleCta,
        "lobbyeu": moduleLobbyEu,
        "goodonyou": moduleGoodOnYou,
        "bcorp": moduleBcorp,
        "yahoo": moduleYahoo,
        "trustscore": moduleTrustScore,
        "mbfc": moduleMbfc,
        "glassdoor": moduleGlassdoor,
        "trustpilot": moduleTrustpilot,
        "similar": moduleSimilar,
    }
    functionDict[type](container, moduleResponse);
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
    const availableStyles = ['bold', 'italic', 'underline', 'strike', 'link', 'code', 'quote']
    floatDiag.innerHTML = `
    <div style="display:none;" id="diag_tag">${plocation}</div><br/>
    <div class="commentBox">
        <div class="commentButtons">
        `
    for (const style of availableStyles) {
        floatDiag.innerHTML += `<div onclick="commentStyle('${style}')" 
                                    class="commentStyleButton comment${style.charAt(0).toUpperCase() + style.slice(1)}">
                                    ${style.charAt(0).toUpperCase() + style.slice(1)}</div>`
    }
    floatDiag.innerHTML += `</div>
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
        locationString = pageLocation ? `db / ${pageLocation} ` : hash;
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
        console.debug(`Data: ${data} `);
    } catch (e) {
        console.error(`Failed to send message: ${type} `);
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
const buttonString = ''
const settingsOffset = settings.firstElementChild.clientHeight;

function setBack(x = false) {
    return
}

function toggleButton(buttonId) {
    buttonState[buttonId] = !buttonState[buttonId];
    const label = document.getElementById(`label - ${buttonId} `);
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
        floatDiag.textContent = `${id} min:${defaults.min} max:${defaults.max} `
        floatDiag.innerHTML = `
        <div id = "diag_type" > ${defaults.type}</div><br/>
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
                htmlString += `< button id = "label-${str}" onclick = "toggleButton('${str}')" class="pushedButton" > ${str}</button> `;
                buttonState[str] = true;
            } else {
                htmlString += `< button id = "label-${str}" onclick = "toggleButton('${str}')" > ${str}</button> `;
                buttonState[str] = false;
            }

        });
        floatDiag.innerHTML = `
        <div id = "diag_type" > ${defaults.type}</div><br/>
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
            const x2 = x.length > 1 ? `.${x[1]} ` : '';
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
    return
    debugLogging("notificationsDraw", settingsState["notifications"])
    if (settingsState["notifications"]) {
        for (const tag of availableNotifications) {
            if (document.getElementById(`${tag} -bell`) == null) {
                currEl = document.querySelector(`[data-id="${keyconversion[tag]}"]`);
                toggleContainer = document.createElement("div");
                toggleContainer.classList.add("tagToggleContainer");

                toggleDialog = `<img id="${tag}-dialog" class="notificationDialog" onclick="notificationDialog(this)" >
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

function settingTemplate(id, i18n, title, state = "skip", extraClass = "") {
    const el = document.createElement("div");
    el.id = id
    el.classList.add("switchItem")
    el.innerHTML = `
        <h2 data-i18n="${i18n}"> ${title}</h2>
            <label class="switch ${extraClass}">
                <input type="checkbox">
                    <span class="slider round"></span>
            </label> `
    if (state != "skip") {
        el.getElementsByTagName("input")[0].checked = state;
    }
    settings.appendChild(el)
}

function addLanguagePicker() {
    const languagePicker = document.createElement("label");
    languagePicker.classList.add("languageSelect")
    let languagePickerOptions = `<option value="-"> - </option>`
    for (lang in languages) {
        languagePickerOptions += `<option value="${languages[lang]}" > ${languages[lang].toUpperCase()}</option> `
    }
    languagePicker.innerHTML = `<h2 data-i18n="common.language" > Language</h2>
        <select id="langselect" title="Language Picker">${languagePickerOptions}</select>`
    return languagePicker
}

function toggleBodyStyle(style) {
    body.classList.toggle(style);
}


function addSettings() {
    // close settings button 
    settings.appendChild(document.createElement("div")).outerHTML = buttonTemplate("closeSettingsButton", "closeSettings");

    // Language Picker
    settings.appendChild(addLanguagePicker())

    // Settings options
    const availableSettings = [
        ["onScreen", "Keep dashboard on screen", ''],
        ["permaDark", "Dark Mode", 'sun'],
        ["bobbleDisable", "Disable Bobble", ''],
        ["debug-banner", "Debug Mode", ''],
        //["allowDisableModules", "Allow Disabling Modules", ''],
        ["singleColumn", "Single Column Layout", 'grid'],
        ["monoChrome", "Monochrome", 'color'],
        //["externalPosts-banner", "Experimental Features"]
    ]
    for (const setting in availableSettings) {
        settingTemplate(availableSettings[setting][0],
            `settings.${availableSettings[setting][0]}`,
            availableSettings[setting][1],
            settingsState[availableSettings[setting][0]], availableSettings[setting][2])
    }

    // Dismissed Notifications
    const dissmissedNotifications = document.createElement("div");
    dissmissedNotifications.id = "dissmissedNotifications";
    dissmissedNotifications.innerHTML = `<h2> You have dismissed the following</h2>
        <ul style="display:inline;" id="dismissedContainer"></ul>`
    dissmissedNotifications.style.display = "none";
    dissmissedNotifications.classList.add("switchItem");
    settings.appendChild(dissmissedNotifications);

    // Notifications
    const notifications = document.createElement("div");
    notifications.id = "notifications-shade";
    notifications.classList.add("switchItem");
    notifications.innerHTML = `<h2 data-i18n="settings.notifications"> Notifications</h2>
        <div id="notificationsContainer" style="display:flex;">
            <img id="notificationsCache" style="display:none;width:24px;height:24px;position:relative;transform:translate(-20px,13px);">
                <label class="switch bell"><input type="checkbox"><span class="slider round"></span></label></div></div> `
    settings.appendChild(notifications);

    if (settingsState["notifications"]) {
        cacheButton = document.getElementById("notificationsCache");
        cacheButton.style.display = "block";
        tagList = settingsState["notificationsTags"] || "";
    }

    const priorityList = document.createElement("div");
    priorityList.id = "priority-list";
    listString = ''
    wbmListString = '<details><summary data-i18n="settings.wbm">WorldBenchmark</summary><div id="sortlist-wbm">'
    for (item in translate) {
        if (!item.startsWith("wbm")) {
            listString += `<li data-id="${item}" ><i class="priority-list-handle"></i><span>${translate[item]}</span></li> `
        } else if (item == "wbm") {
            wbmListString += `</div></details> `
            listString += `<li data-id="${item}" ><i class="priority-list-handle"></i><span>${translate[item]}</span>${wbmListString}</li> `
        } else {
            wbmListString += `<div data-id="${item}" ><i class="priority-list-handle-wbm"></i><span>${translate[item]}</span></div> `
        }
    }
    priorityList.innerHTML = `
        <h2 data-i18n="settings.priorityTitle" > Prioritise Modules</h2>
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
        return;
    }
    settings.style.bottom = "0";
    settings.style.top = `${settingsOffset} `;
    settings.firstElementChild.style.top = "0";
    coName.style.opacity = "0%";
    document.documentElement.style.overflow = "hidden";
    notificationsDraw();
    send_message("IVClicked", "settings");
}

function loadNetworkGraph(x) {
    toggleBodyStyle("graphOpen");
    selectANodeCy(x, 1000)
    return
    const networkGraph = document.getElementById('graph-container');
    networkGraph.classList.add("show");

    if (Url.get.app || isSpeedcam) {
        noOpen = true;
    } else {
        const titleBar = document.getElementById('titlebar');
        titleBar.style.transform = "translateY(-100%)";
    }
    graphButtons.style.top = "12px";
    window.scrollTo(0, 0);
    send_message("IVClicked", "antwork");
    resetNodeStyles();
    layout.start();
}

function closeNetworkGraph() {
    toggleBodyStyle("graphOpen");
    document.getElementById('graph-box').childNodes[0].removeAttribute("open")
    return
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
    body.classList.add('somethingIsOpen');
    noOpen = true;
    backButton.style.backgroundColor = 'var(--c-background)';
    const element = document.getElementById(x);
    element.classList.add('expanded');
    explode();
    setBack(`closeGenericPage("${x}")`);
}

function closeGenericPage(x) {
    document.getElementById(x).classList.remove('expanded');
    body.classList.remove('somethingIsOpen');
    noOpen = false;
    unexplode();
    setBack();
}

function closeSettings() {
    const settingsButton = document.getElementById('settingsButton');
    document.getElementsByClassName('co-name')[0].style.opacity = "100%";
    if (Url.get.app || isSpeedcam) {
        backButton.style.order = "2";
    }
    closeButton.classList.remove("hide");
    settings.style.bottom = "";
    body.classList.remove("settingsOpen");
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

function interact(el) {
    console.log(el)
    closeElement(el);
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
        debugLogging(`setting ${type} ${settingsState[type]} `)
    }
    settingsStateChange()
}


// {value: items[it].value, label: items[it].innerHTML}
const singleColumnModulesDesktop = [];
var excludeSingleColumnModulesApp = [];
var singleColumnModulesApp = defaultOrder
let recalculating = false
function recalculateList(selector = undefined) {
    console.log("recalc")
    if (recalculating) return
    recalculating = true
    masonry = false;
    console.log("recalc")
    debugLogging("recalculateList")
    if (selector == undefined) {
        selector = "content"
        if (isSpeedcam) {
            selector = "speedcontent"
        }
    }
    // remove all the blanks
    const container = document.getElementById(selector);
    container.querySelectorAll(".blank").forEach(x => x.remove());
    container.classList.add("invisible-container");
    let currentModules;
    // get the current modules
    currentModules = Array.from(container.children).map(x => x.dataset.module);
    if (container.classList.contains("masonary")) {
        masonry = true;
        currentModules += Array.from(container.querySelectorAll(".leftColumn .contentSection, .rightColumn .contentSection")).map(x => x.dataset.module)
    }
    // get if any of the current modules are open
    openModules = Array.from(container.querySelectorAll(".contentSection")).filter(x => x.firstChild.open).map(x => x.dataset.module);
    let propertyOrder = defaultOrder;
    try {
        propertyOrder = $("#sortlist").sortable('toArray');
    } catch {
    }
    let wbmOrder = defaultOrderWbm;
    try {
        wbmOrder = $("#sortlist-wbm").sortable('toArray');
    } catch {
    }

    missingModules = defaultOrder.filter(x => !currentModules.includes(x))
    extraModules = currentModules.filter(x => !defaultOrder.includes(x))

    // we need to make 2 sets of lists one that is 1 column and one that is 2 column
    // we need to make sure that both lists keep the same order as propertyOrder
    // theses lists will be used as the grid-template-areas for the css
    // we need to make sure that the lists are the same length
    // current state has the modules that are currently in the container 

    orderedModules = []
    // since we might have extra modules we need to add those to the 
    // ordering list too, but we should spread them out evenly.

    if (extraModules.length > 0) {
        // insert the extra modules into the propertyOrder
        for (const module of extraModules) {
            propertyOrder.splice(propertyOrder.indexOf(module), 0, module)
        }
    }
    // we also need a css rule for each module so we can set the grid-area
    // we can mark off if it has been added by checking agains the currentModuleState
    if (currentModuleState[selector] !== undefined) {
        for (const type of Object.keys(currentModuleState[selector].modules)) {
            if (currentModuleState[selector].cssRules == undefined) {
                currentModuleState[selector].cssRules = []
            }
            if (currentModuleState[selector].cssRules.includes(type)) {
                continue
            }
            if (document.getElementById("dynamicStyling") == null) {
                let style = document.createElement("style")
                style.id = "dynamicStyling"
                document.head.appendChild(style)
            }
            let style = document.getElementById("dynamicStyling")
            if (disabledModules.includes(type)) {
                style.innerHTML += `.contentSection[data-module="${type}"] { display:none!important; }`
            } else {
                style.innerHTML += `.contentSection[data-module="${type}"] { grid-area: ${type}; }`
            }
            currentModuleState[selector].cssRules.push(type)
        }
    }

    for (const module of propertyOrder) {
        if (currentModules.includes(module) && !disabledModules.includes(module)) {
            orderedModules.push(module)
        }
    }


    // filter out any disabled modules from the property order
    // and set them to display: none;



    singleColumnListString = '"' + orderedModules.join(" ").replace(/ /g, '" "') + '"'
    doubleColumnListString = ''

    // split the list into 2 columns
    cols = [[], []]
    for (const module of orderedModules) {
        if (cols[0].length > cols[1].length) {
            cols[1].push(module)
        } else {
            cols[0].push(module)
        }
    }

    console.log(openModules)
    for (const col in cols[0]) {
        firstItem = cols[0][col]
        secondItem = cols[1][col]
        if (secondItem == undefined) {
            doubleColumnListString += `"${cols[0][col]} blank${col}" `
            console.log("hi")
            continue
        }

        blanks = [];
        // if the module is open then we add a blank space where 
        // it was supposed to be, and then add the module on its 
        // own line
        if (openModules.includes(cols[0][col]) && openModules.includes(cols[1][col])) {
            doubleColumnListString += `"${firstItem} ${firstItem}" `
            doubleColumnListString += `"${secondItem} ${secondItem}" `
            continue
        } else if (openModules.includes(cols[0][col])) {
            blanks.push(`blank${col}`)
            doubleColumnListString += `"${firstItem} ${firstItem}" `
            doubleColumnListString += `"${secondItem} blank${col}" `
            continue
        } else if (openModules.includes(cols[1][col])) {
            blanks.push(`blank${col}`)
            doubleColumnListString += `"${secondItem} ${secondItem}" `
            doubleColumnListString += `"${firstItem} blank${col}" `
            continue
        }

        for (const blank of blanks) {
            let blankobj = document.createElement("div")
            blankobj.style.setProperty("display", "none")
            blankobj.style.setProperty("grid-area", blank)
            blankobj.classList.add("blank")
            container.appendChild(blankobj)
        }


        doubleColumnListString += `"${cols[0][col]} ${cols[1][col]}" `
    }

    console.log(singleColumnListString)
    // check if html has class of single or two column
    // then we style the container with the correct grid-template-areas
    if (settingsState["singleColumn"]) {
        document.lastChild.classList.add("single-column")
        document.lastChild.classList.remove("double-column")
        container.setAttribute("style", `grid-template-areas: ${singleColumnListString}`)
    } else {
        document.lastChild.classList.add("double-column")
        document.lastChild.classList.remove("single-column")
        container.setAttribute("style", `grid-template-areas: ${doubleColumnListString}`)
    }
    if (isSpeedcam) {
        container.setAttribute("style", `grid-template-areas: ${doubleColumnListString}`)
    }

    // if masonry is enabled then we need to split up the modules into 2 columns
    // and then we need to add the correct grid-template-areas to the container
    // if the splitting has already been done then we can just make sure they are
    // in the correct order and then we can just add the correct grid-template-areas
    if (masonry && cols[0][0] !== undefined) {
        // we need to split the modules into 2 columns
        if (!container.dataset.masonry) {
            leftColumn = document.createElement("div")
            rightColumn = document.createElement("div")
            leftColumn.classList.add("leftColumn")
            rightColumn.classList.add("rightColumn")
            container.appendChild(leftColumn)
            container.appendChild(rightColumn)
            container.dataset.masonry = true
        }
        leftColumn = container.getElementsByClassName("leftColumn")[0]
        rightColumn = container.getElementsByClassName("rightColumn")[0]

        gridAreasLeft = '"' + cols[0].join('" "') + '"'
        gridAreasRight = '"' + cols[1].join('" "') + '"'
        // we can reoranise the cols[] array so that we can just loop over it
        // and add the modules to the correct column
        leftColumn.setAttribute("style", `grid-template-areas: ${gridAreasLeft}`)
        rightColumn.setAttribute("style", `grid-template-areas: ${gridAreasRight}`)

        // for (const modItem of orderedModules){
        //     const item = container.querySelector(`.contentSection[data-module="${modItem}"]`)
        //     if (item){
        //     if (cols[0].includes(modItem)){
        //         leftColumn.appendChild(item)
        //     } else {
        //         rightColumn.appendChild(item)
        //     }}
        // }
    }

    for (const details of document.querySelectorAll("details")) {
        if (!details.ontoggle) {
            details.ontoggle = function () {
                recalculateList()
            }
        }
    }
    translator.translatePageTo()
    recalculating = false
}


const toggles = {
    "bobbleDisable": "bobbleOverride",
    // "externalPosts-banner": "experimentalFeatures",
    "permaDark": "darkMode",
    "onScreen": "keepOnScreen",
    "debug-banner": "debugMode",
    "singleColumn": "singleColumn",
    "notificationsContainer": "notificationsContainer",
    "monoChrome": "monoChrome",
}

function closeElement(el) {
    el.parentElement.getElementsByTagName("details")[0].open = !el.parentElement.getElementsByTagName("details")[0].open;
    setTimeout(() => {
        el.parentElement.scrollIntoView();
    }, 10);
}

document.addEventListener('mouseup', (event) => {
    if (!event.target.matches) return;
    if (event.target.matches("html")) return;
    if (event.target.matches("#floatDiag")) return;
    if (event.target.matches("#floatDiagSave")) {
        notificationCloseAndSave()
        return
    };
    if (event.target.matches(".interactionBar")) {
        if (event.offsetY > 0) return;
        closeElement(event.target)
        return;
    }
    if (event.target.matches("summary")) {
        recalculateList("#" + event.target.parentElement.parentElement.id)
    }

    if (event.target.matches("#extraDisplay")) {
        if (event.offsetX > 0) return;
        toggleBodyStyle("activeExtra")
        return;
    }

    const tid = event.target.id;
    debugLogging(`clicked ${tid} `)

    if (tid == 'indexRefresh') send_message("IVIndexRefresh", "please");
    if (tid == 'notificationsCache') notificationBell("cacheClear")
    if (tid == 'backButton') send_message("IVClicked", event.target.parentElement.id);

    if (event.target.classList.contains('invisible-disclaimer-title')) send_message("IVClicked", "disclaimer");
    if (event.target.classList.contains('sectionTitle') || event.target.classList.contains('iconclass') || event.target.classList.contains('scoreText')) {
        send_message("IVClicked", event.target.parentElement.id);
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
            settingsStateApply(decoded.data, true);
            break;
    }
});

function postalVote(direction, location, status) {
    direction = (direction == status) ? "un" : direction;
    const directionType = (direction == "un") ?
        "IVPostVoteUnvote" : `IVPostVote${direction.charAt(0).toUpperCase() + direction.slice(1)} `;
    if (direction == "comment") {
        commentDiagOpen(location);
        return;
    }
    debugLogging("postalVote", direction);
    send_message(directionType, location);
}

function moduleUpdate(mesg, comment = false) {
    if (typeof (elmt) == 'undefined') {
        debugLogging("moduleUpdate undefined element", mesg)
        return
    }
    if (comment) {
        recalculateList()
        translator.translatePageTo()
        console.log("comment")
        return
    }
    console.log("not comment")
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
    debugLogging(`voteLoad: ${pageHash} ${site} `)
    send_message("IVVoteStuff", pageHash);
}
async function voteRequest(hash, direction) {
    debugLogging(`vote request: ${hash} ${direction} `);
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

    IVLike.setAttribute("style", `--count: '${decoded.utotal.toString()}'; color:${lc}; `);
    IVDislike.setAttribute("style", `--count: '${decoded.dtotal.toString()}'; color:${dc}; `);
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

function addPopover(contentString, isDebug = false, actionLink = false) {
    if (!settingsState.debugMode && isDebug) return;
    const notification = document.createElement("div");
    notification.classList.add("notification");
    if (isDebug) {
        notification.style.backgroundColor = "red";
    }
    notification.innerHTML = `<div id = "notification-content" > ${contentString}</div> `;
    notification.popover = "manual";
    const existingNotifications = document.getElementsByClassName("notification");
    const offset = existingNotifications.length * 30;
    const popArea = document.getElementById("popArea") || document.body;
    popArea.appendChild(notification);
    notification.style.top = `${offset} px`;
    notification.showPopover();
    if (actionLink) {
        notification.addEventListener("click", () => {
            window.open(actionLink, "_blank");
            notification.hidePopover();
            notification.remove();
            const existingNotifications = document.getElementsByClassName("notification");
            for (let i = 0; i < existingNotifications.length; i++) {
                existingNotifications[i].style.top = `${i * 30} px`;
            }
        })
    }
    setTimeout(() => {
        notification.hidePopover();
        notification.remove();
        const existingNotifications = document.getElementsByClassName("notification");
        for (let i = 0; i < existingNotifications.length; i++) {
            existingNotifications[i].style.top = `${i * 30} px`;
        }
    }, 20_000);
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
                <input type="checkbox" id="smallSize" name="smallSize" onchange='handleSizeChange("small", "medium", "mobile", this)'>
                <label for="smallSize">Small Size</label></br>
                <input type="checkbox" id="mediumSize" name="medumSize" onchange='handleSizeChange("medium", "small", "mobile", this)'>
                <label for="mediumSize">Medium Size</label>
                </br>
                <input type="checkbox" id="mobileSize" name="mobileSize" onchange='handleSizeChange("mobile", "small", "medium", this)'>
                <label for="mobileSize">Mobile Size</label>
                </br></form>
        </div>
        <div> <h3> Body Options </h3> <form>
                <input type="button" id="optionsModeBodyToggle" name="optionsModeBodyToggle" onclick='toggleBodyStyle("optionsMode")'>
                <label for="optionsModeBodyToggle">Options Mode</label></br>
                <input type="button" id="showDisclaimerBodyToggle" name="showDisclaimerBodyToggle" onclick='toggleBodyStyle("showDisclaimer")'>
                <label for="showDisclaimerBodyToggle">Show Disclaimer</label></br>
                <input type="button" id="showInteractionsBodyToggle" name="showInteractionsBodyToggle" onclick='toggleBodyStyle("showInteractions")'>
                <label for="showInteractionsBodyToggle">Show Interactions</label></br>
                <input type="button" id="showMobileBodyToggle" name="showMobileBodyToggle" onclick='toggleBodyStyle("mobile")'>
                <label for="showMobileBodyToggle">Show Mobile</label></br>
            </form>
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

    const currentModuleLocations = []
    for (const x in currentModuleState) {
        Object.keys(currentModuleState[x]).forEach((y) => {
            if (y !== '_preview' && y.includes('/'))
                currentModuleLocations.push(y);
        })
    }
    if (isSpeedcam) {
        popoverDiv.innerHTML += `<div id = "speedCamDebug" ><h3> SpeedCam Debug </h3>
            <h4> Current SpeedCam </h4>
            <span id="range_number">0</span>
            <span id="number_number">0</span>
            <span id="speed_number">0</span>
            <span id="output_output">0</span>
            <span id="output_placeholder">0</span>
            <button id="speedCamSensorButton" onclick="connectSerial()">Serial Pair</button>
            <button id="speedCamSensorButton" onclick="swapLayout()">Swap Layout</button>
            </div>
        `
    }

    popoverDiv.innerHTML += `<div id = "popOptionsModuleLocations" ><h3> Module Locations </h3>
            <h4> Current Module Locations </h4>
            <ul>
                ${currentModuleLocations.map(x => `<li>${x}</li>`).join("")}
            </ul>
        </div> `;

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

    if (title) popoverDiv.innerHTML += `<h2> ${title}</h2>`;
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
                popoverDiv.style.transform = `translateX(calc(${popWidth} / 2 - 50vw))`;
                popoverDiv.style.borderLeft = "1px solid";
                break;
            case "right":
                popoverDiv.style.width = popWidth;
                popoverDiv.style.height = "100vh";
                popoverDiv.style.transform = `translateX(calc(-1 * (${popWidth} / 2 - 50vw)))`;
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

function showDisclaimer() {
    toggleBodyStyle("showDisclaimer")
}

function showInteractions() {
    toggleBodyStyle("showInteractions")
}

function unexplode() {
    return
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
    return
    const content = document.getElementById("content");
    const contentChildren = Array.from(content.children);
    contentChildren.forEach((child, i) => {
        child.classList.add("exploading")
        if (child.classList.contains("expanded")) {
            const expandedChild = child.id;
            content.style = `grid - template - areas: "${expandedChild}"; grid - auto - rows: auto; `;
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
                debugLogging(`removed ${child.id} `)
            }, 500)
        }

    });
}

function checkPageSize() {
    const content = document.getElementById("content");
    const isMobile = body.classList.contains("mobile");
    const isSmall = body.classList.contains("small");
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
    if (!Url.get.exhibit || !isSpeedcam) {
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
    if (e.key === "r") {
        recalculateList();
        addPopover("Recalculated List");
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

// I want to listen for the toggling of any details element that 
// is a child of the contentSection elements and then recalculate the list
pageSetup();