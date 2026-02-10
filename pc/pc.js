const allData = {};
allData.url = document.location.href;
const windowExcludes = ['0', 'getWindowPropsByIframe', 'getPropVal', 'upload', 'displayJsonOnPage', 'syntaxHighlight', 'fetchMyIpInfo', 'collectClientHints'];
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
    "seleniumPropsRegex": Object.getOwnPropertyNames(window).some(prop => seleniumPropsRegex.test(prop))
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
