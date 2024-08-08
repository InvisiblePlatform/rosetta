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
let saveKeysButton = null;
let rotatedFeed = true;

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

let localState = {
    "peripherals": {
        "stream": false,
        "serial": false,
        "camera": false,
    },
    "event_state": {
        "loop": false,
        "autoAlive": false,
    }
}
async function connectSerial(initport = null) {
    try {
        let reader;
        localState.peripherals.serial = false;
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
        localState.peripherals.serial = true;
        let responseString = "";
        let allowReset = true;
        let waitingTimeoutTime = 0;
        let dataCount = 0;
        let scanOnce = true

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
    }
}

function runOnTargetInfo(targetInfo) {
    // add current time to the waitingTimeoutTime
    waitingTimeoutTime = Date.now();
    if (document.getElementById("output_output")) {
        document.getElementById("output_output").textContent = responseString;
        // Parse the JSON object
        document.getElementById("range_number").textContent = targetInfo.target_range;
        document.getElementById("number_number").textContent = targetInfo.target_number;
        document.getElementById("speed_number").textContent = targetInfo.target_speed;
    }
    // Adjust the opacity of the blank splash screen
    lowerThreshold = 1.5;
    upperThreshold = 3.5;
    adjustedOpacity = Math.min(1, Math.max(0, (targetInfo.target_range - lowerThreshold) / (upperThreshold - lowerThreshold)));
    //document.getElementById("blankSplash").style = `--adjust-opacity: ${adjustedOpacity}`;
    responseString = "";
    // if target is below threshold
    if (targetInfo.target_range > upperThreshold && scanOnce) {
        dataCount = 0;
        scanOnce = false;
    }
    if (targetInfo.target_range < lowerThreshold) {
        // open IV
        scanOnce = true;
    }
    // set adjust opacity to 1 if we havent seen a new target in 5 seconds
    setTimeout(() => {
        if (Date.now() - waitingTimeoutTime > 5000) {
            //document.getElementById("blankSplash").style = `--adjust-opacity: 1`;
            dataCount = 0;
        }
    }, 5000);
}


function startupSpeedCam() {
    // If a port is paired already with the device, connect to it
    if ('serial' in navigator) {
        navigator.serial.getPorts().then(ports => {
            if (ports.length > 0) {
                connectSerial(ports[0]);
            }
        });
    } else {
        localState.peripherals.serial = false;
    }

    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    photo = document.getElementById("photo");
    contentArea = document.getElementsByClassName("contentArea")[0]
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
    if (window.localStorage.getItem("apiKeyRoundabout")) {
        roundaboutRequest({}, "speedcam/speedcam_endpoint/list");
    } else {
        createPopoverApiKey();
    }

    clearphoto();
    document.getElementById("topDisplay").addEventListener("click", e => {
        openSpeedCam();
    })

    // check for the speedcamState in local storage
    if (window.localStorage.getItem("speedcamState")) {
        speedcamState = JSON.parse(window.localStorage.getItem("speedcamState"));
    }
    // check for the localState in local storage
    if (window.localStorage.getItem("localState")) {
        localState = JSON.parse(window.localStorage.getItem("localState"));
    }
}

function openSpeedCam(brand = false) {
    contentArea = document.getElementById("contentAreaDiv");
    if (brand) {
        contentArea.classList.add("offScreen")
        itsOpen = true;
        //manualSetup(brand);
    }
    if (!contentArea.classList.contains("offScreen")) {
        // if the content area isnt off screen, then we need to close it
        // then whatever item is set to current item will be opened
        currentItem = document.querySelector(".currentItem");
        if (currentItem && !brand && currentItem.hasAttribute("data-domain")) {
            contentArea.classList.add("offScreen")
            itsOpen = true;
            manualSetup(currentItem.getAttribute("data-domain"));
        }
    }
    // set backButton onlclick to closeIV
    backButton.onclick = closeIV;
}

function closeIV() {
    itsOpen = false;
    contentArea = document.getElementsByClassName("contentArea")[0]
    contentArea.classList.remove("offScreen")
    // we also need to blank out the content div
    content = document.getElementById("content")
    content.innerHTML = "";
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
                context.rotate(Math.PI / 2);
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
function updateDisplay() {
    if (Url.get.site && !timerEnabled) {
        openSpeedCam(Url.get.site);
        setSearchParam("site", null);
    }
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
    }
    // If story has author or source add it to the storyInfoDiv 
    if (story.hasOwnProperty("author") || story.hasOwnProperty("source")) {
        const authorDiv = document.createElement("div");
        if (story.hasOwnProperty("source")) {
            if (story.author) {
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
    storyDiv.classList.add("story");
    storyInfoDiv.classList.add("storyInfo");
    storyDiv.appendChild(storyInfoDiv);
    topDisplay.appendChild(storyDiv);
    return true;
}

document.onkeydown = function (e) {
    if (e.key === "a") {
        createPopoverApiKey()
    }

    if (e.key === "p") {
    }
    if (e.key === "F14" || e.key === "Enter") {
        // Enter
    }

    if (e.key === "F15" || e.key === "Escape") {
        // Escape
    }
    if (e.key === " ") {
        //takepicture();
        addPopover("Rotated")
        rotatedFeed = !rotatedFeed;
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
    }
    if (e.key === "l") {
    }
};

let itsOpen = false;
let timerEnabled = false

function rollOnDisplay() {
    if (!itsOpen && timerEnabled) {
        placement += 1;
        updateDisplay();
        console.log("Rolling")
    }
}
setInterval(rollOnDisplay, 10000)

const httpsStrip = /http[s]*:\/\//g

function eventLoop() {
    ////// Check system state
    //// Check the various peripherals
    // Check the event stream
    if (window.localStorage.getItem("lastEventTime")) {
        if (Date.now() - parseInt(window.localStorage.getItem("lastEventTime")) > 30000) {
            localState.peripherals.stream = false;
        } else {
            localState.peripherals.stream = true;
        }
    }
    // Check the serial port for the sensor
    // Check the camera
    //// Check 
    // Check the event loop
    // Check the autoAlive
}

// Set up our event listener to run the startup process
// once loading is complete.
window.addEventListener("load", startupSpeedCam, false);

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

}


function sendResponseToSSERequest(response, data) {
    const speedcam_id = window.localStorage.getItem("speedcam_id");
    const location = `speedcam/stream/${speedcam_id}/response`;
    const requestObject = {
        "response": response,
        "data": data
    }
    roundaboutRequest(requestObject, location);
}

function sendCommandToRoundabout(command, data) {
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

function sse() {
    // Create a new EventSource
    // if local storage has a api_session_token, add it to the headers
    // if local storage has a speedcam_id, add it to the url
    // if local storage has a cookie add it to the headers
    console.log(`Bearer ${window.localStorage.getItem("apiKeyRoundabout")}`)
    const speedcam_id = window.localStorage.getItem("speedcam_id");
    const streamUrl = "https://assets.reveb.la/speedcam/stream/" + speedcam_id;
    const source = new EventSource(streamUrl, {
        withCredentials: true,
        headers: {
            "Authorization": `Bearer ${window.localStorage.getItem("apiKeyRoundabout")}`,
        },
    });
    source.addEventListener('open', function (e) {
        addPopover("Connected")
        if (triggerAliveStarted == "") {
            // 30 seconds
            triggerAliveLoop(30000)
            sendCommandToRoundabout("sendState", {})
        }

    });
    source.addEventListener('error', function (e) {
        if (e.readyState == EventSource.CLOSED) {
            addPopover("Disconnected")
            console.log("Disconnected")
        }
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
            addPopover(data.text)
        }
        if (data.hasOwnProperty("command")) {
            console.log(data.command);
            switch (data.command) {
                case "shot":
                    addPopover("Shot")
                    sendRequestForScan(false);
                    break;
                case "scan":
                    addPopover("Scanning")
                    sendRequestForScan(true);
                    break;
                case "open":
                    openIV();
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
                    break;
                case "setDomain":
                    console.log(data)
                    break;
                case "pause":
                    console.log(data)
                    break;
                case "resume":
                    console.log(data)
                    break;
                case "error":
                    addPopover(data.error)
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

if (window.localStorage.getItem("apiKeyRoundabout")) {
    // Attempt to connect to the stream
    sse();
}