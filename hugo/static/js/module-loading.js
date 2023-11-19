// Stub

// Load array of data to datastore
// This url needs to be fixed properly not with this bork
const pageHost = `http://${window.location.host}`
const pageCoreLocation = `${pageHost}${document.getElementById('location-url').textContent}`;
const loadPageCore = async () =>{
    try {
        const data = await fetch(pageCoreLocation)
        const response = await data.json()
        for (module of response.modules){
            addModule(type=module.type, url=`${pageHost}/${module.url}`);
        }
    } catch (e) {
        console.log(e)
    }
}
// load modules for matching data

const types = {
    "trustscam": { "id": "trust-scam", "label": "Trust Scam" }
}

const contentContainer = document.getElementsByClassName("content")[0]

async function addModule(type=undefined,url=undefined){
    if (type == undefined || url == undefined) return; 
    // needs some mechanic for caching when we switch to graph mode
    const moduleData = await fetch(url);
    const moduleResponse = await moduleData.json()
    console.log(moduleResponse)
    let sectionContainer = document.createElement('section');
    sectionContainer.className = "contentSection";
    sectionContainer.id = types[type].id;
    // Genericising needed
    if (type == 'trustscam'){
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
    
    console.log(sectionContainer)

    contentContainer.appendChild(sectionContainer);
}
// <section id="trust-scam" class="contentSection">
//     <h2 class="sectionTitle"><div data-i18n="trustsc.title">Trust Scam</div><div class="subname">({{- .Params.trustscore.domain -}})</div></h2>
//     <div class="pie hideTilExpanded"></div>
//     <score class="biaslink">{{- $trust.score -}}</score>
//     <div class="scoreText">
//         <div>
//             <h3>{{- $trust.score -}}</h3>
//             <p data-i18n="trustsc.{{- $trust.rating -}}">{{- $trust.rating -}}</p>
//             <a target="_blank" class="source blanksource" href="https://trustscam.com/{{- $trust.domain -}}">TRUSTSCAM</a>
//         </div>
//     </div>
// </section>

loadPageCore()
