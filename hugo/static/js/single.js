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
let infoCard = document.getElementById('wikipedia-infocard-frame');
let wikipediaPage = document.getElementById('wikipedia-first-frame');

if (document.getElementById('graph-box') != null){
    document.getElementById('graph-box').setAttribute("onclick","loadNetworkGraph()");
}

// For voting 
async function voteAsync(site, direction){
   var voteHeaders;
    try {
        uuid = localStorage.uuid;
    } catch(e) {
        uuid = null
    }
    if (uuid == null){
   voteHeaders = new Headers({
   	'site': site,
   	'direction': direction
   });
    } else {
   voteHeaders = new Headers({
   	'site': site,
   	'direction': direction,
    'user': uuid
   });
    }
   var voteVars = {
       method: 'POST',
       headers: voteHeaders,
       mode: 'cors',
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
       mode: 'cors',
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
    "P": 'tosdr-link'
    // "w": 'wikidata_id'
}

let notificationDialog = function(id){
    console.log(id.target.id)
    floatDiag = document.createElement("div");
    floatDiag.id = "floatDiag"
    floatDiag.style.height = "400px";
    floatDiag.style.width = "400px";
    floatDiag.style.position = "fixed";
    floatDiag.style.zIndex = "10";
    floatDiag.style.top = "calc(50vh - 200px)";
    floatDiag.style.left = "calc(50vw - 200px)";
    floatDiag.style.backgroundColor = "var(--c-secondary-background)";
    floatDiag.textContent = `${id.target.id}`
    body.appendChild(floatDiag);
    floatDiag.onclick = document.getElementById("floatDiag").remove;
}

const availableNotifications = "blP";
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

    var notifications = document.createElement("div");
    notifications.id = "notifications-shade";
    notifications.classList.add("switchItem");
    notifications.innerHTML = `<h2 data-i85n="settings.notifications">Notifications</h2>
        <div id="notificationsContainer" style="display:flex;">
        <img id="notificationsCache" style="display:none;width:24px;height:24px;position:relative;transform:translate(-20px,13px);">
        <label class="switch"><input type="checkbox"><span class="slider round"></span></label></div></div>`
    settings.appendChild(notifications);
    if (localStorage.IVNotifications == "true"){
        notifications.getElementsByTagName("input")[0].checked = true;
        cacheButton = document.getElementById("notificationsCache");
        cacheButton.style.display = "block";
        send_message("IVNotifications", "true");
        tagList = localStorage.IVNotificationsTags || "";
        send_message("IVNotificationsTags", tagList);
        notificationsDraw();
    } else {
        send_message("IVNotifications", "false");
    }

    if (debug == true && (!document.getElementById("debug-banner"))){
        var banner = document.createElement("div");
        banner.id = "debug-banner";
        banner.classList.add("switchItem");
        banner.innerHTML = `<h2 data-i85n="settings.debugBanner">Debug Mode</h2>
            <label class="switch"><input type="checkbox"><span class="slider round"></span></label></div>`
        settings.appendChild(banner);
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
    networkGraph.classList.remove("expanded");
    content.classList.remove('somethingIsOpen');
    body.classList.remove('somethingIsOpen');
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

  if (event.target.parentElement.parentElement) {
    if (event.target.parentElement.parentElement.parentElement.matches('#notifications-shade')) {
        if (localStorage.IVNotifications === "true") {
          toggleNotifications("false");
        } else {
          toggleNotifications("true");
        }
    } else if (event.target.parentElement.parentElement.matches('#bobbleDisable')) {
        toggleBobbleOverride();
    } else if (event.target.parentElement.parentElement.matches('#permaDark')) {
        toggleDarkMode();
    } else if (event.target.parentElement.parentElement.matches('#onScreen')) {
        toggleKeepOnScreen();
    }
    
    if (event.target.matches('#notificationsCache'))
      send_message("IVNotificationsCacheClear", "please");

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
    "wikipedia-first-frame",
    "networkgraph", 
    "small-wikidata",
    "mbfc-header", 
    "trust-pilot",
    "yahoo", 
    "opensec", 
    "carbon", 
    "isin lct", 
    "isin fin", 
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
"isin fin": "isin.tfin",
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
            if (value != "carbon") thiselement.setAttribute('onclick', `openGenericPage("${value}")`);
            // console.log("mode 1");
        }
    }
    }
  };
  if (debug) console.log("sorted")
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
                      console.log(tagList)
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
    hash = md5(site);
    data = await voteAsync(hash, "none").then(data => {
        if (debug) console.log(data);
        voteNumbers = [Number(data["up_total"]),Number(data["down_total"])];
        uuid = data["user"];
        localStorage.setItem("uuid", uuid);
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
    hash = md5(site);
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
