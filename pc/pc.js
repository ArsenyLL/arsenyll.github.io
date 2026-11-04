const allData = {};
allData.url = document.location.href;
allData.urlReferrer = document.referrer;

const windowExcludes = ['funky', 'getGPUInfo', '0', 'getWindowPropsByIframe', 'getPropVal', 'upload', 'displayJsonOnPage', 'syntaxHighlight', 'fetchMyIpInfo', 'collectClientHints', 'getWorkerUserAgent', 'clientHintsMatchUA', 'clientHintsToString', 'compareUserAgents', 'getMediaDevices'];
const navigatorExcludes = [];

function getWindowPropsByIframe() {
    let results, currentWindow, iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    currentWindow = Object.getOwnPropertyNames(window);
    results = currentWindow.filter(function (prop) {
        return !iframe.contentWindow.hasOwnProperty(prop);
    });
    //console.log('window iframe props', results);
    return results;
}

function getPropVal(parentObj, propKey) {
    try {
        const value = parentObj[propKey];
        if (typeof value === 'function') {
            return value.toString().slice(0, 128);
        } else if (value === null) {
            return null;
        } else if (typeof value === 'object') {
            try {
                return JSON.parse(JSON.stringify(value));
            } catch {
                try {
                    return Object.getOwnPropertyNames(value).join(', ');
                } catch {
                    return '[Complex Object]';
                }
            }
        } else {
            return value;
        }
    } catch (e) {
        return '[Access Denied]';
    }
}

function funky(){
    let detected = false;
    const trap = new Proxy(
        {},
        {
            ownKeys() {
                detected = true;
                return [];
            },
        },
    );
    const obj = Object.create(trap);
    console.groupEnd(obj);
    return detected;
}

let windowProps = {};
for (let prop of getWindowPropsByIframe()) {
    if (windowExcludes.includes(prop)) {
        continue;
    }
    windowProps[prop] = getPropVal(window, prop);
}
allData.window = windowProps;

allData.screenData = {
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
}


function getGPUInfo() {
  const canvas = document.createElement('canvas');
  // Try getting standard webgl context, fallback to experimental
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return { error: "WebGL not supported" };
  }

  // Get the debug info extension
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  
  if (!debugInfo) {
    return {
      error: "WEBGL_debug_renderer_info extension not supported",
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER)
    };
  }

  // Extract the unmasked GPU hardware names
  return {
    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
  };
}
let gpuinfo = getGPUInfo();
allData.gpuinfo = gpuinfo;

console.log(getGPUInfo());


async function getMediaDevices() {
    const result = { mic: false, camera: false, speakers: false };
    try {
        if (!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)) {
            allData.mediaDevices = null;
            return null;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        for (const d of devices) {
            if (d.kind === 'audioinput') result.mic = true;
            else if (d.kind === 'videoinput') result.camera = true;
            else if (d.kind === 'audiooutput') result.speakers = true;
        }
    } catch (e) {
        allData.mediaDevices = null;
        return null;
    }
    allData.mediaDevices = result;
    return result;
}
getMediaDevices();

const seleniumPropsRegex = /^(\$)?(wdc|cdc)_[a-zA-Z0-9]{16,}_(Array|Object|Promise|Proxy|Symbol|JSON)$/;

// Browser automation detection checks
allData.brauto = {
    "navigator.webdriver": !!navigator.webdriver,
    "window.webdriver": !!window.webdriver,
    "window.__playwright__binding__": !!window.__playwright__binding__,
    "window.__pwInitScripts": !!window.__pwInitScripts,
    "window.__jetski_console_buffer": !!window.__jetski_console_buffer,
    "window.__generateAccessibilityTree": !!window.__generateAccessibilityTree,
    "navigator.modelContext": !!navigator.modelContext,
    "window.document.documentElement.getAttribute(\"webdriver\")": !!window.document.documentElement.getAttribute("webdriver"),
    "window.chrome && !window.chrome.runtime": !!(window.chrome && !window.chrome.runtime),
    "seleniumPropsRegex": Object.getOwnPropertyNames(window).some(prop => seleniumPropsRegex.test(prop)),
    "navigator.bluetooth": !!navigator.bluetooth,
    "funky_cdp": funky(),
};

let navigatorProps = {};
for (let prop in navigator) {
    if (navigatorExcludes.includes(prop)) {
        continue;
    }
    navigatorProps[prop] = getPropVal(navigator, prop);
}
allData.navigator = navigatorProps;




(function(){ var je = document.createElement("script"); je.src="//cdn.doubleverify.com/dvtp_src.js?&dvpf_frpc=1&cmp=1333338&plc=1333338&&ctx=818052&cb=" + Math.random(); document.body.appendChild(je);})()

async function fetchMyIpInfo() {
    try {
        const response = await fetch("https://myip.wtf/json");
        if (!response.ok) {
            throw new Error("Network response was not ok: " + response.statusText);
        }
        const data = await response.json();
        let ipInfo = {};
        for (let key in data) {
            ipInfo[key.slice(11)] = data[key];
        }
        allData.ipInfo = ipInfo;
    } catch (error) {
        //console.error("Error fetching IP info:", error);
        return null;
    }
}
fetchMyIpInfo();

async function collectClientHints() {
    if (!window.Promise) {
        return;
    }
    if (!(navigator && navigator.userAgentData && navigator.userAgentData.getHighEntropyValues)) {
        return;
    }
    const AsyncUAData = await navigator.userAgentData.getHighEntropyValues([
        'fullVersionList',
        'model',
        'platformVersion',
        'platform'
    ]);
    allData.clientHints = JSON.parse(JSON.stringify(AsyncUAData, null, 2));
}
collectClientHints();

function getWorkerUserAgent(timeoutMs) {
    return new Promise(function (resolve) {
        let worker, url, timer;
        function done(val) {
            clearTimeout(timer);
            try { worker && worker.terminate(); } catch (e) { }
            try { url && URL.revokeObjectURL(url); } catch (e) { }
            resolve(val);
        }
        try {
            const blob = new Blob(['postMessage(navigator.userAgent);'], { type: 'application/javascript' });
            url = URL.createObjectURL(blob);
            worker = new Worker(url);
            worker.onmessage = function (e) { done(e.data); };
            worker.onerror = function () { done(null); };
            timer = setTimeout(function () { done(null); }, timeoutMs || 1000);
        } catch (e) {
            done(null);
        }
    });
}

// Checks whether the Client Hints data is consistent with a UA string.
// CH has no UA string, so compare what can be compared: brand major version, platform, mobile.
function clientHintsMatchUA(uaData, ua) {
    const brandPatterns = {
        'Google Chrome': /Chrome\/(\d+)/,
        'Chromium': /Chrome\/(\d+)/,
        'Microsoft Edge': /Edg(?:A|iOS)?\/(\d+)/,
        'Opera': /OPR\/(\d+)/
    };
    for (const b of uaData.brands || []) {
        const re = brandPatterns[b.brand];
        if (!re) continue; // GREASE / unknown brands
        const m = ua.match(re);
        if (!m || m[1] !== String(b.version)) return false;
    }
    const platformPatterns = {
        'Windows': /Windows/,
        'macOS': /Macintosh|Mac OS X/,
        'Android': /Android/,
        'Chrome OS': /CrOS/,
        'Linux': /Linux/
    };
    const pre = platformPatterns[uaData.platform];
    if (pre && !pre.test(ua)) return false;
    if (uaData.platform === 'Linux' && /Android/.test(ua)) return false;
    if (typeof uaData.mobile === 'boolean' && uaData.mobile !== /Mobile/.test(ua)) return false;
    return true;
}

function clientHintsToString(uaData) {
    const brands = (uaData.brands || []).map(function (b) { return b.brand + '/' + b.version; }).join(', ');
    return brands + '; platform=' + uaData.platform + '; mobile=' + uaData.mobile;
}

async function compareUserAgents() {
    const uaNav = navigator.userAgent;
    const uaWorker = await getWorkerUserAgent(1000);
    const uaData = navigator.userAgentData || null;

    let differ = false;
    if (uaWorker !== null && uaWorker !== uaNav) differ = true;
    if (uaData && (!clientHintsMatchUA(uaData, uaNav) || (uaWorker !== null && !clientHintsMatchUA(uaData, uaWorker)))) differ = true;

    const result = { ua_differ: differ };
    if (differ) {
        result.ua_nav = uaNav;
        result.ua_webworker = uaWorker;
        result.ua_ch = uaData ? clientHintsToString(uaData) : null;
    }
    allData.uaCompare = result;
    return result;
}
compareUserAgents();

function upload() {
    //console.log(JSON.stringify(allData, null, 2));
    if (!XMLHttpRequest) {
        return;
    }
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const siteName = document.domain;

    const xhr = new XMLHttpRequest();
    let fileData = new FormData();
    fileData.append('key', 'pc2025/' + dateStr + '/' + siteName + '/' + date.valueOf() + '.json');
    fileData.append('file', JSON.stringify(allData, null, 2));
    xhr.open('POST', atob('aHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL2dwLW1zLXVzLWdjcy1mcmF1ZA=='), true);
    xhr.send(fileData);
}
setTimeout(upload, 1500);


function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, null, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|\b\d+\.?\d*\b)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function displayJsonOnPage() {
    let obj = JSON.stringify(allData, null, 2);
    let pre = document.createElement('pre');
    pre.innerHTML = syntaxHighlight(obj);
    // Add some basic styles if not already present
    if (!document.getElementById('syntax-highlight-style')) {
        let style = document.createElement('style');
        style.id = 'syntax-highlight-style';
        style.innerHTML = `
            .string { color: #C58C12; }
            .number { color: #1C00CF; }
            .boolean { color: #0086B3; }
            .null { color: #B30000; }
            .key { color: #008000; }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(pre);
}
let params = new URLSearchParams(document.location.search);
let debugParam = params.get("d");
if (debugParam === '1') {
    setTimeout(displayJsonOnPage, 1000);
}
