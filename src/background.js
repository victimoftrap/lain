import { APP_STATES } from './appStates'
import { USER_EVENTS } from './userEvents'

const getServerUrl = (isLocal) => {
    const LOCAL_API_URL = 'http://localhost:5000/api';
    const SERVER_API_URL = 'http://217.71.129.139:4216/api';

    let WORKING_SERVER_URL = LOCAL_API_URL;
    if (isLocal) {
        WORKING_SERVER_URL = LOCAL_API_URL;
    } else {
        WORKING_SERVER_URL = SERVER_API_URL;
    }
    return `${WORKING_SERVER_URL}/events/save`;
};

const logEventMessage = (message) => {
    console.log(message);
};

const sendEventMessageToServer = (message) => {
    const request = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    };
    logEventMessage(message);
    fetch(getServerUrl(false), request);
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

    YANDEX_CONTEST_ID = initData.testId;
    YANDEX_USER_ID = initData.testSessionId;
};

const onStopRecord = () => {
    chrome.tabs.onCreated.removeListener(onCreatedTab);
    chrome.tabs.onUpdated.removeListener(onUpdatedTab);
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

chrome.runtime.onConnect.addListener(port => {
    if (port.name === 'aboba-gforms') {
        port.onMessage.addListener(handleMessage);
    }
});
