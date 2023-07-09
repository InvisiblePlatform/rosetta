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

console.log("[ IV ] Page load")
let wW = window.innerWidth;
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
    { value:"wikipedia-first-frame", label: "Wikipedia"},
    { value:"networkgraph", label: "Network Graph and Company Info"},
    { value:"small-wikidata", label: "Political Alignment"},
    { value:"mbfc-header", label: "Media Bias"},
    { value:"trust-pilot", label: "Trust Pilot"},
    { value:"yahoo", label: "ESG Risk"},
    { value:"opensec", label: "OpenSecrets"},
    { value:"carbon", label: "Carbon Footprint"},
    { value:"isin lct", label: "Low Carbon Transition"},
    { value:"isin dig", label: "Digital Inclusion"},
    { value:"isin nat", label: "Nature Benchmark"},
    { value:"isin fas", label: "Food & Agriculture Sustainability"},
    { value:"isin ssd", label: "Social & Sustainable Development"},
    { value:"goodonyou", label: "Ethical Sourcing"},
    { value:"bcorp", label: "Bcorp"},
    { value:"tosdr-link", label: "Privacy"},
    { value:"glassdoor", label: "Employee Rating"},
    { value:"similar-site-wrapper", label: "Similar Websites"},
    { value:"social-wikidata", label: "Social Media"},
];
var translate = {
"wikipedia-first-frame": "w.wikipedia",
"networkgraph": "graph.title" ,
"small-wikidata": "w.companyinfo",
"mbfc-header": "mbfc.title",
"trust-pilot": "",
"yahoo": "esg.title",
"opensec": "os.title",
"carbon": "carbon.title",
"isin lct": "",
"isin fas": "",
"isin ssd": "",
"isin nat": "",
"isin dig": "",
"goodonyou": "goy.section-title",
"bcorp": "",
"tosdr-link": "tos.title",
"glassdoor":"glassdoor.title",
"similar-site-wrapper": "similar.title",
"social-wikidata": "w.socialmedia",
};
var propertyOrder = localStorage.IVPropertyOrder ? JSON.parse(localStorage.IVPropertyOrder) : defaultOrder;
function slist (target) {
  // (A) SET CSS + GET ALL LIST ITEMS
  target.classList.add("slist");
  let items = target.getElementsByTagName("li"), current = null;
  for (let x = 0; x < propertyOrder.length; x++){
    let value = propertyOrder[x].value;
    if (items[x] !== undefined){
    items[x].setAttribute("value", value);
    items[x].setAttribute("data-i18n", translate[value]);
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
    }
  };


  // (B) MAKE ITEMS DRAGGABLE + SORTABLE
  var position = 0;
  for (let i of items) {
    position += 1;
    if (mode == 1) {
        i.style.order = position;
    }
    // (B1) ATTACH DRAGGABLE
    i.draggable = true;


    // (B2) DRAG START - YELLOW HIGHLIGHT DROPZONES
    i.ondragstart = (ev) => {
      current = i;
      ev.dataTransfer.setData('text/plain', 'hello');
      ev.dataTransfer.dropEffect = 'copy';
      for (let it of items) {
        if (it != current) { it.classList.add("hint"); }
      }
    };

    // (B3) DRAG ENTER - RED HIGHLIGHT DROPZONE
    i.ondragenter = (ev) => {
      if (i != current) { i.classList.add("active"); }
    };

    if (mode == 1) {
    i.addEventListener('touchmove', function(e){
        var tl = e.targetTouches[0];
        iPlace = i.getBoundingClientRect();
        i.style.height = iPlace.height + "px";
        i.style.width = iPlace.width + "px";
        i.style.top = tl.clientY + "px";
        i.classList.add("held");
    })
    i.addEventListener('touchend', function(e){
        var touchLocation = e.targetTouches[0];
        i.classList.remove("held");
        iPlace = i.style.top.split("px")[0];
        i.style.top = "";
        i.style.left = "";
        // oord = Number(i.style.order);
        // for (let it=0; it<items.length; it++){
        //     posY = items[it].getBoundingClientRect().y;
        // }
        // for (let it=0; it<items.length; it++){
        //     ord = Number(items[it].style.order);
        // }
        sorting = [];
        for (let it=0; it<items.length; it++) {
            if (i.getAttribute("value") != items[it].getAttribute("value")){
                posY = items[it].getBoundingClientRect().y;
            } else {
                posY = Number(iPlace);
            }
            sorting.push({key: items[it].getAttribute("value"), value: posY});
        }
        sorted = sorting.sort(sort_by("value", false, Number));
        sortedKeys = {}
        lookupLabel = {}
        for (let it=1; it<sorted.length+1; it++){
            sortedKeys[`${sorted[it-1].key}`] = it;
        }
        for (let it=0; it<items.length; it++) {
            items[it].style.order = sortedKeys[`${items[it].getAttribute("value")}`];
            lookupLabel[`${items[it].getAttribute("value")}`] = items[it].innerHTML;
        }
        let outItems = []
        for (let it=1; it<sorted.length+1; it++){
            outItems.push({value: sorted[it-1].key, label: lookupLabel[`${sorted[it-1].key}`]});
            let value = sorted[it-1].key;
            if (value == "networkgraph"){
                if (document.getElementById("graph-box")){
                    document.getElementById("graph-box").style.order = it + 4;
                }
                if (document.getElementById("wikipedia-infocard-frame")){
                    document.getElementById("wikipedia-infocard-frame").style.order = it + 4;
                }
            }
            if (document.getElementById(value)){
                document.getElementById(value).style.order = it + 4;
            }
        }
        localStorage.IVPropertyOrder = JSON.stringify(outItems);
    });
    }

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

    // i.addEventListener('touchend', function(e){
    //     var touchLocation = e.targetTouches[0];
    //     i.style.left = touchLocation.pageX + 'px';
    //     i.style.top = touchLocation.pageY + 'px';
    //     for (let j of items) {
    //         if (j != current) {
    //           let currentpos = 0, droppedpos = 0;
    //           for (let it=0; it<items.length; it++) {
    //             if (current == items[it]) { currentpos = it; }
    //             if (i == items[it]) { droppedpos = it; }
    //           }
    //           if (currentpos < droppedpos) {
    //             i.parentNode.insertBefore(current, i.nextSibling);
    //           } else {
    //             i.parentNode.insertBefore(current, i);
    //           }
    //         }
    //         let outItems = [];
    //         for (let it=0; it<items.length; it++){
    //             outItems.push({value: items[it].getAttribute("value"), label: items[it].innerHTML});
    //               let value = items[it].getAttribute("value");
    //               if (value == "networkgraph"){
    //                   if (document.getElementById("graph-box")){
    //                       document.getElementById("graph-box").style.order = it + 5;
    //                   }
    //                   if (document.getElementById("wikipedia-infocard-frame")){
    //                       document.getElementById("wikipedia-infocard-frame").style.order = it + 5;
    //                   }
    //               }
    //               if (document.getElementById(value)){
    //                   document.getElementById(value).style.order = it + 5;
    //               }
    //         }
    //         localStorage.IVPropertyOrder = JSON.stringify(outItems);
    //     }
    // })
  }
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
