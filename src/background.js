'use strict';

import { APP_STATES } from './appStates'
import { USER_EVENTS } from './userEvents'

const getServerUrl = (isLocal) => {
    const LOCAL_API_URL = 'http://localhost:5000';
    const SERVER_API_URL = 'http://217.71.129.139:4223';

    if (isLocal) {
        return LOCAL_API_URL;
    } else {
        return SERVER_API_URL;
    }
};

const logEventMessage = (message) => {
    console.log(message);
};

const sendEventMessageToServer = (message) => {
    const apiUrl = getServerUrl(false);
    const request = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    };

    logEventMessage(message);
    fetch(`${apiUrl}/events/save`, request);
};

const onCreatedTab = (tab) => {
    const eventRequest = {
        testSessionId: YANDEX_USER_ID,
        testId: YANDEX_CONTEST_ID,
        createdAt: new Date().toISOString(),
        type: USER_EVENTS.TAB_EVENT,
        event: {
            url: tab.url,
            title: tab.title,
            active: tab.active,
            incognito: tab.incognito,
            index: tab.index,
            status: tab.status,
            audible: tab.audible,
            selected: tab.selected,
        }
    };
    sendEventMessageToServer(eventRequest);
};

const onUpdatedTab = (tabId, info, tab) => {
    if (tab.status === 'complete') {
        onCreatedTab(tab);
    }
};

let YANDEX_CONTEST_ID = '';
let YANDEX_USER_ID = '';

const onStartRecord = (initData) => {
    chrome.tabs.onCreated.addListener(onCreatedTab);
    chrome.tabs.onUpdated.addListener(onUpdatedTab);
    chrome.tabs.onActivated.addListener((info) => {
        chrome.tabs.get(info.tabId, (tabInfo) => {
            onCreatedTab(tabInfo);
        });
    });

    // chrome.windows.onFocusChanged.addListener((winId) => {
    //     console.log(winId);
    //     chrome.windows.get(winId, (someWin) => {
    //         console.log(someWin);
    //     });
    // });

    YANDEX_CONTEST_ID = initData.testId;
    YANDEX_USER_ID = initData.testSessionId;
};

const onStopRecord = () => {
    chrome.tabs.onCreated.removeListener(onCreatedTab);
    chrome.tabs.onUpdated.removeListener(onUpdatedTab);
    chrome.tabs.onActivated.removeListener((info) => {
        chrome.tabs.get(info.tabId, (tabInfo) => {
            onCreatedTab(tabInfo);
        });
    });

    // chrome.windows.onFocusChanged.removeListener((winId) => {
    //     console.log(winId);
    //     chrome.windows.get(winId, (someWin) => {
    //         console.log(someWin);
    //     });
    // });
};

const handleMessage = (message) => {
    switch (message.type) {
        case APP_STATES.START_TRACKING:
            onStartRecord(message.init);
            break;
        case APP_STATES.STOP_TRACKING:
            onStopRecord();
            break;
        default:
            sendEventMessageToServer(message);
            break;
    }
};

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    
});

const getTestLinks = async () => {
    const apiUrl = getServerUrl(false);
    return fetch(`${apiUrl}/links`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

const sendResponseAsMessage = async (sendResponse) => {
    // https://stackoverflow.com/questions/14094447/chrome-extension-dealing-with-asynchronous-sendmessage
    const httpResponse = await getTestLinks();
    const response = await httpResponse.json();

    sendResponse({
        testLinks: response
    });
    localStorage.setItem('links', JSON.stringify(response));
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.greeting === "hello") {
        sendResponseAsMessage(sendResponse);
        return true;
    }
});

chrome.runtime.onConnect.addListener(port => {
    if (port.name === 'aboba-gforms') {
        port.onMessage.addListener(handleMessage);
    }
});
