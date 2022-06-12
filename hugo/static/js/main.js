// Main

let body = document.querySelector('body');

document.addEventListener('DOMContentLoaded',function(){

	document.body.classList.remove('loading');
	
});



// Scroll Into View

let goToTop = function() {

	window.scrollTo({
			top: 0,
			left: 0,
			behavior: 'smooth'
		})

};


// Show NEW button

let companies = document.querySelectorAll('[data-time]');
let dateNow = Math.floor(Date.now() / 1000);

let showNew = function() {
	companies.forEach(co => {
		let lastUpdate = co.getAttribute('data-time');
		
		if (lastUpdate > (dateNow - 604800)) {
			co.querySelector('span.new').classList.remove('d-none');
		}
	})
};

showNew();


// Clear Search

let clearSearch = function() {
	let searchEl = document.querySelector('#input-search');
	let names = document.querySelectorAll('.name-inner');
	searchEl.value = '';
	names.forEach(name => {
		let parent = name.parentElement;
		let largeParent = parent.parentElement;

		largeParent.classList.remove('d-none');
	})
};

// Find Open Section

let findOpenSection = function() {
	let openSection = document.querySelector('.company-parent.neg-flex');
	return openSection;
};

// Find Active Button

let findActive = function() {
	let activeButton = document.querySelector('.inview');

	return activeButton;
};

let triggerScroll = function() {
	let openSection = findOpenSection();
	if (openSection !== null) {
		// Button Scroll Function

		window.addEventListener('scroll', function() {

			let activeButton = findActive();

			let nameDiv = activeButton.previousSibling;
			let p1 = activeButton.parentElement;
			let p2 = p1.parentElement;
			let p3 = p2.nextSibling;
			let cDesc = p3.nextSibling;

			let disFromTop = nameDiv.getBoundingClientRect().top;
			let disFromBottom = nameDiv.scrollHeight;
			let descSize = cDesc.scrollHeight;

			if (disFromTop < 10 && Math.abs(disFromTop) < (descSize - 10)) {
				activeButton.style.position = 'fixed'
				activeButton.style.top = '10px'
				activeButton.style.right = '10px'
			} if (disFromTop > 10) {
				activeButton.style.position = ''
				activeButton.style.top = ''
				activeButton.style.right = ''
			} if (Math.abs(disFromTop) > (descSize - 10)) {
				activeButton.style.position = 'absolute'
				activeButton.style.top = descSize + 'px'
				activeButton.style.right = '10px'
			}
			
		});
	}
};

// Open and Close Company's Info + Add .inview class to Close Button

let showCompanyInfo = function() {

	let activeSection = document.querySelector('.sb-wrapper.active');

	let buttons = activeSection.querySelectorAll('.company-click');
	let sections = activeSection.querySelectorAll('.company-info-wrapper');

	buttons.forEach(button => {

		let buttonName = button.getAttributeNode('data-button-name').value;

		button.addEventListener('click', function(event) {
			event.preventDefault();
			
			let section = activeSection.querySelector("[data-section-name=" + buttonName + "]");

			sections.forEach(sec => {
				if (sec == section) {
					sec.classList.toggle('d-none');
					let parentSec = sec.parentElement;
					parentSec.classList.toggle('neg-flex');
					parentSec.querySelector('.close-text').classList.toggle('d-none');
					parentSec.querySelector('.close-text').classList.toggle('inview');
					parentSec.querySelector('.name-inner').classList.toggle('bk-bg');

				} else {
					sec.classList.add('d-none');
					let parentSec = sec.parentElement;
					parentSec.classList.remove('neg-flex');
					parentSec.querySelector('.close-text').classList.add('d-none');
					parentSec.querySelector('.close-text').classList.remove('inview');
					parentSec.querySelector('.name-inner').classList.remove('bk-bg');
				};
			});

            // console.log(section.textContent);
            if ( "Nothing yet" == section.textContent ) {
                section.textContent = "";
                get_json_data(section = section, item = buttonName);
            }

			goToTop();
			clearSearch();

			findOpenSection();
			triggerScroll();
		})

	});

};

showCompanyInfo();

// Fetching company data
let get_json_data = function(section, item) {
            // Relative URL of external json file
            var json_url = '/' + item.toLowerCase() + '/index.json';

            //Build the XMLHttpRequest (aka AJAX Request)
            xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() { 
                if (this.readyState == 4 && this.status == 200) {//when a good response is given do this

                    var data = JSON.parse(this.responseText); // convert the response to a json object
                    var rowInfo = document.createElement("div");
                    rowInfo.className = "company-description-wrapper";
                    var news = document.createElement("div");
                    news.className = "in-the-news-wrapper";
                    var extras = document.createElement("div");
                    extras.className = "company-extra-wrapper";
                    Object.keys(data.data).forEach(item => {
                        if ( data.data[item] == null 
                            || item == "iscjklanguage" 
                            || item == "type" 
                            || item == "updated" 
                            || item == "name" 
                            || item == "wikidataid" 
                            || item == "permalink"
                            || item == "draft" ){
                        } else if (item == "description"){
                            var para = document.createElement("p");
                            para.className = "mb-5px capitalize";
                            para.innerHTML = data.data[item];
                            rowInfo.appendChild(para);
                        } else if (item == "website"){
                            var para = document.createElement("p");
                            para.className = "website";
                            para.innerHTML = "<span>Website: </span>";
                            for ( site in data.data[item]){
                            para.innerHTML += "<span class=\"link\"> <a href=\"" + data.data[item][site] + "\" target=\"_blank\"> " + data.data[item][site].replace(/http[s]*:\/\/[w\.]*/,"") + " </a></span>";
                            }
                            rowInfo.appendChild(para);
                        } else if (item == "wikipedia"){
                            var para = document.createElement("p");
                            para.className = "wikipedia";
                            para.innerHTML = "<span>Wikipedia: </span><span class=\"link\"><a href=\"" + data.data[item] + "\" target=\"_blank\" >" + data.data[item].replace(/http[s]*:\/\/en\.wikipedia\.org\/wiki/,"") + " </a></span>";
                            rowInfo.appendChild(para);
                        } else if (item == "Content"){
                            news.innerHTML = data.data[item];
                        } else if (item == "importantpeople"){
                            var row = document.createElement("p");
                            row.innerHTML = "<span class=\"par-headings\">Other Relevant People: </span>";
                            for (thing in data.data[item]){
                                if (data.data[item][thing][1] == "null"){
                                    row.innerHTML += "<span class=\"g-bg mb-5px\">" + data.data[item][thing][2] + "</span>"
                                } else {
                                    row.innerHTML += "<span class=\"g-bg mb-5px hover-anchor\" onmouseover=\"loadWikiInfo(this)\"><a href=\"" + data.data[item][thing][1] + "\" target=\"_blank\"> " + data.data[item][thing][2] + " </a><span class=\"hover-pop dot\">This will be a little pop-out wikipedia explanation that appears on hover</span></span>"
                                }
                            }
                            
                            extras.appendChild(row);
                        } else if (item == "owner_of_owner"){
                            var row = document.createElement("p");
                            row.innerHTML = "<span class=\"par-headings\">Affiliate Companies to Stakeholder(s): </span>";
                            for (thing in data.data[item]){
                                if (data.data[item][thing][1] == "null"){
                                    row.innerHTML += "<span class=\"g-bg mb-5px\">" + data.data[item][thing][2] + "</span>"
                                } else {
                                    row.innerHTML += "<span class=\"g-bg mb-5px hover-anchor\" onmouseover=\"loadWikiInfo(this)\"><a href=\"" + data.data[item][thing][1] + "\" target=\"_blank\"> " + data.data[item][thing][2] + " </a><span class=\"hover-pop dot\">This will be a little pop-out wikipedia explanation that appears on hover</span></span>"
                                }
                            }
                            
                            extras.appendChild(row);
                        } else if (item == "owner"){
                            var row = document.createElement("p");
                            row.innerHTML = "<span class=\"par-headings\">Parent: </span>";
                            for (thing in data.data[item]){
                                if (data.data[item][thing][1] == "null"){
                                    row.innerHTML += "<span class=\"g-bg mb-5px\">" + data.data[item][thing][2] + "</span>"
                                } else {
                                    row.innerHTML += "<span class=\"g-bg mb-5px hover-anchor\" onmouseover=\"loadWikiInfo(this)\"><a href=\"" + data.data[item][thing][1] + "\" target=\"_blank\"> " + data.data[item][thing][2] + " </a><span class=\"hover-pop dot\">This will be a little pop-out wikipedia explanation that appears on hover</span></span>"
                                }
                            }
                            
                            extras.appendChild(row);
                        } else if (item == "wikicard"){
                                for (thing in data.data[item]){
                                    for (bit in data.data[item][thing]){
                                        if (bit == "wikicard_enwiki" ||
                                            bit == "wikicard_wiki_id"){ break;}
                                var row = document.createElement("p");
                                text = "<span class=\"par-headings\">" + bit + "</span>";
                                text += "<span class=\"mobile-bold\">" + data.data[item][thing][bit] + "</span>";
                                row.innerHTML = text;
                                extras.appendChild(row);
                                }}
                                
                        } else {
                            var row = document.createElement("p");
                            text = "<span class=\"par-headings\">" + item + "</span>";
                            text += "<span class=\"mobile-bold\">" + data.data[item] + "</span>";
                            row.innerHTML = text;
                            extras.appendChild(row);
                        }
                    }) 
                    section.appendChild(rowInfo);
                    section.appendChild(extras);
                    section.appendChild(news);
                }
            }
            //set the request destination and type
            xmlhttp.open("POST", json_url, true);
            //set required headers for the request
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            // send the request
            xmlhttp.send(); // when the request completes it will execute the code in onreadystatechange section
}

// Close Company

let closeAllCompanyInfo = function() {

	let sections = document.querySelectorAll('.company-info-wrapper');

		sections.forEach(sec => {
			sec.classList.add('d-none');
			let parentSec = sec.parentElement;
			parentSec.classList.remove('neg-flex');
			parentSec.querySelector('.close-text').classList.add('d-none');
			parentSec.querySelector('.close-text').classList.remove('inview');
			parentSec.querySelector('.name-inner').classList.remove('bk-bg');
		});

};


// Search Function Sat

let names = document.querySelectorAll('.name-inner');
let searchEl = document.querySelector('#input-search');

let doSearch = function() {

	names.forEach(name => {	
		let searchTerm = searchEl.value.toUpperCase();
		let innerName = name.textContent.toUpperCase();


		if (innerName.includes(searchTerm)) {
			let parent = name.parentElement;
			let largeParent = parent.parentElement;

			largeParent.classList.remove('d-none');

		} else {
			let parent = name.parentElement;
			let largeParent = parent.parentElement;

			largeParent.classList.add('d-none');
		}
		
	});

};


searchEl.addEventListener('keyup', function() {
	closeAllCompanyInfo();
	doSearch();
});


// Glossary

	let glossaryButton = document.querySelector('.glossary-title');
	let glossaryContent = document.querySelector('.glossary-content');

	glossaryButton.addEventListener('click', function() {

		if (glossaryButton.innerHTML === "Glossary (expand)") {
			glossaryButton.innerHTML = "Glossary (collapse)";
		} else {
			glossaryButton.innerHTML = "Glossary (expand)"
		};

		glossaryContent.classList.toggle('d-none');
		glossaryButton.classList.toggle('bk-bg');
		

	});


// More Info

	let moreInfoButton = document.querySelector('#footer-more-info');
	let moreInfoContent = document.querySelector('#js-desktop-footer');

	moreInfoButton.addEventListener('click', function() {

		moreInfoContent.classList.toggle('vis-hidden');
		moreInfoButton.classList.toggle('bk-bg');

	});


// SHOW THE VIDEO

let videoButton = document.querySelector('.js-video');
let videoMobButton = document.querySelector('.js-video-mob');
let videoOverlay = document.querySelector('.video-overlay');
let iframe = document.querySelector('iframe');

videoButton.addEventListener('click', function() {
	videoOverlay.classList.add('video-open');
});

videoMobButton.addEventListener('click', function() {
	videoOverlay.classList.add('video-open');
});

videoOverlay.addEventListener('click', function() {
	if (videoOverlay.classList.contains('video-open')) {
		videoOverlay.classList.remove('video-open');
		iframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
	}
});


// WIKIPEDIA HOVER ANCHORS

let hoverAnchors = document.querySelectorAll('.hover-anchor');
let wW = window.innerWidth;

hoverAnchors.forEach(el => {
	el.addEventListener('mouseover', () => {
		let elPos = el.getBoundingClientRect();
		let sixty = wW * 60 / 100;
		let hoverPop = el.querySelector('.hover-pop');

		if (elPos.left > sixty) {
		hoverPop.classList.remove('dot');
		hoverPop.classList.add('dot-right');
		}

	})

});

let loadWikiInfo = function(x) {
	let url = x.firstElementChild.getAttribute("href");	
	if (url != "null"){
		let term = url.replace("https://en.wikipedia.org/wiki/", ""); 
		let requestURL = "https://en.wikipedia.org/api/rest_v1/page/summary/" + term + "?redirect=true"
		$.ajax({
		    url: requestURL
		  }).done(function(data) {
			if (data.thumbnail){
				x.lastElementChild.innerHTML = "<img class='thumbnail' src='" + data.thumbnail.source + "'> " + data.extract_html;	
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


/// MORE INFO CALC


let sizeBox = function() {
	let footer = document.querySelector('.footer');
	let scrollBox = document.querySelector('.scroll-info');
	let distBottom = window.innerHeight - footer.offsetTop;
	let newHeight = distBottom - 85 - 132;

	scrollBox.style.height = newHeight + 'px';
}

sizeBox();


// HOW MANY COMPANIES?

let howMany = function() {
	let totalCos = document.querySelectorAll('.company-parent').length;
	let totalCosEl = document.querySelector('.js-total-cos');

	totalCosEl.innerHTML = totalCos

}

howMany();
