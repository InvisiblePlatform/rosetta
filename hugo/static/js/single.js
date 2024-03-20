const pageHost = `${window.location.protocol}//${window.location.host}`
const pageCoreLocation = `${pageHost}${document.getElementById('location-url').textContent}`;
const assetsURL = `https://assets.reveb.la`

const languages = ["ar", "fr", "eo", "en", "es", "de", "zh", "hi", "ca"];
var translator = new Translator({
    persist: true,
    // debug: true,
    filesLocation: `${pageHost}/i18n`
});

var loggedIn = false;

var settingsState;
var defaultSettingsState = {
	"preferred_language": "en",
	"loggedIn": false,
	"debugMode": false,
	"darkMode": false,
	"keepOnScreen": false,
	"userPreferences": [],
	"bobbleOverride": false,
	"notifications": false,
	"notificationsTags":[],
	"listOrder": "",
	"experimentalFeatures": false,
}

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

function pageSetup(){
    settingsStateLoad()
    loadPageCore()
    addSettings()
    if (settingsState["experimentalFeatures"] == true) {
        loginCheck()
        loadPageExternal()
    }
    scrollIntoPlace()
}


function settingsStateLoad(){
    settingsState = (typeof(localStorage.tempSettingsStore) == 'undefined') ? defaultSettingsState : JSON.parse(localStorage.tempSettingsStore)
    console.log(settingsState)
	settingsStateApply(settingsState)
}

function resetSettings(){
	settingsState = defaultSettingsState;
	settingsStateChange()
}

function settingsStateApply(newSettingsState=defaultSettingsState){
	settingsState = newSettingsState;
	translator.translatePageTo(settingsState["preferred_language"]);
	if (settingsState["debugMode"] == true) {
	    document.lastChild.classList.toggle("debugColors");
	    debug = true;
	}
    if (settingsState["darkMode"] == "true"){
        document.lastChild.classList.toggle('dark-theme');
        document.getElementById('backButton').style.backgroundImage = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTciIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNyAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExLjgzMzMgMTMuMzMzNEw2LjUgOC4wMDAwNEwxMS44MzMzIDIuNjY2NzEiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIvPgo8L3N2Zz4K')";
    }
}

function settingsStateChange(){
	send_message("IVSettingsChange", settingsState);
	localStorage.tempSettingsStore = JSON.stringify(settingsState)
	if (debug) console.log("Settings state changed")
	if (debug) console.log(settingsState);
}

translator.fetch(languages).then(() => {
    translator.translatePageTo();
    registerLanguageToggle();
});

function registerLanguageToggle() {
    var select = document.getElementById("langselect");
    for (var i = 0, len = select.childElementCount; i<len; ++i ){
        if (select.children[i].value == settingsState["preferred_language"]) {
            select.selectedIndex = i;
        };
    }
    select.addEventListener("change", evt => {
      var language = evt.target.value;
      if (language == "-" ){ return; };
      translator.translatePageTo(language);
	  settingsState["preferred_language"] = language;
	  settingsStateChange();
    });
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
const loadPageCore = async () =>{
    try {
        const dataf = await fetch(pageCoreLocation)
        const response = await dataf.json()
        localString = ''
        moduleData = await response;
        for (module of response.core){
            if (module.url != 'local'){
				await addModule(type=module.type, url=`${pageHost}/ds/${module.url}`)
					.then((string) => localString += string);
            }
        }
        if ("political" in response)
            localString += await addLocalModule(type="political", data=response.political)
        if ("social" in response) 
            localString += await addLocalModule(type="social", data=response.social)

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
			addLocalModule(type="post", data=data)
		}
	} else {
		if (debug) console.log(data)
	}
}

const loadPageExternal = async () =>{
    postLocation = `${document.getElementById('location-url').textContent.replace("/index.json","").replace('/db','db')}`
	send_message("IVGetPost", postLocation)
}

var loginButtonEl;
function loginCheck() {
    loginButtonEl = document.createElement("button"); 
    loginButtonEl.innerHTML = "<div></div>"
    loginButtonEl.id = "loginButton";
    loginButtonEl.style.right = '128px';
    loginButtonEl.setAttribute("type", "button");
    loginButtonEl.setAttribute("onclick", "loginButtonAction()");
    settingsButton.parentNode.insertBefore(loginButtonEl,settingsButton);

	console.log(Url.get["username"])
    if (Url.get["username"]){
        loggedIn = true;
		settingsState["loggedIn"] = true;
    } 
}
// load modules for matching data

const types = {
    "trustscore": { "id": "trust-scam", "label": "Trust Scam", "translate": "trustsc.title" },
    "mbfc": { "id": "mbfc", "label": "Media Bias", "translate": "mbfc.title" },
    "glassdoor": { "id": "glassdoor", "label": "Employee Rating", "translate": "glassdoor.title" },
    "similar": { "id": "similar-site-wrapper", "label": "Similar Sites", "translate": "similar.title" },
    "tosdr": { "id": "tosdr-link", "label": "Privacy", "translate": "tosdr.title" },
    "trustpilot": { "id": "trust-pilot", "label": "Trust Pilot", "translate": "trustpilot.title" },
    "yahoo": { "id": "yahoo", "label": "Esg Rating", "translate": "esg.title" },
    "post": { "id": "post", "label": "User Added", "translate": "user.moduletitle" },
    "bcorp": { "id": "bcorp", "label": "Bcorp Rating", "translate": "bcorp.title" },
    "goodonyou": { "id": "goodonyou", "label": "Goodonyou Rating", "translate": "goy.title" },
    "wbm": { "id": "wbm", "label": "WBM", "translate": "wbm.title" },
    "cta": { "id": "cta", "label": "Call to Action", "translate": "cta.title" },
    "opensecrets": { "id": "opensec", "label": "OpenSecrets", "translate": "os.title" },
    "lobbyeu": { "id": "lobbyeu", "label": "LobbyFacts.eu", "translate": "lb.title" },
	"post": { "id": "post", "label": "User Content", "translate": "user.moduletitle"},
    "social": { "id": "social-wikidata", "label": "Social Media", "translate": "social.title" },
    "political": { "id": "political-wikidata", "label": "Political Leanings", "translate": "political.title" },
    "politicali": { "id": "politicali-wikidata", "label": "Political Ideology", "translate": "wikidata.polideology" },
}

function tableRow(item){
    return `<tr><th data-i18n="${item[0]}">${item[1]}</th><td>${item[2]}</td></tr>`
}
function sourceStringClose(href, text){
	return `<a target="_blank" class="source" href='${href}'>${text}</a></div> </div>`
}

const contentContainer = document.getElementsByClassName("content")[0]

var localString = ''

async function addLocalModule(type=undefined,data=undefined){
    if (type == undefined || data == undefined) return; 
    if (type in types) {} else {return;}


    // Genericising needed
    // console.log(data)
    if (type == "social"){
        htmlString = `<section class="contentSection" id="${types[type].id}">
        <h2 class="sectionTitle"><div data-i18n="${types[type].translate}">${types[type].label}</div><div class="subname"></div></h2>
        <section id="social-wikidata-links" class="collapsible-content"><table>`
        for (label in data){
            for (item in data[label]){
                htmlString += `<tr><th>${label.replaceAll(" id","").replaceAll(" username","")}</th>
                    <td><a class="spacelinks" href="${data[label][item]['url']}">${data[label][item]['url']}</a><a class="minisource" target="_blank" href="https://wikidata.org/"></a></td>
                </tr>`
            }
        }
        htmlString += `</table></section></section>`
    }
    if (type == "political"){
        lang = "enlabel"
        for (label in data){
            labelId = (label == "polalignment") ? "political-wikidata" : "politicali-wikidata";
            actLabel = (label == "polalignment") ? "Political Alignments" : "Political Ideologies";
            htmlString = `<section class="contentSection" id="${labelId}">
                <h2 class="sectionTitle"><div data-i18n="wikidata.${label}">${actLabel}</div></h2>
<div class="scoreText fullBleed"><div>`
            for (item in data[label]){
                htmlString += `<tr><th></th>
                    <h3>${data[label][item]["sourceLabels"][lang]} <a class="spacelinks" href="https://wikidata.org/wiki/${data[label][item]['dataId']}">${data[label][item]['data'][lang]}</a><a class="minisource" target="_blank" href="https://wikidata.org/wiki/${data[label][item]['dataId']}"></a></h3>`
            }
            htmlString += `
     <a target="_blank" class="hideInSmall source" href="https://wikidata.org/wiki/${data[label][item]['dataId']}">WIKIDATA</a>
            </div></div></section>
            `
        }
    }
    if (type == 'post'){
        postContent = $('<div/>').html(data.content).text()
		dataLocationString = data.uid.replace(pageHost, "").replace("/ds/", "").replace(".json", "");
        htmlString = `<section class="contentSection" id="${types[type].id}" data-location="${dataLocationString}"
        <h2 class="sectionTitle"><div data-i18n="user.moduletitle">User Content</div><div class="subname">(${data.location})</div></h2>
         <div class="scoreText fullBleed userText">
             <div>${postContent}<a class="source" target="_blank" href="https://assets.reveb.la/#user" >${data.author}</a>
            </div>
         </div>
		<ul class="smallVoteBox bottomLeftOfModule hideInSmall">
			<li><a target="_blank" onclick="postalVote('up','${data.uid}', '${data.status}')" >Up</a><div>(${data.up_total})</div></li>
			<li><a target="_blank" onclick="postalVote('down','${data.uid}', '${data.status}')" >Down</a><div>(${data.down_total})</div></li>
			<li><a target="_blank" onclick="postalVote('comment','${data.uid}', '${data.status}')" ><div>Comment </a>(${data.comment_total})</div></li>
            </ul>
        </section>`

    }
    return htmlString
}

function opsTd(r){
    return `<td style="--size: calc(${r.percent.replace("%", "")}}/100);">
            <span class="data">${r.entity}</span>
            <span class="tooltip">${r.entity}<br>
                (${r.amount})</span>
            </td>`
}

async function addModule(type=undefined,url=undefined){
    if (type == undefined || url == undefined) return; 
    // needs some mechanic for caching when we switch to graph mode
    const moduleData = await fetch(url);
    const moduleResponse = await moduleData.json()
    //console.log(moduleResponse)
	dataLocationString = url.replace(pageHost, "").replace("/ds/", "").replace(".json", "");
    if (type in types) {} else {return;}
    // Genericising needed
    htmlString = `<section id="${types[type].id}" class="contentSection" data-location="${dataLocationString}">
        <h2 class="sectionTitle"><div data-i18n="${types[type].translate}">${types[type].label}</div><div class="subname">(${moduleResponse.source})</div></h2>
    `

    if (type == "opensecrets"){
        //console.log(moduleResponse)
        htmlString += `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/charts.css/dist/charts.min.css">`
        if ("bill_most_heading" in moduleResponse){
            htmlString += `
            <p class="flavourText"><b>${moduleResponse.bill_most_heading}</b></p>
            <p class="flavourText"><a href='${moduleResponse.bill_most_url}'>${moduleResponse.bill_most_title} (${moduleResponse.bill_most_code})</a></p>`
        }
        htmlString += '<div class="scoreText fullBleed"><div><p data-i18n="os.disclaimer"></p><br>'
        if ("cycle_year" in moduleResponse){
            htmlString += `<p>Data is true of the ${moduleResponse.cycle_year} cycle</p> <br>`
            if ("contributions_rank" in moduleResponse) htmlString+= `<p><b>Contributions Rank:</b> ${moduleResponse.contributions_rank}</p>`
            if ("contributions_amount" in moduleResponse) htmlString+= `<p><b>Contributions Amount:</b> ${moduleResponse.contributions_amount}</p>`
            if ("lobbying_rank" in moduleResponse) htmlString+= `<p><b>Lobbying Rank:</b> ${moduleResponse.lobbying_rank}</p>`

            htmlString+= '<br> <div class="charts">'
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

            }

            if ("lobbycards" in moduleResponse){
                htmlString += "<h3 data-i18n='opensec.lobbying'> Lobbying </h3>"
                for (card of moduleResponse.lobbycards){
                    htmlString += `
                            <div class="openSecLobbyCardContainer"><h4>${card.year}</h4><h5>${card.dollars}</h5>
                            <div><b data-i18n='opensec.lobbistingov'>Lobbyists who worked in government</b><div> ${card.held.count} (${card.held.percent})</div></div>
                            <div><b data-i18n='opensec.lobbistnotingov'>Lobbyists who haven't worked in government</b><div> ${card.notheld.count} (${card.notheld.percent})</div></div>
                            </div>
                    `
                }
                htmlString += "</div>"
            }

        }
        htmlString += `
                <a class="source hideInSmall" target="_blank" href="https://www.opensecrets.org/orgs/name/summary?id=${moduleResponse.osid}">OPENSECRETS</a>
                </div>
                </div>
                </div>
                `
    }

    if (type == "wbm"){
		wbmstring = ''
        for (module in moduleResponse.modules){
            file = moduleResponse.modules[module].file;
            trans = file.split("_").slice(1).join("-").toLowerCase()
            fileName = file.split("_").slice(1).join(" ")
			wbmstring += `<section id="wbm-${trans}" class="contentSection">
            <h2 class="sectionTitle"><div data-i18n="wbm.${trans}">${fileName}</div><div class="subname">(${moduleResponse.source})</div></h2>
            <div class="pie hideTilExpanded"></div>
            `
            additionalString = ''
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
	            	  wbmstring += `<score class="ratingOutOf" style="--outOf:'/ ${outOf}';">${score}</score>
							<div class="pie hideTilExpanded animate" style="--c:var(--chart-fore);--p:${percent};"></div>
							<div class="scoreText fullBleed"><div><table>`
                  }
                }
            }
            wbmstring += `${additionalString}</table> <a target="_blank" class="source" href='{{- $source.Get "source" -}}'>WORLDBENCHMARK</a></div> </div></section>`
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
        <div class="scoreText">
        <div>
        <h3>${moduleResponse.author}<span class="author" data-i18n="common.author"> - Author</span></h3>
        <p>${moduleResponse.description}</p>
        </div>
        <div><div><h4> Positive </h4>${positiveString}</div><div><h4> Negative </h4> ${negativeString}</div></div></div>`
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
        htmlString += `<div class="scoreText fullBleed"><div> <table>`
		for (item in options){
			htmlString += tableRow(options[item])
		}
		htmlString += `</table>
			<a class="source" target="_blank" href="https://lobbyfacts.eu/datacard/org?rid=${moduleResponse.eu_transparency_id}">EU Transparency register via LobbyFacts.eu</a>
		</div></div>`
    }
    if (type == "goodonyou"){
        rating = (moduleResponse.rating / 5) * 100
        lrating = Math.floor(moduleResponse.labourRating / 4)
        arating = Math.floor(moduleResponse.animalRating / 4)
        erating = Math.floor(moduleResponse.environmentRating / 4)
        htmlString += `
<div class="pie hideTilExpanded"></div>
<score class="ratingOutOfFive">${moduleResponse.rating}</score>
<div class="pie hideTilExpanded animate" style="--c:var(--chart-fore);--p:${rating};"></div>
<div class="scoreText fullBleed">
    <div>
<table class="dataTable">
<tr><th data-i18n="goy.lr">Labour Rating</th><td class="hideInSmall ratingOutOf" style="--outOf:'/5';">${lrating}</td></tr>
<tr><th data-i18n="goy.ar">Animal Rating</th><td class="hideInSmall ratingOutOf" style="--outOf:'/5';">${arating}</td></tr>
<tr><th data-i18n="goy.evr">Environment Rating</th><td class="hideInSmall ratingOutOf" style="--outOf:'/5';">${erating}</td></tr>
<tr><th data-i18n="goy.p">Price</th><td class="hideInSmall ratingOutOf" style="--outOf:'/4';">${ moduleResponse.price }</td></tr>
</table>
<a class="source" target="_blank" href="https://directory.goodonyou.eco/brand/na">GOODONYOU.ECO</a>
</div>
</div>

        `
    }

    if (type == "bcorp"){

    htmlString += `<img class="iconclass" src="${pageHost}/icon/bcorp.svg"/>
    <score class="ratingOutOf hideTilExpanded" style='--outOf:"/140+";'>${moduleResponse.score}</score>
    <div class="scoreText fullBleed"><div>
    <table class="dataTable hideInSmall">
    <tr><th data-i18n="common.industry_average">Industry Average Score</th><td class="ratingOutOf" style="--outOf:'/140+'">${ moduleResponse.score_industryAverage }</td></tr>
    <tr><th data-i18n="bcorp.governance"></th><td class="ratingOutOf">${moduleResponse.Governance}</td></tr>
    <tr><th data-i18n="bcorp.workers"></th><td class="ratingOutOf">${moduleResponse.Workers}</td></tr>
    <tr><th data-i18n="bcorp.community"></th><td class="ratingOutOf">${moduleResponse.Community}</td></tr>
    <tr><th data-i18n="bcorp.environment"></th><td class="ratingOutOf">${moduleResponse.Environment}</td></tr>
    <tr><th data-i18n="bcorp.customers"></th><td class="ratingOutOf">${moduleResponse.Customers}</td></tr>
    </table>
    <a class="source hideInSmall" target="_blank" href="https://www.bcorporation.net/en-us/find-a-b-corp/company/${moduleResponse.slug}">BCORP</a>
    </div>
    </div>`
    }


    if (type == 'yahoo'){
        formatting = [ ["Negligible","0 - 9.9 "], ["Low","10 - 19.9"], ["Medium","20 - 29.9"], ["High", "30 - 39.9"], ["Severe","40+      "]]
        // 0-10, 10-20, 20-30, 40+
        biasString =''
		for (item in formatting){
			biasString +=`<tr><th><div data-i18n="esg.${item[0].toLowerCase()}" class="biaslink">${item[0]}</div></th><td>${item[1]}</td></tr>`
		}
        htmlString += `
<div class="pie hideTilExpanded"></div>
<score class="biaslink">${moduleResponse.totalEsg}</score>
<div class="scoreText fullBleed"> 
<div class="ratingOutOf hideTilExpanded" style="--outOf:'/40+';text-align: center;" >${moduleResponse.totalEsg}</div>
<table class="leftBorder">
<tr>
    <th data-i18n='esg.environmental' >Environmental Risk Score</th> 
    <td class="" style="--outOf:'/ 40+';">${moduleResponse.environmentScore}</td>
</tr>
<tr>
    <th data-i18n='esg.social' >Social Risk Score</th>
    <td class="" style="--outOf:'/ 40+';">${moduleResponse.socialScore}</td>
</tr>
<tr>
    <th data-i18n='esg.governance' >Governance Risk Score</th>
    <td class="" style="--outOf:'/ 40+';">${moduleResponse.governanceScore}</td>
</tr>
<tr>
    <th data-i18n='esg.total'>Total ESG</th>
    <td class="" style="--outOf:'/ 40+';">${moduleResponse.totalEsg}</td>
</tr>
</table>
</div>
<div class="scoreText">
<div class="esgKey"><h3 data-i18n="esg.gradingscale">Grading Scale</h3>
<table class="esgKey">
${biasString}
</table>
</div>
<a target="_blank" class="source hideInSmall" href="https://finance.yahoo.com/quote/${moduleResponse.ticker}/sustainability">SUSTAINALYTICS, INC VIA YAHOO! FINANCE</a>
</div>
`
    }
    if (type == 'trustscore'){
        htmlString += `
        <div class="pie hideTilExpanded"></div>
        <score class="biaslink">${moduleResponse.score}</score>
        <div class="scoreText">
            <div>
                <h3>${moduleResponse.score}</h3>
                <p data-i18n="trustsc.${moduleResponse.rating}">${moduleResponse.rating}</p>
                <a target="_blank" class="source blanksource" href="https://trustscam.com/${moduleResponse.source}">TRUSTSCAM</a>
            </div>
        </div>
        `;

    }

    if (type == 'mbfc'){
        htmlString +=`
        <div class="pie hideTilExpanded"></div>
        <score class="biaslink" data-i18n="bias.${ moduleResponse.bias }">${ moduleResponse.bias }</score>
        <div class="scoreText">
            <div>
                <h3 data-i18n="bias.${ moduleResponse.bias }"></h3>
                <p>${ moduleResponse.description }</p>
                <br />
                <p><b data-i18n="bias.popularity">Popularity:</b> ${ moduleResponse.popularity }</p>
                <p><b data-i18n="bias.credibility">Credibility:</b> ${ moduleResponse.credibility}</p>
                <p><b data-i18n="bias.reporting">Reporting:</b> ${ moduleResponse.reporting}</p>
                <p><b data-i18n="bias.questionable">Reasons for Questionable:</b> ${ moduleResponse.questionable }</p>
                <a target="_blank" class="source blanksource" href="${ moduleResponse.url }">MEDIA BIAS FACT CHECKER</a>
            </div>
        </div>
        `;
    }

    if (type == 'glassdoor'){
        htmlString += `
            <div class="pie hideTilExpanded"></div>
            <score class="ratingOutOfFive">${ moduleResponse.glasroom_rating.ratingValue }</score>
            <div class="pie hideTilExpanded animate" style="--c:var(--chart-fore);--p:${ (parseFloat(moduleResponse.glasroom_rating.ratingValue) / 5) * 100 };"></div>
            <div class="scoreText fullBleed">
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
            <a class="source hideInSmall" target="_blank" href="${ moduleResponse.url }">GLASSDOOR</a>
            </div>
            </div>
        `
    }

    if (type == 'tosdr'){
        rated = moduleResponse.rated;
        htmlString += `
            <div class="pie hideTilExpanded"></div>
            <score style="font-size: 64px;">${rated}</score>
            <div class="scoreText fullBleed">
                <div>
            <h3><div data-i18n="tos.wordGrade" style="display:inline;">Grade</div> ${rated}</h3>
            <p data-i18n="tos.${rated.toLowerCase()}"></p>
            <a target="_blank" class="source" href="https://tosdr.org/en/service/${moduleResponse.id}">TOS;DR</a>
            </div>
            </div>
        `
    }

    if (type == 'trustpilot'){
        starString = ''
        numberOfStars = Math.floor(moduleResponse.score);
        remainingStar = moduleResponse.score - numberOfStars;
        for (let i = 0; i < 5; i++){
            division = (numberOfStars > i) ? 1 : 0;
            division = (numberOfStars == i) ? remainingStar : division;
            starString += `<span class="coolStar" style="--division:${division};"></span>`
        }
        htmlString += `
         <score class="ratingOutOf" style="--outOf:'/5';">${moduleResponse.score}</score>
         <div class="scoreText fullBleed">
             <div>
         <div class="ratingCount">${ moduleResponse.reviews.total } <span data-i18n="glassdoor.reviews"></span></div>
         <div class="stars">
         ${starString}
         </div>
         <table id="trustChart" class="hideTilExpanded">
             <tr><th data-i18n="trustpilot.total">Total Reviews</th><td>${ moduleResponse.reviews.total }</td></tr>
             <tr><th data-i18n="trustpilot.one">One Star</th><td>${ moduleResponse.reviews.oneStar }</td></tr>
             <tr><th data-i18n="trustpilot.two">Two Star</th><td>${ moduleResponse.reviews.twoStars }</td></tr>
             <tr><th data-i18n="trustpilot.three">Three Star</th><td>${ moduleResponse.reviews.threeStars }</td></tr>
             <tr><th data-i18n="trustpilot.four">Four Star</th><td>${ moduleResponse.reviews.fourStars }</td></tr>
             <tr><th data-i18n="trustpilot.five">Five Star</th><td>${ moduleResponse.reviews.fiveStars }</td></tr>
         </table>
         <a class="source" target="_blank" href="https://trustpilot.com/review/${ moduleResponse.domain }" >TRUST PILOT</a>
         </div>
         </div>
        `
    }
    if (type == 'similar'){
        similarString = ''
        for (site in moduleResponse.similar){
            ssite = moduleResponse.similar[site].s
            p = Math.floor(moduleResponse.similar[site].p * 100)
            similarString += `<section class="similar-site">
            <a target="_blank" alt="${ssite}" href="https://${ssite}">
                ${ssite}</a><div class="percent">${p}</div></section>`;
        }

        htmlString += `
        <div class="scoreText fullBleed"><div>
        <section id="similar-sites" class="hideInSmall">
        ${similarString}
        </section>
        <a target="_blank" class="source" href="https://similarsites.com/site/${ moduleResponse.domain }" style="order:101;">SIMILARSITES.COM</a>
            </div></div>
        `;

    }
	if (type != 'wbm'){
    if (settingsState["experimentalFeatures"]){
        htmlString += `<button type='button' class='loadInfoButton hideInSmall bottomLeftOfModule' onclick="postLoad(this)"> Load info</button>`
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
        console.log("Logged in")
        commentDiagOpen();
    } else {
        window.open(`${assetsURL}/auth/login`, '_blank').focus()
    }
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

let allLinks = document.querySelectorAll('a');
let noOpen = false;

allLinks.forEach(el => {
    el.setAttribute("target", "_blank");
});

let backButton = document.getElementById('backButton');
let closeButton = document.getElementById('closeButton');
let voteButtons = document.getElementById('Invisible-vote');
let boyButton = document.getElementById('Invisible-boycott');
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
var mode = 0                                                                    
const phoneRegex = /Mobile/i;                                                   
                                                                                
if (Url.get["mode"] > 0){
    mode = Url.get["mode"];
    if (debug) console.log("mode override " + mode)
} else {
if (phoneRegex.test(navigator.userAgent)){                                      
    mode = 1;
} else {
    mode = 2;
}
}

if ( mode == 1 ){
    if (debug) console.log("[ Invisible Voice ]: phone mode");
    document.getElementsByClassName("content")[0].classList.add("mobile");
    body.classList.add("mobile");
}
if ( mode == 2 ){
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
let resetBack = function(){
    settings.style.bottom = "200vh";
    settings.style.top = "";
    titleBar.style.display = "";
    settings.firstElementChild.style.top = `-${settingsOffset}`;
    if (networkGraph != null) networkGraph.style.visibility = 'hidden';
    backButton.setAttribute("onclick", 'justSendBack()');
    backButton.style.backgroundColor = '';
    if ( mode == 1 ) backButton.classList.remove("show");
    settingsButton.style.display = 'block';
    if (settingsState["experimentalFeatures"]) loginButtonEl.style.display = 'block';
    closeButton.style.display = "";
    titleBar.style.backgroundColor = "";
    titleBar.style.position = "";
    titleBar.style.top = "";
    backButton.style.borderColor = '';
    roundelButton.style.opacity = '';
    window.scrollTo(0,0);
}

let setBack = function(x){
    backButton.setAttribute("onclick", x);
    backButton.classList.add("show");
    settingsButton.style.display = 'none';
    if (settingsState["experimentalFeatures"]) loginButtonEl.style.display = 'none';
    roundelButton.style.opacity = '0';
    window.scrollTo(0,0);
}

let loadWikipediaPage = function(x) {
    wikipediaPage.classList.add('expanded');
    content.classList.add('somethingIsOpen');
    body.classList.add('somethingIsOpen');
    noOpen = true;
    send_message("IVClicked", "wikipedia-first-frame");
    backButton.style.backgroundColor = 'var(--c-background)';
    graphButtons.setAttribute("style", "");
    setBack('closeWikipediaPage()');
}

let loadProfileCard = function(x) {
    infoCard.classList.add('expanded');
    content.classList.add('somethingIsOpen');
    body.classList.add('somethingIsOpen');
    noOpen = true;
    backButton.style.backgroundColor = 'var(--c-background)';
    send_message("IVClicked", "wikipedia-infocard-frame");
    setBack('closeInfoCard()');
}

const keyconversion = {
    "b": 'bcorp',
    "c": 'connections',
    "l": 'glassdoor',
    "g": 'goodonyou',
    "i": 'isin',
    "m": 'mbfc',
    "o": 'osid',
    // "a": 'polalignment',
    // "p": 'polideology',
    "y": 'yahoo',
    "P": 'tosdr-link',
    "s": 'trust-scam',
    "t": 'trust-pilot',
    // "w": 'wikidata_id'
}

const availableNotifications = "blPtsm";
const defaultUserPreferences = {
   "l": { type: "range", min: 0, max: 10 },
   "b": { type: "range", min: 0, max: 150 },
   "P": { type: "range", min: 1, max: 6 },
   "s": { type: "range", min: 0, max: 100 },
   "t": { type: "range", min: 0, max: 100 },
   "m": { type: "label", labels: [ "conspiracy-pseudoscience", "left",
"left-center", "pro-science", "right", "right-center", "satire",
"censorship", "conspiracy", "failed-fact-checks", "fake-news", "false-claims",
"hate", "imposter", "misinformation", "plagiarism", "poor-sourcing", "propaganda", "pseudoscience"
  ] },
};
let userPreferences = {}
let buttonState = {}
function toggleButton(buttonId) {
  buttonState[buttonId] = !buttonState[buttonId];
  document.getElementById(`label-${buttonId}`).classList.toggle("pushedButton");
}

let diagOpen = false;
let notificationDialog = function(id){
    if (diagOpen) return;
    diagOpen = true;
    var loadedPreferences = {};
    if (settingsState["userPreferences"] != "")
        loadedPreferences = JSON.parse(settingsState["userPreferences"]) || {};
    const mergedPreferences = { ...defaultUserPreferences, ...loadedPreferences };
    settingsState["userPreferences"] = JSON.stringify(mergedPreferences);
    userPreferences = mergedPreferences;

    notid = id.target.id.replace("-dialog","")
    console.log(notid)
    defaults = defaultUserPreferences[notid]
    floatDiag = document.createElement("div");
    floatDiag.id = "floatDiag"
    if (defaults.type == "range"){
        floatDiag.textContent = `${id.target.id} min:${defaults.min} max:${defaults.max}`
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
        <div>${id.target.id}</div>
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

let notificationCloseAndSave = function(){
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
    settingsState["userPreferences"] = JSON.stringify(userPreferences);
    send_message("IVNotificationsPreferences", userPreferences)
	settingsStateChange();
    floatDiag.remove()
}

let notificationsDraw = function(){
    if (settingsState["notifications"] == "true"){
        tagsEnabled = settingsState["notificationsTags"] || '';
        for (const tag of availableNotifications){
            if (document.getElementById(`${tag}-bell`) == null){
                currEl = document.querySelector(`[data-id="${keyconversion[tag]}"]`);
                toggleContainer = document.createElement("div");
                toggleContainer.classList.add("tagToggleContainer");
                notToggle = document.createElement("div");
                notToggle.id = `${tag}-bell`;
                notToggle.classList.add("notificationBell");
                notToggle.innerHTML = '<label class="switch"><input type="checkbox"><span class="slider round"></span></label>';
                if (tagsEnabled.includes(tag))
                    notToggle.getElementsByTagName("input")[0].checked = true;

                toggleDialog = document.createElement("img");
                toggleDialog.id = `${tag}-dialog`;
                toggleDialog.classList.add("notificationDialog");
                toggleDialog.onclick = notificationDialog;
                toggleContainer.appendChild(toggleDialog);
                toggleContainer.appendChild(notToggle);
                currEl.appendChild(toggleContainer);
            } else {
                if (tagsEnabled.includes(tag)){
                    document.getElementById(`${tag}-bell`).getElementsByTagName("input")[0].checked = true;
                } else {
                    document.getElementById(`${tag}-bell`).getElementsByTagName("input")[0].checked = false;
                }
            }
        }
        console.log(tagsEnabled);
    } else {
        // check for if toggles are there already, remove them if they are 
        document.querySelectorAll(".notificationBell").forEach(x => x.remove());
        document.querySelectorAll(".notificationDialog").forEach(x => x.remove());
    }
}
var defaultOrder = [
    "cta",
    "political-wikidata",
    "politicali-wikidata",
    "wikipedia-first-frame",
    "networkgraph", 
    "mbfc", 
    "trust-pilot",
    "yahoo", 
    "opensec", 
    "carbon", 
    "lobbyeu",
	"post",
    "wbm",
    "wbm-automotive-data",
    "wbm-gender-benchmark",
    "wbm-just-transition-assessment",
    "wbm-just-transition-assessment-social",
    "wbm-seeds-index-esa",
    "wbm-seeds-index-ssea",
    "wbm-seeds-index-wc-africa",
    "wbm-chumanrightsb",
    "wbm-financial-system-benchmark",
    "wbm-social-transformation",
    "wbm-transport-benchmark",
    "wbm-buildings-benchmark",
    "wbm-digital-inclusion",
    "wbm-electric-utilities",
    "wbm-food-agriculture-benchmark",
    "wbm-nature-benchmark",
    "wbm-oil-gas-benchmark",
    "wbm-seafood-stewardship",
    "goodonyou", 
    "bcorp", 
    "tosdr-link", 
    "glassdoor", 
    "similar-site-wrapper", 
    "social-wikidata", 
    "trust-scam",
];
var translate = {
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
    "cta": "cta.title",
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

    // Notifications
    var notifications = document.createElement("div");
    notifications.id = "notifications-shade";
    notifications.classList.add("switchItem");
    notifications.innerHTML = `<h2 data-i85n="settings.notifications">Notifications</h2>
        <div id="notificationsContainer" style="display:flex;">
        <img id="notificationsCache" style="display:none;width:24px;height:24px;position:relative;transform:translate(-20px,13px);">
        <label class="switch"><input type="checkbox"><span class="slider round"></span></label></div></div>`
    settings.appendChild(notifications);

    if (settingsState["notifications"] == "true"){
        let notifications = document.getElementById("notifications-shade")
        notifications.getElementsByTagName("input")[0].checked = true;
        cacheButton = document.getElementById("notificationsCache");
        cacheButton.style.display = "block";
        send_message("IVNotifications", "true");
        tagList = settingsState["notificationsTags"] || "";
        send_message("IVNotificationsTags", tagList);
    } else {
        send_message("IVNotifications", "false");
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
        resetBack();
    } else {
    settings.style.bottom = "0";
    settings.style.top = `${settingsOffset}`;
    titleBar.style.backgroundColor = "transparent";
    titleBar.style.position = "fixed";
    titleBar.style.top = "0";
    if (mode == "1"){
        backButton.style.visibility = "visible";
        backButton.style.display = "inherit";
        backButton.style.order = "unset";
    }
    if (mode == 2){
        closeButton.style.display = "none";
    }
    notificationsDraw();
    settings.firstElementChild.style.top = "0";
    backButton.style.backgroundColor = 'var(--c-secondary-background)';
    backButton.style.borderColor = 'var(--c-light-text)';
    coName.style.opacity = "0%";
    fullPage.style.overflow = "hidden";
    send_message("IVClicked", "settings");
    setBack('closeSettings()');
    }
}

let loadNetworkGraph = function(x) {
    backButton.style.borderColor = 'var(--c-border-color)';
    backButton.style.backgroundColor = 'var(--c-background)';
    networkGraph.style.visibility = 'visible';
    sigmacontainer.style.width = "100vw";
    sigmacontainer.style.height = "100vh";
    sigmacontainer.style.position = "fixed";
    sigmacontainer.style.zIndex = "4";
    networkGraph.classList.add("expanded");
    if (mode == 1){
        noOpen = true;
    }
    if (mode == 2){
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

let closeWikipediaPage = function(x){
    wikipediaPage.classList.remove('expanded');
    content.classList.remove('somethingIsOpen');
    body.classList.remove('somethingIsOpen');
    noOpen = false;
    resetBack();
}
let closeInfoCard = function(x){
    infoCard.classList.remove('expanded');
    content.classList.remove('somethingIsOpen');
    body.classList.remove('somethingIsOpen');
    noOpen = false;
    resetBack();
}
let closeNetworkGraph = function(x){
    networkGraph.style.visibility = 'hidden';
    if (mode == 1){
        noOpen = false;
    }
    sigmacontainer.style.width = "1px";
    sigmacontainer.style.height = "1px";
    networkGraph.classList.remove("expanded");
    graphButtons.style.top = "";
    send_message("IVClicked", "unwork");
    resetBack();
}

let justSendBack = function(x) {
    bw = backButton.getBoundingClientRect()['width'];
    send_message("IVClicked", "back");
}

let openGenericPage = function(x){
    if (noOpen){
        return;
    }
    backButton.style.backgroundColor = 'var(--c-background)';
    element = document.getElementById(x)
    var bb = element.getBoundingClientRect()
    var startW = bb['width'];
    var startH = bb['height'];
    element.style.width = startW + "px";
    element.style.transform = "translate( -" + bb['x'] + "px, -" + bb['y'] + "px)";
    element.style.top = bb['y'] + "px";
    element.style.left = bb['x'] + "px";
    element.classList.add('expanded');
    content.classList.add('somethingIsOpen');
    body.classList.add('somethingIsOpen');
    noOpen = true;
    blank.style.order = element.style.order;
    blank.style.display = "block";
    blank.style.height = startH + "px";
    blank.style.width = startW + "px";
    blank.style.margin = "6px";

    setBack(`closeGenericPage("${x}")`);
}

let closeGenericPage = function(x){
    element = document.getElementById(x)
    element.style.height = "";
    element.style.width = "";
    element.style.transform = "";
    element.style.top = "";
    element.style.left = "";
    blank.style.order = 0;
    blank.style.display = "none";
    element.classList.remove('expanded');
    content.classList.remove('somethingIsOpen');
    body.classList.remove('somethingIsOpen');
    noOpen = false;
    resetBack();
}

let closeSettings = function(x) {
    body.classList.remove("settingsOpen");
    if (mode == "1"){
        backButton.style.order = "2";
    }
    coName.style.opacity = "100%";
    fullPage.style.overflow = "";
    resetBack();
}




function toggleNotifications(value) {
  if (settingsState["notifications"] === value) return;
  settingsState["notifications"] = value;
  cacheButton = document.getElementById("notificationsCache");
  cacheButton.style.display = value === "true" ? "block" : "none";
  send_message("IVNotifications", value);
  settingsStateChange();
  notificationsDraw();
  console.log("notifications " + settingsState["notifications"]);
}

function notificationBell(ppId){
    if (ppId == "cacheClear"){
        send_message("IVNotificationsCacheClear", "please");
        settingsState["userPreferences"] = JSON.stringify(defaultUserPreferences);
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
                var order = (settingsState["listOrder"] != "") ? settingsState["listOrder"].split('|') : defaultOrder;
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
                if (settingsState["notifications"] == "true") {
                  tagList = "";
                  document.querySelectorAll(".notificationBell").forEach(function(x){ 
                      if (x.getElementsByTagName("input")[0].checked)
                          tagList += x.id.replace(/-bell/,"");
                  })
                  recalculateList()
                  send_message("IVNotificationsTags", tagList);
				  settingsStateChange();
                }
	    	}
	    }
  });
  //if (debug) console.log($('#sortlist').sortable('toArray'));
  

}

function toggleToggle(type){
	if (type == "darkMode") document.lastChild.classList.toggle('dark-theme');
    if (type == "notificationsContainer"){
        toggleNotification(settingsState["notifications"])    
        return
    }
	settingsState[type] = !settingsState[type];
	console.log(`setting ${type} ${settingsState[type]}`)
    if (type == "debugMode") document.lastChild.classList.toggle("debugColors");
	settingsStateChange()
}

// {value: items[it].value, label: items[it].innerHTML}
function recalculateList(){
  var propertyOrder = (settingsState["listOrder"] != "") ? settingsState["listOrder"].split('|') : defaultOrder;
  let target = document.getElementById("sortlist")
  let items = target.getElementsByTagName("li"), current = null;

  for (let x = 0; x < propertyOrder.length; x++){
    let value = propertyOrder[x];
    if (items[x] !== undefined){
        items[x].setAttribute("data-i18n", translate[value]);
        if (value == "networkgraph"){
            if (document.getElementById("graph-box")){
                [...document.styleSheets[3].cssRules].find(y=> y.selectorText=='#graph-box').style.order = x + 5;
            }
            if (document.getElementById("wikipedia-infocard-frame")){
                [...document.styleSheets[3].cssRules].find(y=> y.selectorText=='#wikipedia-infocard-frame').style.order = x + 5;
            }
        }
        if (document.getElementById(value)){
            thiselement = document.getElementById(value);
            [...document.styleSheets[3].cssRules].find(y=> y.selectorText==`#${value}`).style.order= x + 5;
            if (mode == 1 && value != "carbon"){
                thiselement.setAttribute('onclick', `openGenericPage("${value}")`);
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

document.addEventListener("DOMContentLoaded", function(){
    if (Url.get["app"] == 'true'){
        closeButton.style.visibility = "hidden";
    }
    if (Url.get["vote"] == 'true'){
        body.classList.add("topBar");
        boyButton.classList.toggle("hide");
        voteButtons.classList.toggle("hide");
        if (mode == 2) content.classList.add("padOnSmall");
        voteLoad();
    } else {
        boyButton.style.visibility = "hidden";
        voteButtons.style.visibility = "hidden";
    }
    if (Url.get["expanded"] && mode == 1){
        document.getElementById(Url.get["expanded"]).classList.add("expanded")
        content.classList.add('somethingIsOpen');
    }
});

document.addEventListener('mouseup', function (event) {
  if (event.target.matches("html")) return;
  if (event.target.matches("#floatDiag")) return;
  if (event.target.matches("#floatDiagSave")) {
      notificationCloseAndSave()
      return
  };

  var tid = event.target.id;
  
  if (tid == '#indexRefresh') send_message("IVIndexRefresh", "please");
  if (tid == '#notificationsCache') notificationBell("cacheClear")
  if (tid == '#backButton') send_message("IVClicked", event.target.parentElement.id);
  if (tid == '#Invisible-boycott') send_message("IVBoycott", "please");

  if (event.target.classList.contains('invisible-disclaimer-title'))send_message("IVClicked", "disclaimer");
  if (event.target.classList.contains('sectionTitle') || event.target.classList.contains('iconclass') || event.target.classList.contains('scoreText')) {
    send_message("IVClicked", event.target.parentElement.id);
    if (event.target.parentElement.id == "wikipedia-first-frame") loadWikipediaPage();
    if (event.target.parentElement.id == "wikipedia-infocard-frame") loadProfileCard();
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
    if (debug) console.log(e);
    const decoded = e.data
    var dlikeC = '';
    var likeC = '';

    if (decoded.message == "VoteUpdate"){
		voteUpdate(decoded)
    }
    if (decoded.message == "ModuleUpdate"){
        moduleUpdate(decoded);
    }
    if (decoded.message == "PostUpdate"){
        postUpdate(decoded);
    }
    if (decoded.message == "PostUpdateTL"){
        postUpdate(decoded, true);
    }
});

function postalVote(direction, location, status){
    if (status == direction){
           send_message("IVPostVoteUnvote", location) 
    } else {
        if (direction == "comment"){
            commentDiagOpen(location)
        } else if (direction == "up") {
           send_message("IVPostVoteUp", location) 
        } else if (direction == "down"){
           send_message("IVPostVoteDown", location) 
        }
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
		console.log(mesg)
		return
	}
	if (comment){
		data = mesg
		sVB = elmt.getElementsByClassName("smallVoteBox")[0]
		contentText = $('<div/>').html(data.content).text()   
		commentBox = document.createElement("div")
		commentBox.classList.add("smallCommentBox")
		commentBox.setAttribute("data-location", mesg["uid"])
		commentBox.innerHTML = `
		<div>${contentText}<a class="tinysource" target="_blank" href="https://assets.reveb.la/#user" >${data.author}</a></div>
		
		<ul class="smallerVoteBox hideInSmall">
			<li><a target="_blank" onclick="postalVote('up','${data.uid}', '${data.status}')" >Up</a><div>(${data.up_total})</div></li>
			<li><a target="_blank" onclick="postalVote('down','${data.uid}', '${data.status}')" >Down</a><div>(${data.down_total})</div></li>
			<li><a target="_blank" onclick="postalVote('comment','${data.uid}', '${data.status}')" ><div>Comment </a>(${data.comment_total})</div></li>
            </ul>`
		sVB.parentNode.insertBefore(commentBox, sVB)

		return
	}

	if (location_str.includes("-")){
		className = "smallerVoteBox"	
		console.log(mesg)
		console.log(elmt)
	} else {
		className = "smallVoteBox bottomLeftOfModule"
	}
    if (elmt.getElementsByClassName("loadInfoButton").length > 0){
        elmt.getElementsByClassName("loadInfoButton")[0].remove();
    } else {
        elmt.getElementsByClassName(className.split(" ")[0])[0].remove();
    }

	elmt.innerHTML += `<ul class="${className} hideInSmall">
		<li><a target="_blank" onclick="postalVote('up','${location_str}', '${mesg.status}')" >Up</a><div>(${mesg.up_total})</div></li>
		<li><a target="_blank" onclick="postalVote('down','${location_str}', '${mesg.status}')" >Down</a><div>(${mesg.down_total})</div></li>
		<li><a target="_blank" onclick="postalVote('comment','${location_str}', '${mesg.status}')" ><div>Comment </a>(${mesg.comment_total})</div></li></ul>`

	if (mesg.comment_total > 0){
		send_message("IVGetPost", mesg.top_comment)
	}
}



// Voting
let voteUrl = "https://assets.reveb.la";
var tempVoteDirection = "";
var tempInvert = false;
var invert = null;
var hash;
async function voteLoad(){
    site = document.getElementsByClassName("co-name")[0].textContent.replace(".", "")
    hash = document.getElementById("graphLoc").innerText.split('/')[2].replace('.json','');
    send_message("IVVoteStuff", hash);
}
function vote(direction){
    // First look for hash
    site = document.getElementsByClassName("co-name")[0].textContent.replace(".", "")
    hash = document.getElementById("graphLoc").innerText.split('/')[2].replace('.json','');
    invert = false;
    olddirection = tempVoteDirection
    // Then check if voted before
    // Then check vote direction
    // if directions are the same then unvote
    if (direction == olddirection) invert = true;
    // if directions are different but not "" then unvote the other direction
    if (!invert && tempVoteDirection != ""){
        if (direction == "up"){
            voteRequest(hash, "down", true)
        } else {
            voteRequest(hash, "up", true)
        }
    }
    // otherwise vote
    voteRequest(hash, direction, invert)
    // Update totals
    tempVoteDirection = direction;
    tempInvert = invert;
}
async function voteRequest(hash, direction, invert){
    if (debug) console.log("vote request: " + hash + " " + direction + " " + invert);
    newDirection = direction;
    if (invert){
        newDirection = "un" + direction;
    }

    send_message("IVVoteStuff", direction)
}
var decodedTest;
function voteUpdate(decoded=false){
	if (!decoded){ return }
	var IVLike = document.getElementById('Invisible-like')
	var IVDislike = document.getElementById('Invisible-dislike')


	decodedTest = decoded;
    direction = decoded.voteStatus;
	console.log(decoded.dtotal)
    dc = lc = "";

    if (!invert && direction == "up") lc = "green";
    if (!invert && direction == "down") dc = "green";

    if (invert) tempVoteDirection = "";
	IVLike.setAttribute("style", `--count:'${decoded.utotal.toString()}';color:${lc};`);
	IVDislike.setAttribute("style", `--count:'${decoded.dtotal.toString()}';color:${dc};`);
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
    slist(document.getElementById("sortlist"));
    recalculateList()
	scrollIntoPlace()
});
