let allLinks = document.querySelectorAll('a');

allLinks.forEach(el => {
  if (el.href.toString().includes("wikipedia.org") && el.target != "_blank"){
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
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  }); 
} 