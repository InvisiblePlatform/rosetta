// Stub

// Load array of data to datastore
// This url needs to be fixed properly not with this bork
const pageHost = `http://${window.location.host}`
const pageCoreLocation = `${pageHost}${document.getElementById('location-url').textContent}`;
const loadPageCore = async () =>{
    try {
        const data = await fetch(pageCoreLocation)
        const response = await data.json()
        for (module of response.core){
            if (module.url == 'local'){
                console.log(module);
            } else {
                addModule(type=module.type, url=`${pageHost}/ds/${module.url}`);
            }
        }
    } catch (e) {
        console.log(e)
    }
}
// load modules for matching data

const types = {
    "trustscore": { "id": "trust-scam", "label": "Trust Scam" },
    "mbfc": { "id": "mbfc", "label": "Media Bias" },
    "glassdoor": { "id": "glassdoor", "label": "Employee Rating" },
    "similar": { "id": "similar-site-wrapper", "label": "Similar Sites" },
    // "tosdr": { "id": "tosdr-link", "label": "Privacy" },
}

const contentContainer = document.getElementsByClassName("content")[0]

async function addModule(type=undefined,url=undefined){
    if (type == undefined || url == undefined) return; 
    // needs some mechanic for caching when we switch to graph mode
    const moduleData = await fetch(url);
    const moduleResponse = await moduleData.json()
    // console.log(moduleResponse)
    if (type in types) {} else {return;}
    let sectionContainer = document.createElement('section');
    sectionContainer.className = "contentSection";
    sectionContainer.id = types[type].id;
    // Genericising needed
    if (type == 'trustscore'){
        sectionContainer.innerHTML = `
        <h2 class="sectionTitle"><div data-i18n="trustsc.title">Trust Scam</div><div class="subname">(${moduleResponse.source})</div></h2>
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
        <h2 class="sectionTitle"><div data-i18n="mbfc.title">Media Bias</div><div class="subname">(${ moduleResponse.source })</div></h2>
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
            <h2 data-i18n="glassdoor.title" class='sectionTitle'>Employee Rating</h2>
            <div class="pie hideTilExpanded"></div>
            <score class="ratingOutOfFive">${ moduleResponse.glasroom_rating.ratingValue }</score>
            <div class="pie hideTilExpanded animate" style="--c:var(--chart-fore);--p:${ (parseFloat(moduleResponse.glasroom_rating.ratingValue) / 5) * 100 };"></div>
            <div class="scoreText fullBleed">
                <div>
            <div class="ratingCount">${ moduleResponse.glasroom_rating.ratingCount } <emphasis class="ratingCount" data-i18n="glassdoor.reviews"></emphasis></div>
            <table class="dataTable">
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
        sectionContainer.innerHTML = `
            <h2 class='sectionTitle' data-i18n="tos.title">Privacy</h2>
            <div class="pie hideTilExpanded"></div>
            <score style="font-size: 64px;">{{ .rated }}</score>
            <div class="scoreText fullBleed">
                <div>
            <h3><div data-i18n="tos.wordGrade" style="display:inline;">Grade</div> {{ $grade }}</h3>
            {{- if eq $grade "E" -}}
            <p data-i18n="tos.e">The terms of service raise very serious concerns.</p>
            {{- else if eq $grade "D" -}}
            <p data-i18n="tos.d">The terms of service are very uneven or there are are some important issues that need your attention.</p>
            {{- else if eq $grade "C" -}}
            <p data-i18n="tos.c">The terms of service are okay but some issues need your consideration.</p>
            {{- else if eq $grade "B" -}}
            <p data-i18n="tos.b">The terms of service are fair towards the user but they could be improved.</p>
            {{- else if eq $grade "A" -}}
            <p data-i18n="tos.a">The best terms of services: they treat you fairly, respect your rights and will not abuse your data.</p>
            {{- end -}}
            <a target="_blank" class="source" href="https://tosdr.org/en/service/{{- $id -}}">TOS;DR</a>
            </div>
            </div>
        `
    }

    if (type == 'similar'){
        htmlString = `
        <h2 data-i18n="similar.title" class="sectionTitle" >Similar Websites</h2>
        <div class="scoreText fullBleed"><div>
        <section id="similar-sites" class="hideInSmall">`

        for (site in moduleResponse.similar){
        //<section class="similar-site">
        //    <a target="_blank" alt="{{- index . "Site" -}}" href="http://{{- index . "Site" -}}">
        //        {{- index . "Site" -}}</a> <div class="percent">{{- index . "Grade" | mul 100 | math.Floor  -}}</div>
        //</section>
            ssite = moduleResponse.similar[site].s
            htmlString += `
        <section class="similar-site">
            <a target="_blank" alt="${ssite}" href="https://${ssite}">
                ${ssite}</a><div class="percent">100</div>
        </section>
    `;

        }
        sectionContainer.innerHTML = `${htmlString}
        </section>
        <a target="_blank" class="source" href="https://similarsites.com/site/${ moduleResponse.domain }" style="order:101;">SIMILARSITES.COM</a>
            </div></div>
        `;
    }
    //console.log(sectionContainer)
    contentContainer.appendChild(sectionContainer);
}
// <section id="similar-site-wrapper" class="contentSection">
// </section>

loadPageCore()
