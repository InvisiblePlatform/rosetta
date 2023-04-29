var mode = 0                                                                    
const phoneRegex = /Mobile/i;                                                   
                                                                                
if (phoneRegex.test(navigator.userAgent)){                                      
    mode = 1;
    console.log("[ Invisible Voice ]: phone mode");
    document.getElementsByClassName("content")[0].classList.add("mobile");
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

allLinks.forEach(el => {
    el.setAttribute("target", "_blank");
});

let wW = window.innerWidth;
let backButton = document.getElementById('backButton');
let closeButton = document.getElementById('closeButton');
let settingsButton = document.getElementById('settingsButton');
let titleBar = document.getElementById('titlebar');
let coName = document.getElementsByClassName('co-name')[0];
let content = document.getElementsByClassName('content')[0];
closeButton.setAttribute('onclick', 'closeIV()');

let closeIV = function(){
    send_message("IVClose", "closeButton");
};

let settings = document.getElementById('settings');
let networkGraph = document.getElementById('graph-container');
let infoCard = document.getElementById('wikipedia-infocard-frame');
let wikipediaPage = document.getElementById('wikipedia-first-frame');

document.getElementById('graph-box').setAttribute("onclick","loadNetworkGraph()");


let settingsOffset = settings.firstElementChild.clientHeight;
let resetBack = function(){
    settings.style.bottom = "200vh";
    settings.style.top = "";
    titleBar.style.display = "";
    settings.firstElementChild.style.top = `-${settingsOffset}`;
    networkGraph.style.visibility = 'hidden';
    backButton.setAttribute("onclick", 'justSendBack()');
    backButton.classList.remove("show");
    settingsButton.style.display = 'block';
    titleBar.style.backgroundColor = "";
    titleBar.style.position = "";
    titleBar.style.top = "";
    window.scrollTo(0,0);
}
let setBack = function(x){
    backButton.setAttribute("onclick", x);
    backButton.classList.add("show");
    settingsButton.style.display = 'none';
    window.scrollTo(0,0);
}


let loadWikipediaPage = function(x) {
    wikipediaPage.classList.add('expanded');
    send_message("IVClicked", "wikipedia-first-frame");
    setBack('closeWikipediaPage()');
}

let loadProfileCard = function(x) {
    infoCard.classList.add('expanded');
    send_message("IVClicked", "wikipedia-infocard-frame");
    setBack('closeInfoCard()');
}
let loadSettings = function(x) {
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
    settings.firstElementChild.style.top = "0";
    coName.style.opacity = "0%";
    content.style.display = "none";
    send_message("IVClicked", "settings");
    setBack('closeSettings()');
    }
}

let loadNetworkGraph = function(x) {
    networkGraph.style.visibility = 'visible';
    if (mode == 1){
        networkGraph.classList.add("expanded");
    }
    titleBar.style.position = "fixed";
    titleBar.style.top = "0";
    window.scrollTo(0,0);
    document.getElementsByTagName('content');
    send_message("IVClicked", "antwork");
    setBack('closeNetworkGraph()');
}

let closeWikipediaPage = function(x){
    wikipediaPage.classList.remove('expanded');
    resetBack();
}
let closeInfoCard = function(x){
    infoCard.classList.remove('expanded');
    resetBack();
}
let closeNetworkGraph = function(x){
    networkGraph.style.visibility = 'hidden';
    if (mode == 1){
        networkGraph.classList.remove("expanded");
    }
    send_message("IVClicked", "back");
    resetBack();
}

let justSendBack = function(x) {
    send_message("IVClicked", "back");
}

let openGenericPage = function(x){
    element = document.getElementById(x)
    element.classList.add('expanded');
    setBack(`closeGenericPage("${x}")`);
}

let closeGenericPage = function(x){
    element = document.getElementById(x)
    element.classList.remove('expanded');
    resetBack();
}

let closeSettings = function(x) {
    if (mode == "1"){
        backButton.style.order = "2";
    }
    coName.style.opacity = "100%";
    content.style.display = "";
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

let loadWikiInfo = function(x) {
    return;
	let url = x.firstElementChild.getAttribute("href");	
	if (url != "null"){
		let term = url.replace("https://en.wikipedia.org/wiki/", ""); 
		let requestURL = "https://en.wikipedia.org/api/rest_v1/page/summary/" + term + "?redirect=true"
		$.ajax({
		    url: requestURL
		  }).done(function(data) {
			if (data.thumbnail){
				x.lastElementChild.innerHTML = "<img class='thumbnail' width='100%' src='" + data.thumbnail.source + "'> " + data.extract_html;	
			} else {
				x.lastElementChild.innerHTML = data.extract_html;	
			}
		  }).fail(function() {
			  console.log("oh no")
		});
	} else {
		x.lastElementChild.innerHTML = x.firstElementChild.innerHTML;
	}
	x.removeAttribute("onmouseover");
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
    { value:"wikipedia-first-frame", label: "Wikipedia"},
    { value:"networkgraph", label: "Network Graph and Company Info"},
    { value:"wikidata-small", label: "Political Alignment"},
    { value:"mbfc-header", label: "Media Bias"},
    { value:"trust-pilot", label: "Trust Pilot"},
    { value:"yahoo", label: "ESG Risk"},
    { value:"isin lct", label: "Low Carbon Transition"},
    { value:"isin fas", label: "Food & Agriculture Sustainability"},
    { value:"isin ssd", label: "Social & Sustainable Development"},
    { value:"goodonyou", label: "Ethical Sourcing"},
    { value:"bcorp", label: "B corp"},
    { value:"tosdr-link", label: "Privacy"},
    { value:"glassdoor", label: "Employee Rating"},
    { value:"similar-site-wrapper", label: "Similar Websites"},
    { value:"social-wikidata", label: "Social Media + Email"},
];
var propertyOrder = localStorage.IVPropertyOrder ? JSON.parse(localStorage.IVPropertyOrder) : defaultOrder;
slist(document.getElementById("sortlist"));
function slist (target) {
  // (A) SET CSS + GET ALL LIST ITEMS
  target.classList.add("slist");
  let items = target.getElementsByTagName("li"), current = null;
  for (let x = 0; x < propertyOrder.length; x++){
    let value = propertyOrder[x].value;
    items[x].setAttribute("value", value);
    items[x].innerHTML = propertyOrder[x].label;
    if (value == "networkgraph"){
        if (document.getElementById("graph-box")){
            document.getElementById("graph-box").style.order = x + 5;
        }
        if (document.getElementById("wikipedia-infocard-frame")){
            document.getElementById("wikipedia-infocard-frame").style.order = x + 5;
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

  };


  // (B) MAKE ITEMS DRAGGABLE + SORTABLE
  for (let i of items) {
    // (B1) ATTACH DRAGGABLE
    i.draggable = true;

    // (B2) DRAG START - YELLOW HIGHLIGHT DROPZONES
    i.ondragstart = (ev) => {
      current = i;
      for (let it of items) {
        if (it != current) { it.classList.add("hint"); }
      }
    };

    // (B3) DRAG ENTER - RED HIGHLIGHT DROPZONE
    i.ondragenter = (ev) => {
      if (i != current) { i.classList.add("active"); }
    };

    // (B4) DRAG LEAVE - REMOVE RED HIGHLIGHT
    i.ondragleave = () => {
      i.classList.remove("active");
    };

    // (B5) DRAG END - REMOVE ALL HIGHLIGHTS
    i.ondragend = () => { for (let it of items) {
        it.classList.remove("hint");
        it.classList.remove("active");
    }};

    // (B6) DRAG OVER - PREVENT THE DEFAULT "DROP", SO WE CAN DO OUR OWN
    i.ondragover = (evt) => { evt.preventDefault(); };

    // (B7) ON DROP - DO SOMETHING
    i.ondrop = (evt) => {
      evt.preventDefault();
      if (i != current) {
        let currentpos = 0, droppedpos = 0;
        for (let it=0; it<items.length; it++) {
          if (current == items[it]) { currentpos = it; }
          if (i == items[it]) { droppedpos = it; }
        }
        if (currentpos < droppedpos) {
          i.parentNode.insertBefore(current, i.nextSibling);
        } else {
          i.parentNode.insertBefore(current, i);
        }
      }
      let outItems = [];
      for (let it=0; it<items.length; it++){
          outItems.push({value: items[it].getAttribute("value"), label: items[it].innerHTML});
            let value = items[it].getAttribute("value");
            if (value == "networkgraph"){
                if (document.getElementById("graph-box")){
                    document.getElementById("graph-box").style.order = it + 5;
                }
                if (document.getElementById("wikipedia-infocard-frame")){
                    document.getElementById("wikipedia-infocard-frame").style.order = it + 5;
                }
            }
            if (document.getElementById(value)){
                document.getElementById(value).style.order = it + 5;
            }
      }
      localStorage.IVPropertyOrder = JSON.stringify(outItems);
    };
  }
}

window.addEventListener('message', function(e){
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

