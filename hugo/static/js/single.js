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

console.log("[ IV ] Page load")
let wW = window.innerWidth;
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
closeButton.setAttribute('onclick', 'closeIV()');

let closeIV = function(){
    send_message("IVClose", "closeButton");
};

let settings = document.getElementById('settings');
let graphButtons = document.getElementById('graphButtons');
let networkGraph = document.getElementById('graph-container');
let infoCard = document.getElementById('wikipedia-infocard-frame');
let wikipediaPage = document.getElementById('wikipedia-first-frame');

document.getElementById('graph-box').setAttribute("onclick","loadNetworkGraph()");

var mode = 0                                                                    
const phoneRegex = /Mobile/i;                                                   
                                                                                
if (phoneRegex.test(navigator.userAgent)){                                      
    mode = 1;
    console.log("[ Invisible Voice ]: phone mode");
    document.getElementsByClassName("content")[0].classList.add("mobile");
    body.classList.add("mobile");
} else {
    backButton.classList.add("show");
    mode = 2;
    document.getElementsByClassName("content")[0].classList.add("desktop");
    body.classList.add("desktop");
}

if ( mode == 2 ){
    closeButton.classList.add("closeExtention");
    settingsButton.style.right = "64px";
}

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
    networkGraph.style.visibility = 'hidden';
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
    networkGraph.classList.add("expanded");
    content.classList.add('somethingIsOpen');
    body.classList.add('somethingIsOpen');
    if (mode == 1){
        noOpen = true;
    }
    if (mode == 2){
        closeButton.style.display = "none";
    }
    titleBar.style.position = "fixed";
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
    networkGraph.classList.remove("expanded");
    content.classList.remove('somethingIsOpen');
    body.classList.remove('somethingIsOpen');
    graphButtons.style.top = "";
    send_message("IVClicked", "back");
    resetBack();
}

let justSendBack = function(x) {
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
    if (infoCard.classList.contains("expanded")) {
        settings.style.visibility = 'hidden';
        setBack('closeInfoCard()');
    } else if (wikipediaPage.classList.contains("expanded")) {
        settings.style.visibility = 'hidden';
        setBack('closeWikipediaPage()');
    } else {
       resetBack();
    }
}

var IVKeepOnScreen = localStorage.IVKeepOnScreen;
var IVDarkModeOverride = localStorage.IVDarkModeOverride;
var IVLike = document.getElementById('Invisible-like')
var IVDislike = document.getElementById('Invisible-dislike')

if (IVKeepOnScreen == "true"){
	document.getElementById('onScreen').getElementsByTagName('label')[0].firstElementChild.checked = true;
    send_message("IVKeepOnScreen", "true");
}
    
if (IVDarkModeOverride == "true"){
	document.getElementById('permaDark').getElementsByTagName('label')[0].firstElementChild.checked = true;
    document.lastChild.classList.toggle('dark-theme');
    document.getElementById('backButton').style.backgroundImage = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTciIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNyAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExLjgzMzMgMTMuMzMzNEw2LjUgOC4wMDAwNEwxMS44MzMzIDIuNjY2NzEiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIvPgo8L3N2Zz4K')";
}
document.addEventListener("DOMContentLoaded", function(){
    if (Url.get["app"] == 'true'){
        closeButton.style.visibility = "hidden";
    } else {
        console.log("we have light")
    }
    if (Url.get["vote"] == 'true' && mode == 1){
        body.classList.add("topBar");
    } else {
        boyButton.style.visibility = "hidden";
        voteButtons.style.visibility = "hidden";
    }
    if (Url.get["expanded"] && mode == 1){
        document.getElementById(Url.get["expanded"]).classList.add("expanded")
        content.classList.add('somethingIsOpen');
    }
document.addEventListener('mouseup', function(event){
    if (event.target.matches('#Invisible-boycott')){
        send_message("IVBoycott", "please");
    };
    if (event.target.matches('#Invisible-like')){
        send_message("IVLike", "please");
    };
    if (event.target.matches('#Invisible-dislike')){
        send_message("IVDislike", "please");
    };
    if (event.target.classList.contains('invisible-disclaimer-title')){
        send_message("IVClicked", "disclaimer");
    };
    if (event.target.classList.contains('sectionTitle')|| event.target.classList.contains('iconclass')){
        send_message("IVClicked", event.target.parentElement.id);
        if (event.target.parentElement.id == "wikipedia-first-frame"){
            loadWikipediaPage();
        }
        if (event.target.parentElement.id == "wikipedia-infocard-frame"){
            loadProfileCard();
        }
        event.target.scrollIntoView();
    };
    if (event.target.parentElement.parentElement) 
        if (event.target.parentElement.parentElement.matches('#permaDark')){
            console.log("IVDarkModeOverride");
		    if (IVDarkModeOverride == "true") {
		    	IVDarkModeOverride = false;
		    	localStorage.IVDarkModeOverride = false;
                document.lastChild.classList.toggle('dark-theme');
		    } else {
		    	IVDarkModeOverride = true;
		    	localStorage.IVDarkModeOverride = true;
                
                document.lastChild.classList.toggle('dark-theme');
		    }
            send_message("IVDarkModeOverride", IVDarkModeOverride);
        }
    if (event.target.parentElement.parentElement) 
    if (event.target.parentElement.parentElement.matches('#onScreen')){
        console.log("IVKeepOnScreen");
        IVKeepOnScreen = localStorage.IVKeepOnScreen;
		if (IVKeepOnScreen == "true") {
			localStorage.IVKeepOnScreen = false;
            console.log("keep off")
		} else {
			localStorage.IVKeepOnScreen = true;
            console.log("keep on")
		}
    }
    if (event.target.matches('#backButton')){
        send_message("IVClicked", event.target.parentElement.id);
    }
    if (event.target.matches('#profile-card')){
        send_message("biggen", "big");
        console.log("bigg");
    }
})},false);
// {value: items[it].value, label: items[it].innerHTML}
var defaultOrder = [
    "wikipedia-first-frame",
    "networkgraph", 
    "small-wikidata",
    "mbfc-header", 
    "trust-pilot",
    "yahoo", 
    "opensec", 
    "carbon", 
    "isin lct", 
    "isin dig",
    "isin nat", 
    "isin fas", 
    "isin ssd", 
    "goodonyou", 
    "bcorp", 
    "tosdr-link", 
    "glassdoor", 
    "similar-site-wrapper", 
    "social-wikidata", 
];
var translate = {
"wikipedia-first-frame": "w.wikipedia",
"networkgraph": "graph.title" ,
"small-wikidata": "w.companyinfo",
"mbfc-header": "mbfc.title",
"trust-pilot": "trustpilot.title",
"yahoo": "esg.title",
"opensec": "os.title",
"carbon": "carbon.title",
"isin lct": "isin.tlct",
"isin fas": "isin.tfas",
"isin ssd": "isin.tssd",
"isin nat": "isin.tnat",
"isin dig": "isin.tdig",
"goodonyou": "goy.section-title",
"bcorp": "bcorp.title",
"tosdr-link": "tos.title",
"glassdoor":"glassdoor.title",
"similar-site-wrapper": "similar.title",
"social-wikidata": "w.socialmedia",
};
function recalculateList(){
  var propertyOrder = localStorage.getItem("IVListOrder") ? localStorage.getItem("IVListOrder").split('|') : defaultOrder;
  let target = document.getElementById("sortlist")
  let items = target.getElementsByTagName("li"), current = null;
  for (let x = 0; x < propertyOrder.length; x++){
    let value = propertyOrder[x];
    if (items[x] !== undefined){
    items[x].setAttribute("data-i18n", translate[value]);
    if (value == "networkgraph"){
        if (document.getElementById("graph-box")){
            document.getElementById("graph-box").style.order = x + 5;
        }
        if (document.getElementById("wikipedia-infocard-frame")){
            document.getElementById("wikipedia-infocard-frame").style.order = x + 5;
            document.getElementById("wikipedia-infocard-frame").setAttribute('onclick', `openGenericPage("wikipedia-infocard-frame")`);
        }
    }
    if (document.getElementById(value)){
        thiselement = document.getElementById(value);
        thiselement.style.order = x + 5;
        if (mode == 1){
            thiselement.setAttribute('onclick', `openGenericPage("${value}")`);
            // console.log("mode 1");
        }
    }
    }

  };
  console.log("sorted")
}
function slist (target) {
  // (A) SET CSS + GET ALL LIST ITEMS
  target.classList.add("slist");
  $('#sortlist').sortable({
        group: 'iv-list',
        animation: 200,
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
	    	}
	    }
  });
  recalculateList()
  console.log($('#sortlist').sortable('toArray'));
  

}

window.addEventListener('message', function(e){
    if (e.data.message === undefined) return
    console.log(e);
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

window.onload = slist(document.getElementById("sortlist"));
