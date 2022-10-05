let allLinks = document.querySelectorAll('a');

allLinks.forEach(el => {
  if (el.href.toString().includes("wikipedia.org") && el.target != "_blank" && !el.classList.contains("source")){
      href = el.href;
      org_html = el.innerHTML;
      parent = el.parentElement;
      var new_el = document.createElement("span");
      new_el.innerHTML = "<span class='hover-anchor' onmouseover='loadWikiInfo(this)'><a target='_blank' href=\"" + el.href + "\" >" + org_html + "</a><span class='hover-pop dot'>This will be a little pop-out wikipedia explanation that appears on hover</span></span>"
      parent.replaceChild(new_el,el);
}});

let hoverAnchors = document.querySelectorAll('.hover-anchor');
let wW = window.innerWidth;

hoverAnchors.forEach(el => {
  let elPos = el.getBoundingClientRect();
  let sixty = wW * 60 / 100;
  let hoverPop = el.querySelector('.hover-pop');

  if (elPos.left > sixty) {
    hoverPop.classList.remove('dot');
    hoverPop.classList.add('dot-right');
  }
})
let backButton = document.getElementById('backButton');
let resetBack = function(x){
    x.style.visibility = 'hidden';
    backButton.style.visibility = 'hidden';
    backButton.setAttribute("onclick", '');
}
let setBack = function(x){
    backButton.style.visibility = 'visible';
    backButton.setAttribute("onclick", x);
}

let settings = document.getElementById('settings');
let networkGraph = document.getElementById('graph-container');

let loadSettings = function(x) {
    settings.style.visibility = 'visible';
    setBack('closeSettings()');
}

let loadNetworkGraph = function(x) {
    networkGraph.style.visibility = 'visible';
    setBack('closeNetworkGraph()');
}

let closeNetworkGraph = function(x){
    networkGraph.style.visibility = 'hidden';
    resetBack(networkGraph);
}

let closeSettings = function(x) {
    resetBack(settings);
}

let loadWikiInfo = function(x) {
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

var coll = document.getElementsByClassName("collapsible");
var i;
for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "") {
      content.style.display = "none";
    } else {
      content.style.display = "";
    }
  }); 
} 

document.addEventListener('mouseup', function(event){
    if (event.target.matches('#profile-card')){
        send_message("biggen", "big");
        console.log("bigg");
    }
})
function send_message(type, data)
{
    var msg = {
        type: type,
        data: data
    };
    parent.postMessage(msg, "*");
}
function slist (target) {
  // (A) SET CSS + GET ALL LIST ITEMS
  target.classList.add("slist");
  let items = target.getElementsByTagName("li"), current = null;
  for (let x = 0; x < propertyOrder.length; x++){
    items[x].innerHTML = propertyOrder[x];
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
	outItems.push(items[it].innerHTML);
      }
      localstorage.set({
          "propertyOrder": outItems
      });
      console.log(outItems);
    };
  }
}
