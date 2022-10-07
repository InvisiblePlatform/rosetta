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

// let allLinks = document.querySelectorAll('a');
// 
// allLinks.forEach(el => {
//   if (el.href.toString().includes("wikipedia.org") && el.target != "_blank" && !el.classList.contains("source")){
//       href = el.href;
//       org_html = el.innerHTML;
//       parentW = el.parentElement;
//       var new_el = document.createElement("span");
//       new_el.innerHTML = "<span class='hover-anchor' onmouseover='loadWikiInfo(this)'><a target='_blank' href=\"" + el.href + "\" >" + org_html + "</a><span class='hover-pop dot'>This will be a little pop-out wikipedia explanation that appears on hover</span></span>"
//       parentW.replaceChild(new_el,el);
// }});
// 
// let hoverAnchors = document.querySelectorAll('.hover-anchor');
let wW = window.innerWidth;

// hoverAnchors.forEach(el => {
//     return;
//   let elPos = el.getBoundingClientRect();
//   let sixty = wW * 60 / 100;
//   let hoverPop = el.querySelector('.hover-pop');
// 
//   if (elPos.left > sixty) {
//     hoverPop.classList.remove('dot');
//     hoverPop.classList.add('dot-right');
//   }
// })
let backButton = document.getElementById('backButton');
let closeButton = document.getElementById('closeButton');
closeButton.setAttribute('onclick', 'closeIV()');

let closeIV = function(){
    send_message("IVClose", "closeButton");
};


let resetBack = function(){
    settings.style.visibility = 'hidden';
    networkGraph.style.visibility = 'hidden';
    backButton.setAttribute("onclick", 'justSendBack()');
    coName.style.visibility = 'visible';
}
let setBack = function(x){
    backButton.setAttribute("onclick", x);
}

let settings = document.getElementById('settings');
let networkGraph = document.getElementById('graph-container');
let infoCard = document.getElementById('wikipedia-infocard-frame');
let wikipediaPage = document.getElementById('wikipedia-first-frame');
let coName = document.getElementsByClassName('co-name')[0];

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
    settings.style.visibility = 'visible';
    coName.style.visibility = 'hidden';
    send_message("IVClicked", "settings");
    setBack('closeSettings()');
}

let loadNetworkGraph = function(x) {
    networkGraph.style.visibility = 'visible';
    window.scrollTo(0,0);
    document.getElementsByTagName('content');
    send_message("IVClicked", "network");
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
    send_message("IVClicked", "back");
    resetBack();
}

let justSendBack = function(x) {
    send_message("IVClicked", "back");
}

let closeSettings = function(x) {
    resetBack();
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

document.addEventListener("DOMContentLoaded", function(){
document.addEventListener('mouseup', function(event){
    console.log("IVCLICKED", event.target.parentElement.id);
    if (event.target.classList.contains('sectionTitle')){
        send_message("IVClicked", event.target.parentElement.id);
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
    { value:"isin", label: "Low Carbon Transition"},
    { value:"isin", label: "Food & Agriculture Sustainability"},
    { value:"isin", label: "Social & Sustainable Development"},
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
        document.getElementById(value).style.order = x + 5;
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
      console.log(outItems);
    };
  }
}
