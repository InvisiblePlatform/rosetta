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


