const pageHost = `${window.location.protocol}//${window.location.host}`
const pageCoreLocation = `${pageHost}${document.getElementById('location-url').textContent}`;
const assetsURL = `https://assets.reveb.la`

const languages = ["ar", "fr", "eo", "en", "es", "de", "zh", "hi", "ca"];
var translator = new Translator({
    persist: true,
    ///debug: true,
    filesLocation: `${pageHost}/i18n`
});

var loggedIn = false;

var settingsState;

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
var ratingColorArray = {
    "success": "var(--c-main)",
    "danger": "red",
    "neutral": "grey",
    "warning": "amber",
}

var translate = {
    "cta": "cta.title",
    "wikipedia-first-frame": "w.wikipedia",
    "networkgraph": "graph.title" ,
    "small-wikidata": "w.companyinfo",
    "mbfc": "mbfc.title",
    "trust-pilot": "trustpilot.title",
    "yahoo": "esg.title",
    "opensec": "os.title",
    "carbon": "carbon.title",
    "lobbyeu": "lb.title",
    "post": "user.moduletitle",
    "wbm": "wbm.title",
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
    "glassdoor":"glassdoor.title",
    "similar-site-wrapper": "similar.title",
    "social-wikidata": "w.socialmedia",
    "trust-scam": "trustsc.title",
};

var defaultOrder = Object.keys(translate)
var defaultOrderString = defaultOrder.join('|')

const availableNotifications = "beglmstwp";

const defaultUserPreferences = {
   "l": { type: "range", min: 0, max: 10 },
   "b": { type: "range", min: 0, max: 300 },
   "w": { type: "multiRange", min: 0, max: 100 },
   "g": { type: "range", min: 0, max: 5 },
   "p": { type: "range", min: 1, max: 6 },
   "s": { type: "range", min: 0, max: 100 },
   "t": { type: "range", min: 0, max: 100 },
   "m": { type: "label", labels: [ "conspiracy-pseudoscience", "left",
"left-center", "pro-science", "right", "right-center", "satire",
"censorship", "conspiracy", "failed-fact-checks", "fake-news", "false-claims",
"hate", "imposter", "misinformation", "plagiarism", "poor-sourcing", "propaganda", "pseudoscience"
  ] },
};

var defaultSettingsState = {
	"preferred_language": "en",
	"loggedIn": false,
	"debugMode": false,
	"darkMode": false,
	"keepOnScreen": false,
	"userPreferences": defaultUserPreferences,
	"bobbleOverride": false,
	"notifications": false,
	"notificationsTags":[],
	"listOrder": defaultOrderString,
	"experimentalFeatures": false,
}


var oldSettings;

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

Hash = {
    get hash(){
        var value=''
        if(window.location.hash.length!==0)
            window.location.hash.replace(/#+([^\?]+)/gi, function(hash){
               value = hash.replace('#',''); 
            })
        return value
    }
}
translator.fetch(languages).then(() => {
    translator.translatePageTo();
    registerLanguageToggle();
});

function pageSetup(){
    addToolsSection()
    resetSettings(false)
    send_message("IVSettingsReq", true);
    loadPageCore()
    addSettings()
    slist(document.getElementById("sortlist"));
    loadPageExternal()
    scrollIntoPlace()
	notificationsDraw();
	forceAllLinksNewTab();
    translator.translatePageTo();
    recalculateList();
}


function resetSettings(change=true){
	settingsState = defaultSettingsState;
    if (change) settingsStateChange()
}

var firstShot = false;
function settingsStateApply(newSettingsState=defaultSettingsState){
    if (typeof(oldSettings) === 'undefined') {
        oldSettings = JSON.parse(JSON.stringify(settingsState));
		firstShot = true;
        if (debug) console.log("oldsettings not set")
    }
	settingsState = newSettingsState;

    
    changed = []
    for (item in settingsState){
        if (settingsState[item] != oldSettings[item] && item != 'userPreferences'){
           changed.push(item) 
        }
    }

    if (debug) console.log(changed)
	if (changed.includes("loggedIn"))
		loggedIn = settingsState["loggedIn"]

	if (changed.includes("experimentalFeatures")){
		if (settingsState["experimentalFeatures"])
			loginCheck(true);
		loadPageExternal()
    }


	if (firstShot){
		document.getElementById("notifications-shade").getElementsByTagName("input")[0].checked = settingsState["notifications"]
		for (const toggle in toggles){
			toggleEl = document.getElementById(toggle)
			if (toggleEl !== null && toggle != 'notificationsContainer'){
				toggleEl.getElementsByTagName("input")[0].checked = settingsState[toggles[toggle]];
    	    }
    	}
	}


	if (newSettingsState["debugMode"] == true) {
	    document.lastChild.classList.add("debugColors");
    } else {
	    document.lastChild.classList.remove("debugColors");
    }

    if (newSettingsState["darkMode"] == true){
        document.lastChild.classList.add('dark-theme');
        document.getElementById('backButton').style.backgroundImage = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTciIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNyAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExLjgzMzMgMTMuMzMzNEw2LjUgOC4wMDAwNEwxMS44MzMzIDIuNjY2NzEiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIvPgo8L3N2Zz4K')";
    } else {
        document.lastChild.classList.remove('dark-theme');
    }

    if (settingsState["dissmissedNotifications"].length > 0){
        dissmissedNotificationsDraw();
    }


    recalculateList()
	translator.translatePageTo(settingsState["preferred_language"]);
	notificationsDraw();
    
	debug = settingsState["debugMode"]
    oldSettings = JSON.parse(JSON.stringify(settingsState));
	firstShot = false;
}



function settingsStateChange(){
	send_message("IVSettingsChange", settingsState);
    settingsStateApply(settingsState)
	if (debug) console.log("Settings state changed")
	if (debug) console.log(settingsState);
}


function registerLanguageToggle() {
    var select = document.getElementById("langselect");
    for (var i = 0, len = select.childElementCount; i<len; ++i ){
        if (select.children[i].value == settingsState["preferred_language"])
            select.selectedIndex = i;
    }
    select.addEventListener("change", evt => {
      var language = evt.target.value;
      if (language == "-" ){ return; };
      translator.translatePageTo(language);
	  settingsState["preferred_language"] = language;
	  settingsStateChange();
    });
}

function dissmissedNotificationsDraw(){
    let container = document.getElementById("dismissedContainer");
    if (settingsState["dissmissedNotifications"].length == 0 ){
        document.getElementById("dissmissedNotifications").style.display = "none";
        container.innerHTML = ""
        return
    }
    document.getElementById("dissmissedNotifications").style.display = "block";
    container.innerHTML = ""
    for (const item in settingsState["dissmissedNotifications"]){
        site = settingsState["dissmissedNotifications"][item]
        container.innerHTML += `<li onclick="removeSiteFromDimissed(this)" style="display:inline;">${site}</li>`

    }
}
function removeSiteFromDimissed(el){
    site = el.innerText;
    settingsState["dissmissedNotifications"].pop(site);
    dissmissedNotificationsDraw();
    settingsStateChange();
}

const scrollIntoPlace = async () => {
    if (Hash.hash.length!==0){
        var scrollPlace = document.getElementById(Hash.hash)
        if (scrollPlace){
        scrollPlace.scrollIntoView()
        console.log("Scroll To Place")
        }
    }
}

var moduleData;
const localModules = ["political", "social"]
const loadPageCore = async () =>{
    try {
        const dataf = await fetch(pageCoreLocation)
        const response = await dataf.json()
        let currentDomain = document.getElementsByClassName("co-name")[0].innerText.replace(".","")
        localString = ''
        moduleData = await response;

        const siteDataSendable = { 
            "siteData": response.data,
            "domainKey": currentDomain,
        }
        send_message("IVSiteDataUpdate", siteDataSendable)
        for (module of response.core){
            if (module.url != 'local'){
				await addModule(type=module.type, url=`${pageHost}/ds/${module.url}`)
					.then((string) => localString += string);
            }
        }
        for (const item in localModules)
            localString += (localModules[item] in response) ? await addLocalModule(localModules[item], response[localModules[item]]) : '';
        content.innerHTML += localString
		translator.translatePageTo()
    } catch (e) {
        console.log(e)
    }
}

function postUpdate(data, topLevel=false){
	if (data["comment"]){
		moduleUpdate(data, true)
		return
	}
	if (debug) console.log(`topLevel ${topLevel}`)
	if (topLevel == true){
		if (!document.getElementById("post")){
			addLocalModule(type="post", data=data).then(function(htmlString){
                content.innerHTML += htmlString
            })
            if (data["top_comment"]){
                send_message("IVGetPost", data["top_comment"]);
            }
		}
	} else {
		if (debug) console.log(data)
        if (data["location"].startsWith("db")){
            document.getElementById("post").remove()
			addLocalModule(type="post", data=data).then(function(htmlString){
                content.innerHTML += htmlString
            })
            if (data["top_comment"]){
                send_message("IVGetPost", data["top_comment"]);
            }
        }
	}
}

const loadPageExternal = async () =>{
	if (document.getElementById("post")){
		document.getElementById("post").remove()
	}
    if (!settingsState["experimentalFeatures"]) return;
    postLocation = `${document.getElementById('location-url').textContent.replace("/index.json","").replace('/db','db')}`
	send_message("IVGetPost", postLocation)
}

var loginButtonEl;
function loginCheck() {
    if (document.getElementById("loginButton")){
        document.getElementById("loginButton").remove()
    }
    if (!settingsState["experimentalFeatures"]) return;
    loginButtonEl = document.createElement("button"); 
    loginButtonEl.innerHTML = "<div></div>"
    loginButtonEl.id = "loginButton";
    loginDistance = (phoneMode) ? '64px' : '112px';
    loginButtonEl.style.right = loginDistance;
    loginButtonEl.setAttribute("type", "button");
    loginButtonEl.setAttribute("onclick", "loginButtonAction()");
    settingsButton.parentNode.insertBefore(loginButtonEl,settingsButton);

    if (Url.get["username"])
		settingsState["loggedIn"] = true;
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
	"post": { "id": "post", "label": "User Content", "translate": "user.moduletitle", "subname": true},
    "social": { "id": "social-wikidata", "label": "Social Media", "translate": "social.title", "subname": false },
    "political": { "id": "political-wikidata", "label": "Political Leanings", "translate": "political.title", "subname": true },
    "politicali": { "id": "politicali-wikidata", "label": "Political Ideology", "translate": "wikidata.polideology", "subname": true },
}

function tableRow(item){
    return `<tr><th data-i18n="${item[0]}">${item[1]}</th><td>${item[2]}</td></tr>`
}
function sourceStringClose(href, text){
    return `</div></div><a target="_blank" class="hideInSmall source" href='${href}'>${text}</a>`
}
function miniSource(href){
    return `<a class="minisource" target="_blank" href="${href}"></a>`
}

const contentContainer = document.getElementsByClassName("content")[0]

var localString = ''

function moduleString(id, i18n, label, subname=false, scoreText=false, scoreClass=false, dataLoc=false){
    subnameString = subname ? `<div class='subname'>(${subname})</div>` : '';
    scoreClassString = scoreClass ? `${scoreClass}` : 'scoreText';
    scoreTextString = scoreText ? `<div class="${scoreClass}">${scoreText}` : '';
    dataLocationString = dataLoc ? `data-location="${dataLoc}"` : '';
    return `<section class="contentSection" id="${id}" ${dataLocationString}>
            <h2 class="sectionTitle"><div data-i18n="${i18n}">${label}</div>${subnameString}</h2>
            <div class="hovertext hideInSmall"><div>?</div></div><div class="hidetext"><h3 data-i18n="title.${id}"> </h3><p data-i18n="desc.${id}"></div>
              ${scoreTextString}`
}

function notPieString(data, trans=false, scoreClass=false, icon=false, outOf=false, reviews=false ){
	transString = (trans != false) ? ` data-i18n="${trans}"` : ''; 
	scoreClassString = (scoreClass != false) ? scoreClass : 'biaslink';
    iconString = (icon != false) ? `<img class="iconclass" src="${icon}">` : '';
    ratingsString = (reviews != false) ? `<div class="ratingCount">${reviews} <span data-i18n="glassdoor.reviews"></span></div>` : '';
    outOfString = (outOf != false) ? ` style="--outOf:'${outOf}';" ` : '';
    return `<div class="notPieContainer"><div>${iconString}
        <score class="${scoreClassString}"${transString}${outOfString}>${ data }</score>
        ${ratingsString}
        </div>
		</div>`
}
function pieString(data, trans=false, scoreClass=false, percent=false, outOf=false, reviews=false, pieColour=false ){
	transString = (trans != false) ? ` data-i18n="${trans}"` : ''; 

	scoreClassString = (scoreClass != false) ? scoreClass : 'biaslink'
    ratingsString = (reviews != false) ? `<div class="ratingCount">${reviews} <span data-i18n="glassdoor.reviews"></span></div>` : '';
    percentString = (percent != false) ? 
        `<div class="pie hideTilExpanded animate" style="--c:var(--chart-fore);--p:${percent};"></div>` : '';
    outOfString = (outOf != false) ? ` style="--outOf:'${outOf}';" ` : '';
    pieColourString = (pieColour != false) ? ` style='--c:${pieColour};'` : '';
    return `<div class="pieContainer"><div>
        <div class="pie hideTilExpanded"${pieColourString}></div>
        ${percentString}
        <score class="${scoreClassString}"${transString}${outOfString}>${ data }</score>
        ${ratingsString}
        </div>
		</div>`
}

function addToolsSection(){
    let currentDomain = document.getElementsByClassName("co-name")[0].innerText
    content.innerHTML += `
    <section id="carbon">
        <div class="iconarray">
            <div><a href="https://www.websitecarbon.com/website/${currentDomain}"><img src="/icon/carbon.svg" alt="Website Carbon Calculator" /></a></div>
            <div><a href="https://themarkup.org/blacklight?url=${currentDomain}"><img src="/icon/lightning.svg" alt="Blacklight" /></a></div>
        </div>
    </section>
    <section id="Invisible-vote" class="hideInSmall hide">
    <section id="Invisible-like" onclick="vote('up')" style="--count:'0';" data-i18n="vote.like">Like</section>
    <section id="Invisible-dislike" onclick="vote('down')" style="--count:'0';" data-i18n="vote.dislike">Dislike</section>
    </section>
    <section id="Invisible-boycott" onclick="boycott()" data-i18n="vote.boycott" class="hideInSmall hide">Boycott</section>
    `
	let voteButtons = document.getElementById('Invisible-vote');
	let boyButton = document.getElementById('Invisible-boycott');
    if (Url.get["app"] == 'true'){
        closeButton.style.visibility = "hidden";
    }
    if (Url.get["vote"] == 'true'){
        body.classList.add("topBar");
        boyButton.classList.toggle("hide");
        voteButtons.classList.toggle("hide");
        if (!phoneMode) content.classList.add("padOnSmall");
        voteLoad();
    } else {
        boyButton.style.visibility = "hidden";
        voteButtons.style.visibility = "hidden";
    }
    if (Url.get["expanded"] && phoneMode){
        document.getElementById(Url.get["expanded"]).classList.add("expanded")
        content.classList.add('somethingIsOpen');
    }

}

async function addLocalModule(type=undefined,data=undefined){
    if (type == undefined || data == undefined) return; 
    if (type in types) {} else {return;}

    // Genericising needed
    // console.log(data)
    if (type == "social"){
        htmlString = `${moduleString(types[type].id, types[type].translate, types[type].label, false)}
                        <section id="social-wikidata-links" class="fullBleed"><table>`
        for (label in data)
            for (item in data[label]){
                htmlString += `<tr><th>${label.replaceAll(" id","").replaceAll(" username","")}</th>
                    <td><a class="spacelinks" href="${data[label][item]['url']}">${data[label][item]['url']}</a>${miniSource("https://wikidata.org")}</td>
                </tr>`
            }
        htmlString += `</table></section></section>`
    }
    if (type == "political"){
        lang = "enlabel"
        polString = ''
        for (label in data){
            labelId = (label == "polalignment") ? "political-wikidata" : "politicali-wikidata";
            actLabel = (label == "polalignment") ? "Political Alignments" : "Political Ideologies";
            polString += moduleString(labelId, `wikidata.${label}`, actLabel, false, " ", "fullBleed")
            polString += '<div><ul>'
            for (item in data[label]){
				itemObj = data[label][item]
				dataId = itemObj['dataId']
				miniSourceHref = `https://wikidata.org/wiki/${dataId}`
                polString += `<li><h3>${itemObj["sourceLabels"][lang]} <a class="spacelinks" href="https://wikidata.org/wiki/${dataId}">${itemObj['data'][lang]}</a></h3>${miniSource(miniSourceHref)}</li>`
            }
            sourceString = sourceStringClose(`https://wikidata.org/wiki/${data[label][item]['dataId']}`, "WIKIDATA")
            polString += `</ul>${sourceString}</section>`
        }
        htmlString = polString
    }
    if (type == 'post'){
        postContent = $('<div/>').html(data.content).text()
		dataLocationString = data.uid.replace(pageHost, "").replace("/ds/", "").replace(".json", "");
        htmlString = `
		${moduleString(types[type].id, "user.moduletitle", "User Content", data.location, ' ', "fullBleed userText", dataLocationString)}
        <div>${postContent}
             ${sourceStringClose("https://assets.reveb.la/#user", data.author)}
			 ${voteBox(data.uid, data, "smallVoteBox bottomLeftOfModule hideInSmall")}
        </section>`

    }
    return htmlString
}

function voteBox(location_str, dataObj, styles=false){
    classString = styles ? `class="${styles}"`: '';
    return `<ul ${classString}>
				<li><a target="_blank" data-i18n="vote.like" onclick="postalVote('up','${location_str}', '${dataObj.voteStatus}')" >Up</a><div>(${dataObj.up_total})</div></li>
				<li><a target="_blank" data-i18n="vote.dislike" onclick="postalVote('down','${location_str}', '${dataObj.voteStatus}')" >Down</a><div>(${dataObj.down_total})</div></li>
            	<li><a target="_blank" data-i18n="vote.comment" onclick="postalVote('comment','${location_str}', '${dataObj.voteStatus}')" >Comment</a><div>(${dataObj.comment_total})</div></li>
            </ul>`
}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

function opsTd(r){
    return `<td style="--size: calc(${r.percent.replace("%", "")}}/100);">
            <span class="data">${r.entity}</span>
            <span class="tooltip">${r.entity}<br>
                (${r.amount})</span>
            </td>`
}

function boldP(bold, text, styles=false){
    classString = styles ? `class="${styles}"`: '';
    return `<p ${classString}><b>${bold}</b> ${text}</p>`
}

async function addModule(type=undefined,url=undefined){
    if (type == undefined || url == undefined) return; 
    // needs some mechanic for caching when we switch to graph mode
    const moduleData = await fetch(url);
    const moduleResponse = await moduleData.json()
    //console.log(moduleResponse)
	dataLocationString = url.replace(pageHost, "").replace("/ds/", "").replace(".json", "");
    if (type in types) {} else {return;}
    typeDef = types[type]
    // Genericising needed
    moduleSource = (typeDef.subname) ? moduleResponse.source : false;
    htmlString = moduleString(typeDef.id, typeDef.translate, typeDef.label, moduleSource, false, false, dataLocationString)

    if (type == "opensecrets"){
        //console.log(moduleResponse)
        htmlString += `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/charts.css/dist/charts.min.css">`
        if ("bill_most_heading" in moduleResponse){
            htmlString += ` ${boldP(moduleResponse.bill_most_heading,'',"flavourText")}
            <p class="flavourText"><a href='${moduleResponse.bill_most_url}'>${moduleResponse.bill_most_title} (${moduleResponse.bill_most_code})</a></p>`
        }
        htmlString += '<div class="fullBleed"><div><p data-i18n="os.disclaimer"></p><br>'
        if ("cycle_year" in moduleResponse){
			htmlString += `<p>Data is true of the ${moduleResponse.cycle_year} cycle</p> <table>`
            const ranks = ["contributions_rank", "contributions_amount", "lobbying_rank"];
            for (const rank in ranks){
                if (ranks[rank] in moduleResponse)
                    htmlString += tableRow(["" ,toTitleCase(ranks[rank].replace("_"," ")), moduleResponse[ranks[rank]]])
            }

			htmlString+= '</table><div class="charts">'
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
            if ("charts" in moduleResponse){
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
                for (chartType in charts){
                    house = charts[chartType]
                    houseDems = house.Dems.all_years
                    houseRepubs = house.Repubs.all_years
                    heightThou = [].concat(houseDems,houseRepubs).sort(function(a,b) { return a - b }).reverse()[0] / 1000
                    if (heightThou > 0){
                        htmlString+=`<h3 data-i18n="opensec.${chartType.toLowerCase()}">${chartType}</h3>${commonString}`
                        lastD = 0
                        lastR = 0
                        for (year in house["all_data"]){
                            dataD = house["all_data"][year]["Dems"];
                            dataR = house["all_data"][year]["Repubs"];
                            tD = dataD / (heightThou * 1000)
                            tR = dataR / (heightThou * 1000)
                            htmlString+=`
                                <tr><th scope="row">${year}</th>
                                    <td style="--start:${ lastD }; --size:${ tD };"><span class="data">${ dataD }</span></td>
                                    <td style="--start:${ lastR }; --size:${ tR };"><span class="data">${ dataR }</span></td>
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

            if ("lobbycards" in moduleResponse){
                htmlString += "<div class='fullBleed'><h3 data-i18n='opensec.lobbying'> Lobbying </h3>"
                for (card of moduleResponse.lobbycards){
                    htmlString += `
                            <div class="openSecLobbyCardContainer"><h4>${card.year}</h4><h5>${card.dollars}</h5>
							<table>
							${tableRow(["opensec.Lobbyistingov", "Lobbyists who worked in government", card.held.count +" (" + card.held.percent + ")"])}
							${tableRow(["opensec.Lobbyistnotingov", "Lobbyists who havent worked in government", card.notheld.count + " (" + card.notheld.percent + ")"])}
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

    if (type == "wbm"){
		wbmstring = ''
        for (module in moduleResponse.modules){
            file = moduleResponse.modules[module].file;
            trans = file.split("_").slice(1).join("-").toLowerCase()
            fileName = file.split("_").slice(1).join(" ")
	        dataLocationString = url.replace(pageHost, "").replace("/ds/", "").replace(".json", "");
            source = "https://www.worldbenchmarkingalliance.org/research/"
			wbmstring += `<section id="wbm-${trans}" class="contentSection" data-location="${dataLocationString}-${trans}">
            <h2 class="sectionTitle"><div data-i18n="wbm.${trans}">${fileName}</div><div class="subname">(${moduleResponse.source})</div></h2>
            <div class="hovertext hideInSmall"><div>?</div></div><div class="hidetext"><h3 data-i18n="title.wbm-${trans}"> </h3><p data-i18n="desc.wbm-${trans}"></div>
            `
            additionalString = '<div class="scoreText"><div><table>'
            for (item of Object.keys(moduleResponse.modules[module])){
                if (!item.includes("Total Score")){
                    if (item != "file" && item != "Company Scorecard"){
                        itemLabel = item.split("(")[0]
						itemTrans = itemLabel.trim().toLowerCase().replaceAll(" ","-").replaceAll(/;|'|:|’|,/g, "").replaceAll("--","-").replaceAll("/","").replaceAll(".","")
                        if (item.includes("(")){
                            outOf = item.split("(")[1].replace(")","")
                            additionalString += `<tr><th data-i18n='wbm.${itemTrans}'>${itemLabel}</th>
								<td style="--outOf:'/ ${outOf}';" class="ratingOutOf" >${moduleResponse.modules[module][item]}</td></tr>`
                        } else {
							additionalString += `<tr><th data-i18n='${itemTrans}'>${item}</th> 
								<td style="--outOf:'';" >${moduleResponse.modules[module][item]}</td></tr>`
                        }
                    }
                } else {
                  if (!item.includes("Raw")){
					  outOf = Number(item.split("(")[1].replace(")",""))
                	  itemLabel = item.split("(")[0]
                	  score = Number(moduleResponse.modules[module][item])
                	  percent = (score / outOf) * 100
	            	  wbmstring += `${pieString(score,false,"ratingOutOf",percent,"/ " + outOf)}`
                  }
                }
            }


            wbmstring += `${additionalString}</table> ${sourceStringClose(source, "WORLDBENCHMARK")}`
            if (settingsState["experimentalFeatures"]){
                wbmstring += `<button type='button' data-i18n="vote.loadinfo" class='loadInfoButton hideInSmall bottomLeftOfModule' onclick="postLoad(this)"> Load info</button>`
            }
            wbmstring += `</section>`
        }
		htmlString = wbmstring
    }
    if (type == "cta"){
        positiveString = ''
        negativeString = ''
        for (link in moduleResponse.links){
            if (moduleResponse.links[link].type == "positive"){
            positiveString += `<div><a href='${moduleResponse.links[link].url}'>${moduleResponse.links[link].label}</a></div>`
            } else {
            negativeString += `<div><a href='${moduleResponse.links[link].url}'>${moduleResponse.links[link].label}</a></div>`
            }
        }
        htmlString += `
        <score class="biaslink"> </score>
        <div class="fullBleed">
        <div>
        <p>${moduleResponse.description}</p>
        </div>
		<div><div><h4> Positive </h4>${positiveString}</div><div><h4> Negative </h4> ${negativeString}</div>${sourceStringClose("https://assets.reveb.la/", moduleResponse.author)}`
    }
    if (type == "lobbyeu"){
        rating = moduleResponse
		options = [["lb.transparency_id","Transparency ID:",moduleResponse.eu_transparency_id],
				   ["lb.hq_countries","HQ Country:",moduleResponse.head_country],
				   ["lb.eu_country","EU Office Country:",moduleResponse.be_country],
    			   ["lb.lobby_count","Lobbyist Count:",moduleResponse.lobbyist_count],
    			   ["lb.lobby_fte","Lobbyist FTE:",moduleResponse.lobbyist_fte],
    			   ["lb.calculated_cost","Calculated Total Cost:",moduleResponse.calculated_cost],
    			   ["lb.meeting_count","Meetings with the EU:",moduleResponse.meeting_count],
    			   ["lb.passes_count","Lobbyist Passes Count:",moduleResponse.passes_count]]
        htmlString += `<div class="fullBleed"><div> <table>`
		for (item in options){
			htmlString += tableRow(options[item])
		}
        sourceUrl = `https://lobbyfacts.eu/datacard/org?rid=${moduleResponse.eu_transparency_id}`
		htmlString += `</table>${sourceStringClose(sourceUrl, "EU Transparency register via LobbyFacts.eu")}`
    }
    if (type == "goodonyou"){
        rating = (moduleResponse.rating / 5) * 100
        lrating = Math.floor(moduleResponse.labourRating / 4)
        arating = Math.floor(moduleResponse.animalRating / 4)
        erating = Math.floor(moduleResponse.environmentRating / 4)
        sourceUrl = `https://directory.goodonyou.eco/brand/${moduleResponse.source.split("/")[1]}`
        htmlString += `
        ${pieString(moduleResponse.rating,false,"ratingOutOf",rating,'/5',false)}
<div class="scoreText">
    <div>
<table class="dataTable">
<tr><th data-i18n="goy.lr">Labour Rating</th><td class="ratingOutOf" style="--outOf:'/5';">${lrating}</td></tr>
<tr><th data-i18n="goy.ar">Animal Rating</th><td class="ratingOutOf" style="--outOf:'/5';">${arating}</td></tr>
<tr><th data-i18n="goy.evr">Environment Rating</th><td class="ratingOutOf" style="--outOf:'/5';">${erating}</td></tr>
<tr><th data-i18n="goy.p">Price</th><td class="ratingOutOf" style="--outOf:'/4';">${ moduleResponse.price }</td></tr>
</table>
${sourceStringClose(sourceUrl, "GOODONYOU.ECO")}
        `
    }

    if (type == "bcorp"){

        sourceUrl = `https://www.bcorporation.net/en-us/find-a-b-corp/company/${moduleResponse.slug}`
        iconUrl = pageHost + "/icon/bcorp.svg";

    htmlString += `${notPieString(moduleResponse.score, false, "ratingOutOf", iconUrl, "/140+")}
    <div class="scoreText"><div>
    <table class="dataTable">
    <tr><th data-i18n="common.industry_average">Industry Average Score</th><td class="ratingOutOf" style="--outOf:'/140+'">${ moduleResponse.score_industryAverage }</td></tr>
    <tr><th data-i18n="bcorp.governance"></th><td class="ratingOutOf">${moduleResponse.Governance}</td></tr>
    <tr><th data-i18n="bcorp.workers"></th><td class="ratingOutOf">${moduleResponse.Workers}</td></tr>
    <tr><th data-i18n="bcorp.community"></th><td class="ratingOutOf">${moduleResponse.Community}</td></tr>
    <tr><th data-i18n="bcorp.environment"></th><td class="ratingOutOf">${moduleResponse.Environment}</td></tr>
    <tr><th data-i18n="bcorp.customers"></th><td class="ratingOutOf">${moduleResponse.Customers}</td></tr>
    </table>
    ${sourceStringClose(sourceUrl, "BCORP")}`
    }


    if (type == 'yahoo'){
        formatting = [ ["Negligible","0 - 9.9 "], ["Low","10 - 19.9"], ["Medium","20 - 29.9"], ["High", "30 - 39.9"], ["Severe","40+      "]]

        biasString ='<div class="fullBleed"><div class="esgKey"><h3 data-i18n="esg.gradingscale">Grading Scale</h3><table class="esgKey">'
		for (item in formatting){
			biasString +=`<tr><th><div data-i18n="esg.${formatting[item][0].toLowerCase()}" class="biaslink">${formatting[item][0]}</div></th><td>${formatting[item][1]}</td></tr>`
		}

    scores = [['esg.environmental','Environmental Risk Score',moduleResponse.environmentScore],
              ['esg.governance','Governance Risk Score',moduleResponse.governanceScore],
              ['esg.social','Social Risk Score',moduleResponse.socialScore],
              ['esg.total','Total ESG',moduleResponse.totalEsg]]

        tableString ='<div class="scoreText"><div><table>'
        for (item in scores){
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
    if (type == 'trustscore'){
        sourceUrl = `https://trustscam.com/${moduleResponse.source}`
        htmlString += `
		${pieString(moduleResponse.score, false, false, false, false, false, ratingColorArray[moduleResponse.rating])}
        <div class="scoreText">
            <div>
                <h3>${moduleResponse.score}</h3>
                <p data-i18n="trustsc.${moduleResponse.rating}">${moduleResponse.rating}</p>
                ${sourceStringClose(sourceUrl, "TRUSTSCAM")}`;
    }

    if (type == 'mbfc'){
		questionableString =''
		for (tag in moduleResponse.questionable){
			questionableString += `<span class="questionable">${toTitleCase(moduleResponse.questionable[tag].replaceAll('-', ' '))}</span>`	
		}
        htmlString +=`
		${pieString(moduleResponse.bias, `bias.${moduleResponse.bias}`)}
        <div class="scoreText">
            <div>
                <h3 data-i18n="bias.${ moduleResponse.bias }"></h3>
                <p>${ moduleResponse.description }</p>
				<table>
                ${tableRow(["bias.popularity","Popularity:", moduleResponse.popularity ])}
                ${tableRow(["bias.credibility","Credibility:", moduleResponse.credibility])}
                ${tableRow(["bias.reporting","Reporting:", moduleResponse.reporting ])}
				</table>
				<div><h4 data-i18n="bias.questionable">Reasons for Questionable:</h4><div class="questionableContainer"> ${questionableString}</div></div>
                ${sourceStringClose(moduleResponse.url, "MEDIA BIAS FACT CHECK")}`;
    }

    if (type == 'glassdoor'){
        percentValue = (parseFloat(moduleResponse.glasroom_rating.ratingValue) / 5) * 100;
        htmlString += `
			${pieString(moduleResponse.glasroom_rating.ratingValue, false, "ratingOutOf", percentValue, "/5", moduleResponse.glasroom_rating.ratingCount)}
            <div class="scoreText">
                <div>
            <div class="ratingCount">${ moduleResponse.glasroom_rating.ratingCount } <emphasis class="ratingCount" data-i18n="glassdoor.reviews"></emphasis></div>
            <table class="dataTable">
            <tr><th data-i18n="common.industry_average">Industry Average Score</th><td class="ratingOutOf glass" style="--outOf:'/5'">${ moduleResponse.score_industryAverage }</td></tr>
            <tr><th data-i18n="glassdoor.companyt"></th><td class="ratingOutOf glass" data-i18n="glassdoor.${ moduleResponse.type.toLowerCase().replace(" - ","_").replace(" ","_")}">${ moduleResponse.type }</td></tr>
            <tr><th data-i18n="glassdoor.headquarters"></th><td class="ratingOutOf glass">${ moduleResponse.headquarters }</td></tr>
            <tr><th data-i18n="glassdoor.founded"></th><td class="ratingOutOf glass">${ moduleResponse.founded }</td></tr> 
            <tr><th data-i18n="glassdoor.industry"></th><td class="ratingOutOf glass">${ moduleResponse.industry }</td></tr> 
            <tr><th data-i18n="glassdoor.revenue"></th><td class="ratingOutOf glass">${ moduleResponse.revenue }</td></tr>
            <tr><th data-i18n="glassdoor.size"></th><td class="ratingOutOf glass">${ moduleResponse.size }</td></tr>
            </table>
            ${sourceStringClose(moduleResponse.url, "GLASSDOOR")}`;
    }

    if (type == 'tosdr'){
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

    if (type == 'trustpilot'){
        starString = ''
        numberOfStars = Math.floor(moduleResponse.score);
        remainingStar = moduleResponse.score - numberOfStars;
        sourceUrl = `https://trustpilot.com/review/${ moduleResponse.domain }`
        for (let i = 0; i < 5; i++){
            division = (numberOfStars > i) ? 1 : 0;
            division = (numberOfStars == i) ? remainingStar : division;
            starString += `<span class="coolStar" style="--division:${division};"></span>`
        }
        htmlString += `
        ${notPieString(moduleResponse.score,false,"ratingOutOf",false,'/5', moduleResponse.reviews.total)}
         <div class="scoreText">
             <div>
         <div class="stars">
         ${starString}
         </div>
         <table id="trustChart">
             <tr><th data-i18n="trustpilot.total">Total Reviews</th><td>${ moduleResponse.reviews.total }</td></tr>
             <tr><th data-i18n="trustpilot.one">One Star</th><td>${ moduleResponse.reviews.oneStar }</td></tr>
             <tr><th data-i18n="trustpilot.two">Two Star</th><td>${ moduleResponse.reviews.twoStars }</td></tr>
             <tr><th data-i18n="trustpilot.three">Three Star</th><td>${ moduleResponse.reviews.threeStars }</td></tr>
             <tr><th data-i18n="trustpilot.four">Four Star</th><td>${ moduleResponse.reviews.fourStars }</td></tr>
             <tr><th data-i18n="trustpilot.five">Five Star</th><td>${ moduleResponse.reviews.fiveStars }</td></tr>
         </table>
        ${sourceStringClose(sourceUrl, "TRUST PILOT")}`
    }
    if (type == 'similar'){
        sourceUrl = `https://similarsites.com/site/${ moduleResponse.domain }` 
        similarString = ''
        for (site in moduleResponse.similar){
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
	if (type != 'wbm'){
    if (settingsState["experimentalFeatures"]){
        htmlString += `<button type='button' data-i18n="vote.loadinfo" class='loadInfoButton hideInSmall bottomLeftOfModule' onclick="postLoad(this)"> Load info</button>`
    }
    htmlString += "</section>"
	}
    return htmlString
}


function commentDiagOpen(location=hash){
    // Location, post_type, content
    if (diagOpen) return;
    diagOpen = true;
    if (location == hash){
        var leader = `${Url.get['username']} is posting on ${document.getElementsByClassName("co-name")[0].innerText}`; 
    } else {
        var leader = `${Url.get['username']} is posting on ${location}`; 
    }
    floatDiag = document.createElement("div");
    floatDiag.id = "floatDiag"
    floatDiag.textContent = "oh"
	floatDiag.classList.add("recolorOutlineOnOpen")
	floatDiag.setAttribute("style", "--start:0px;--end:400px;")
    floatDiag.innerHTML = `
    <div id="diag_type" class="">${leader}</div><br/>
    <div style="display:none;" id="diag_tag">${location}</div><br/>
    <div class="commentBox">
		<textarea id="commentBoxInput" name="commentBoxInput" maxlength="512" type="text" ></textarea>
    </div>
    <div onclick="commentClose(true)" class="commentButton commentPost">Post</div>
	<div onclick="commentClose()" class="commentButton commentClose"><div></div></div>`
    body.appendChild(floatDiag)
	backButton.style.transform = "translate(42px,42px)";
	backButton.classList.remove("show")
    console.log(leader)
}

let commentClose = function(post=false){
    diagOpen = false;
    floatDiag = document.getElementById("floatDiag");
    if (post){
        diagTag = document.getElementById("diag_tag").textContent;
        comment_content = document.getElementById("commentBoxInput").value
        if (diagTag.length == "32"){
            console.log("page")
			diagTag = `${document.getElementById('location-url').textContent.replace("/index.json","").replace('/db','db')}`
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
	backButton.style.transform = "";
	backButton.classList.add("show")
    floatDiag.remove()
}

function loginButtonAction(){
    if (Url.get["username"]){
        commentDiagOpen();
		return
	}
    window.open(`${assetsURL}/auth/login`, '_blank').focus()
}


function send_message(type, data){
    var msg = { type: type, data: data };
    if (parent){
	    try {
            parent.postMessage(msg, "*");
	    } catch(e){
	    	console.log(e);
	    }
    } else {
        console.log("parent not found");
    }
}

function forceAllLinksNewTab(){
	document.querySelectorAll('a').forEach(el => {
	    el.setAttribute("target", "_blank");
	});
}

let noOpen = false;
let backButton = document.getElementById('backButton');
let closeButton = document.getElementById('closeButton');
let roundelButton = document.getElementById('roundelButton');
let settingsButton = document.getElementById('settingsButton');
let titleBar = document.getElementById('titlebar');
let coName = document.getElementsByClassName('co-name')[0];
let blank = document.getElementsByClassName('blankForSmall')[0];
let fullPage = document.documentElement;
let content = document.getElementsByClassName('content')[0];
let body = document.body;
let settings = document.getElementById('settings');
let graphButtons = document.getElementById('graphButtons');
let networkGraph = document.getElementById('graph-container');
let sigmacontainer = document.getElementById('sigma-container');
let infoCard = document.getElementById('wikipedia-infocard-frame');
let wikipediaPage = document.getElementById('wikipedia-first-frame');

closeButton.setAttribute('onclick', 'closeIV()');
let closeIV = function(){ send_message("IVClose", "closeButton"); };

var voteNumbers = [2, 4];
const phoneRegex = /Mobile/i;                                                   
var phoneMode = false
                                                                                
if (Url.get["mode"] > 0){
	phoneMode = true;
    if (debug) console.log("mode override ")
} else {
if (phoneRegex.test(navigator.userAgent)){                                      
	phoneMode = true;
} 
}

if (phoneMode){
    if (debug) console.log("[ Invisible Voice ]: phone mode");
    document.getElementsByClassName("content")[0].classList.add("mobile");
    body.classList.add("mobile");
}
if (!phoneMode){
    backButton.classList.add("show");
    closeButton.classList.add("closeExtention");
    settingsButton.style.right = "64px";
    document.getElementsByClassName("content")[0].classList.add("desktop");
    body.classList.add("desktop");
}

if (debug) console.log("[ IV ] Page load")

let spinRoundel = function(){
    roundelButton.animate(
        [ { transform: "rotate(0)" }, { transform: "rotate(360deg)" } ],
        { duration: 500, iterations: 1 })
}


let settingsOffset = settings.firstElementChild.clientHeight;
let setBack = function(x=false){
    if (x == false){
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
    if (phoneMode) backButton.classList.remove("show");
    if (settingsState["experimentalFeatures"]) loginButtonEl.style.display = 'block';
    
    backAction = (x == false) ? "justSendBack()" : x;
    if (x != false){
        backButton.classList.add("show");
        settingsButton.style.display = 'none';
        if (settingsState["experimentalFeatures"])
            loginButtonEl.style.display = 'none';
        roundelButton.style.opacity = '0';
    }
    backButton.setAttribute("onclick", backAction);

    window.scrollTo(0,0);
}

let userPreferences = {}
let buttonState = {}
function toggleButton(buttonId) {
  buttonState[buttonId] = !buttonState[buttonId];
  document.getElementById(`label-${buttonId}`).classList.toggle("pushedButton");
}

let diagOpen = false;
let notificationDialog = function(el){
    if (diagOpen) return;
    setBack("notificationCloseAndSave(false)")
    console.log(el.id)
    id = el.id;
    diagOpen = true;
    var loadedPreferences = {};
    if (settingsState["userPreferences"] != {})
        loadedPreferences = settingsState["userPreferences"];
    const mergedPreferences = { ...defaultUserPreferences, ...loadedPreferences };
    settingsState["userPreferences"] = mergedPreferences;
    userPreferences = mergedPreferences;

    notid = id.replace("-dialog","")
    console.log(notid)
    defaults = defaultUserPreferences[notid]
    floatDiag = document.createElement("div");
    floatDiag.id = "floatDiag"
    if (defaults.type == "range"){
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
          if (userPreferences[notid]["labels"].includes(str)){
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
    (function() {

        function addSeparator(nStr) {
            nStr += '';
            var x = nStr.split('.');
            var x1 = x[0];
            var x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + '.' + '$2');
            }
            return x1 + x2;
        }

        function rangeInputChangeEventHandler(e){
            var rangeGroup = $(this).attr('name'),
                minBtn = $(this).parent().children('.min'),
                maxBtn = $(this).parent().children('.max'),
                range_min = $(this).parent().children('.range_min'),
                range_max = $(this).parent().children('.range_max'),
                minVal = parseInt($(minBtn).val()),
                maxVal = parseInt($(maxBtn).val()),
                origin = e.originalEvent.target.className;

            if(origin === 'min' && minVal > maxVal-1){
                $(minBtn).val(maxVal-1);
            }
            var minVal = parseInt($(minBtn).val());
            $(range_min).html(addSeparator(minVal));


            if(origin === 'max' && maxVal-1 < minVal){
                $(maxBtn).val(1+ minVal);
            }
            var maxVal = parseInt($(maxBtn).val());
            $(range_max).html(addSeparator(maxVal));
        }

     $('input[type="range"]').on( 'input', rangeInputChangeEventHandler);
})();

}

let notificationCloseAndSave = function(save=true){
    if (save){
        diagOpen = false;
        floatDiag = document.getElementById("floatDiag");
        diagType = document.getElementById("diag_type").textContent;
        diagTag = document.getElementById("diag_tag").textContent;
        if (diagType == "range"){
            newMin = floatDiag.getElementsByClassName("range_min")[0].textContent;
            newMax = floatDiag.getElementsByClassName("range_max")[0].textContent;
            userPreferences[diagTag].min = parseInt(newMin);
            userPreferences[diagTag].max = parseInt(newMax);
        } else {
            const activeButtons = defaultUserPreferences[diagTag].labels.filter((buttonId) => buttonState[buttonId]);
            userPreferences[diagTag].labels = activeButtons;
        }
        settingsState["userPreferences"] = userPreferences;
	    settingsStateChange();
    }
    floatDiag.remove()
    setBack();
}

let notificationsDraw = function(){
	if (debug) console.log(` notification set to ${settingsState["notifications"]}`)
    if (settingsState["notifications"]){
        for (const tag of availableNotifications){
            if (document.getElementById(`${tag}-bell`) == null){
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
    } else {
        // check for if toggles are there already, remove them if they are 
        document.querySelectorAll(".notificationBell").forEach(x => x.remove());
        document.querySelectorAll(".notificationDialog").forEach(x => x.remove());
    }
}

function settingTemplate(id, i18n, title, state="skip"){
    var el = document.createElement("div")
    el.id = id
    el.classList.add("switchItem")
    el.innerHTML = `
        <h2 data-i18n="${i18n}">${title}</h2>
            <label class="switch">
                <input type="checkbox">
            <span class="slider round"></span>
        </label> `
    if (state != "skip"){
        el.getElementsByTagName("input")[0].checked = state;
    }
    settings.appendChild(el)
}


function addSettings(){
    // Language Picker
    var languagePicker = document.createElement("label");
    languagePicker.classList.add("languageSelect")
    let languagePickerOptions = `<option value="-">-</option>`
    for (lang in languages){
        languagePickerOptions += `<option value="${languages[lang]}">${languages[lang].toUpperCase()}</option>`
    }
    languagePicker.innerHTML = `<h2 data-i18n="common.language">Language</h2>
                                <select id="langselect" title="Language Picker">${languagePickerOptions}</select>`

    settings.appendChild(languagePicker)

    settingTemplate("onScreen", "settings.dashboard", "Keep dashboard on screen", settingsState["keepOnScreen"])
    settingTemplate("permaDark", "settings.darkMode", "Dark Mode", settingsState["darkMode"])
    settingTemplate("bobbleDisable", "settings.bobbleDisabled", "Disable Bobble", settingsState["bobbleOverride"])
    settingTemplate("debug-banner", "settings.debugBanner", "Debug Mode", settingsState["debugMode"])
    settingTemplate("externalPosts-banner", "settings.externalPosts", "Experimental Features", settingsState["experimentalFeatures"])

    // Dismissed Notifications
    var dissmissedNotifications = document.createElement("div");
    dissmissedNotifications.id = "dissmissedNotifications";
    dissmissedNotifications.innerHTML = `<h2>You have dismissed the following</h2>
        <ul style="display:inline;" id="dismissedContainer"></ul>`
    dissmissedNotifications.style.display = "none";
    dissmissedNotifications.classList.add("switchItem");
    settings.appendChild(dissmissedNotifications);

    // Notifications
    var notifications = document.createElement("div");
    notifications.id = "notifications-shade";
    notifications.classList.add("switchItem");
    notifications.innerHTML = `<h2 data-i85n="settings.notifications">Notifications</h2>
        <div id="notificationsContainer" style="display:flex;">
        <img id="notificationsCache" style="display:none;width:24px;height:24px;position:relative;transform:translate(-20px,13px);">
        <label class="switch"><input type="checkbox"><span class="slider round"></span></label></div></div>`
    settings.appendChild(notifications);

    if (settingsState["notifications"]){
        let notifications = document.getElementById("notifications-shade")
        cacheButton = document.getElementById("notificationsCache");
        cacheButton.style.display = "block";
        tagList = settingsState["notificationsTags"] || "";
    }
    
    let priorityList = document.createElement("div");
    priorityList.id ="priority-list";
    listString = ''
    for (item in translate){
        listString += `<li data-id="${item}">${translate[item]}</li>`
    }
    priorityList.innerHTML = `
     <h2 data-i18n="settings.priorityTitle">Prioritise Modules</h2>
     <div data-i18n="settings.priorityOrder">Drag to re-order modules</div>
       <ul id="sortlist" class="slist">${listString}</ul>`
    settings.appendChild(priorityList)
}

let loadSettings = function(x) {
    body.classList.add("settingsOpen");
    if (settings.style.bottom == "0px"){
        closeSettings();
        send_message("IVClicked", "unsettings");
        setBack();
    } else {
    settings.style.bottom = "0";
    settings.style.top = `${settingsOffset}`;
    titleBar.style.backgroundColor = "transparent";
    titleBar.style.position = "fixed";
    titleBar.style.top = "0";
    if (phoneMode){
        backButton.style.visibility = "visible";
        backButton.style.display = "inherit";
        backButton.style.order = "unset";
    }
    if (!phoneMode){
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
}

let loadNetworkGraph = function(x) {
    backButton.style.borderColor = 'var(--c-border-color)';
    backButton.style.backgroundColor = 'var(--c-background)';
    networkGraph.style.visibility = 'visible';
    sigmacontainer.style.visibility = 'visible';
    sigmacontainer.style.width = "100vw";
    sigmacontainer.style.height = "100vh";
    sigmacontainer.style.position = "fixed";
    sigmacontainer.style.zIndex = "4";
    networkGraph.classList.add("expanded");
    if (phoneMode){
        noOpen = true;
    }
    if (!phoneMode){
        closeButton.style.display = "none";
    }
    titleBar.style.position = "";
    titleBar.style.top = "0";
    graphButtons.style.top = "12px";
    window.scrollTo(0,0);
    document.getElementsByTagName('content');
    send_message("IVClicked", "antwork");
    setBack('closeNetworkGraph()');
}

let closeNetworkGraph = function(x){
    networkGraph.style.visibility = 'hidden';
    if (phoneMode){
        noOpen = false;
    }
    sigmacontainer.style.width = "1px";
    sigmacontainer.style.height = "1px";
    networkGraph.classList.remove("expanded");
    graphButtons.style.top = "";
    send_message("IVClicked", "unwork");
    setBack();
}

let justSendBack = function(x) {
    bw = backButton.getBoundingClientRect()['width'];
    send_message("IVClicked", "back");
}


let openGenericPage = function(x){
    if (noOpen){
        return;
    }
    content.classList.add('somethingIsOpen');
    body.classList.add('somethingIsOpen');
    noOpen = true;
    backButton.style.backgroundColor = 'var(--c-background)';
    if (x == "wikipage" || x == "infocard"){
        if ( x == "infocard"){
            send_message("IVClicked", "wikipedia-infocard-frame");
            infoCard.classList.add('expanded');
        } else {
            graphButtons.setAttribute("style", "");
            wikipediaPage.classList.add('expanded');
            send_message("IVClicked", "wikipedia-first-frame");
        }
    } else {
        element = document.getElementById(x)
        var bb = element.getBoundingClientRect()
        var startW = bb['width'];
        var startH = bb['height'];
        element.style.width = startW + "px";
        element.style.transform = "translate( -" + bb['x'] + "px, -" + bb['y'] + "px)";
        element.style.top = (bb['y'] - 60) + "px";
        element.style.left = bb['x'] + "px";
        element.classList.add('expanded');
        blank.style.order = element.style.order;
        blank.style.display = "block";
        blank.style.height = startH + "px";
        blank.style.width = startW + "px";
        blank.style.margin = "6px";
    }

    setBack(`closeGenericPage("${x}")`);
}

let closeGenericPage = function(x){
    switch (x){
        case "wikipage":
            wikipediaPage.classList.remove('expanded');
            break;
        case "infocard":
            infoCard.classList.remove('expanded');
            break;
        default:
            element = document.getElementById(x)
            element.style.height =
            element.style.width = 
            element.style.transform =
            element.style.top =
            element.style.left = "";
            blank.style.order = 0;
            blank.style.display = "none";

            element.classList.remove('expanded');
            break;
    }
    content.classList.remove('somethingIsOpen');
    body.classList.remove('somethingIsOpen');
    noOpen = false;
    setBack();
}

let closeSettings = function(x) {
    body.classList.remove("settingsOpen");
    if (phoneMode){
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
  console.log("notifications " + settingsState["notifications"]);
}

function notificationBell(ppId){
    console.log(ppId)
    if (ppId == "cacheClear"){
        settingsState["userPreferences"] = defaultUserPreferences;
        settingsStateChange();
        return
    }
    tagList = "";
    document.querySelectorAll(".notificationBell").forEach(function (x) {
        state = x.getElementsByTagName("input")[0].checked;
        if ((x.id === ppId && !state) || (x.id !== ppId && state))
          tagList += x.id.replace(/-bell/, "");
    });
    console.log(tagList);
    send_message("IVNotificationsTags", tagList);
    settingsState["notificationsTags"] = tagList;
    settingsStateChange()
}

function slist (target) {
  // (A) SET CSS + GET ALL LIST ITEMS
  target.classList.add("slist");
  $('#sortlist').sortable({
        group: 'iv-list',
        animation: 200,
        ghostClass: "sortghost",
	    store: {
	    	/**
	    	 * Get the order of elements. Called once during initialization.
	    	 * @param   {Sortable}  sortable
	    	 * @returns {Array}
	    	 */
	    	get: function (sortable) {
                var order = (settingsState["listOrder"] != defaultOrderString) ? settingsState["listOrder"].split('|') : defaultOrder;
                let missingItems = defaultOrder.filter(item => !order.includes(item));
                // Add missing items to IVListOrder
                order = order.concat(missingItems);
	    		return order;
	    	},

	    	/**
	    	 * Save the order of elements. Called onEnd (when the item is dropped).
	    	 * @param {Sortable}  sortable
	    	 */
	    	set: function (sortable) {
	    		var order = sortable.toArray();
	    		settingsState["listOrder"] = order.join('|');
                if (settingsState["notifications"]) {
                  tagList = "";
                  document.querySelectorAll(".notificationBell").forEach(function(x){ 
                      if (x.getElementsByTagName("input")[0].checked)
                          tagList += x.id.replace(/-bell/,"");
                  })
                  send_message("IVNotificationsTags", tagList);
                }
				settingsStateChange();
	    	}
	    }
  });
  //if (debug) console.log($('#sortlist').sortable('toArray'));
  

}

function toggleToggle(type){
	console.log(`setting ${type}`)
    if (type == "notificationsContainer"){
        toggleNotifications(settingsState["notifications"])    
    } else {
	    settingsState[type] = !settingsState[type];
	    console.log(`setting ${type} ${settingsState[type]}`)
    }
	settingsStateChange()
}

// {value: items[it].value, label: items[it].innerHTML}
function recalculateList(){
    if (debug) console.log("Recalculating List ...")
  var propertyOrder = (settingsState["listOrder"] != "") ? settingsState["listOrder"].split('|') : defaultOrder;
  let target = document.getElementById("sortlist")
  let items = target.getElementsByTagName("li")

  for (let x = 0; x < propertyOrder.length; x++){
    let value = propertyOrder[x];
    if (items[x] !== undefined){
        items[x].setAttribute("data-i18n", translate[value]);
        items[x].setAttribute("data-id", value);
        if (value == "networkgraph"){
            if (document.getElementById("graph-box")){
                [...document.styleSheets[3].cssRules].find(y=> y.selectorText=='#graph-box').style.order = x + 5;
            }
            if (document.getElementById("wikipedia-infocard-frame")){
                [...document.styleSheets[3].cssRules].find(y=> y.selectorText=='#wikipedia-infocard-frame').style.order = x + 5;
            }
        } else {
            [...document.styleSheets[3].cssRules].find(y=> y.selectorText==`#${value}`).style.order= x + 5;
            if (document.getElementById(value)){
                thiselement = document.getElementById(value);
                if (phoneMode && value != "carbon"){
                    thiselement.setAttribute('onclick', `openGenericPage("${value}")`);
                }
            }
        }
    }
  };
  
  if (debug) console.log("sorted")
  if (document.getElementById('graph-box') != null){
      document.getElementById('graph-box').setAttribute("onclick","loadNetworkGraph()");
  }
  if (document.getElementById("wikipedia-infocard-frame")){
      document.getElementById("wikipedia-infocard-frame").setAttribute('onclick', `openGenericPage("wikipedia-infocard-frame")`);
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

document.addEventListener('mouseup', function (event) {
  if (event.target.matches("html")) return;
  if (event.target.matches("#floatDiag")) return;
  if (event.target.matches("#floatDiagSave")) {
      notificationCloseAndSave()
      return
  };

  var tid = event.target.id;
  
  if (tid == 'indexRefresh') send_message("IVIndexRefresh", "please");
  if (tid == 'notificationsCache') notificationBell("cacheClear")
  if (tid == 'backButton') send_message("IVClicked", event.target.parentElement.id);

  if (event.target.classList.contains('invisible-disclaimer-title'))send_message("IVClicked", "disclaimer");
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
  var ppId = event.target.parentElement.parentElement.id;

  if (event.target.parentElement.parentElement.matches('.notificationBell'))
      notificationBell(ppId)

  if (ppId in toggles) toggleToggle(toggles[ppId])

}, false);

window.addEventListener('message', function(e){
    if (e.data.message === undefined) return
    console.log(e.data);
    const decoded = e.data
    switch(decoded.message){
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

function postalVote(direction, location, status){
    if (direction == status) direction = "un";
    console.log(direction)
    if (direction == "up") directionType = "IVPostVoteUp"
    if (direction == "down") directionType = "IVPostVoteDown"
    if (direction == "un") directionType = "IVPostVoteUnvote"
    if (direction == "comment"){
        commentDiagOpen(location)
    } else {
       send_message(directionType, location) 
    }
   
}

const moduleExceptions = {
	"trustpilot": "trust-pilot",
	"opensecrets": "opensec",
	"tosdr": "tosdr-link",
	"similar": "similar-site-wrapper",
	"trustscore": "trust-scam",
}
function moduleUpdate(mesg, comment=false){
    location_str = mesg["location"];
	var elmt = $(`[data-location='${location_str}']`)[0];
	if (typeof(elmt) == 'undefined'){
	    elmt = $(`[data-location='${mesg.uid}']`)[0];
	}
	if (typeof(elmt) == 'undefined'){
		console.log(mesg)
		return
	}
	if (comment){
		data = mesg
		sVB = elmt.getElementsByClassName("smallVoteBox")[0]
        if (typeof(sVB) == 'undefined') return
		contentText = $('<div/>').html(data.content).text()
        if (debug) console.log(contentText)
        if (elmt.getElementsByClassName("smallCommentBox").length > 0){
            elmt.getElementsByClassName("smallCommentBox")[0].remove()
        }
		commentBox = document.createElement("div")
		commentBox.classList.add("smallCommentBox")
		commentBox.setAttribute("data-location", mesg["uid"])
		commentBox.innerHTML = `
		<div>${contentText}<a class="tinysource" target="_blank" href="https://assets.reveb.la/#user" >${data.author}</a></div>
        ${voteBox(data.uid, data, "smallerVoteBox hideInSmall")}`

		sVB.parentNode.insertBefore(commentBox, sVB)
        recalculateList()
        translator.translatePageTo()
		return
	}

	if (location_str.length == 36 && elmt.tagName != "SECTION" ){
		className = "smallerVoteBox hideInSmall"	
		console.log(mesg)
		console.log(elmt)
	} else {
		className = "smallVoteBox bottomLeftOfModule hideInSmall"
	}
    if (elmt.getElementsByClassName("loadInfoButton").length > 0){
        elmt.getElementsByClassName("loadInfoButton")[0].remove();
    } else {
        elmt.getElementsByClassName(className.split(" ")[0])[0].remove();
    }
    

	elmt.innerHTML += voteBox(location_str, mesg, className)

	if (mesg.comment_total > 0){
		send_message("IVGetPost", mesg.top_comment)
	}
    recalculateList()
    translator.translatePageTo()
}



// Voting
let voteUrl = "https://assets.reveb.la";
var tempVoteDirection = "";
var tempInvert = false;
var invert = null;
var hash;

function vote(direction, thisOne=false){
    // First look for hash
    site = document.getElementsByClassName("co-name")[0].textContent.replace(".", "")
    hash = document.getElementById("graphLoc").innerText.split('/')[2].replace('.json','');

    voteRequest(hash, direction)
}

async function voteLoad(){
    site = document.getElementsByClassName("co-name")[0].textContent.replace(".", "")
    hash = document.getElementById("graphLoc").innerText.split('/')[2].replace('.json','');
    send_message("IVVoteStuff", hash);
}
async function voteRequest(hash, direction){
    if (debug) console.log("vote request: " + hash + " " + direction);
    send_message("IVVoteStuff", direction)
}
function voteUpdate(decoded=false){
	if (!decoded){ return }
    console.log(decoded)
	var IVLike = document.getElementById('Invisible-like')
	var IVDislike = document.getElementById('Invisible-dislike')

    direction = decoded.voteStatus;

    dc = lc = "";

    if (direction == "up") lc = "green";
    if (direction == "down") dc = "green";

	IVLike.setAttribute("style", `--count:'${decoded.utotal.toString()}';color:${lc};`);
	IVDislike.setAttribute("style", `--count:'${decoded.dtotal.toString()}';color:${dc};`);
    lF = (decoded.voteStatus == "up" ) ? "vote('un')" : "vote('up')";
    dF = (decoded.voteStatus == "down" ) ? "vote('un')" : "vote('down')";
    IVLike.setAttribute("onclick", lF )
    IVDislike.setAttribute("onclick", dF)
}

function boycott(){
  send_message("IVBoycott", "please");
  console.log("Boycott")
}

function postLoad(el){
    elementId = el.parentElement.getAttribute("data-location").replace(pageHost, "").replace("/ds/", "").replace(".json", "");
    send_message("IVPostStuff", elementId);
}

const sort_by = (field, reverse, primer) => {
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



pageSetup();
content.addEventListener("DOMNodeInserted", function(event){
	scrollIntoPlace()
});
