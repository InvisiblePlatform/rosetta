const pageHost = `${window.location.protocol}//${window.location.host}`
const pageCoreLocation = `${pageHost}${document.getElementById('location-url').textContent}`;
const assetsURL = `https://assets.reveb.la`

// Translator
var translator = new Translator({
    persist: true,
    // debug: true,
    filesLocation: `${pageHost}/i18n`
});
const languages = ["ar", "fr", "eo", "en", "es", "de", "zh", "hi", "ca"];
translator.fetch(languages).then(() => {
    translator.translatePageTo();
    registerLanguageToggle();
});

function registerLanguageToggle() {
    var select = document.getElementById("langselect");
    for (var i = 0, len = select.childElementCount; i<len; ++i ){
        if (select.children[i].value == localStorage.preferred_language) {
            select.selectedIndex = i;
        };
    }

    // console.log(select);
    select.addEventListener("change", evt => {
      var language = evt.target.value;
      if (language == "-" ){ return; };
      translator.translatePageTo(language);
    });
}

const loadPageCore = async () =>{
    try {
        const dataf = await fetch(pageCoreLocation)
        const response = await dataf.json()
        for (module of response.core){
            if (module.url == 'local'){
                console.log(module);
            } else {
                addModule(type=module.type, url=`${pageHost}/ds/${module.url}`);
            }
        }
        if ("political" in response) addLocalModule(type="political", data=response.political)
        if ("social" in response) addLocalModule(type="social", data=response.social)
    } catch (e) {
        console.log(e)
    }
}
const loadPageExternal = async () =>{
    try {
        postLocation = `${document.getElementById('location-url').textContent.replace("/index.json","").replace('/db','db')}`
        postURL = `${assetsURL}/get-post`

		data = {
			"location": postLocation,
		}
        headers = new Headers({
                "content-type": 'application/json'
        });

		const dataf = await fetch(postURL, {
			method: "POST",
            headers: headers,
			body: JSON.stringify(data)
		})
        const response = await dataf.json()
        console.log(postLocation)
        console.log(response.content)
        if (response.hasOwnProperty('author')){
            console.log(response)
            addLocalModule(type="post", data=response)
        }
    } catch (e) {
        if (debug == true) console.log(e)
    }
}

const loginCheck = async () => {
        try{
        postURL = `${assetsURL}/auth/am-i-logged-in`
        postLocation = `${document.getElementById('location-url').textContent.replace("/index.json","").replace('/db','db')}`
        headers = new Headers({
                "content-type": 'application/json'
        });

		const dataf = await fetch(postURL, {
			method: "GET",
            headers: headers,
            credentials: 'include',
		})
        const response = await dataf.json()
        if (response.hasOwnProperty("message")){
            console.log(response)
            element = document.createElement("div")
            element.innerHTML = `<p>You are logged in as ${response.message}, <a href="${assetsURL}/posttest?location=${postLocation}"> on this page</a></p>`
            carbon_el = document.getElementById("carbon")
            carbon_el.appendChild(element)

        }
        } catch (e){
            console.log(e)
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
    "social": { "id": "social-wikidata", "label": "Social Media", "translate": "social.title" },
    "political": { "id": "political-wikidata", "label": "Political Leanings", "translate": "political.title" },
}

const contentContainer = document.getElementsByClassName("content")[0]

// TODO:
// GOY missing slug
async function addLocalModule(type=undefined,data=undefined){
    if (type == undefined || data == undefined) return; 
    if (type in types) {} else {return;}
    stopDefaultContainer = false;
    let sectionContainer = document.createElement('section');
    sectionContainer.className = "contentSection";
    sectionContainer.id = types[type].id;

    // Genericising needed
    // console.log(data)
    if (type == "social"){
    htmlString = `
        <h2 class="sectionTitle"><div data-i18n="${types[type].translate}">${types[type].label}</div><div class="subname"></div></h2>

    `
        //<button class="collapsible">Show/Hide</button>
        htmlString += `<section id="social-wikidata-links" class="collapsible-content"><table>`
        for (label in data){
            for (item in data[label]){
                htmlString += `<tr><th></th>
                    <td><a class="spacelinks" href="${data[label][item]['url']}">${data[label][item]['url']}</a><a class="minisource" target="_blank" href="https://wikidata.org/"></a></td>
                </tr>`
            }
        }
        htmlString += `
            </table></section>
        `
        sectionContainer.innerHTML = htmlString
    }
    if (type == "political"){
        lang = "enlabel"
        stopDefaultContainer = true;
        for (label in data){
            let sectionContainer = document.createElement('section');
            sectionContainer.className = "contentSection";
            sectionContainer.id = types[type].id;
            actLabel = (label == "polalignment") ? "Political Alignments" : "Political Ideologies";
            htmlString = `
                <h2 class="sectionTitle"><div data-i18n="wikidata.${label}">${actLabel}</div></h2>
<div class="pie hideTilExpanded"></div>
<score class="biaslink" ></score>
<div class="scoreText fullBleed">`
            for (item in data[label]){
                htmlString += `<tr><th></th>
                    <h3>${data[label][item]["sourceLabels"][lang]} <a class="spacelinks" href="https://wikidata.org/wiki/${data[label][item]['dataId']}">${data[label][item]['data'][lang]}</a><a class="minisource" target="_blank" href="https://wikidata.org/wiki/${data[label][item]['dataId']}"></a></h3>`
            }
            htmlString += `
     <a target="_blank" class="hideInSmall source" href="https://wikidata.org/wiki/${data[label][item]['dataId']}">WIKIDATA</a>
                </div>
                </div>
            `
            sectionContainer.innerHTML = htmlString
            contentContainer.appendChild(sectionContainer);
        }
    }
    if (type == 'post'){

        postContent = $('<div/>').html(data.content).text()
        htmlString = `
        <h2 class="sectionTitle"><div data-i18n="user.moduletitle">User Content</div><div class="subname">(${data.location})</div></h2>
         <div class="scoreText fullBleed userText">
             <div>`
        htmlString +=postContent
        htmlString +=`<a class="source" target="_blank" href="https://assets.reveb.la/#user" >${data.author}</a>
            </div>
         </div>
        `
        sectionContainer.innerHTML = htmlString;
    }
    if (!stopDefaultContainer)
        contentContainer.appendChild(sectionContainer);
    // if (type == "social"){
    //     var coll = document.getElementsByClassName('collapsible');
    //     var i;

    //     for (i = 0; i < coll.length; i++) {
    //         coll[i].addEventListener('click', function() {
    //             this.classList.toggle('active');
    //             var content = this.nextElementSibling;
    //             if (content.style.display === "none") {
    //                 content.style.display = "flex";
    //             } else {
    //                 content.style.display = "none";
    //             }
    //         });
    //     }
    // }
    translator.translatePageTo();
}

async function addModule(type=undefined,url=undefined){
    if (type == undefined || url == undefined) return; 
    // needs some mechanic for caching when we switch to graph mode
    const moduleData = await fetch(url);
    const moduleResponse = await moduleData.json()
    //console.log(moduleResponse)
    if (type in types) {} else {return;}
    let stopDefaultContainer = false
    let sectionContainer = document.createElement('section');
    sectionContainer.className = "contentSection";
    sectionContainer.id = types[type].id;
    // Genericising needed
    htmlString = `
        <h2 class="sectionTitle"><div data-i18n="${types[type].translate}">${types[type].label}</div><div class="subname">(${moduleResponse.source})</div></h2>
    `

    if (type == "opensecrets"){
        //console.log(moduleResponse)
        htmlString += `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/charts.css/dist/charts.min.css">`
        if ("bill_most_heading" in moduleResponse){
            htmlString += `<p class="flavourText"><b>${moduleResponse.bill_most_heading}</b></p>
            <p class="flavourText"><a href='${moduleResponse.bill_most_url}'>${moduleResponse.bill_most_title} (${moduleResponse.bill_most_code})</a></p>`
        }
        htmlString += '<div class="scoreText fullBleed"><div>'
        if ("cycle_year" in moduleResponse){
            htmlString += `<p>Data is true of the ${moduleResponse.cycle_year} cycle</p>`
            if ("contributions_rank" in moduleResponse) htmlString+= `<p><b>Contributions Rank:</b> ${moduleResponse.contributions_rank}</p>`
            if ("contributions_amount" in moduleResponse) htmlString+= `<p><b>Contributions Amount:</b> ${moduleResponse.contributions_amount}</p>`
            if ("lobbying_rank" in moduleResponse) htmlString+= `<p><b>Lobbying Rank:</b> ${moduleResponse.lobbying_rank}</p>`

            htmlString+= '<div class="charts">'
            if ("bars" in moduleResponse){
                bars = moduleResponse.bars;
                if ("recipients_of_funds" in bars){
                    htmlString+=`
                        <h3 data-i18n="opensec.recipients">Recipients of Funds</h3>
                        <table class="charts-css multiple stacked bar show-heading"><tbody><tr>`
                    for (recipient in bars.recipients_of_funds){
                        let r = bars.recipients_of_funds[recipient]
                        htmlString+=`
                            <td style="--size: calc(${r.percent.replace("%", "")}}/100);">
                            <span class="data">${r.entity}</span>
                            <span class="tooltip">${r.entity}<br>
                                (${r.amount})</span>
                            </td>
                        `
                    }
                    htmlString += "</tr></body></table>"
                }
                if ("sources_of_funds" in bars){
                    htmlString+=`
                        <h3 data-i18n="opensec.sources">Sources of Funds</h3>
                        <table class="charts-css multiple stacked bar show-heading"><tbody><tr>`
                    for (source in bars.sources_of_funds){
                        let r = bars.sources_of_funds[source]
                        htmlString+=`
                            <td style="--size: calc(${r.percent.replace("%", "")}}/100);">
                            <span class="data">${r.entity}</span>
                            <span class="tooltip">${r.entity}<br>
                                (${r.amount})</span>
                            </td>
                        `
                    }
                    htmlString += "</tr></body></table>"
                }
                if ("sources_of_funds_to_candidates" in bars){
                    htmlString+=`
                        <h3 data-i18n="opensec.sourcestocandidates">Sources of Funds to Candidates</h3>
                        <table class="charts-css multiple stacked bar show-heading"><tbody><tr>`
                    for (source in bars.sources_of_funds_to_candidates){
                        let r = bars.sources_of_funds_to_candidates[source]
                        htmlString+=`
                            <td style="--size: calc(${r.percent.replace("%", "")}}/100);">
                            <span class="data">${r.entity}</span>
                            <span class="tooltip">${r.entity}<br>
                                (${r.amount})</span>
                            </td>
                        `
                    }
                    htmlString += "</tr></body></table>"
                }
            }// End of Bars
            if ("charts" in moduleResponse){
                charts = moduleResponse.charts;
                if ("House" in charts){
                    house = charts["House"]
                    year_range = house.latest_year - house.earliest_year;
                    earlyYear = house.earliest_year
                    valueYear = house.Dems.all_years.length
                    houseDems = house.Dems.all_years
                    houseRepubs = house.Repubs.all_years
                    heightThou = [].concat(houseDems,houseRepubs).sort(function(a,b) { return a - b }).reverse()[0] / 1000
                    if (heightThou > 0){
                        htmlString+=`
                            <h3 data-i18n="opensec.house">House</h3>
                            <h4 style="color:red !important;" data-i18n="opensec.republicans">Republicans</h4>
                            <h4 style="color:blue !important;" data-i18n="opensec.democrats">Democrats</h4>
                            <table class="charts-css line multiple hide-data show-labels show-primary-axis show-data-on-hover" style="--color-1: blue;--color-2:red;">
                            <thead>
                                <tr>
                                <th data-i18n="opensec.year"        scope="col">Year</th>
                                <th data-i18n="opensec.democrats"   scope="col">Democrats</th>
                                <th data-i18n="opensec.republicans" scope="col">Republicans</th>
                                </tr>
                            </thead>
                            <tbody>`
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
                if ("Senate" in charts){
                    house = charts["Senate"]
                    year_range = house.latest_year - house.earliest_year;
                    earlyYear = house.earliest_year
                    valueYear = house.Dems.all_years.length
                    houseDems = house.Dems.all_years
                    houseRepubs = house.Repubs.all_years
                    heightThou = [].concat(houseDems,houseRepubs).sort(function(a,b) { return a - b }).reverse()[0] / 1000
                    if (heightThou > 0){
                        htmlString+=`
                            <h3 data-i18n="opensec.senate">Senate</h3>
                            <h4 style="color:red !important;" data-i18n="opensec.republicans">Republicans</h4>
                            <h4 style="color:blue !important;" data-i18n="opensec.democrats">Democrats</h4>
                            <table class="charts-css line multiple hide-data show-labels show-primary-axis show-data-on-hover" style="--color-1: blue;--color-2:red;">
                            <thead>
                                <tr>
                                <th data-i18n="opensec.year"        scope="col">Year</th>
                                <th data-i18n="opensec.democrats"   scope="col">Democrats</th>
                                <th data-i18n="opensec.republicans" scope="col">Republicans</th>
                                </tr>
                            </thead>
                            <tbody>`
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
                            <p><b data-i18n='opensec.lobbistingov'>Lobbyists who worked in government</b>${card.held.count} (${card.held.percent})</p>
                            <p><b data-i18n='opensec.lobbistnotingov'>Lobbyists who haven't worked in government</b>${card.notheld.count} (${card.notheld.percent})</p>
                            </div>
                    `
                }
                htmlString += "</div>"
            }

        }
        htmlString += `</div>
                <a class="source hideInSmall" target="_blank" href="https://www.opensecrets.org/orgs/name/summary?id=${moduleResponse.osid}">OPENSECRETS</a>
                </div>
                </div>
                `
        sectionContainer.innerHTML = htmlString
    }

    if (type == "wbm"){
        for (module in moduleResponse.modules){
            let ssectionContainer = document.createElement('section');
            ssectionContainer.className = "contentSection";
            file = moduleResponse.modules[module].file;
            trans = file.split("_").slice(1).join("-").toLowerCase()
            fileName = file.split("_").slice(1).join(" ")
            ssectionContainer.id = `wbm-${trans}`;
            htmlString = `
            <h2 class="sectionTitle"><div data-i18n="wbm.${trans}">${fileName}</div><div class="subname">(${moduleResponse.source})</div></h2>
            <div class="pie hideTilExpanded"></div>
            `
            additionalString = ''
            for (item of Object.keys(moduleResponse.modules[module])){
                if (!item.includes("Total Score")){
                    if (item != "file" && item != "Company Scorecard"){
                        if (item.includes("(")){
                            outOf = item.split("(")[1].replace(")","")
                            itemLabel = item.split("(")[0]
                            additionalString += `<tr><th data-i18n='wbm.${itemLabel.trim().toLowerCase().replaceAll(" ","-").replaceAll(/;|'|:|’|,/g, "").replaceAll("--","-").replaceAll("/","").replaceAll(".","")}'>${itemLabel}</th>
                            <td style="--outOf:'/ ${outOf}';" class="ratingOutOf" >${moduleResponse.modules[module][item]}</td></tr>`
                        } else {
                        additionalString += `<tr><th data-i18n='wbm.${item.trim().toLowerCase().replaceAll(" ","-").replaceAll(/;|'|:|’|,/g, "").replaceAll("--","-").replaceAll("/","").replaceAll(".","")}'>${item}</th>
                            <td style="--outOf:'';" >${moduleResponse.modules[module][item]}</td></tr>`
                        }
                    }
                } else {
                  if (!item.includes("Raw")){
                  outOf = Number(item.split("(")[1].replace(")",""))
                  itemLabel = item.split("(")[0]
                  score = Number(moduleResponse.modules[module][item])
                  percent = (score / outOf) * 100
                  
                htmlString += `
<score class="ratingOutOf" style="--outOf:'/ ${outOf}';">${score}</score>
<div class="pie hideTilExpanded animate" style="--c:var(--chart-fore);--p:${percent};"></div>
         <div class="scoreText fullBleed">
             <div>
         <table>

                    `
                  }
                }
            }
            htmlString += additionalString
            ssectionContainer.innerHTML = `${htmlString} </table> <a target="_blank" class="source" href='{{- $source.Get "source" -}}'>WORLDBENCHMARK</a></div> </div>`
            contentContainer.appendChild(ssectionContainer);
            stopDefaultContainer = true;
        }
    }
    if (type == "cta"){
        htmlString += `
        <score class="biaslink"> </score>
        <div class="scoreText">
        <div>
        <h3>${moduleResponse.author}<span class="author" data-i18n="common.author"> - Author</span></h3>
        <p>${moduleResponse.description}</p>
        </div>
        <div>`
        positiveString = ''
        negativeString = ''
        for (link in moduleResponse.links){
            if (moduleResponse.links[link].type == "positive"){
            positiveString += `<div><a href='${moduleResponse.links[link].url}'>${moduleResponse.links[link].label}</a></div>`
            } else {
            negativeString += `<div><a href='${moduleResponse.links[link].url}'>${moduleResponse.links[link].label}</a></div>`
            }
        }
        htmlString += "<div><h4> Positive </h4>"
        htmlString += positiveString
        htmlString += "</div><div><h4> Negative </h4>"
        htmlString += negativeString

        sectionContainer.innerHTML = `${htmlString}</div></div></div>`
    }
    if (type == "lobbyeu"){
        rating = moduleResponse
        //console.log(moduleResponse)
        htmlString += `
<div class="scoreText fullBleed">
    <div>
    <table>
    <tr><th data-i18n="lb.transparency_id">Transparency ID:</th><td>${moduleResponse.eu_transparency_id}</td></tr>
    <tr><th data-i18n="lb.hq_countries">HQ Country:</th><td>${moduleResponse.head_country}</td></tr>
    <tr><th data-i18n="lb.eu_country">EU Office Country:</th><td>${moduleResponse.be_country}</td></tr>
    <tr><th data-i18n="lb.lobby_count">Lobbyist Count:</th><td>${moduleResponse.lobbyist_count}</td></tr>
    <tr><th data-i18n="lb.lobby_fte">Lobbyist FTE:</th><td>${moduleResponse.lobbyist_fte}</td></tr>
    <tr><th data-i18n="lb.calculated_cost">Calculated Total Cost:</th><td>${moduleResponse.calculated_cost}</td></tr>
    <tr><th data-i18n="lb.meeting_count">Meetings with the EU:</th><td>${moduleResponse.meeting_count}</td></tr>
    <tr><th data-i18n="lb.passes_count">Lobbyist Passes Count:</th><td>${moduleResponse.passes_count}</td></tr>
    </table>
<a class="source" target="_blank" href="https://lobbyfacts.eu/datacard/org?rid=${moduleResponse.eu_transparency_id}">EU Transparency register via LobbyFacts.eu</a>
</div>
</div>

        `
        sectionContainer.innerHTML = htmlString
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
        sectionContainer.innerHTML = htmlString
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
        sectionContainer.innerHTML = htmlString
    }


    if (type == 'yahoo'){
        formatting = ["Negligible", "Low", "Medium", "High", "Severe"]
        // 0-10, 10-20, 20-30, 40+

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
    <tr>
        <th><div data-i18n="esg.negligible" class="biaslink">Negligible</div></th>
        <td>0 - 9.9  </td>
    </tr>
    <tr>
        <th><div data-i18n="esg.low" class="biaslink">Low</div></th>
        <td>10 - 19.9</td>
    </tr>
    <tr>
        <th><div data-i18n="esg.medium" class="biaslink">Medium</div></th>
        <td>20 - 29.9</td>
    </tr>
    <tr>
        <th><div data-i18n="esg.high" class="biaslink">High</div></th>
        <td>30 - 39.9</td>
    </tr>
    <tr>
        <th><div data-i18n="esg.severe" class="biaslink">Severe</div></th>
        <td>40+      </td>
    </tr>
</table>
</div>
<a target="_blank" class="source hideInSmall" href="https://finance.yahoo.com/quote/${moduleResponse.ticker}/sustainability">SUSTAINALYTICS, INC VIA YAHOO! FINANCE</a>
</div>
`
        sectionContainer.innerHTML = htmlString
    }
    if (type == 'trustscore'){
        sectionContainer.innerHTML = `
        ${htmlString}
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
        sectionContainer.innerHTML = `
        ${htmlString}
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
        sectionContainer.innerHTML = `
            ${htmlString}
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
        sectionContainer.innerHTML = `
            ${htmlString}
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

    if (type == 'similar'){
        htmlString += `
        <div class="scoreText fullBleed"><div>
        <section id="similar-sites" class="hideInSmall">`

        for (site in moduleResponse.similar){
            ssite = moduleResponse.similar[site].s
            p = Math.floor(moduleResponse.similar[site].p * 100)
            htmlString += `
        <section class="similar-site">
            <a target="_blank" alt="${ssite}" href="https://${ssite}">
                ${ssite}</a><div class="percent">${p}</div>
        </section>
    `;

        }
        sectionContainer.innerHTML = `${htmlString}
        </section>
        <a target="_blank" class="source" href="https://similarsites.com/site/${ moduleResponse.domain }" style="order:101;">SIMILARSITES.COM</a>
            </div></div>
        `;
    }
    if (type == 'trustpilot'){
        htmlString += `
         <score class="ratingOutOf" style="--outOf:'/5';">${moduleResponse.score}</score>
         <div class="scoreText fullBleed">
             <div>
         <div class="ratingCount">${ moduleResponse.reviews.total } <span data-i18n="glassdoor.reviews"></span></div>
         <div class="stars">
        `
        numberOfStars = Math.floor(moduleResponse.score);
        remainingStar = moduleResponse.score - numberOfStars;
        for (let i = 0; i < 5; i++){
            division = (numberOfStars > i) ? 1 : 0;
            division = (numberOfStars == i) ? remainingStar : division;
            htmlString += `<span class="coolStar" style="--division:${division};"></span>`


        }
        sectionContainer.innerHTML = `${htmlString}
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
    //console.log(sectionContainer)
    if (!stopDefaultContainer)
        contentContainer.appendChild(sectionContainer);
    translator.translatePageTo();
}
// <section id="similar-site-wrapper" class="contentSection">
// </section>

loadPageCore()
if (localStorage.experimentalFeatures == "true") {
    loginCheck()
    //loginButton()
    loadPageExternal()
}

function send_message(type, data){
    var msg = {
        type: type,
        data: data
    };
    if (parent){
	    try{
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
if (Url.get["debug"] == 'true'){
    debug = true;
}
if (localStorage.debugMode == "true") {
    document.lastChild.classList.toggle("debugColors");
    debug = true;
}
let wW = window.innerWidth;
let backButton = document.getElementById('backButton');
let closeButton = document.getElementById('closeButton');
let voteButtons = document.getElementById('Invisible-vote');
var voteNumbers = [2, 4];
let boyButton = document.getElementById('Invisible-boycott');
let roundelButton = document.getElementById('roundelButton');
let settingsButton = document.getElementById('settingsButton');
let titleBar = document.getElementById('titlebar');
let coName = document.getElementsByClassName('co-name')[0];
let blank = document.getElementsByClassName('blankForSmall')[0];
let fullPage = document.documentElement;
let content = document.getElementsByClassName('content')[0];
let body = document.body;
closeButton.setAttribute('onclick', 'closeIV()');
let closeIV = function(){
    send_message("IVClose", "closeButton");
};
let settings = document.getElementById('settings');
let graphButtons = document.getElementById('graphButtons');
let networkGraph = document.getElementById('graph-container');
let sigmacontainer = document.getElementById('sigma-container');
let infoCard = document.getElementById('wikipedia-infocard-frame');
let wikipediaPage = document.getElementById('wikipedia-first-frame');


// For voting 
async function voteAsync(site, direction){
   // var voteHeaders;
   //  try {
   //      uuid = localStorage.uuid;
   //  } catch(e) {
   //      uuid = null
   //  }
   //  if (uuid == null){
   voteHeaders = new Headers({
       'Content-Type': "application/json"
   });
   //  } else {
   // voteHeaders = new Headers({
   // 	'site': site,
   // 	'direction': direction,
   //  'user': uuid
   // });
   //  }
    var data = {
        type: "domainhash",
        location: site,
        direction: direction,
    }
   var voteVars = {
       method: 'POST',
       headers: voteHeaders,
       credentials: 'include',
       body: JSON.stringify(data)

   };
   console.log(site, direction);
   var data = await fetch(
       new Request(voteUrl + "/vote", voteVars)
   ).then(response => response.json()
   ).then(data => {
       return data;
   }
   );
   return data;
}

async function getTotalAsync(site){
   var voteHeaders = new Headers({
   	'site': site
   });
   var voteVars = {
       method: 'GET',
       headers: voteHeaders,
   };
   var data = await fetch(
       new Request(voteUrl + "/get-data", voteVars)
   ).then(response => response.json()
   ).then(data => {
       return data;
   }
   );
    return data;
}

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
const spinRoundelFrames = [
 { transform: "rotate(0)" },
 { transform: "rotate(360deg)" },
];

const spinRoundelTiming = {
    duration: 500,
    iterations: 1,
}

let spinRoundel = function(){
    roundelButton.animate(spinRoundelFrames, spinRoundelTiming);
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
    if (localStorage.userPreferences)
        loadedPreferences = JSON.parse(localStorage.userPreferences) || {};
    const mergedPreferences = { ...defaultUserPreferences, ...loadedPreferences };
    localStorage.setItem("userPreferences", JSON.stringify(mergedPreferences));
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
    localStorage.setItem("userPreferences", JSON.stringify(userPreferences));
    send_message("IVNotificationsPreferences", userPreferences)
    floatDiag.remove()
}

let notificationsDraw = function(){
    if (localStorage.IVNotifications == "true"){
        tagsEnabled = localStorage.IVNotificationsTags || '';
        for (const tag of availableNotifications){
            if (document.getElementById(`${tag}-bell`) == null){
                currEl = document.querySelector(`[data-id="${keyconversion[tag]}"]`);
                toggleContainer = document.createElement("div");
                toggleContainer.classList.add("tagToggleContainer");
                notToggle = document.createElement("div");
                notToggle.id = `${tag}-bell`;
                notToggle.classList.add("notificationBell");
                notToggle.innerHTML = '<label class="switch"><input type="checkbox"><span class="slider round"></span></label>';
                toggleContainer.style.margin = "0px";
                toggleContainer.style.top = "4px";
                toggleContainer.style.right = "-40px";
                toggleContainer.style.position = "relative";
                toggleContainer.style.display = "flex";
                notToggle.style.margin = "0px";
                notToggle.style.position = "relative";
                if (tagsEnabled.includes(tag))
                    notToggle.getElementsByTagName("input")[0].checked = true;
                currEl.style.display = "flex";
                currEl.style.justifyContent = "space-between";

                toggleDialog = document.createElement("img");
                toggleDialog.style.width = '20px';
                toggleDialog.style.height = '20px';
                toggleDialog.style.transform = 'translate(-20px,-6px)';
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

function settingTemplate(el, id, i18n, title, state="skip"){
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
    languagePicker.innerHTML = `
     <h2 data-i18n="common.language">Language</h2>
     <select id="langselect" title="Language Picker">
     ${languagePickerOptions}
     </select>
     `
    settings.appendChild(languagePicker)
    // Keep Dash on screen
    var onScreenItem = document.createElement("div")
    settingTemplate(onScreenItem, "onScreen", "settings.dashboard", "Keep dashboard on screen")
    // Dark Mode
    var darkmodeItem = document.createElement("div")
    settingTemplate(darkmodeItem, "permaDark", "settings.darkMode", "Dark Mode")
    // Bobble disable
    var bobbleItem = document.createElement("div")
    settingTemplate(bobbleItem, "bobbleDisable", "settings.bobbleDisabled", "Disable Bobble")
    // Notifications
    var notifications = document.createElement("div");
    notifications.id = "notifications-shade";
    notifications.classList.add("switchItem");
    notifications.innerHTML = `<h2 data-i85n="settings.notifications">Notifications</h2>
        <div id="notificationsContainer" style="display:flex;">
        <img id="notificationsCache" style="display:none;width:24px;height:24px;position:relative;transform:translate(-20px,13px);">
        <label class="switch"><input type="checkbox"><span class="slider round"></span></label></div></div>`
    settings.appendChild(notifications);

    if (localStorage.IVNotifications == "true"){
        let notifications = document.getElementById("notifications-shade")
        notifications.getElementsByTagName("input")[0].checked = true;
        cacheButton = document.getElementById("notificationsCache");
        cacheButton.style.display = "block";
        send_message("IVNotifications", "true");
        tagList = localStorage.IVNotificationsTags || "";
        send_message("IVNotificationsTags", tagList);
    } else {
        send_message("IVNotifications", "false");
    }
    
    // External Posts 
    var postbanner = document.createElement("div");
    settingTemplate(postbanner, "externalPosts-banner", "settings.externalPosts", "Experimental Features", localStorage.experimentalFeatures)

    if (debug == true && (!document.getElementById("debug-banner"))){
        var banner = document.createElement("div");
        banner.id = "debug-banner";
        banner.classList.add("switchItem");
        banner.innerHTML = `<h2 data-i85n="settings.debugBanner">Debug Mode</h2>
            <label class="switch"><input type="checkbox"><span class="slider round"></span></label></div>`
        settings.appendChild(banner);
    }
    let priorityList = document.createElement("div");
    priorityList.id ="priority-list";
    priorityList.innerHTML = `
     <h2 data-i18n="settings.priorityTitle">Prioritise Modules</h2>
     <div data-i18n="settings.priorityOrder">Drag to re-order modules</div>
       <ul id="sortlist" class="slist">

   	    <li style="list-style: none;" data-id="wikipedia-first-frame">Wikipedia</li>
   	    <li style="list-style: none;" data-id="networkgraph">Network Graph and Company Info </li>
   	    <li style="list-style: none;" data-id="political-wikidata">Political Alignment</li>
   	    <li style="list-style: none;" data-id="mbfc">Media Bias</li>
   	    <li style="list-style: none;" data-id="cta">Call To Action</li>
   	    <li style="list-style: none;" data-id="trust-pilot">Trust Pilot</li>
   	    <li style="list-style: none;" data-id="yahoo">ESG Risk</li>
   	    <li style="list-style: none;" data-id="opensec">Open Secrets</li>
   	    <li style="list-style: none;" data-id="carbon">Carbon Footprint</li>
   	    <li style="list-style: none;" data-id="lobbyeu">LobbyFacts.eu</li>

   	    <li style="list-style: none;" data-id="wbm">World Benchmark</li>
        <li style="list-style: none;" data-id="wbm-automotive-data"> Automotive Data </li>
        <li style="list-style: none;" data-id="wbm-gender-benchmark"> Gender Benchmark</li>
        <li style="list-style: none;" data-id="wbm-just-transition-assessment"> Just Transition Assessment</li>
        <li style="list-style: none;" data-id="wbm-just-transition-assessment-social"> Just Transition Assessment Social</li>
        <li style="list-style: none;" data-id="wbm-seeds-index-esa"> Seeds Index ESA</li>
        <li style="list-style: none;" data-id="wbm-seeds-index-ssea"> Seeds Index SSEA</li>
        <li style="list-style: none;" data-id="wbm-seeds-index-wc-africa"> Seeds Index WC Africa</li>
        <li style="list-style: none;" data-id="wbm-chumanrightsb"> Human Rights Benchmark</li>
        <li style="list-style: none;" data-id="wbm-financial-system-benchmark"> Financial System Benchmark</li>
        <li style="list-style: none;" data-id="wbm-social-transformation"> Social Transformation</li>
        <li style="list-style: none;" data-id="wbm-transport-benchmark"> Transport Benchmark</li>
        <li style="list-style: none;" data-id="wbm-buildings-benchmark"> Buildings Benchmark</li>
        <li style="list-style: none;" data-id="wbm-digital-inclusion"> Digital Inclusion</li>
        <li style="list-style: none;" data-id="wbm-electric-utilities"> Electric Utilities</li>
        <li style="list-style: none;" data-id="wbm-food-agriculture-benchmark"> Food Agriculture Benchmark</li>
        <li style="list-style: none;" data-id="wbm-nature-benchmark"> Nature Benchmark</li>
        <li style="list-style: none;" data-id="wbm-oil-gas-benchmark"> Oil Gas Benchmark</li>
        <li style="list-style: none;" data-id="wbm-seafood-stewardship"> Seafood Stewardship</li>

   	    <li style="list-style: none;" data-id="goodonyou">Ethical Sourcing</li>
   	    <li style="list-style: none;" data-id="bcorp">B corp</li>
   	    <li style="list-style: none;" data-id="tosdr-link">Privacy</li>
   	    <li style="list-style: none;" data-id="glassdoor">Employee Rating</li>
   	    <li style="list-style: none;" data-id="similar-site-wrapper">Similar Websites</li>
   	    <li style="list-style: none;" data-id="social-wikidata">Social Media</li>
   	    <li style="list-style: none;" data-id="trust-scam">Trust Scam</li>
       </ul>
   `
    settings.appendChild(priorityList)
}

addSettings()
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
    send_message("IVClicked", "back");
    resetBack();
}

let justSendBack = function(x) {
    if (Url.get["vote"] != "true"){
        window.location.href = "https://test.reveb.la/" ;
    }
    bw = backButton.getBoundingClientRect()['width'];
    // if ( bw == 40 || bw == 78 || mode == 1) {
    send_message("IVClicked", "back");
    // }
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
    // element.style.height = startH + "px";
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
    if (infoCard != null) {
    if (infoCard.classList.contains("expanded")) {
        settings.style.visibility = 'hidden';
        setBack('closeInfoCard()');
    } else if (wikipediaPage.classList.contains("expanded")) {
        settings.style.visibility = 'hidden';
        setBack('closeWikipediaPage()');
    } else {
       resetBack();
    }
    } else {
       resetBack();
    }
}

var IVKeepOnScreen = localStorage.IVKeepOnScreen;
var IVDarkModeOverride = localStorage.IVDarkModeOverride;
var ExperimentalFeatures = localStorage.experimentalFeatures;
var IVBobbleOverride = localStorage.IVBobbleOverride;
var IVLike = document.getElementById('Invisible-like')
var IVDislike = document.getElementById('Invisible-dislike')

if (IVKeepOnScreen == "true"){
	document.getElementById('onScreen').getElementsByTagName('label')[0].firstElementChild.checked = true;
    send_message("IVKeepOnScreen", "true");
}
    
if (IVBobbleOverride == "true"){
	document.getElementById('bobbleDisable').getElementsByTagName('label')[0].firstElementChild.checked = true;
    send_message("IVBobbleDisable", "true");
}

if (IVDarkModeOverride == "true"){
	document.getElementById('permaDark').getElementsByTagName('label')[0].firstElementChild.checked = true;
    document.lastChild.classList.toggle('dark-theme');
    document.getElementById('backButton').style.backgroundImage = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTciIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNyAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExLjgzMzMgMTMuMzMzNEw2LjUgOC4wMDAwNEwxMS44MzMzIDIuNjY2NzEiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIvPgo8L3N2Zz4K')";
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


function toggleNotifications(value) {
  if (localStorage.IVNotifications === value) return;

  localStorage.IVNotifications = value;
  cacheButton = document.getElementById("notificationsCache");
  cacheButton.style.display = value === "true" ? "block" : "none";
  send_message("IVNotifications", value);
  notificationsDraw();
  console.log("notifications " + localStorage.IVNotifications);
}

function toggleDarkMode() {
  debugModeCount = debugModeCount < 4 ? debugModeCount + 1 : debugModeCount;

  if (debugModeCount === 4) {
    debug = !debug;
    localStorage.debugMode = debug;
    document.lastChild.classList.toggle("debugColors");
  }

  console.log("IVDarkModeOverride");
  IVDarkModeOverride = !IVDarkModeOverride;
  localStorage.IVDarkModeOverride = IVDarkModeOverride;
  document.lastChild.classList.toggle('dark-theme');
  send_message("IVDarkModeOverride", IVDarkModeOverride);
}
function toggleExperimentalFeatures() {
  ExperimentalFeatures = !ExperimentalFeatures;
  localStorage.experimentalFeatures = ExperimentalFeatures;
  send_message("ExperimentalFeatures", ExperimentalFeatures ? "true" : "false");
  console.log("experimentalFeatures " + ExperimentalFeatures);
}

function toggleBobbleOverride() {
  IVBobbleOverride = !IVBobbleOverride;
  localStorage.IVBobbleOverride = IVBobbleOverride;
  send_message("IVBobbleDisable", IVBobbleOverride ? "true" : "false");
  console.log("bobble " + IVBobbleOverride);
}

function toggleKeepOnScreen() {
  IVKeepOnScreen = !IVKeepOnScreen;
  localStorage.IVKeepOnScreen = IVKeepOnScreen;
  if (debug) {
    console.log(IVKeepOnScreen ? "keep on" : "keep off");
  }
}


var debugModeCount = 0
document.addEventListener('mouseup', function (event) {
  if (event.target.matches("html")) return;
  if (event.target.matches("#floatDiag")) return;
  if (event.target.matches("#floatDiagSave")) {
      notificationCloseAndSave()
      return
  };

  if (event.target.matches('#Invisible-boycott')) {
    send_message("IVBoycott", "please");
  } else if (event.target.classList.contains('invisible-disclaimer-title')) {
    send_message("IVClicked", "disclaimer");
  } else if (event.target.classList.contains('sectionTitle') || event.target.classList.contains('iconclass') || event.target.classList.contains('scoreText')) {
    send_message("IVClicked", event.target.parentElement.id);

    if (event.target.parentElement.id == "wikipedia-first-frame") loadWikipediaPage();
    if (event.target.parentElement.id == "wikipedia-infocard-frame") loadProfileCard();
    event.target.scrollIntoView();

  } else if (event.target.parentElement.parentElement) {
    if (event.target.parentElement.parentElement.matches('.notificationBell')) {
      tagList = "";
      clickedBell = event.target.parentElement.parentElement.id;
      document.querySelectorAll(".notificationBell").forEach(function (x) {
        if (x.id == clickedBell) {
          if (!x.getElementsByTagName("input")[0].checked) tagList += x.id.replace(/-bell/, "");
        } else {
          if (x.getElementsByTagName("input")[0].checked) tagList += x.id.replace(/-bell/, "");
        }
      });
      console.log(tagList);
      send_message("IVNotificationsTags", tagList);
      localStorage.IVNotificationsTags = tagList;
    }
  }

  if (event.target.parentElement.parentElement.parentElement) {
    if (event.target.parentElement.parentElement.parentElement.matches('#notifications-shade')) {
        if (localStorage.IVNotifications === "true") {
          toggleNotifications("false");
        } else {
          toggleNotifications("true");
        }
    } else if (event.target.parentElement.parentElement.matches('#bobbleDisable')) {
        toggleBobbleOverride();
    } else if (event.target.parentElement.parentElement.matches('#externalPosts-banner')) {
        toggleExperimentalFeatures();
    } else if (event.target.parentElement.parentElement.matches('#permaDark')) {
        toggleDarkMode();
    } else if (event.target.parentElement.parentElement.matches('#onScreen')) {
        toggleKeepOnScreen();
    }

    if (event.target.matches('#indexRefresh')){
      send_message("IVIndexRefresh", "please");
    }
    
    if (event.target.matches('#notificationsCache')){
      send_message("IVNotificationsCacheClear", "please");
      localStorage.setItem("userPreferences", JSON.stringify(defaultUserPreferences));
    }

    if (event.target.matches('#backButton')) {
      send_message("IVClicked", event.target.parentElement.id);
    } else if (event.target.matches('#profile-card')) {
      send_message("biggen", "big");
      if (debug) console.log("bigg");
    }
  }
}, false);

// {value: items[it].value, label: items[it].innerHTML}
var defaultOrder = [
    "cta",
    "political-wikidata",
    "wikipedia-first-frame",
    "networkgraph", 
    "small-wikidata",
    "mbfc", 
    "trust-pilot",
    "yahoo", 
    "opensec", 
    "carbon", 
    "lobbyeu",
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
"goodonyou": "goy.section-title",
"bcorp": "bcorp.title",
"tosdr-link": "tos.title",
"glassdoor":"glassdoor.title",
"similar-site-wrapper": "similar.title",
"social-wikidata": "w.socialmedia",
"trust-scam": "trustsc.title",
};
function recalculateList(){
  var propertyOrder = localStorage.getItem("IVListOrder") ? localStorage.getItem("IVListOrder").split('|') : defaultOrder;
  let target = document.getElementById("sortlist")
  let items = target.getElementsByTagName("li"), current = null;
  let missingItems = defaultOrder.filter(item => !propertyOrder.includes(item));

  // Add missing items to IVListOrder
  propertyOrder = propertyOrder.concat(missingItems);

  // Update localStorage with the modified IVListOrder
  localStorage.setItem("IVListOrder", propertyOrder.join('|'));
  for (let x = 0; x < propertyOrder.length; x++){
    let value = propertyOrder[x];
    if (items[x] !== undefined){
    items[x].setAttribute("data-i18n", translate[value]);
    if (value == "networkgraph"){
        if (document.getElementById("graph-box")){
            //document.getElementById("graph-box").style.order = x + 5;
            [...document.styleSheets[3].cssRules].find(y=> y.selectorText=='#graph-box').style.order = x + 5;
        }
        if (document.getElementById("wikipedia-infocard-frame")){
            // document.getElementById("wikipedia-infocard-frame").style.order = x + 5;
            [...document.styleSheets[3].cssRules].find(y=> y.selectorText=='#wikipedia-infocard-frame').style.order = x + 5;
            document.getElementById("wikipedia-infocard-frame").setAttribute('onclick', `openGenericPage("wikipedia-infocard-frame")`);
        }
    }
    if (document.getElementById(value)){
        thiselement = document.getElementById(value);
        // thiselement.style.order = x + 5;
        [...document.styleSheets[3].cssRules].find(y=> y.selectorText==`#${value}`).style.order= x + 5;
        if (mode == 1){
            if (value != "carbon") thiselement.setAttribute('onclick', `openGenericPage("${value}")`);
            // console.log("mode 1");
        }
    }
    }
  };
  if (debug) console.log("sorted")
  if (document.getElementById('graph-box') != null){
      document.getElementById('graph-box').setAttribute("onclick","loadNetworkGraph()");
  }
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
	    		var order = localStorage.getItem("IVListOrder");
	    		return order ? order.split('|') : [];
	    	},

	    	/**
	    	 * Save the order of elements. Called onEnd (when the item is dropped).
	    	 * @param {Sortable}  sortable
	    	 */
	    	set: function (sortable) {
	    		var order = sortable.toArray();
	    		localStorage.setItem("IVListOrder", order.join('|'));
                recalculateList()
                if (localStorage.IVNotifications == "true") {
                  tagList = "";
                  document.querySelectorAll(".notificationBell").forEach(function(x){ 
                      if (x.getElementsByTagName("input")[0].checked)
                          tagList += x.id.replace(/-bell/,"");
                  })
                  // localStorage.IVNotificationsTags = tagList;
                  send_message("IVNotificationsTags", tagList);
                }
	    	}
	    }
  });
  recalculateList()
  if (debug) console.log($('#sortlist').sortable('toArray'));
  

}

window.addEventListener('message', function(e){
    if (e.data.message === undefined) return
    if (debug) console.log(e);
    const decoded = e.data
    var dlikeC = '';
    var likeC = '';

    if (decoded.message == "VoteUpdate"){
        if ( decoded.vstatus == "up"){
            likeC = "var(--c-main)";
            dlikeC = "var(--c-light-text)";
        } else if (decoded.vstatus == "down") {
            likeC = "var(--c-light-text)";
            dlikeC = "var(--c-main)";
        } else if (decoded.vstatus == "none") {
            likeC = "var(--c-light-text)";
            dlikeC = "var(--c-light-text)";
        }
        IVDislike.setAttribute("style", "--count:'" + decoded.dtotal + "';color:" + dlikeC + ";");
        IVLike.setAttribute("style", "--count:'" + decoded.utotal + "';color:"+ likeC + ";");
    }
    if (decoded.message == "IVAutoOpen"){
    }
});

// Voting
let voteUrl = "https://assets.reveb.la";
var tempVoteDirection = "";
var tempInvert = false;
var invert = null;
var uuid = null;
async function voteLoad(){
    site = document.getElementsByClassName("co-name")[0].textContent.replace(".", "")
    hash = document.getElementById("graphLoc").innerText.split('/')[2].replace('.json','');
    // data = await voteAsync(hash, "none").then(data => {
    //     if (debug) console.log(data);
    //     voteNumbers = [Number(data["up_total"]),Number(data["down_total"])];
    //     uuid = data["user"];
    //     localStorage.setItem("uuid", uuid);
    //     voteUpdate();
    // });
    data = await getTotalAsync(hash).then(data => {
        if (debug) console.log(data);
        voteNumbers = [Number(data["up_total"]),Number(data["down_total"])];
        //uuid = data["user"];
        //localStorage.setItem("uuid", uuid);
        voteUpdate();
    });
}
function vote(direction){
    try {
        uuid = localStorage.uuid;
    } catch(e) {
        console.log(e)
    }
    // First look for hash
    site = document.getElementsByClassName("co-name")[0].textContent.replace(".", "")
    hash = document.getElementById("graphLoc").innerText.split('/')[2].replace('.json','');
    invert = false;
    console.log(uuid);
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
    voteUpdate();
}
async function voteRequest(hash, direction, invert){
    if (debug) console.log("vote request: " + hash + " " + direction + " " + invert);
    newDirection = direction;
    if (invert){
        newDirection = "un" + direction;
    }
    data = await voteAsync(hash, newDirection).then(data => {
        if (debug) console.log(data);
        voteNumbers = [Number(data["up_total"]),Number(data["down_total"])];
        uuid = data["user"];
        localStorage.setItem("uuid", uuid);
        voteUpdate();
    });
}
function voteUpdate(){
    direction = tempVoteDirection;
    // if (direction == "up"){
    //     if (invert) voteNumbers[0] -= 1;
    //     if (!invert) voteNumbers[0] += 1;
    // } else if (direction == "down") {
    //     if (invert) voteNumbers[1] -= 1;
    //     if (!invert) voteNumbers[1] += 1;
    // } else {
    //    voteNumbers[0] = oldNumbers[0];
    //    voteNumbers[1] = oldNumbers[1];
    //}
    IVLike.setAttribute("style", "--count:'" + voteNumbers[0] + "';");
    IVDislike.setAttribute("style", "--count:'" + voteNumbers[1] + "';");
    if (!invert) {
        if (direction == "up") {
            IVLike.style.color = "green";
            IVDislike.style.color = "";
        } else {
            IVLike.style.color = "";
            IVDislike.style.color = "green";
        }
    } else {
        tempVoteDirection = "";
        IVDislike.style.color = "";
        IVLike.style.color = "";
    }
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

//  Formatted version of a popular md5 implementation
//  Original copyright (c) Paul Johnston & Greg Holt.
//  The function itself is now 42 lines long.

function md5(inputString) {
    var hc="0123456789abcdef";
    function rh(n) {var j,s="";for(j=0;j<=3;j++) s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s;}
    function ad(x,y) {var l=(x&0xFFFF)+(y&0xFFFF);var m=(x>>16)+(y>>16)+(l>>16);return (m<<16)|(l&0xFFFF);}
    function rl(n,c)            {return (n<<c)|(n>>>(32-c));}
    function cm(q,a,b,x,s,t)    {return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
    function ff(a,b,c,d,x,s,t)  {return cm((b&c)|((~b)&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t)  {return cm((b&d)|(c&(~d)),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t)  {return cm(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t)  {return cm(c^(b|(~d)),a,b,x,s,t);}
    function sb(x) {
        var i;var nblk=((x.length+8)>>6)+1;var blks=new Array(nblk*16);for(i=0;i<nblk*16;i++) blks[i]=0;
        for(i=0;i<x.length;i++) blks[i>>2]|=x.charCodeAt(i)<<((i%4)*8);
        blks[i>>2]|=0x80<<((i%4)*8);blks[nblk*16-2]=x.length*8;return blks;
    }
    var i,x=sb(""+inputString),a=1732584193,b=-271733879,c=-1732584194,d=271733878,olda,oldb,oldc,oldd;
    for(i=0;i<x.length;i+=16) {olda=a;oldb=b;oldc=c;oldd=d;
        a=ff(a,b,c,d,x[i+ 0], 7, -680876936);d=ff(d,a,b,c,x[i+ 1],12, -389564586);c=ff(c,d,a,b,x[i+ 2],17,  606105819);
        b=ff(b,c,d,a,x[i+ 3],22,-1044525330);a=ff(a,b,c,d,x[i+ 4], 7, -176418897);d=ff(d,a,b,c,x[i+ 5],12, 1200080426);
        c=ff(c,d,a,b,x[i+ 6],17,-1473231341);b=ff(b,c,d,a,x[i+ 7],22,  -45705983);a=ff(a,b,c,d,x[i+ 8], 7, 1770035416);
        d=ff(d,a,b,c,x[i+ 9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,     -42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
        a=ff(a,b,c,d,x[i+12], 7, 1804603682);d=ff(d,a,b,c,x[i+13],12,  -40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);
        b=ff(b,c,d,a,x[i+15],22, 1236535329);a=gg(a,b,c,d,x[i+ 1], 5, -165796510);d=gg(d,a,b,c,x[i+ 6], 9,-1069501632);
        c=gg(c,d,a,b,x[i+11],14,  643717713);b=gg(b,c,d,a,x[i+ 0],20, -373897302);a=gg(a,b,c,d,x[i+ 5], 5, -701558691);
        d=gg(d,a,b,c,x[i+10], 9,   38016083);c=gg(c,d,a,b,x[i+15],14, -660478335);b=gg(b,c,d,a,x[i+ 4],20, -405537848);
        a=gg(a,b,c,d,x[i+ 9], 5,  568446438);d=gg(d,a,b,c,x[i+14], 9,-1019803690);c=gg(c,d,a,b,x[i+ 3],14, -187363961);
        b=gg(b,c,d,a,x[i+ 8],20, 1163531501);a=gg(a,b,c,d,x[i+13], 5,-1444681467);d=gg(d,a,b,c,x[i+ 2], 9,  -51403784);
        c=gg(c,d,a,b,x[i+ 7],14, 1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);a=hh(a,b,c,d,x[i+ 5], 4,    -378558);
        d=hh(d,a,b,c,x[i+ 8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16, 1839030562);b=hh(b,c,d,a,x[i+14],23,  -35309556);
        a=hh(a,b,c,d,x[i+ 1], 4,-1530992060);d=hh(d,a,b,c,x[i+ 4],11, 1272893353);c=hh(c,d,a,b,x[i+ 7],16, -155497632);
        b=hh(b,c,d,a,x[i+10],23,-1094730640);a=hh(a,b,c,d,x[i+13], 4,  681279174);d=hh(d,a,b,c,x[i+ 0],11, -358537222);
        c=hh(c,d,a,b,x[i+ 3],16, -722521979);b=hh(b,c,d,a,x[i+ 6],23,   76029189);a=hh(a,b,c,d,x[i+ 9], 4, -640364487);
        d=hh(d,a,b,c,x[i+12],11, -421815835);c=hh(c,d,a,b,x[i+15],16,  530742520);b=hh(b,c,d,a,x[i+ 2],23, -995338651);
        a=ii(a,b,c,d,x[i+ 0], 6, -198630844);d=ii(d,a,b,c,x[i+ 7],10, 1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);
        b=ii(b,c,d,a,x[i+ 5],21,  -57434055);a=ii(a,b,c,d,x[i+12], 6, 1700485571);d=ii(d,a,b,c,x[i+ 3],10,-1894986606);
        c=ii(c,d,a,b,x[i+10],15,   -1051523);b=ii(b,c,d,a,x[i+ 1],21,-2054922799);a=ii(a,b,c,d,x[i+ 8], 6, 1873313359);
        d=ii(d,a,b,c,x[i+15],10,  -30611744);c=ii(c,d,a,b,x[i+ 6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21, 1309151649);
        a=ii(a,b,c,d,x[i+ 4], 6, -145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+ 2],15,  718787259);
        b=ii(b,c,d,a,x[i+ 9],21, -343485551);a=ad(a,olda);b=ad(b,oldb);c=ad(c,oldc);d=ad(d,oldd);
    }
    return rh(a)+rh(b)+rh(c)+rh(d);
}
window.onload = slist(document.getElementById("sortlist"));
content.addEventListener("DOMNodeInserted", function(event){
    recalculateList()
});
