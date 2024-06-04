let sampleResponse = null;
let brandStack = {};
let brandStackOrder = [];
let topDisplay = document.getElementById("topDisplay");
const dbLocationUrl = "https://test.reveb.la/db/"
// The width and height of the captured photo. We will set the
// width to the value defined here, but the height will be
// calculated based on the aspect ratio of the input stream.

const width = 1920; // We will scale the photo width to this
let height = 1080; // This will be computed based on the input stream

// |streaming| indicates whether or not we're currently streaming
// video from the camera. Obviously, we start at false.

let streaming = false;

// The various HTML elements we need to configure or control. These
// will be set by the startup() function.
// okay
let video = null;
let canvas = null;
let photo = null;
let startbutton = null;
let returnbutton = null;
let azurebutton = null;
let googlebutton = null;
let geminibutton = null;
let outputText = null;
let saveKeysButton = null;

let rotatedFeed = true;

function showViewLiveResultButton() {
    if (window.self !== window.top) {
        // Ensure that if our document is in a frame, we get the user
        // to first open it in its own tab or window. Otherwise, it
        // won't be able to request permission for camera access.
        document.querySelector(".contentarea").remove();
        const button = document.createElement("button");
        button.textContent = "View live result of the example code above";
        document.body.append(button);
        button.addEventListener("click", () => window.open(location.href));
        return true;
    }
    return false;
}


function startupSpeedCam() {
    if (showViewLiveResultButton()) {
        return;
    }
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    photo = document.getElementById("photo");
    contentArea = document.getElementsByClassName("contentArea")[0]

    azurebutton = document.getElementById("azureBrand");
    googlebutton = document.getElementById("googleVision");
    geminibutton = document.getElementById("geminiVision");
    returnbutton = document.getElementById("returnButton");
    saveKeysButton = document.getElementById("saveApiKeys");

    outputText = document.getElementById("outputText")



    let topDisplay = document.getElementById("topDisplay")
    topDisplay.innerHTML = '<div id="blankSplash">Invisible Voice</div>'
    navigator.mediaDevices
        .getUserMedia({ video: { width: 1920, height: 1080 }, audio: false })
        .then((stream) => {
            video.srcObject = stream;
            video.play();
        })
        .catch((err) => {
            console.error(`An error occurred: ${err}`);
        });

    video.addEventListener(
        "canplay",
        (ev) => {
            if (!streaming) {
                height = video.videoHeight / (video.videoWidth / width);

                // Firefox currently has a bug where the height can't be read from
                // the video, so we will make assumptions if this happens.

                if (isNaN(height)) {
                    height = width / (9 / 16);
                }

                video.setAttribute("width", width);
                video.setAttribute("height", height);
                canvas.setAttribute("width", height);
                canvas.setAttribute("height", width);
                streaming = true;
            }
        },
        false,
    );
    if (!window.localStorage.getItem("apiKey")) {
        createPopoverApiKey();
    }

    clearphoto();
    document.getElementById("topDisplay").addEventListener("click", e => {
        target = e.target
        console.log(target)


        if (target.className == "companyPanel") {
            openSpeedCam(target.getAttribute("data-brand"))
        } else if (target.className == "companyText") {
            openSpeedCam(target.parentNode.getAttribute("data-brand"))
        } else if (target.className == "title" || target.className == "source") {
            openSpeedCam(target.parentNode.parentNode.getAttribute("data-brand"))
        } else {
            refreshDisplay()
            placement = 1;
            updateDisplay()
        }
    })

    if (localStorage.getItem("keywordImagesLookup")) {
        keywordImagesLookup = JSON.parse(localStorage.getItem("keywordImagesLookup"))
    }
}

// Fill the photo with an indication that none has been
// captured.
function openSpeedCam(brand = false) {
    if (brand) {
        const currentBrand = brandStack[brand].db;
        manualSetup(currentBrand)
    }
    console.log(`${brand} open`)
    contentArea.classList.toggle("offScreen")
    itsOpen = true;
    checkInputTimeout()
}

let lastInputTime = Date.now();

function handleInput() {
    lastInputTime = Date.now();
}

function checkInputTimeout() {
    const timeoutDuration = 2 * 60 * 1000; // 2 minutes
    if (Date.now() - lastInputTime >= timeoutDuration) {
        closeIV();
        addPopover("Timeout")
    } else {
        setTimeout(checkInputTimeout, timeoutDuration);
    }
}

document.addEventListener("mousemove", handleInput);
document.addEventListener("touchstart", handleInput);


function closeIV() {
    itsOpen = false;
    contentArea = document.getElementsByClassName("contentArea")[0]
    contentArea.classList.remove("offScreen")
    //currentBrand = ''
    //manualSetup(currentBrand)
}

function clearphoto() {
    const context = canvas.getContext("2d");
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const data = canvas.toDataURL("image/png");
    photo.setAttribute("src", data);
}

// Capture a photo by fetching the current contents of the video
// and drawing it into a canvas, then converting that to a PNG
// format data URL. By drawing it on an offscreen canvas and then
// drawing that to the screen, we can change its size and/or apply
// other changes before drawing it.

function takepicture(rotated = true) {
    const context = canvas.getContext("2d");
    if (width && height) {
        if (rotated) {
            context.translate(canvas.width * 0.5, canvas.height * 0.5);
            context.rotate(Math.PI / 2);
            context.translate(-width * 0.5, -height * 0.5);
            context.drawImage(video, 0, 0, width, height);
        } else {
            context.drawImage(video, 0, 0, height, width);
        }

        const data = canvas.toDataURL("image/png");
        photo.setAttribute("src", data);
    } else {
        clearphoto();
    }
}
function dataURLtoBlob(dataURL) {
    let array, binary, i, len;
    binary = atob(dataURL.split(',')[1]);
    array = [];
    i = 0;
    len = binary.length;
    while (i < len) {
        array.push(binary.charCodeAt(i));
        i++;
    }
    return new Blob([new Uint8Array(array)], {
        type: 'image/png'
    });
};

function sendRequestForScan(type) {

    console.log(`Requesting scan ${type}`)
    currentPhoto = photo.src
    let options;
    let requestUrl;
    if (type == "azure") {
        requestUrl = 'https://cv-ai-test.cognitiveservices.azure.com/vision/v3.2/analyze?visualFeatures=Brands&language=en&model-version=latest'
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Ocp-Apim-Subscription-Key': document.getElementById("azureApiKey").value
            },
            body: dataURLtoBlob(currentPhoto)
        };
    }
    if (type == "gemini") {
        dataObject = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "inlineData": {
                                "mimeType": "image/png",
                                "data": currentPhoto.replace("data:image/png;base64,", ""),
                            }
                        },
                        {
                            "text": "What are the brands of objects in this photo? And what are their websites? Can you format it in a json object array like \n{ \"results\": [ {\"brand\" \"brandName\",\"site\": \"https://brandsite.com\"}, ... ]} \n don't add any extra commentary or formatting, just a single line of json. You can guess at what brands are there you dont have to be sure of it."
                        }
                    ]
                }
            ],
            "generationConfig": { "maxOutputTokens": 8192, "temperature": 1, "topP": 0.95, },
            "safetySettings": [
                { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
                { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
                { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
                { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
            ]
        }
        requestUrl = 'https://us-central1-aiplatform.googleapis.com/v1/projects/revebla-193223/locations/us-central1/publishers/google/models/gemini-1.5-pro-preview-0409:streamGenerateContent' + `?access_token=${document.getElementById("googleApiKey").value}`
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataObject)
        }
    }
    if (type == "openai") {
        requestUrl = "https://api.openai.com/v1/chat/completions";
        apikey = window.localStorage.getItem("apiKey")
        options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apikey
            },
            body: JSON.stringify({
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "system",
                        "content": [
                            {
                                "text": "What are the brands of objects in this photo? And what are their websites? Can you format it in a json object array like { \"results\": [ {\"brand\" : \"$brandName\",\"site\": \"$https://brandsite.com\"}, ... ]}. Don't add any extra commentary or formatting, just a single line of json. You can guess at what brands are there you dont have to be sure of it.",
                                "type": "text"
                            }
                        ]
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": currentPhoto
                                }
                            }
                        ]
                    }
                ],
                "temperature": 1,
                "max_tokens": 256,
                "top_p": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0
            })
        };
    }

    fetch(requestUrl, options)
        .then(response => response.json())
        .then(response => handleResponse(response))
        .catch(err => console.error(err));

}

placement = 0;

function updateDisplay() {
    timerEnabled = true;
    const numberOfItems = topDisplay.children.length;
    if (placement > numberOfItems - 1) {
        placement = 0;
    }
    for (const child in [...Array(numberOfItems).keys()]) {
        if (child == placement) {
            topDisplay.children[child].classList.remove("offScreen")
            topDisplay.children[child].classList.remove("offScreenUp")
            topDisplay.children[child].classList.add("currentItem")
        } else if (child > placement) {
            topDisplay.children[child].classList.remove("currentItem")
            topDisplay.children[child].classList.add("offScreen")
            topDisplay.children[child].classList.remove("offScreenUp")
        } else {
            topDisplay.children[child].classList.remove("currentItem")
            topDisplay.children[child].classList.remove("offScreen")
            topDisplay.children[child].classList.add("offScreenUp")
        }
    }
}
document.onkeyup = function (e) {
    if (e.keyCode === 49) {
        placement += 1;
        updateDisplay();
    }
}
function demoGo() {
    demoModeSet()
    refreshDisplay()
    placement = 1;
    updateDisplay()
}

let lastKeyPressTimeF14 = 0;
let lastKeyPressTimeF15 = 0;
document.onkeydown = function (e) {
    if (e.key === "a") {
        createPopoverApiKey()
    }
    const coolDownPeriod = 60000; // 60 seconds

    if (e.key === "F14" || e.key === "Enter") {
        takepicture();
        sendRequestForScan("openai");
        console.log("F14 pressed");
        addPopover("Scanning")
        lastKeyPressTimeF14 = currentTime;

    }
    if (e.key === "F15" || e.key === "Escape") {
        if (document.getElementsByClassName("currentItem").length > 0) {
            const currentTime = new Date().getTime();
            currentItem = document.getElementsByClassName("currentItem")[0]
            if (currentItem.getAttribute("data-brand") == "Invisible Voice") {
                refreshDisplay()
                placement = 1;
                updateDisplay()
            } else {
                openSpeedCam(currentItem.getAttribute("data-brand"))
            }
            console.log("F15 pressed")
            lastKeyPressTimeF15 = currentTime;
            addPopover("Opened")
        } else {
            itsOpen = false;
            refreshDisplay()
            placement = 1;
            timerEnabled = true;
            rollOnDisplay()
        }
    }
    if (e.key === " ") {
        //takepicture();
        addPopover("Rotated")
        rotatedFeed = !rotatedFeed;
        console.log(`Spacebar pressed, rotatedFeed is now ${rotatedFeed}`)
        canvas = document.getElementById("canvas");
        currentWidth = canvas.width
        currentHeight = canvas.height
        canvas.width = currentHeight
        canvas.height = currentWidth
        canvas.setAttribute("width", currentHeight);
        canvas.setAttribute("height", currentWidth);
        document.getElementById("video").classList.toggle("notRotated")
    }
    if (e.key === "s") {
        saveBrandStack()
        addPopover("Saved")
    }
    if (e.key === "l") {
        loadBrandStack()
        addPopover("Loaded")
    }
};

let itsOpen = false;
let timerEnabled = false

function rollOnDisplay() {
    if (!itsOpen && timerEnabled) {
        placement += 1;
        updateDisplay();
    }
}

setInterval(rollOnDisplay, 10000)

function sendRequestForArticles(articles, brandName, type) {
    const brandNameA = brandName
    let filteredArticles = articles
    if (articles.length > 10) {
        filteredArticles = articles.slice(-10);
    }
    const prompt = `Here is a json object. 
    It is a list of objects representing articles, 
    the objects contain a originalSource to the article, 
    to maybe add some context, and originalTitle aka a headline 
    that is sometimes condensed. I need a response with which of these headlines would be potentially interesting to an activist, only respond with interesting responses. 
    also include a list of keywords in the objects that are related, 
    you can guess the keywords from the article's title, 
    also include the "el" variable. 
    Don't include potentially positive stories. 
    Could you format your response like this as a json object, with no extra text: 
    {"stories": [{"el":10, "keywords": ["example1","example2", "brandName" ...]} ...]} 

    Here are the stories to select from:
    ${JSON.stringify(filteredArticles)}`

    if (type === 'gemini') {
        dataObject = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": { "maxOutputTokens": 8192, "temperature": 1, "topP": 0.95, },
            "safetySettings": [
                { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
                { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
                { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
                { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
            ]
        }
        requestUrl = 'https://us-central1-aiplatform.googleapis.com/v1/projects/revebla-193223/locations/us-central1/publishers/google/models/gemini-1.5-pro-preview-0409:streamGenerateContent' + `?access_token=${document.getElementById("googleApiKey").value}`
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataObject)
        }
    }
    if (type === 'openai') {
        requestUrl = "https://api.openai.com/v1/chat/completions";
        apikey = window.localStorage.getItem("apiKey")
        options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apikey,
            },
            body: JSON.stringify({
                "model": "gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": [
                            {
                                "text": prompt,
                                "type": "text"
                            }
                        ]
                    }
                ],
                "temperature": 1,
                "max_tokens": 256,
                "top_p": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0
            })
        };
    }
    fetch(requestUrl, options)
        .then(response => response.json())
        .then(response => handleResponse(response, brandNameA))
        .catch(err => console.error(err));

}

function handleResponse(response, brandName = false) {
    const brandNameA = brandName
    sampleResponse = response;
    outputText.innerText = ''
    if (response.brands) {
        console.log("Probably Azure");
        outputText.innerText = JSON.stringify(response.brands);
        return
    }

    if (response.object === "chat.completion") {
        console.log("Probably OpenAI")
        innerTextObject = ''
        for (i in response.choices) {
            innerTextObject += response.choices[i].message.content
        }
        innerTextObject = innerTextObject.replace('```json', '').replace('```', '')
        handleResults(innerTextObject, brandNameA);
        return
    }
    console.log("Probably google")
    innerTextObject = ''
    for (i in response) {
        innerTextObject += response[i].candidates[0].content.parts[0].text;
    }
    innerTextObject = innerTextObject.replace('```json', '').replace('```', '')

    //outputText.innerText = innerTextObject;
    handleResults(innerTextObject, brandNameA);
}

function filterOutKeywordsToOne(storyKeywords) {
    inBoth = []
    storyKeywords.forEach(item => {
        if (Object.keys(keywordImagesLookup).includes(item)) {
            inBoth.push(item)
        }
    })
    const randomIndexKeyword = Math.floor(Math.random() * inBoth.length)
    return inBoth[randomIndexKeyword]

}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function setDisplay(brandNameIn) {
    const brandInfo = brandStack[brandNameIn]
    internalObject = `<div class="companyText">${JSON.stringify(brandInfo.site)}</div>`
    imageSelection = null

    if ("storyStack" in brandInfo) {
        for (const story in brandInfo.storyStack) {
            if (brandInfo.cleanNews[brandInfo.storyStack[story].el].originalLink in graphOverrideLookup) {
                imageSelection = graphOverrideLookup[brandInfo.storyStack[story].originalLink]
                internalObject = `<div class="companyText">
                <div class="title">${brandInfo.storyStack[story].originalTitle}</div>
                <div class="source">${brandInfo.storyStack[story].originalSource}</div></div>`
                break
            }
        }
        if (imageSelection == null) {
            tempStoryStack = shuffleArray(brandInfo.storyStack);

            for (const story in tempStoryStack) {
                story_obj = tempStoryStack[story]
                if (story_obj.keywords.length > 0) {
                    keywordToUse = filterOutKeywordsToOne(story_obj.keywords)
                    imageSelection = keywordImagesLookup[keywordToUse]
                    internalObject = `<div class="companyText">
                <div class="title">${story_obj.originalTitle}</div>
                <div class="source">${story_obj.originalSource}</div></div>`
                    break
                }
            }
        }
    }
    // <img class="logo" src="https://logo.clearbit.com/${brandInfo.site}"></img>
    styleString = imageSelection ? `style="background-image: url(${imageSelection});" ` : ''
    topDisplay.innerHTML += `<div class="companyPanel" ${styleString} data-brand="${brandInfo.name}">
            ${internalObject}
        </div>`
}

async function getOpenGraphData(url) {
    try {
        if (url.startsWith("http://")) {
            url = url.replace("http://", "https://");
        }

        const options = {
            method: 'GET',
            mode: 'no-cors'
        }
        const response = await fetch(url, options);
        const responsehtml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(responsehtml, "text/html");
        const metaTags = doc.getElementsByTagName("meta");
        const openGraphData = {};
        for (const tag of metaTags) {
            const property = tag.getAttribute("property");
            if (property && property.startsWith("og:")) {
                const key = property.replace("og:", "");
                const value = tag.getAttribute("content");
                openGraphData[key] = value;
            }
        }

        return openGraphData;
    } catch (error) {
        console.error(error);
        return {};
    }
}

async function handleOpenGraphData(url) {
    const data = await getOpenGraphData(url);
    if ('image' in data && data) {
        const imgContainer = document.createElement("div");
        imgContainer.innerHTML = `<div class="companyPanel" style="background-image: url(${data.image});"></div>`
        document.body.append(imgContainer);
        console.log(data.image)
        return true
    }
    return false
}

async function getPexelsImageForTag(tag) {
    const apiKey = window.localStorage.getItem("apiPexelsKey")
    const url = `https://api.pexels.com/v1/search?query=${tag}&per_page=1`
    const options = {
        method: 'GET',
        headers: {
            'Authorization': apiKey
        }
    }
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.photos.length > 0) {
        return data.photos[0].src.original;
    } else {
        return null;
    }
}


const httpsStrip = /http[s]*:\/\//g


let keywordImagesLookup = {}
let graphOverrideLookup = {}

const filterByKeywords = (data, keywords) => {
    both = []
    data.forEach(story => {
        add = false
        story.keywords.forEach(keyword => {
            if (Object.keys(keywordImagesLookup).includes(keyword)) {
                add = true
            }
        })

        if (add) both.push(story)
    })
    return both
};

async function returnArticlesForWikipedia(wikipedia, brandName) {
    const brandNameA = brandName
    requestUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${wikipedia}?redirect=true`
    init = {
        method: 'GET',
        headers: { 'Api-User-Agent': "admin@invisible-voice.com" },
        mode: 'cors',
        redirect: 'follow'
    }
    const wikiPage = document.createElement("div");
    const wikiPageData = await fetch(new Request(requestUrl, init))
        .then(response => response.text())
    wikiPage.innerHTML = wikiPageData
    citeNews = wikiPage.getElementsByClassName("news")
    cleanNews = []
    for (const el in citeNews) {
        const ref = citeNews[el]
        if (!ref.classList) continue;
        if (ref.classList.contains("cs1-prop-foreign-lang-source")) continue;
        // Dates are formatted dd Month year
        originalLink = ref.getElementsByTagName("a")[0].href
        // if (originalLink.includes("web.archive.org")) continue;
        if (originalLink.includes("speedcam")) continue;
        if (originalLink.includes("/sports/")) continue;
        originalTitle = ref.getElementsByTagName("a")[0].innerText
        //if (originalTitle.includes("...")) continue;
        //if (originalTitle.search(new RegExp(brandName, "i")) < 0) continue;
        archiveLink = ref.getElementsByTagName("a")[1] ? ref.getElementsByTagName("a")[1].href : "????";

        originalSource = ref.getElementsByTagName("i")[0] ? ref.getElementsByTagName("i")[0].innerText : "????";
        if (originalSource == "????") {
            sourcedomain = originalLink.replaceAll(httpsStrip, "").split("/")[0]
            if (sourcedomain == "web.archive.org") {
                if (archiveLink == "????") {
                    sourcedomain = originalLink.replaceAll(httpsStrip, "").split("/")[4]
                } else {
                    sourcedomain = archiveLink.replaceAll(httpsStrip, "").split("/")[0]
                    if (sourcedomain == "web.archive.org") {
                        sourcedomain = archiveLink.replaceAll(httpsStrip, "").split("/")[4]
                    }
                }
            }

            originalSource = sourcedomain.replace("www.", "")

        }
        date = "???"
        if (ref.innerText.matchAll('[0-9]+ [A-Za-z]+ [0-9]+').next().value) {
            date = ref.innerText.matchAll('[0-9]+ [A-Za-z]+ [0-9]+').next().value[0]
        } else if (ref.innerText.matchAll('[A-Za-z]+ [0-9,]+ [0-9]+').next().value) {
            date = ref.innerText.matchAll('[A-Za-z]+ [0-9,]+ [0-9]+').next().value[0]
        }
        const newsItem = { originalLink, originalTitle, originalSource, archiveLink, date, el }
        cleanNews.push(newsItem)
    }
    cleanNews.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });

    forSending = []
    for (const story in cleanNews) {
        story_obj = cleanNews[story]
        forSending.push({
            el: story_obj["el"],
            originalSource: story_obj["originalSource"],
            originalTitle: story_obj["originalTitle"],
            // originalLink: story_obj["originalLink"],
        })
    }
    brandStack[brandName]["stories"] = forSending
    brandStack[brandName]["cleanNews"] = cleanNews
    console.log("sending req")
    sendRequestForArticles(forSending, brandNameA, "openai")
}

function addToBrandStack(brand) {
    console.log(brand)
    console.log(brandStackOrder)
    const brandName = brand.brand
    const brandSite = brand.site.replace("https://", "").replace("http://", "").split("/")[0];
    if (typeof (brandStack[brandName]) === 'undefined') {
        brandStack[brandName] = {
            "name": brandName,
            "site": brandSite,
            "db": brandSite.replace("www.", "").replaceAll(".", "")
        }
        // Getting rosetta doc
        fetch(`${dbLocationUrl}${brandStack[brandName].db}.json`)
            .then(response => response.json())
            .then(data => brandStack[brandName]["data"] = data).then(() => {
                if (brandStack[brandName]["data"]["wikipedia_page"]) {
                    returnArticlesForWikipedia(brandStack[brandName]["data"]["wikipedia_page"], brandStack[brandName]["name"])
                }
            })
    }
    if (brandStackOrder.includes(brandName)) {
        placement = brandStackOrder.indexOf(brandName)
        brandStackOrder.pop(placement)
    }
    if (!brandStackOrder.includes(brandName)) {
        if (brandStackOrder.length == 0) {
            brandStackOrder = [brandName]
        } else {
            newOrder = [brandName]
            brandStackOrder = newOrder.concat(brandStackOrder)
        }
        while (brandStackOrder.length > 4) {
            currentLast = brandStackOrder.length - 1
            brandStackOrder.pop(currentLast)
        }
    }
}

function addCoverDisplay() {
    console.log("cover!!!")
    topDisplay.innerHTML += '<div id="blankSplash">Invisible Voice</div>'
}

function refreshDisplay() {
    topDisplay = document.getElementById("topDisplay")
    topDisplay.innerHTML = '';
    addCoverDisplay();
    for (const item in brandStackOrder) {
        brandInfo = brandStack[brandStackOrder[item]];
        setDisplay(brandInfo.name)
    }
    if (topDisplay.children.length > 1) {
        updateDisplay()
    }
}

async function getImagesForKeywords(keywords, returnImages = false) {
    let collectedImages = []
    for (const keyword in keywords) {
        if (Object.keys(keywordImagesLookup).includes(keywords[keyword])) {
            if (returnImages) collectedImages.push(keywordImagesLookup[keywords[keyword]])
            continue
        }
        getPexelsImageForTag(keyword)
            .then((data) => {
                console.log(data);
                if (data) {
                    keywordImagesLookup[keywords[keyword]] = data
                    if (returnImages) collectedImages.push(data)
                    localStorage.setItem("keywordImagesLookup", JSON.stringify(keywordImagesLookup))
                }
            });
    }
    if (returnImages) {
        return collectedImages
    }

}

function handleResults(obj, brandName = false) {
    const brandNameA = brandName
    response = JSON.parse(obj)
    if ("results" in response) {
        results = response.results
        for (const item in results) {
            addToBrandStack(results[item])
        }
        return
    }
    if ("stories" in response) {
        if (response.stories.length == 0) {
            console.log("No stories found")
            return
        }
        console.log(response)
        console.log(brandNameA)
        if (brandNameA) {
            brandStack[brandNameA]["articlesRes"] = response.stories
            storyStack = []
            for (const story in response.stories) {
                thisStory = brandStack[brandNameA].cleanNews.find(news => news.el == response.stories[story].el);
                thisStory.keywords = response.stories[story].keywords
                storyStack.push(thisStory)
            }
            brandStack[brandNameA]["storyStack"] = storyStack
            for (const story in storyStack) {
                handleOpenGraphData(storyStack[story].originalLink)
                    .then((data) => {
                        // Handle the resolved promise here
                        console.log(data);
                        if (!data) {
                            if (storyStack[story].keywords.length > 0) {
                                getImagesForKeywords(storyStack[story].keywords, true).then((data) => {
                                    for (const item in data) {
                                        console.log(data[item])
                                        refreshDisplay()
                                    }
                                })
                            }
                        } else {
                            console.log("Image found - OpenGraph")
                            graphOverrideLookup[storyStack[story].originalLink] = data
                            refreshDisplay()
                        }
                    })
                    .catch((error) => {
                        // Handle any errors that occurred during the promise
                        console.error(error);

                    });
            }
            return
        }
    }

}

function saveApiKeysToWebStorage() {
    window.localStorage.setItem("azure", document.getElementById("azureApiKey").value)
    window.localStorage.setItem("google", document.getElementById("googleApiKey").value)
    console.log("Saved")
}

// Set up our event listener to run the startup process
// once loading is complete.
window.addEventListener("load", startupSpeedCam, false);



function demoModeSet() {
    brandStack['Nike, Inc.'] = { "name": "Nike, Inc.", "site": "www.nike.com", "db": "nikecom", "data": { "goodonyou_slug": ["nike", "jordan"], "wikidata_id": ["Q483915", "Q101144401", "Q420953"], "title": "nike.com", "connections": "/connections/nike.com.json", "social": { "Twitter username": [{ "url": "https://twitter.com/Nike", "source": "nike.com" }, { "url": "https://twitter.com/nikebasketball", "source": "nike.com" }, { "url": "https://twitter.com/nikefootball", "source": "nike.com" }, { "url": "https://twitter.com/nikestore", "source": "nike.com" }, { "url": "https://twitter.com/nikesportswear", "source": "nike.com" }, { "url": "https://twitter.com/jumpman23", "source": "nike.com" }], "Facebook ID": [{ "url": "https://www.facebook.com/nike", "source": "nike.com" }, { "url": "https://www.facebook.com/jumpman23", "source": "nike.com" }], "Instagram username": [{ "url": "https://www.instagram.com/nike/", "source": "nike.com" }, { "url": "https://www.instagram.com/jumpman23/", "source": "nike.com" }], "YouTube channel ID": [{ "url": "https://www.youtube.com/channel/UCUFgkRb0ZHc4Rpq15VRCICA", "source": "nike.com" }, { "url": "https://www.youtube.com/channel/UCqnGgTN0ajGp0LaoKkyxAxA", "source": "nike.com" }], "TikTok username": [{ "url": "https://www.tiktok.com/@nike", "source": "nike.com" }, { "url": "https://www.tiktok.com/@jumpman23", "source": "nike.com" }], "subreddit": [{ "url": "https://old.reddit.com/r/Jordans/", "source": "nike.com" }] }, "goodonyou": [{ "rating": 3, "source": "Nike" }, { "rating": 3, "source": "Jordan" }], "core": [{ "type": "goodonyou", "url": "goodonyou/nike.json" }, { "type": "goodonyou", "url": "goodonyou/jordan.json" }, { "type": "opensecrets", "url": "opensecrets/D000027998.json" }, { "type": "wbm", "url": "wbm/PT_01270.json" }, { "type": "yahoo", "url": "yahoo/NKE.json" }, { "type": "trustpilot", "url": "trustpilot/nikecom.json" }, { "type": "lobbyeu", "url": "lobbyfacts/393423121496-65.json" }, { "type": "trustscore", "url": "trustscore/nikecom.json" }, { "type": "similar", "url": "similar/nikecom.json" }], "data": { "g0": 3, "_g0": "Nike", "g1": 3, "_g1": "Jordan", "w": [{ "s": "Nike", "m": [{ "s": "2021_Gender_Benchmark", "r": 45.2 }] }], "t": 1.8, "_t": "Nike", "s": "82.7", "_s": "nike.com", "e": 5, "_e": "Nike, Inc.", "k": "yzcgtesw" } }, "stories": [{ "el": "0", "originalSource": "The Independent", "originalTitle": "\"Nike is pronounced Nikey, confirms guy who ought to know\"" }, { "el": "1", "originalSource": "Reuters", "originalTitle": "\"Nike profit up but shares tumble on U.S. concerns\"" }, { "el": "2", "originalSource": "nike.com", "originalTitle": "\"Nike CR7\"" }, { "el": "3", "originalSource": "brandfinance.com", "originalTitle": "\"Most Valuable Apparel Brand? Nike Just Does It Again\"" }, { "el": "4", "originalSource": "The Independent", "originalTitle": "\"Logos that became legends: Icons from the world of advertising\"" }, { "el": "5", "originalSource": "The Washington Post", "originalTitle": "\"'Just Do It': The surprising and morbid origin story of Nike's slogan\"" }, { "el": "6", "originalSource": "oregonlive.com", "originalTitle": "\"Nike's 'Just Do It' slogan celebrates 20 years\"" }, { "el": "7", "originalSource": "The New York Times", "originalTitle": "\"The Birth of 'Just Do It' and Other Magic Words\"" }, { "el": "8", "originalSource": "The Oregonian", "originalTitle": "\"NikeTown Portland to close forever [at its original location] on Friday\"" }, { "el": "9", "originalSource": "The New York Times", "originalTitle": "\"Nike Executive Resigns; C.E.O. Addresses Workplace Behavior Complaints\"" }, { "el": "10", "originalSource": "Bloomberg LP", "originalTitle": "\"Nike Taps EBay Veteran John Donahoe to Succeed Parker as CEO\"" }, { "el": "11", "originalSource": "The New York Times", "originalTitle": "\"COMPANY NEWS; Cole-Haan to Nike For $80 Million\"" }, { "el": "12", "originalSource": "The New York Times", "originalTitle": "\"Hockey Fan, and Investor, Buys Bauer From Nike\"" }, { "el": "13", "originalSource": "Orange County Register", "originalTitle": "\"Bob Hurley: Success built on everyone's inner surfer\"" }, { "el": "14", "originalSource": "The Washington Post", "originalTitle": "\"Nike Drafts An All Star\"" }, { "el": "15", "originalSource": "Portland Business Journal", "originalTitle": "\"Nike unloads Starter for $60M\"" }, { "el": "16", "originalSource": "BloombergBusinessweek", "originalTitle": "\"Iconix Brand Buys Nike's Umbro Soccer Unit for $225 Million\"" }, { "el": "17", "originalSource": "The Wall Street Journal", "originalTitle": "\"After Umbro, Nike Turns to Cole Haan Sale\"" }, { "el": "18", "originalSource": "Portland Business Journal", "originalTitle": "\"Nike completes Umbro sale to Iconix\"" }, { "el": "19", "originalSource": "Portland Business Journal", "originalTitle": "\"Nike completes Cole Haan sale\"" }, { "el": "20", "originalSource": "Reuters", "originalTitle": "\"Nike profit rises, futures orders up 13 percent\"" }, { "el": "21", "originalSource": "markets.businessinsider.com", "originalTitle": "\"Nike surges after beating on earnings and announcing $15 billion in buybacks (NKE) | Markets Insider\"" }, { "el": "22", "originalSource": "BBC News", "originalTitle": "\"Nike turns to digital sales during China shutdown\"" }, { "el": "23", "originalSource": "SPECTRUM, Inc", "originalTitle": "\"SPARQ – Nike Performance Summitt\"" }, { "el": "24", "originalSource": "Reuters", "originalTitle": "\"Factbox: Nike's Vaporfly running shoes and tumbling records\"" }, { "el": "25", "originalSource": "WSJ", "originalTitle": "\"Nike Vaporfly Shoes Won't Be Banned From Olympics\"" }, { "el": "26", "originalSource": "Popular Mechanics", "originalTitle": "\"Nike's High-Stepping Air Force\"" }, { "el": "27", "originalSource": "Working Mother", "originalTitle": "\"Nike advert\"" }, { "el": "28", "originalSource": "Reuters", "originalTitle": "\"Nike shoes race to $437,500 world record auction price for sneakers\"" }, { "el": "29", "originalSource": "The New York Times", "originalTitle": "\"Nike Sold an NFT Sneaker for $134,000\"" }, { "el": "30", "originalSource": "blog.oregonlive.com", "originalTitle": "\"Appellate court rejects Beaverton annexation | The Oregonian Extra\"" }, { "el": "31", "originalSource": "American City Business Journals", "originalTitle": "\"A first look at Nike's $380M-plus HQ expansion (Renderings)\"" }, { "el": "32", "originalSource": "news.bbc.co.uk", "originalTitle": "\"Programmes | Panorama | Archive | Gap and Nike: No Sweat? October 15, 2000\"" }, { "el": "33", "originalSource": "International Consortium of Investigative Journalists", "originalTitle": "\"Offshore Trove Exposes Trump-Russia Links And Piggy Banks Of The Wealthiest 1 Percent\"" }, { "el": "34", "originalSource": "Esquire", "originalTitle": "\"People Are Already Burning Their Nikes in Response to the Colin Kaepernick Ad\"" }, { "el": "35", "originalSource": "Bloomberg.com", "originalTitle": "\"Nike Orders Rose in Four-Day Period After Kaepernick Ad Debut\"" }, { "el": "36", "originalSource": "bbc.co.uk", "originalTitle": "\"Nike hit by conservative backlash over 'racist trainer'\"" }, { "el": "37", "originalSource": "wsj.com", "originalTitle": "\"Nike Nixes 'Betsy Ross Flag' Shoe After Kaepernick Intervenes\"" }, { "el": "38", "originalSource": "bbc.com", "originalTitle": "\"Nike 'pulls Betsy Ross flag trainer after Kaepernick complaint'\"" }, { "el": "39", "originalSource": "bloomberg.com", "originalTitle": "\"Nike Pulls 'Betsy Ross Flag' Sneakers After Kaepernick Complaint\"" }, { "el": "40", "originalSource": "Reuters", "originalTitle": "\"Pence backs Hong Kong protests in China speech, slams NBA and Nike\"" }, { "el": "41", "originalSource": "NPR.org", "originalTitle": "\"Nike Vaporfly Shoes Controversy\"" }, { "el": "43", "originalSource": "Reuters", "originalTitle": "\"Canada probes Nike, Dynasty Gold over alleged use of forced labor in China\"" }, { "el": "44", "originalSource": "Uyghur Rights Monitor, the Helena Kennedy Centre for International Justice at Sheffield Hallam University", "originalTitle": "\"Tailoring Responsibility: Tracing Apparel Supply Chains from the Uyghur Region to Europe\"" }, { "el": "45", "originalSource": "Reuters", "originalTitle": "\"Canon tops list of climate-friendly companies\"" }, { "el": "46", "originalSource": "Sourcing Journal", "originalTitle": "\"Nike's Move to Zero Collection Leaves Little Fabric Waste Behind\"" }, { "el": "47", "originalSource": "The New York Times", "originalTitle": "\"The Media Business: Advertising – Addenda; Nike Spot Wins An Emmy Award\"" }, { "el": "48", "originalSource": "The New York Times", "originalTitle": "\"The Media Business: Advertising – Addenda; Nike Spot Wins An Emmy Award\"" }, { "el": "49", "originalSource": "The New York Times", "originalTitle": "\"A Nike Poster Upsets Fans of the Punk Rock Band Minor Threat in a Major Way\"" }, { "el": "50", "originalSource": "The Oregonian", "originalTitle": "\"Nike courts controversy, publicity with drug-themed skater shirts\"" }, { "el": "51", "originalSource": "Vidyard", "originalTitle": "\"A Shortish History of Online Video\"" }, { "el": "52", "originalSource": "The Sunday Times", "originalTitle": "\"The Premier League's goal rush\"" }, { "el": "53", "originalSource": "sportspromedia.com", "originalTitle": "\"Nike offers further backing for Asian soccer\"" }, { "el": "54", "originalSource": "Sky Sports", "originalTitle": "\"Premier League: Sportswear giants Nike to end Manchester United sponsorship\"" }, { "el": "55", "originalSource": "The Guardian", "originalTitle": "\"Manchester United sign record 10-year kit deal with Adidas worth £750m\"" }, { "el": "56", "originalSource": "bbc.com", "originalTitle": "\"Tiger Woods and Nike end 27-year partnership\"" }, { "el": "58", "originalSource": "The Oregonian", "originalTitle": "\"Oregon Ducks add orange to their Nike uniform repertoire for Colorado game\"" }, { "el": "60", "originalSource": "The Wall Street Journal", "originalTitle": "\"Nike Pledges $13.5 Million to Help Renovate University of Oregon Track Facilities\"" }, { "el": "62", "originalSource": "The New York Times", "originalTitle": "\"The Swoon of the Swoosh\"" }], "articlesRes": [{ "el": 9, "keywords": ["workplace", "executive", "resignation"], "interesting": true, "score": 5 }, { "el": 32, "keywords": ["sweatshop", "labor", "gap"], "interesting": true, "score": 9 }, { "el": 33, "keywords": ["offshore", "tax", "wealth"], "interesting": true, "score": 8 }, { "el": 36, "keywords": ["racism", "trainer"], "interesting": true, "score": 7 }, { "el": 37, "keywords": ["betsy ross", "flag", "shoe"], "interesting": true, "score": 6 }, { "el": 38, "keywords": ["betsy ross", "flag", "kaepernick"], "interesting": true, "score": 6 }, { "el": 39, "keywords": ["betsy ross", "flag", "kaepernick"], "interesting": true, "score": 6 }, { "el": 40, "keywords": ["hong kong", "protest", "nba"], "interesting": true, "score": 8 }, { "el": 41, "keywords": ["vaporfly", "controversy"], "interesting": true, "score": 4 }, { "el": 43, "keywords": ["forced labor", "china"], "interesting": true, "score": 10 }, { "el": 44, "keywords": ["supply chain", "uyghur", "europe"], "interesting": true, "score": 9 }] }
    brandStack["Monster Energy"] = { "name": "Monster Energy", "site": "www.monsterenergy.com", "db": "monsterenergycom", "data": { "title": "monsterenergy.com", "wikidata_id": false, "core": [{ "type": "glassdoor", "url": "glassdoor/333508.json" }, { "type": "trustpilot", "url": "trustpilot/monsterenergycom.json" }, { "type": "trustscore", "url": "trustscore/monsterenergycom.json" }, { "type": "similar", "url": "similar/monsterenergycom.json" }], "data": { "l": 4.1, "_l": "www.monsterenergy.com", "t": 3.1, "_t": "Monster Energy", "s": "81.2", "_s": "monsterenergy.com", "k": "zlts" } }, "stories": [{ "el": "0", "originalSource": "Highwiredaxe.com", "originalTitle": "\"Monster Energy and Idol Roc Announce Line-Up for Fourth Monster Energy Outbreak Tour featuring Headliner Kyle Welch\"" }, { "el": "1", "originalSource": "law.com", "originalTitle": "\"Mother Sues Energy Drink Maker Over Teenager's Death\"" }, { "el": "2", "originalSource": "The New York Times", "originalTitle": "\"F.D.A. Receives Death Reports Citing Popular Energy Drink\"" }, { "el": "3", "originalSource": "Telegraph India", "originalTitle": "\"Ban on 'irrational' energy drinks\"" }, { "el": "5", "originalSource": "nascar.com", "originalTitle": "\"NASCAR series name: Monster Energy NASCAR Cup Series unveiled\"" }, { "el": "6", "originalSource": "reuters.com", "originalTitle": "\"Dakota, Coke set Monster drink distribution plans\"" }, { "el": "8", "originalSource": "Transworld Motocross", "originalTitle": "\"Monster Athletes Ready For X Games | Transworld Motocross\"" }, { "el": "9", "originalSource": "broadwayworld.com", "originalTitle": "\"Nyjah Huston Takes Third Place in Monster Energy's Skateboard Street at X Games Minneapolis 2017\"" }, { "el": "10", "originalSource": "Snowboarder Magazine", "originalTitle": "\"Monster Energy, The Official Energy Partner of X Games Aspen 2016, Takes Over With Its Team of the World's Best Competing Athletes\"" }, { "el": "11", "originalSource": "Fox Business", "originalTitle": "\"Can Monster Energy Inject Youth Into NASCAR?\"" }, { "el": "12", "originalSource": "Washington Post Magazine", "originalTitle": "\"A D.C. root beer company, an energy drink behemoth and an ugly trademark fight\"" }, { "el": "13", "originalSource": "wisconsinlawreview.org", "originalTitle": "\"Shaming Trademark Bullies\"" }, { "el": "14", "originalSource": "bbc.com", "originalTitle": "\"Pizza firm wins trademark row ruling\"" }, { "el": "15", "originalSource": "Techdirt", "originalTitle": "\"Monster Energy Loses Trademark Opposition Against UK Drink Company, But May Have Bullied It To Death Anyway\"" }, { "el": "16", "originalSource": "Comicbook", "originalTitle": "\"Monster Energy Has Filed Trademark Complaints Against Pokemon and Monster Hunter Over Use of Word 'Monster'\"" }, { "el": "18", "originalSource": "Crunchyroll News", "originalTitle": "\"Monster Energy Takes on Pokémon, Monster Musume's Trademarks in Japan, It Wasn't Very Effective\"" }, { "el": "20", "originalSource": "Vulture", "originalTitle": "\"Beastie Boys Sue Energy Drink Company for Using Their Music\"" }, { "el": "21", "originalSource": "bevnet.com", "originalTitle": "\"Beastie Boys Awarded $668,000 in Legal Fees in Monster Copyright Case\"" }, { "el": "22", "originalSource": "The Washington Post", "originalTitle": "\"The woman who claims Monster Energy drinks are a tool of the devil is back, just in time for Halloween\"" }], "articlesRes": [{ "el": 1, "keywords": ["lawsuit-drink", "death"], "interesting": true, "score": 10 }, { "el": 2, "keywords": ["death"], "interesting": true, "score": 9 }, { "el": 15, "keywords": ["trademark"], "interesting": true, "score": 6 }, { "el": 20, "keywords": ["lawsuit"], "interesting": true, "score": 7 }, { "el": 21, "keywords": ["lawsuit"], "interesting": true, "score": 5 }] }
    brandStack["Boots"] = { "name": "Boots", "site": "boots.co.uk", "db": "bootscouk", "data": { "title": "boots.co.uk", "wikidata_id": false, "core": [{ "type": "trustpilot", "url": "trustpilot/bootscom.json" }], "data": { "t": 4.6, "_t": "Boots Opticians", "k": "zt" } }, "stories": [{ "el": "0", "originalSource": "BBC", "originalTitle": "\"Alliance Boots takeover approved\"" }, { "el": "1", "originalSource": "Chicago Tribune", "originalTitle": "\"Walgreen-Alliance Boots deal is complete\"" }, { "el": "2", "originalSource": "Campaign Live", "originalTitle": "\"Boots revamps Advantage Card kiosks\"" }, { "el": "3", "originalSource": "The New York Times", "originalTitle": "\"COMPANY NEWS; Boots Pharmaceuticals Unit To Go to BASF of Germany\"" }, { "el": "4", "originalSource": "The Independent", "originalTitle": "\"Boots ditches Wellbeing strategy to return to its roots as a chemist\"" }, { "el": "5", "originalSource": "BBC News", "originalTitle": "\"Boots announces £7bn merger deal\"" }, { "el": "6", "originalSource": "Bloomberg", "originalTitle": "\"KKR Agrees to Buy Alliance Boots, Beating Guy Hands\"" }, { "el": "7", "originalSource": "The Guardian", "originalTitle": "\"How Boots' Swiss move cost UK£100m a year\"" }, { "el": "8", "originalSource": "The Telegraph", "originalTitle": "\"Alliance Boots sells 45pc stake to Walgreens\"" }, { "el": "9", "originalSource": "BBC News", "originalTitle": "\"Walgreens to buy up Alliance Boots\"" }, { "el": "10", "originalSource": "BBC Sport", "originalTitle": "\"Boots to sponsor women's home nations and Republic of Ireland sides\"" }, { "el": "11", "originalSource": "BBC News", "originalTitle": "\"Boots review puts 200 stores at risk\"" }, { "el": "12", "originalSource": "pharmaceutical-journal.com", "originalTitle": "\"Boots sees profits almost halve in 2019\"" }, { "el": "13", "originalSource": "The Irish Times", "originalTitle": "\"Boots Ireland appoints Stephen Watkins as new MD\"" }, { "el": "14", "originalSource": "The Guardian", "originalTitle": "\"Do supermarket meal deals cut the mustard?\"" }, { "el": "15", "originalSource": "pharmaceutical-journal.com", "originalTitle": "\"Boots to provide mental health care service for £65 per month\"" }, { "el": "16", "originalSource": "the Guardian", "originalTitle": "\"A brief history of Boots No7\"" }, { "el": "17", "originalSource": "BBC News", "originalTitle": "\"'Proof' face creams beat wrinkles\"" }, { "el": "18", "originalSource": "the Guardian", "originalTitle": "\"Boots anti-wrinkle cream actually works, say researchers\"" }, { "el": "19", "originalSource": "Evening Standard", "originalTitle": "\"Sold out: The £17 cream even scientists say can banish wrinkles\"" }, { "el": "20", "originalSource": "Good Housekeeping", "originalTitle": "\"The brand new No7 product that had a 10,000-person waiting list\"" }, { "el": "21", "originalSource": "thetimes.co.uk", "originalTitle": "\"Is Boots No 7 retinol cream a £34 skincare miracle? Our beauty experts' guide to the products that work\"" }, { "el": "22", "originalSource": "BBC News", "originalTitle": "\"Early rush for anti-ageing cream\"" }, { "el": "23", "originalSource": "telegraph.co.uk", "originalTitle": "\"5 years younger? We take an exclusive look at the latest £38 wrinkle serum by No7\"" }, { "el": "24", "originalSource": "Irish Examiner", "originalTitle": "\"Can a €30 cream really turn back the clock?\"" }, { "el": "25", "originalSource": "The Telegraph", "originalTitle": "\"Boots: 'we sell homeopathic remedies because they sell, not because they work'\"" }, { "el": "26", "originalSource": "express.co.uk", "originalTitle": "\"'Homeopathic medicines don't work'\"" }, { "el": "27", "originalSource": "The Independent", "originalTitle": "\"Boots director on homeopathy and the top 10 Gerald Ratner moments\"" }, { "el": "28", "originalSource": "The Guardian", "originalTitle": "\"Homeopathy protesters to take 'mass overdose' outside Boots\"" }, { "el": "29", "originalSource": "Guardian newspapers", "originalTitle": "\"Boots staff under pressure to milk the NHS for cash, says pharmacists' union\"" }, { "el": "30", "originalSource": "Guardian newspapers", "originalTitle": "\"Boots could face regulator's investigation after Guardian report\"" }, { "el": "31", "originalSource": "The Guardian", "originalTitle": "\"How Boots went Rogue\"" }, { "el": "32", "originalSource": "The Guardian", "originalTitle": "\"Yours, a stressed pharmacist: Boots article prompts flood of letters\"" }, { "el": "33", "originalSource": "The Guardian", "originalTitle": "\"The Guardian view on Boots: sick staff, a healthcare business and the public purse\"" }, { "el": "34", "originalSource": "The Guardian", "originalTitle": "\"BHS, Boots … our misbehaving corporations need their wings clipped\"" }, { "el": "35", "originalSource": "The Guardian", "originalTitle": "\"'Independent' pharmacist's letter edited by Boots' owner\"" }, { "el": "36", "originalSource": "Guardian newspapers", "originalTitle": "\"Boots UK boss Simon Roberts quits\"" }, { "el": "37", "originalSource": "Guardian newspapers", "originalTitle": "\"New Boots boss offers chance to change\"" }, { "el": "38", "originalSource": "bbc.co.uk", "originalTitle": "\"Boots: Pharmacists under Pressure?\"" }, { "el": "39", "originalSource": "bbc.co.uk", "originalTitle": "\"Some Boots pharmacists claim they are at 'breaking point'\"" }, { "el": "40", "originalSource": "bbc.co.uk", "originalTitle": "\"Boots pharmacists raise staffing concerns\"" }, { "el": "41", "originalSource": "Subsaga", "originalTitle": "\"Boots: Pharmacists under Pressure? Inside Out subtitles\"" }, { "el": "42", "originalSource": "bbc.co.uk", "originalTitle": "\"'Frazzled' Boots pharmacist mixed up patient's pills\"" }, { "el": "43", "originalSource": "The Guardian", "originalTitle": "\"Boots faces boycott over refusal to lower cost of morning-after pill\"" }, { "el": "44", "originalSource": "BBC News", "originalTitle": "\"Boots staff 'harassed' by morning-after pill campaigners\"" }, { "el": "45", "originalSource": "BBC News", "originalTitle": "\"Boots 'breaking' morning-after pill promise, say Labour MPs\"" }, { "el": "46", "originalSource": "BBC News", "originalTitle": "\"Boots rolls out cheaper morning-after pill across UK\"" }, { "el": "47", "originalSource": "The Times", "originalTitle": "\"NHS forced to pay £1,500 for £2 pot of moisturiser\"" }, { "el": "48", "originalSource": "The Times", "originalTitle": "\"Boots faces inquiry over cancer drug price hike\"" }, { "el": "49", "originalSource": "BBC News", "originalTitle": "\"Boots owner denies overcharging NHS for cancer mouthwash\"" }], "articlesRes": [{ "el": 11, "keywords": ["risk", "stores"], "interesting": true, "score": 6 }, { "el": 12, "keywords": ["profits"], "interesting": true, "score": 5 }, { "el": 29, "keywords": ["NHS", "cash", "pressure"], "interesting": true, "score": 9 }, { "el": 30, "keywords": ["regulator", "investigation"], "interesting": true, "score": 8 }, { "el": 31, "keywords": ["Rogue"], "interesting": true, "score": 7 }, { "el": 32, "keywords": ["stressed", "pharmacist"], "interesting": true, "score": 7 }, { "el": 33, "keywords": ["sick staff", "healthcare", "public purse"], "interesting": true, "score": 9 }, { "el": 34, "keywords": ["misbehaving corporations"], "interesting": true, "score": 8 }, { "el": 38, "keywords": ["Pharmacists", "Pressure"], "interesting": true, "score": 7 }, { "el": 39, "keywords": ["pharmacists", "breaking point"], "interesting": true, "score": 8 }, { "el": 40, "keywords": ["pharmacists", "staffing concerns"], "interesting": true, "score": 7 }, { "el": 42, "keywords": ["Frazzled", "pharmacist", "pills"], "interesting": true, "score": 8 }, { "el": 43, "keywords": ["boycott", "morning-after pill"], "interesting": true, "score": 9 }, { "el": 44, "keywords": ["harassed", "morning-after pill", "campaigners"], "interesting": true, "score": 9 }, { "el": 45, "keywords": ["morning-after pill", "promise"], "interesting": true, "score": 8 }, { "el": 47, "keywords": ["NHS", "moisturiser"], "interesting": true, "score": 6 }, { "el": 48, "keywords": ["inquiry", "cancer drug", "price hike"], "interesting": true, "score": 9 }, { "el": 49, "keywords": ["overcharging", "NHS", "cancer", "mouthwash"], "interesting": true, "score": 10 }] }
    brandStack["Nestle"] = { "name": "Nestle", "site": "nestle.com", "db": "nestlecom", "data": { "wikidata_id": ["Q160746", "Q1993628", "Q1400476"], "title": "nestle.com", "connections": "/connections/nestle.com.json", "social": { "Twitter username": [{ "url": "https://twitter.com/Nestle", "source": "nestle.com" }], "subreddit": [{ "url": "https://old.reddit.com/r/FuckNestle/", "source": "nestle.com" }], "Facebook ID": [{ "url": "https://www.facebook.com/Nestle", "source": "nestle.com" }, { "url": "https://www.facebook.com/Nestea.DE", "source": "nestle.com" }], "Instagram username": [{ "url": "https://www.instagram.com/nestle/", "source": "nestle.com" }], "YouTube channel ID": [{ "url": "https://www.youtube.com/channel/UCdfxp4cUWsWryZOy-o427dw", "source": "nestle.com" }], "Tumblr username": [{ "url": "https://nestle.tumblr.com/", "source": "nestle.com" }] }, "core": [{ "type": "glassdoor", "url": "glassdoor/3492.json" }, { "type": "wbm", "url": "wbm/PT_01245.json" }, { "type": "trustpilot", "url": "trustpilot/nestlecom.json" }, { "type": "lobbyeu", "url": "lobbyfacts/15366395387-57.json" }, { "type": "trustscore", "url": "trustscore/nestlecom.json" }, { "type": "similar", "url": "similar/nestlecom.json" }], "data": { "l": 4.1, "_l": "www.nestle.com", "w": [{ "s": "Nestle", "m": [{ "s": "2023_Food_Agriculture_Benchmark", "r": 65.6 }, { "s": "2022_CHumanRightsB", "r": 34.3 }, { "s": "2022_Social_Transformation", "r": 16 }, { "s": "2023_Nature_Benchmark", "r": 54.1 }] }], "t": 3.2, "_t": "Nestlé", "s": "74.2", "_s": "nestle.com", "e": 7.5, "_e": "Nestlé S.A.", "k": "zcltesw" } }, "stories": [{ "el": "0", "originalSource": "Cleverism", "originalTitle": "\"The History of Nestlé\"" }, { "el": "1", "originalSource": "The New York Times", "originalTitle": "\"How Nestlé Expanded Beyond the Kitchen\"" }, { "el": "2", "originalSource": "The New York Times", "originalTitle": "\"Rowntree Accepts Bid By Nestle\"" }, { "el": "3", "originalSource": "Financial Times", "originalTitle": "\"The inside story of the Cadbury takeover\"" }, { "el": "4", "originalSource": "BBC News", "originalTitle": "\"Nestlé takes world ice cream lead\"" }, { "el": "5", "originalSource": "The New York Times", "originalTitle": "\"Jenny Craig Brings 5 Times Its Price in '02\"" }, { "el": "6", "originalSource": "SWI – the international service of the Swiss Broadcasting Corporation", "originalTitle": "\"Nestlé completes takeover of Novartis food unit – SWI swissinfo.ch\"" }, { "el": "7", "originalSource": "money.cnn.com", "originalTitle": "\"Nestlé to buy Gerber for $5.5B\"" }, { "el": "8", "originalSource": "novartis.com", "originalTitle": "\"Novartis completes its business portfolio restructuring, divesting Gerber for USD 5.5 billion to Nestlé\"" }, { "el": "9", "originalSource": "Reuters", "originalTitle": "\"Novartis seeks to buy rest of Alcon for $39 billion\"" }, { "el": "10", "originalSource": "Bloomberg.com", "originalTitle": "\"Nestlé Wants to Sell You Both Sugary Snacks and Diabetes Pills\"" }, { "el": "11", "originalSource": "Bloomberg", "originalTitle": "\"Nestlé to Buy 60% Stake in Hsu Fu Chi for .7 Billion\"" }, { "el": "12", "originalSource": "newstatesman.com", "originalTitle": "\"Nestlé to buy Pfizer Nutrition for $11.85bn\"" }, { "el": "13", "originalSource": "LA Weekly", "originalTitle": "\"Nestle Acquires Stake in \"Brain Food\" Company\"" }, { "el": "14", "originalSource": "Wall Street Journal", "originalTitle": "\"PE Deals for Weight Loss Brands Face Shifting Diet Demographics\"" }, { "el": "15", "originalSource": "Wall Street Journal", "originalTitle": "\"Nestlé Sells PowerBar Brand\"" }, { "el": "16", "originalSource": "Wall Street Journal", "originalTitle": "\"Nestlé Explores Sale of Frozen Food Unit Davigel\"" }, { "el": "17", "originalSource": "Reuters", "originalTitle": "\"Nestle invests more in skin care strategy with 10 research centers\"" }, { "el": "18", "originalSource": "arlnow.com", "originalTitle": "\"Nestle Nestlé to Move U.S. Headquarters to Rosslyn\"" }, { "el": "19", "originalSource": "BBC News", "originalTitle": "\"Kit Kat sugar content to be cut by 10%, says Nestle\"" }, { "el": "20", "originalSource": "The Independent", "originalTitle": "\"Shreddies are about to get a lot healthier\"" }, { "el": "21", "originalSource": "Reuters", "originalTitle": "\"Nestle plans $20.8 billion share buyback amid Third Point pressure\"" }, { "el": "22", "originalSource": "The Wall Street Journal", "originalTitle": "\"Nestlé Plans Share Buyback After Pressure From Third Point\"" }, { "el": "23", "originalSource": "Bloombery Business", "originalTitle": "\"Nestle Is Said to Pay $425 Million to Buy Blue Bottle Coffee\"" }, { "el": "24", "originalSource": "Financial Times", "originalTitle": "\"Nestlé breaks into US hipster coffee market with Blue Bottle deal\"" }, { "el": "25", "originalSource": "USA TODAY", "originalTitle": "\"Nestle is selling its U.S. candy business to Ferrero for about $2.8 billion\"" }, { "el": "26", "originalSource": "Reuters", "originalTitle": "\"Loeb pressures Nestle for more sales, restructuring\"" }, { "el": "27", "originalSource": "The Wall Street Journal", "originalTitle": "\"Nestlé to Sell Gerber Life Insurance to Western & Southern Financial\"" }, { "el": "28", "originalSource": "MarketWatch", "originalTitle": "\"Nestlé to sell Gerber Life Insurance for $1.55 billion\"" }, { "el": "29", "originalSource": "Financial Times", "originalTitle": "\"Nestlé eyes 'once in a generation' plant-based opportunity\"" }, { "el": "30", "originalSource": "The Economic Times", "originalTitle": "\"Nestle investing Rs 6,000-6,500 cr to expand manufacturing ops in India, says top official\"" }, { "el": "31", "originalSource": "The Wall Street Journal", "originalTitle": "\"Nestlé Expands in Vitamins With $5.75 Billion Nature's Bounty Deal\"" }, { "el": "32", "originalSource": "Bloomberg.com", "originalTitle": "\"Nestle to Buy Vitamin Brands From KKR for $5.75 Billion\"" }, { "el": "33", "originalSource": "SWI swissinfo", "originalTitle": "\"Ukraine labels Nestlé a 'sponsor' of Russia's war of aggression\"" }, { "el": "35", "originalSource": "CNNMoney", "originalTitle": "\"Nestle selling U.S. candy brands to Nutella company\"" }, { "el": "36", "originalSource": "CNN", "originalTitle": "\"The world's biggest food company is now making vegan sausages\"" }, { "el": "37", "originalSource": "Reuters", "originalTitle": "\"Nestle to respond to baby milk criticism in coming days\"" }, { "el": "39", "originalSource": "Milwaukee Journal Sentinel", "originalTitle": "\"Slaves feed world's taste for chocolate: Captives common in cocoa farms of Africa\"" }, { "el": "42", "originalSource": "ap.google.com", "originalTitle": "\"Nearly 53,000 Chinese children sick from milk\"" }, { "el": "43", "originalSource": "The Times", "originalTitle": "\"China baby milk scandal spreads as sick toll rises to 13,000\"" }, { "el": "44", "originalSource": "Reuters", "originalTitle": "\"FDA confirms E. coli found in Nestle cookie dough\"" }, { "el": "45", "originalSource": "news.biharprabha.com", "originalTitle": "\"Beware! Eating 2 -Minute Maggi Noodles can ruin your Nervous System\"" }, { "el": "46", "originalSource": "NDTV", "originalTitle": "\"Maggi Noodles Packets Recalled Across Uttar Pradesh, Say Food Inspectors: Report\"" }, { "el": "47", "originalSource": "The Times of India", "originalTitle": "\"'Maggi' under regulatory scanner for lead, MSG beyond permissible limit\"" }, { "el": "48", "originalSource": "The National", "originalTitle": "\"The human rights and wrongs of Nestlé and water for all\"" }, { "el": "49", "originalSource": "CBC News", "originalTitle": "\"Nestlé bottled-water ads misleading, environmentalists say\"" }, { "el": "50", "originalSource": "Reuters", "originalTitle": "\"Nestlé water ads misleading: Canada green groups\"" }], "articlesRes": [{ "el": 33, "keywords": ["ukraine", "russia", "war"], "interesting": true, "score": 9 }, { "el": 39, "keywords": ["slaves", "chocolate", "africa", "cocoa"], "interesting": true, "score": 10 }, { "el": 42, "keywords": ["china", "milk", "sick", "children"], "interesting": true, "score": 8 }, { "el": 43, "keywords": ["china", "baby milk", "scandal"], "interesting": true, "score": 9 }, { "el": 44, "keywords": ["fda", "e coli", "cookie dough", "nestle"], "interesting": true, "score": 7 }, { "el": 45, "keywords": ["maggi", "noodles", "nervous system"], "interesting": true, "score": 7 }, { "el": 46, "keywords": ["maggi", "noodles", "recall", "uttar pradesh"], "interesting": true, "score": 6 }, { "el": 47, "keywords": ["maggi", "lead", "msg"], "interesting": true, "score": 6 }, { "el": 48, "keywords": ["human rights", "water"], "interesting": true, "score": 8 }, { "el": 49, "keywords": ["bottled water", "misleading", "environmentalists"], "interesting": true, "score": 7 }, { "el": 50, "keywords": ["nestle", "water", "misleading"], "interesting": true, "score": 7 }] }
    brandStackOrder = ["Monster Energy", "Nike, Inc.", "Boots", "Nestle"]

}

function createPopoverApiKey() {
    const popArea = document.getElementById("popArea");
    if (popArea) {
        const popoverDiv = document.createElement("div");
        popoverDiv.classList.add("popoverApi");
        popoverDiv.innerHTML = `
            <h2>API Key</h2>
            <form>
                <label for="apiKey">OpenAI Key:</label>
                <input type="text" id="apiKey" name="apiKey" value="${localStorage.getItem('apiKey') || ''}"><br/>
                <label for="apiPexelsKey">Pexels Key:</label>
                <input type="text" id="apiPexelsKey" name="apiPexelsKey" value="${localStorage.getItem('apiPexelsKey') || ''}">
                <button type="submit">Save</button>
                <button type="button">Load</button>
            </form>
        `;

        const form = popoverDiv.querySelector('form');
        const apiKeyInput = popoverDiv.querySelector('#apiKey');
        const apiPexelsKeyInput = popoverDiv.querySelector('#apiPexelsKey');

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            localStorage.setItem('apiKey', apiKeyInput.value);
            localStorage.setItem('apiPexelsKey', apiPexelsKeyInput.value);
            popoverDiv.remove();
        });
        popArea.appendChild(popoverDiv);
    }
}

function saveBrandStack() {
    localStorage.setItem('brandStack', JSON.stringify(brandStack));
    localStorage.setItem('brandStackOrder', JSON.stringify(brandStackOrder));
}
function loadBrandStack() {
    brandStack = JSON.parse(localStorage.getItem('brandStack'));
    brandStackOrder = JSON.parse(localStorage.getItem('brandStackOrder'));
}