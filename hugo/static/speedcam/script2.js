const topDisplay = document.getElementById("topDisplay");
const contentAreaDiv = document.getElementById("contentAreaDiv");
const speedContent = document.getElementById("speedcontent");
const neoGraph = document.getElementById("neoGraph");
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
let rotatedFeed = true;
const stateObj = document.getElementById("stateObj");
const httpsStrip = /http[s]*:\/\//g

let isLive = false;
let keepStateObjectStatic = false;
function changeStateObj(className, retainState = false, genericError = false) {
    // this removes the class from the stateObj
    // and then adds the new class
    if (currentLayout == "voice") {
        return
    }
    if (currentLayout == "subvert") {
        return
    }
    // if the current state object is setupcomplete then we should ignore
    // any changes to the state object
    if (stateObj.classList.contains("setupComplete")) {
        stateObj.classList.remove("setupComplete");
        return;
    }
    // if there is no layout set then we shouldnt allow updating state 
    // to "analyse" or "assess" or "brand"
    if (currentLayout == "") {
        if (className == "analyse" || className == "assess" || className == "brand") {
            return;
        }
    }


    if (genericError) {
        stateObj.style = `--error: "${genericError}"`;
        retainState = true;
        className = "genericError";
    }
    if (keepStateObjectStatic) {
        return;
    }
    if (retainState) {
        keepStateObjectStatic = true;
    }
    currentClass = stateObj.classList[0];
    stateObj.classList.remove(currentClass);
    stateObj.classList.add(className);
    printOutForLocalMode(`State Object: ${className}`)
}

let stateStep = 0;
function stateController() {
    // each time this function is called, it should check the stateObj
    // and then run the next step in the chain
    // first we brand, then analyse, then assess.
    // then we should change the layout to subvert.
    // then we start over. this shouldnt be able to be triggered
    // on any layout other than ready.
    if (currentLayout == "voice") {
        stateStep = 0;
        return
    }
    if (currentLayout == "subvert") {
        stateStep = 0;
        return
    }
    if (stateStep == 0) {
        changeStateObj("brand")
        stateStep += 1;
    } else if (stateStep == 1) {
        changeStateObj("analyse")
        stateStep += 1;
    } else if (stateStep == 2) {
        changeStateObj("assess")
        stateStep += 1;
    } else if (stateStep == 3) {
        changeStateObj()
        changeLayout("subvert")
        timerEnabled = true;
        itsOpen = false;
        stateStep = 0;
    }
}

let currentLayout = '';
function setBottomBarBrand(brand, reset = false) {
    // we should ignore this function if the layout is voice
    // or ready or no layout is set
    bottomBar = document.getElementById("bottomBar");
    if (reset) {
        bottomBar.classList.add("hide")
        bottomBar.removeAttribute("data-brand")
        return
    }
    if (!brand) {
        bottomBar.classList.add("hide")
        bottomBar.removeAttribute("data-brand")
        return
    }
    bottomBar.classList.remove("hide")
    bottomBar.dataset.brand = brand;
    printOutForLocalMode(`Bottom Bar: ${brand}`)
}

const staticClassesForBody = ["speedbody"]
// ["ready", "subvert", "voice"]
function changeLayout(className, dontRoll = false) {
    // this removes the class from the body
    // and then adds the new class
    const currentClassList = document.body.classList;
    for (const currentClass of currentClassList) {
        if (staticClassesForBody.includes(currentClass)) {
            continue;
        }
        document.body.classList.remove(currentClass);
    }
    if (className == "ready") {
        document.body.classList.add("layoutReady")
        changeStateObj()
        currentLayout = "ready";
        timerEnabled = true;
    } else if (className == "subvert") {
        document.body.classList.add("layoutSubvertisments")
        currentLayout = "subvert";
        if (!dontRoll) {
            updateDisplay();
        }
    } else if (className == "voice") {
        document.body.classList.add("layoutVoice")
        itsOpen = true;
        stop_sensing = true;
        setBottomBarBrand(false, true)
        timerEnabled = false;
        //pauseDisplay();
        currentLayout = "voice";
    } else if (!className) {
        setBottomBarBrand(false, true)
        currentLayout = "";
    } else {
        currentLayout = className;
        document.body.classList.add(className);
    }
    printOutForLocalMode(`Layout: ${className}`)
}

function printOutForLocalMode(string, object = null) {
    console.log(`Local Mode: ${string}`)
    if (object) {
        console.log(object)
    }
}

let targetInfo = {
    'target_range': 0,
    'target_number': 0,
    'target_speed': 0,
}

SPEEDCAM_FRONTEND_OPTIONS = {
    "range_enabled": { "label": "Range Enabled", "type": "checkbox" },
    "range_open": { "label": "Range Open", "type": "number", "min": 0, "max": 12 },
    "range_shot": { "label": "Range Shot", "type": "number", "min": 0, "max": 12 },
    "range_limit": { "label": "Range Limit", "type": "number", "min": 0, "max": 12 },
    "range_fade_end": { "label": "Range Fade End", "type": "number", "min": 0, "max": 12 },
    "range_fade_enabled": { "label": "Range Fade Enabled", "type": "checkbox" },
    "timeout_close": { "label": "Timeout Close", "type": "number", "min": 0, "max": 60 },
    "timeout_shot": { "label": "Timeout Shot", "type": "number", "min": 0, "max": 60 },
    "timeout_limit": { "label": "Timeout Limit", "type": "number", "min": 0, "max": 600 },
}

SPEEDCAM_COMMANDS = {
    "shot": { "label": "Take Shot", "type": "button" },
    "scan": { "label": "Take Shot and Scan", "type": "button" },
    "open": { "label": "Open", "type": "button" },
    "close": { "label": "Close", "type": "button" },
    "sendState": { "label": "Send State", "type": "button" },
    "getState": { "label": "Get State", "type": "button" },
    "setDomain": { "label": "Set Domain", "type": "button" },
    "pause": { "label": "Pause", "type": "button" },
    "resume": { "label": "Resume", "type": "button" },
    "alive": { "label": "Alive", "type": "button" },
    "error": { "label": "Error", "type": "button" },
}

let speedcamState = {
    "currentDomain": "",
    "currentDomains": [],
    "currentSpeedcam": null,
    "currentStories": [],
    "frontend": {
        "range_enabled": true,
        "range_open": 0,
        "range_shot": 0,
        "range_limit": 0,
        "range_fade_end": 0,
        "range_fade_enabled": false,
        "timeout_close": 0,
        "timeout_shot": 0,
        "timeout_limit": 0,
    },
}
async function connectSerial(initport = null) {
    try {
        let reader;
        if (initport) {
            const port = initport;
            await port.open({ baudRate: 9600 });
            reader = port.readable.getReader();
        } else {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            reader = port.readable.getReader();
        }
        console.log("Connected to serial port")
        let responseString = "";
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            // Decode and Display the received data on the webpage
            readString = new TextDecoder().decode(value);
            responseString += readString;
            responseString = responseString.trim();
            if (!responseString.startsWith('{') || responseString.length > 80) {
                responseString = "";
            }
            // Skip the first 5 data points
            // Read the data until the first JSON object is received
            if (responseString.endsWith("}")) {
                targetInfo = JSON.parse(responseString.replace(/'/g, '"'));
                runOnTargetInfo(targetInfo);
            }
        }
    } catch (error) {
        console.error("Error:", error);
        changeStateObj("noSensor", true);
    }
}
let stop_sensing = false;
let closeTimeoutObject = null;
let shotTimeoutObject = null;
let limitTimeoutObject = null;
let readCounter = 0;
function runOnTargetInfo(targetInfo) {
    waitingTimeoutTime = Date.now();
    closeTimeoutTime = speedcamState.frontend.timeout_close * 1000;

    // every 40 reads we should send a response to the server
    readCounter += 1;
    if (readCounter > 100) {
        sendResponseToSSERequest("read", targetInfo)
        readCounter = 0;
    }

    if (document.getElementById("output_output")) {
        // Parse the JSON object
        document.getElementById("range_number").textContent = targetInfo.target_range;
        document.getElementById("number_number").textContent = targetInfo.target_number;
        document.getElementById("speed_number").textContent = targetInfo.target_speed;
        // set output_placeholder to the frontend options
        outputPlaceholder = document.getElementById("output_placeholder");
        if (outputPlaceholder) {
            outputPlaceholder.innerHTML = "";
            for (const key in SPEEDCAM_FRONTEND_OPTIONS) {
                const option = SPEEDCAM_FRONTEND_OPTIONS[key];
                const optionDiv = document.createElement("div");
                optionDiv.textContent = `${option.label}: ${speedcamState.frontend[key]}`;
                outputPlaceholder.appendChild(optionDiv);
            }
        }
    }

    // Adjust the blur of the camera feed based on the target range
    lowerThreshold = speedcamState.frontend.range_open;
    upperThreshold = speedcamState.frontend.range_fade_end;
    if (targetInfo.target_range > upperThreshold) {
        console.log("Above threshold, adjusting blur")
        adjustedBlur = 0;
        document.getElementById("video").style = `--blur: ${adjustedBlur}px`;
    } else {
        if (targetInfo.target_range < lowerThreshold) {
            console.log("Below threshold, adjusting blur")
            // it should blur between 10px and 0px
            adjustedBlur = 10;
            document.getElementById("video").style = `--blur: ${adjustedBlur}px`;
        } else {
            adjustedBlur = 10 - ((targetInfo.target_range - lowerThreshold) / (upperThreshold - lowerThreshold)) * 10;
            document.getElementById("video").style = `--blur: ${adjustedBlur}px`;
        }
    }

    shotThreshold = speedcamState.frontend.range_shot;

    // if we are below the lower threshold, we should open the IV if it is closed
    if (targetInfo.target_range < lowerThreshold && currentLayout == "subvert") {
        console.log("Below threshold, opening IV")
        // open IV
        openSpeedCam();
        stop_sensing = true;

    }
    // We should renew the timeout if the target is below the threshold, or create it if it doesn't exist
    if (targetInfo.target_range < lowerThreshold) {
        console.log("Below threshold, renewing timeout")
        if (closeTimeoutObject) {
            clearTimeout(closeTimeoutObject);
        }
        closeTimeoutObject = setTimeout(() => {
            changeLayout("ready")
            clearTimeout(shotTimeoutObject);
            shotTimeoutObject = setTimeout(() => {
                console.log("Not Taking shot, just a wait")
                clearTimeout(shotTimeoutObject);
                shotTimeoutObject = null;
            }, 3000);
        }, closeTimeoutTime);
    }
    // if we are above the shot threshold, we should take a shot, if we havent in the shot timeout window
    if (targetInfo.target_range < shotThreshold && targetInfo.target_range > lowerThreshold) {
        if (shotTimeoutObject) {
            console.log("Skipping shot, already taken")
        } else {
            console.log("Above threshold, taking shot")
            stateController();
            sendRequestForScan(true);
            shotTimeoutObject = setTimeout(() => {
                console.log("Taking shot wait over")
                clearTimeout(shotTimeoutObject);
                shotTimeoutObject = null;
            }, speedcamState.frontend.timeout_shot * 1000);
        }
    }
}

function startCam() {
    navigator.mediaDevices
        .getUserMedia({ video: { width: 1920, height: 1080 }, audio: false })
        .then((stream) => {
            video.srcObject = stream;
            video.play();
            changeStateObj("camera");
        })
        .catch((err) => {
            console.error(`An error occurred: ${err}`);
            changeStateObj("noCamera");
        });
}

function startupSpeedCam() {
    // Disabled modules
    disabledModules.push("similar")
    disabledModules.push("social")
    disabledModules.push("trustscore")
    disabledModules.push("graph-box")


    // If a port is paired already with the device, connect to it
    if ('serial' in navigator) {
        navigator.serial.getPorts().then(ports => {
            if (ports.length > 0) {
                connectSerial(ports[0]);
            }
        });
    } else {
        changeStateObj("noSensor");
    }
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    photo = document.getElementById("photo");
    startCam();
    video.addEventListener(
        "canplay",
        (ev) => {
            if (streaming) {
                return;
            }
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
        },
        false,
    );
    if (window.localStorage.getItem("apiKeyRoundabout")) {
        roundaboutRequest({}, "speedcam/speedcam_endpoint/list");
        changeStateObj("api");
    } else {
        // try getting the key from the url before requesting it 
        if (Url.get.apiKey) {
            window.localStorage.setItem("apiKeyRoundabout", Url.get.apiKey)
            console.log("apikey set from url")
            roundaboutRequest({}, "speedcam/speedcam_endpoint/list");
            changeStateObj("api");
        } else {
            createPopoverApiKey();
        }
    }

    clearphoto();

    // check for the speedcamState in local storage
    if (window.localStorage.getItem("speedcamState")) {
        speedcamState = JSON.parse(window.localStorage.getItem("speedcamState"));
    }
}
function openSpeedCam(brand = false) {
    if (brand) {
        itsOpen = true;
    }
    if (currentLayout == "subvert") {
        // if the content area isnt off screen, then we need to close it
        // then whatever item is set to current item will be opened
        currentItem = document.querySelector(".currentItem");
        if (currentItem && !brand && currentItem.hasAttribute("data-domain")) {
            itsOpen = true;
            brand = currentItem.getAttribute("data-domain");
        }
    }
    if (brand) {
        console.log(`Opening ${brand}`)
        manualSetup(brand);
        changeLayout("voice")
        setTimeout(() => {
            sendResponseToSSERequest("domainOpen", brand)
        }, 1000);
    }
}

function closeIV() {
    itsOpen = false;
    // we also need to blank out the content div
    speedContent.innerHTML = "";
    speedContent.style = "";
    if (cy !== undefined) {
        cy.elements().remove();
    }
    sendResponseToSSERequest("domainClose", {})
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

let rotated_once = false;
function takepicture(rotated = true) {
    const context = canvas.getContext("2d");
    // Clear the canvas
    if (width && height) {
        if (rotated) {
            if (!rotated_once) {
                context.translate(canvas.width * 0.5, canvas.height * 0.5);
                context.rotate(-Math.PI / 2);
                context.translate(-width * 0.5, -height * 0.5);
                rotated_once = true;
            }
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

async function roundaboutRequest(requestObject, location) {
    if (!isLive) {
        printOutForLocalMode("roundaboutRequest", { requestObject, location })
        return;
    }
    const requestUrl = `https://assets.reveb.la/${location}`;
    if ("apiKeyRoundabout" in window.localStorage) {
    } else {
        addPopover("No API Key")
        return;
    }
    if ("api_session_token" in requestObject) {
    } else {
        requestObject["api_session_token"] = window.localStorage.getItem("apiKeyRoundabout");
    }
    // Include no-cors for now
    const options = {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.localStorage.getItem("apiKeyRoundabout")}`,
        }),
    }

    options.body = JSON.stringify(requestObject);
    fetch(requestUrl, options)
        .then(response => {
            response.json().then(data => {
                handleResponse(data, location);
            })
            // if response has a session cookie, save it to local storage
            if (response.headers.has("set-cookie")) {
                window.localStorage.setItem("api_session_cookie", response.headers.get("set-cookie"));
            }
        }).catch(err => console.error(err));
}

function handleResponse(response, location) {
    if (response.error) {
        console.error(response.error)
        return;
    }
    const speedcam_id = window.localStorage.getItem("speedcam_id");
    switch (location) {
        case "speedcam/speedcam_endpoint/list":
            if ("speedcams" in response) {
                availableSpeedcams = response.speedcams;
                window.localStorage.setItem("availableSpeedcams", JSON.stringify(availableSpeedcams));
            }
            break;
        // we need a case for any speedcam/speedcam/{speedcam_id}/shot
        case `speedcam/speedcam/${speedcam_id}/shot`:
            console.log(response)
            break;
        default:
            console.log(response)
            break;
    }
}

function sendRequestForScan(include_scan = false) {
    if (!isLive) {
        return;
    }
    takepicture();
    const data = canvas.toDataURL("image/png");
    //const blob = dataURLtoBlob(data);
    const speedcam_id = window.localStorage.getItem("speedcam_id");
    const location = `speedcam/speedcam/${speedcam_id}/shot`;
    const requestObject = {
        "image": data,
    }
    if (include_scan) {
        requestObject.scan = 1;
    }
    roundaboutRequest(requestObject, location);

}

placement = 0;
let shotTimeout = null;
function updateDisplay() {
    if (!timerEnabled && !itsOpen) {
        // openSpeedCam(Url.get.site);
        closeIV();
        setSearchParam("site", null);
    }
    timerEnabled = true;
    const numberOfItems = topDisplay.children.length;
    if (placement > numberOfItems - 1) {
        placement = 0;
    }
    for (const child in [...Array(numberOfItems).keys()]) {
        if (child == placement) {
            topDisplay.children[child].classList.remove("lastItem")
            topDisplay.children[child].classList.add("currentItem")
            topDisplay.children[child].classList.remove("nextItem")
            const ourdomain = topDisplay.children[child].dataset.domain
            setBottomBarBrand(ourdomain)
        } else if (child == (placement - 1) || (placement == 0 && child == numberOfItems - 1)) {
            topDisplay.children[child].classList.add("lastItem")
            topDisplay.children[child].classList.remove("currentItem")
            topDisplay.children[child].classList.remove("nextItem")
        } else {
            topDisplay.children[child].classList.remove("lastItem")
            topDisplay.children[child].classList.remove("currentItem")
            topDisplay.children[child].classList.add("nextItem")
        }
    }
    // if we havent taken a shot in timeout_shot seconds, take a shot
    return
    if (speedcamState.frontend.timeout_shot > 0) {
        if (shotTimeout) {
            clearTimeout(shotTimeout);
        }
        shotTimeout = setTimeout(() => {
            sendRequestForScan(true);
        }, speedcamState.frontend.timeout_shot * 1000);
    }
}

function pauseDisplay() {
    timerEnabled = false
    itsOpen = false;
    timerEnabled = false

    function rollOnDisplay() {
        if (!itsOpen && timerEnabled) {
            placement += 1;
            updateDisplay();
            console.log("Rolling")
        }
    }
    setInterval(rollOnDisplay, 10000)
}

function openSpeedCamOnStory(target) {
    brand = target.parentElement.dataset.domain.replaceAll(".", "");
    openSpeedCam(brand)
}

function addStoryToDisplay(story) {
    const storyDiv = document.createElement("div");
    const imageAttributionDiv = document.createElement("div");
    const storyInfoDiv = document.createElement("div");
    let image_attribution = false
    if (story.hasOwnProperty("image")) {
        image = story.image;
        if (image.hasOwnProperty("image_url")) {
            // Add the image as a url to the background of the div
            storyDiv.style.backgroundImage = `url(${image.image_url})`;
        }
        if (image.hasOwnProperty("source")) {
            // if the source is not null then add a source div
            const sourceDiv = document.createElement("div");
            sourceDiv.textContent = image.source;
            image_attribution = true
            imageAttributionDiv.appendChild(sourceDiv);
        }
        if (image.hasOwnProperty("author")) {
            // if the author is not null then add a author div
            const authorDiv = document.createElement("div");
            authorDiv.textContent = image.author;
            image_attribution = true
            imageAttributionDiv.appendChild(authorDiv);
        }
        if (image.hasOwnProperty("id")) {
            // add the image id to the data-image-id attribute
            storyDiv.setAttribute("data-image-id", image.id);
        }
        if (image_attribution) {
            imageAttributionDiv.classList.add("attribution");
            storyDiv.appendChild(imageAttributionDiv);
        }
    } else {
        return false;
    }
    if (story.hasOwnProperty("title")) {
        const titleDiv = document.createElement("div");
        titleDiv.textContent = story.title;
        titleDiv.classList.add("title");
        storyInfoDiv.appendChild(titleDiv);
    }
    if (story.hasOwnProperty("url")) {
        // add the url to the data-article-url attribute
        storyDiv.setAttribute("data-url", story.url);
    }
    if (story.hasOwnProperty("id")) {
        storyDiv.setAttribute("data-story-id", story.id);
    }
    if (story.hasOwnProperty("domain")) {
        // We should clean story.domain incase a normal domain got through
        cleanDomain = story.domain.replace(httpsStrip, "").replace("www.", "").replace(".", "");
        storyDiv.setAttribute("data-domain", cleanDomain);
        storyInfoDiv.innerHTML += `<img class="logo" src="https://logo.clearbit.com/${story.domain.replace(httpsStrip, "")}"></img>`
    }
    // If story has author or source add it to the storyInfoDiv 
    if (story.hasOwnProperty("author") || story.hasOwnProperty("source")) {
        const authorDiv = document.createElement("div");
        if (story.hasOwnProperty("source")) {
            if (story.author && story.author != story.source) {
                authorDiv.textContent = story.author + " - " + story.source
            } else {
                authorDiv.textContent = story.source
            }
        } else {
            authorDiv.textContent = story.author
        }
        authorDiv.classList.add("authorArticle");
        storyInfoDiv.appendChild(authorDiv);
    }
    if (story.hasOwnProperty("date")) {
        // add the date to the data-date attribute
        storyDiv.setAttribute("data-date", story.date);
    }

    const storyOverlay = document.createElement("div")
    storyOverlay.classList.add("storyOverlay")
    storyOverlay.addEventListener('click', openSpeedCamOnStory)

    storyDiv.classList.add("story");
    storyInfoDiv.classList.add("storyInfo");
    storyDiv.appendChild(storyInfoDiv);
    storyDiv.appendChild(storyOverlay);
    topDisplay.appendChild(storyDiv);
    return true;
}

let itsOpen = false;
let timerEnabled = false; // For letting the display roll and change placements

function rollOnDisplay() {
    if (!itsOpen && timerEnabled) {
        placement += 1;
        updateDisplay();
        console.log("Rolling")
    }
}
setInterval(rollOnDisplay, 10000)

function createPopoverApiKey() {
    const popArea = document.getElementById("popArea");
    if (popArea) {
        if (document.querySelector(".popoverApi")) {
            document.querySelector(".popoverApi").remove();
        }
        const popoverDiv = document.createElement("div");
        const roundaboutKey = window.localStorage.getItem("apiKeyRoundabout");

        popoverDiv.classList.add("popoverApi");
        popoverDiv.innerHTML = `
            <h2>Logged in</h2>
            <form>
                <label for="apiKey">API Key</label>
                <input type="text" id="apiKey" name="apiKey" value="${roundaboutKey}">
            </form>
        `;

        const form = popoverDiv.querySelector('form');

        if (window.localStorage.getItem("apiKeyRoundabout")) {
            popoverDiv.querySelector('input').value = window.localStorage.getItem("apiKeyRoundabout");
            const speedCamSelectionMenu = document.createElement("select");
            speedCamSelectionMenu.id = "speedCamSelectionMenu";
            if (window.localStorage.getItem("availableSpeedcams")) {
                for (const speedcam of JSON.parse(window.localStorage.getItem("availableSpeedcams"))) {
                    const option = document.createElement("option");
                    option.value = speedcam.id;
                    option.textContent = speedcam.friendly_name;
                    option.classList.add("speedcamOption");
                    option.classList.add(speedcam.state + "Speedcam");
                    speedCamSelectionMenu.appendChild(option);
                }
            }
            form.appendChild(speedCamSelectionMenu);

        }
        const saveAndLoad = `<button type="submit">Save</button><button type="button">Load</button>`;
        form.innerHTML += saveAndLoad;
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            window.localStorage.setItem("apiKeyRoundabout", form.elements.apiKey.value);
            // Get the selected speedcam and add the choice to the local storage
            const speedCamSelectionMenu = document.getElementById("speedCamSelectionMenu");
            if (speedCamSelectionMenu) {
                window.localStorage.setItem("speedcam_id", speedCamSelectionMenu.value);
            }
            popoverDiv.remove();
        });
        // Add the range output elements
        outputText = document.createElement("div");
        outputText.id = "output_output";
        outputText.textContent = "Output";
        popoverDiv.appendChild(outputText);
        popArea.appendChild(popoverDiv);
    }
}

function updateState(stateObj) {
    updated_keys = []
    stateController();
    setTimeout(() => {
        stateController();
    }, 1000);
    for (const key in stateObj) {
        if (key in speedcamState && speedcamState[key] != stateObj[key]) {
            updated_keys.push(key);
            speedcamState[key] = stateObj[key];
        } else {
            console.log(`Key ${key} not in speedcamState`)
        }
    }
    if ("currentStories" in stateObj) {
        // clear the topDisplay
        topDisplay.innerHTML = "";
        for (const story of stateObj.currentStories) {
            addStoryToDisplay(story);
        }
    }
    if (updated_keys.length > 0) {
        console.log(`Updated keys: ${updated_keys}`)
        // add new state to local storage
        window.localStorage.setItem("speedcamState", JSON.stringify(speedcamState));
    }
    // Add frontend value to output_placeholder as text
    outputPlaceholder = document.getElementById("output_placeholder");
    if (outputPlaceholder) {
        outputPlaceholder.innerHTML = "";
        for (const key in SPEEDCAM_FRONTEND_OPTIONS) {
            const option = SPEEDCAM_FRONTEND_OPTIONS[key];
            const optionDiv = document.createElement("div");
            optionDiv.textContent = `${option.label}: ${stateObj.frontend[key]}`;
            outputPlaceholder.appendChild(optionDiv);
        }
    }

}

function sendResponseToSSERequest(response, data) {
    if (!isLive) {
        printOutForLocalMode("sendResponseToSSERequest", { response, data })
        return;
    }
    const speedcam_id = window.localStorage.getItem("speedcam_id");
    const location = `speedcam/stream/${speedcam_id}/response`;
    const requestObject = {
        "response": response,
        "data": data
    }
    roundaboutRequest(requestObject, location);
}

function sendCommandToRoundabout(command, data) {
    if (!isLive) {
        printOutForLocalMode("sendCommandToRoundabout", { command, data })
        return;
    }
    const speedcam_id = window.localStorage.getItem("speedcam_id");
    const location = `speedcam/stream/${speedcam_id}/command/${command}`;
    const requestObject = {
        "command": command,
        "data": data
    }
    roundaboutRequest(requestObject, location);
}

let triggerAliveStarted = "";
function triggerAliveLoop(timeout) {
    if (triggerAliveStarted == "kill") {
        return;
    }
    sendResponseToSSERequest("alive", {})
    triggerAliveStarted = "started";
    setTimeout(() => {
        triggerAliveLoop(timeout)
    }, timeout)
}

function systemCheck() {
    // Check if the system is still alive
    // if the last event time is more than 30 seconds ago
    // then we should change the state to connectionLost
    // and then we should try to reconnect
    const current_time = Date.now();
    const lastEventTime = window.localStorage.getItem("lastEventTime");
    if (lastEventTime) {
        if (current_time - lastEventTime > 30000) {
            // changeStateObj("connectionLost");
        }
    }

    // Check that the sensor is still connected
    if (!navigator.serial) {
        changeStateObj("noSensor");
    }
    // Check that the camera is still connected
    if (!navigator.mediaDevices) {
        changeStateObj("noCamera");
        return false
    }
    return true
}


function sse() {
    // Create a new EventSource
    // if local storage has a api_session_token, add it to the headers
    // if local storage has a speedcam_id, add it to the url
    // if local storage has a cookie add it to the headers
    console.log(`Bearer ${window.localStorage.getItem("apiKeyRoundabout")}`)
    const speedcam_id = window.localStorage.getItem("speedcam_id");
    const streamUrl = "https://assets.reveb.la/speedcam/stream/" + speedcam_id + "?";

    // if our window is at "test.reveb.la" then we can keep going 
    // but if it is localhost we should just print out the data
    if (window.location.hostname == "localhost") {
        isLive = false;
        return;
    } else {
        isLive = true;
    }

    const source = new EventSource(streamUrl, {
        withCredentials: true,
        headers: {
            "Authorization": `Bearer ${window.localStorage.getItem("apiKeyRoundabout")}`,
        },
    });
    source.addEventListener('open', function (e) {
        if (triggerAliveStarted == "") {
            // 30 seconds
            triggerAliveLoop(30000)
            changeStateObj("connectedToServer")
            sendCommandToRoundabout("sendState", {})
        }

    });
    source.addEventListener('error', function (e) {
        if (e.readyState == EventSource.CLOSED) {
            //changeStateObj("connectionLost");
        }
        //changeStateObj("connectionLost");
    });
    source.onmessage = function (event) {
        // On event, set a localStorage var to current time
        // if the event.data has "subscribed" ignore it
        const current_time = Date.now();
        window.localStorage.setItem("lastEventTime", current_time);

        data = JSON.parse(event.data);
        if (data.hasOwnProperty("text")) {
            // if data.text has "subscribed" ignore it
            if (data.text.includes("subscribed")) {
                return;
            }
            console.log(data.text);
        }
        if (data.hasOwnProperty("command")) {
            console.log(data.command);
            switch (data.command) {
                case "shot":
                    sendRequestForScan(false);
                    break;
                case "scan":
                    sendRequestForScan(true);
                    break;
                case "open":
                    openSpeedCam();

                    break;
                case "close":
                    closeIV();
                    break;
                case "sendState":
                    updateState(data.state)
                    updateDisplay();
                    break;
                case "getState":
                    console.log(data.state)
                    changeLayout("ready")
                    break;
                case "setDomain":
                    console.log(data)
                    break;
                case "pause":
                    console.log(data)
                    changeLayout("subvert", true);
                    break;
                case "resume":
                    changeLayout("subvert")
                    console.log(data)
                    break;
                case "error":
                    console.log(data.error)
                    break;
                case "alive":
                    console.log(data)
                    sendResponseToSSERequest("alive", {})
                    break;
                case "refresh":
                    window.location.reload();
                    break;
                default:
                    console.log(data)
                    break;
            }
        }
    }

}

const returnButton = document.querySelector("#speedReturn")
const speedCloseButton = document.querySelector("#speedClose")
if (window.localStorage.getItem("apiKeyRoundabout")) {
    sse();
}

returnButton.addEventListener("click", () => {
    changeLayout("subvert", true)
    setTimeout(() => {
        stop_sensing = false;
    }, 20000)
})

speedCloseButton.addEventListener("click", () => {
    changeLayout("ready")
    setTimeout(() => {
        stop_sensing = false;
    }, 20000)
})

document.onkeydown = function (e) {
    if (e.key === "a") {
        createPopoverApiKey()
    }
    if (e.key === "1") {
        stateController()
    }
    if (e.key === "2") {
        changeLayout("ready")
    }
    if (e.key === "3") {
        changeLayout("subvert")
    }
    if (e.key === "4") {
        changeLayout("voice")
    }
    if (e.key === "5") {
        changeLayout()
    }
};
// Set up our event listener to run the startup process
// once loading is complete.
window.addEventListener("load", startupSpeedCam, false);

speedContent.addEventListener("click", (event) => {
    document.body.dataset.focus = "voice";
})
neoGraph.addEventListener("click", (event) => {
    document.body.dataset.focus = "graph";
})
bottomBar.addEventListener("click", (event) => {
    if (bottomBar.dataset.brand) {
        currentItem = document.querySelector(".currentItem");
        if (currentItem) {
            openSpeedCam(currentItem.dataset.domain)
        }
    } else {
        createPopoverOptions()
    }
})

stateObj.addEventListener("click", (event) => {
    if (stateObj.classList.contains("noSensor")) {
        connectSerial();
        printOutForLocalMode("Connecting to Sensor")
        return
    }
    if (stateObj.classList.contains("noCamera")) {
        startCam();
        printOutForLocalMode("Connecting to Camera")
        return
    }
    if (stateObj.classList.contains("noServer")) {
        sse();
        printOutForLocalMode("Connecting to Server")
        return
    }
    if (stateObj.classList.contains("noApiKey")) {
        createPopoverApiKey();
        printOutForLocalMode("No API Key")
        return
    }
    if (stateObj.classList.contains("setupComplete")) {
        changeLayout("ready")
        changeStateObj()
        printOutForLocalMode("Setup Complete")
        return
    }
    changeStateObj("setupComplete")
})