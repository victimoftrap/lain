'use strict';

import { APP_STATES } from './appStates'
import { USER_EVENTS } from './userEvents'

import { nanoid } from 'nanoid'

const EXTENSION_STATE = 'gforms-ets-state';
const USER_SESSION_ID = 'testSessionId';

let port = chrome.runtime.connect({ name: 'aboba-gforms' });

const sendTrackingMessage = (testSessionId, testId, type, eventObj) => {
    port.postMessage({
        testSessionId: testSessionId,
        testId: testId,
        createdAt: new Date().toISOString(),
        type: type,
        event: eventObj
    });
};

const injectMouseListeners = (testSessionId, testId) => {
    let mainPage = document.getElementsByClassName('freebirdFormviewerViewFormContentWrapper')[0];
    mainPage.addEventListener('mouseleave', (event) => {
        sendTrackingMessage(
            testSessionId,
            testId,
            USER_EVENTS.MOUSE_LEAVE_EVENT, 
            event
        );
    });

    mainPage.addEventListener('mouseenter', (event) => {
        sendTrackingMessage(
            testSessionId,
            testId,
            USER_EVENTS.MOUSE_ENTER_EVENT,
            event
        );
    });
};

const testTitleExtractor = (testSessionId, testId) => {
    const headerComponent = document.getElementsByClassName('freebirdFormviewerViewHeaderHeader')[0];
    const headerTitle = headerComponent.getElementsByClassName('freebirdFormviewerViewHeaderTitle')[0].innerText;
    const headerDescription = headerComponent.getElementsByClassName('freebirdFormviewerViewHeaderDescription')[0].innerText;

    const myEventObj = {
        testTitle: headerTitle,
        testDescription: headerDescription,
    };
    sendTrackingMessage(testSessionId, testId, USER_EVENTS.FORM_TEST_TITLE_EVENT, myEventObj);
};

const studentNameExtractor = (testSessionId, testId) => {
    const studentFormField = document.getElementsByClassName('freebirdFormviewerViewNumberedItemContainer')[0];
    
    const title = studentFormField.getElementsByClassName('freebirdFormviewerComponentsQuestionBaseTitle')[0];
    const nameInput = studentFormField.getElementsByTagName('input');

    const myEventObj = {
        testSessionId: testSessionId,
        studentInfo: nameInput,
    };
    sendTrackingMessage(testSessionId, testId, USER_EVENTS.FORM_STUDENT_EVENT, myEventObj);
};

const sendForm = (testSessionId, testId) => {
    const sendButton = document.getElementsByClassName('freebirdFormviewerViewNavigationSubmitButton')[0];
    sendButton.onclick = (event) => {
        testTitleExtractor(testSessionId);
        studentNameExtractor(testSessionId);

        sendTrackingMessage(testSessionId, testId, USER_EVENTS.FORM_SOLUTION_SENT_EVENT, event);
        stop();
    };
};

const preClearForm = (testSessionId, testId) => {
    const preClearButton = document.getElementsByClassName('freebirdFormviewerViewNavigationClearButton');
    preClearButton.onclick = (event) => {
        sendTrackingMessage(testSessionId, testId, USER_EVENTS.FORM_TRYING_TO_CLEAR_EVENT, event);
    };
};

const clearForm = (testSessionId, testId) => {
    const clearDialog = document.getElementsByClassName('freebirdFormviewerViewNavigationClearDialog')[0];
    if (clearDialog !== undefined) {
        const clearDialogButtonsList = clearDialog.getElementsByClassName('exportButtons')[0].children;
        
        const cancelClearFormButton = clearDialogButtonsList[0];
        cancelClearFormButton.onclick = (event) => {
            sendTrackingMessage(testSessionId, testId, USER_EVENTS.FORM_CANCEL_CLEAR_EVENT, event);
        };
        
        const finallyClearFormButton = clearDialogButtonsList[1];
        finallyClearFormButton.onclick = (event) => {
            sendTrackingMessage(testSessionId, testId, USER_EVENTS.FORM_CLEARED_EVENT, event);
        };
    }
};

const abobaExtractor = (testSessionId, testId) => {
    const formFields = document.getElementsByClassName('freebirdFormviewerViewNumberedItemContainer');
    for (let i = 1; i < formFields.length; i++) {
        const field = formFields[i];

        const questionBody = field.getElementsByClassName('freebirdFormviewerComponentsQuestionBaseRoot')[0];
        if (questionBody !== undefined) {
            const taskTitle = questionBody.children[0].getElementsByClassName('freebirdFormviewerComponentsQuestionBaseTitle')[0].innerText;

            const questionAnswersContainer = questionBody.children[1];
            const taskTypeClassName = questionAnswersContainer.className;
            if (taskTypeClassName.includes('Checkbox')) {
                const answerDivList = questionAnswersContainer.children[1].children;
                for (let answerPosition = 0; answerPosition < answerDivList.length; answerPosition++) {
                    const answerText = answerDivList[answerPosition]
                        .getElementsByClassName('freebirdFormviewerComponentsQuestionCheckboxLabel')[0]
                        .innerText;

                    answerDivList[answerPosition].onclick = (event) => {
                        const myEventObj = {
                            taskNumber: i,
                            taskTitle: taskTitle,
                            taskType: 'checkbox',
                            answerNumber: answerPosition,
                            answerTitle: answerText,
                        };
                        sendTrackingMessage(testSessionId, testId, USER_EVENTS.SOLUTION_CHECKBOX_EVENT, myEventObj);
                    };
                }
            }

            if (taskTypeClassName.includes('Radio')) {
                const answerDivList = questionAnswersContainer.children[1].children;
                for (let answerPosition = 0; answerPosition < answerDivList.length; answerPosition++) {
                    const answerText = answerDivList[answerPosition]
                        .getElementsByClassName('freebirdFormviewerComponentsQuestionRadioLabel')[0]
                        .innerText;

                    answerDivList[answerPosition].onclick = (event) => {
                        const myEventObj = {
                            taskNumber: i,
                            taskTitle: taskTitle,
                            taskType: 'radio',
                            answerNumber: answerPosition,
                            answerTitle: answerText,
                        };
                        sendTrackingMessage(testSessionId, testId, USER_EVENTS.SOLUTION_RADIO_EVENT, myEventObj);
                    };
                }
            }

            // long + short text inputs
            if (taskTypeClassName.includes('freebirdFormviewerComponentsQuestionTextRoot')) {
                const textareaTagAnswerInput = questionAnswersContainer.getElementsByTagName('textarea')[0];
                const inputTagAnswerInput = questionAnswersContainer.getElementsByTagName('input')[0];

                if (textareaTagAnswerInput !== undefined) {
                    textareaTagAnswerInput.oninput = (event) => {
                        const myEventObj = {
                            taskNumber: i,
                            taskTitle: taskTitle,
                            taskType: 'longtext',
                            answerRawText: event.target.value,
                        };
                        sendTrackingMessage(testSessionId, testId, USER_EVENTS.SOLUTION_TEXT_EVENT, myEventObj);
                    };
                }
                if (inputTagAnswerInput !== undefined) {
                    inputTagAnswerInput.oninput = (event) => {
                        const myEventObj = {
                            taskNumber: i,
                            taskTitle: taskTitle,
                            taskType: 'shorttext',
                            answerRawText: event.target.value,
                        };
                        sendTrackingMessage(testSessionId, testId, USER_EVENTS.SOLUTION_TEXT_EVENT, myEventObj);
                    };
                }
            }

            if (taskTypeClassName.includes('freebirdFormviewerComponentsQuestionScaleRoot')) {
            }
        }
    }
};

const getUserId = () => {
    let testSessionId = localStorage.getItem(USER_SESSION_ID);

    if (testSessionId === null) {
        testSessionId = nanoid();
        localStorage.setItem(USER_SESSION_ID, testSessionId);
    }
    return testSessionId;
};

const getFormId = () => {
    const formActionUrl = document.getElementsByTagName('form')[0].action;
    const pathList = formActionUrl.split('/');
    return pathList[pathList.length - 2];
};

const injectAll = (testSessionId, testId) => {
    injectMouseListeners(testSessionId, testId);
    abobaExtractor(testSessionId, testId);
    sendForm(testSessionId, testId);
    preClearForm(testSessionId, testId);
    clearForm(testSessionId, testId);
};

const start = () => {
    const testSessionId = getUserId();
    const testId = getFormId();

    port.postMessage({
        type: APP_STATES.START_TRACKING,
        init: {
            testSessionId: testSessionId, 
            testId: testId,
        },
    });
    localStorage.setItem(EXTENSION_STATE, APP_STATES.START_TRACKING);
    injectAll(testSessionId, testId);
};

const stop = () => {
    port.postMessage({
        type: APP_STATES.STOP_TRACKING,
    });
    localStorage.setItem(EXTENSION_STATE, APP_STATES.STOP_TRACKING);
    localStorage.removeItem(USER_SESSION_ID);
};

const formResponseLinks = () => {
    const linksToFormList = document.getElementsByClassName('freebirdFormviewerViewResponseLinksContainer')[0].getElementsByTagName('a');

    const changeSolution = linksToFormList[0];
    changeSolution.onclick = (event) => {
        sendTrackingMessage(testSessionId, testId, USER_EVENTS.FORM_CHANGE_SOLUTION_EVENT, event);
        start();
    };

    const newSolution = linksToFormList[1];
    newSolution.onclick = (event) => {
        sendTrackingMessage(testSessionId, testId, USER_EVENTS.FORM_NEW_SOLUTION_EVENT, event);
        start();
    };
}

const checkAppState = () => {
    let lainExtensionState = localStorage.getItem(EXTENSION_STATE);

    const googleFormsPath = location.pathname;
    if (googleFormsPath.includes('closedform')) {
        if (lainExtensionState === APP_STATES.START_TRACKING) {
            stop();
        }
        localStorage.setItem(EXTENSION_STATE, APP_STATES.IDLE);
        return;
    }

    if (lainExtensionState === null) {
        localStorage.setItem(EXTENSION_STATE, APP_STATES.IDLE);
    }

    if (lainExtensionState === APP_STATES.IDLE) {
        chrome.runtime.sendMessage({ greeting: "hello" }, (response) => {
            const links = response.testLinks.links;
            const formId = getFormId();

            for (let i = 0; i < links.length; i++) {
                if (links[i].includes(formId)) {
                    start();
                    break;
                }
            }
        });
    }
    
    if (lainExtensionState === APP_STATES.START_TRACKING) {
        const testSessionId = getUserId();
        const formId = getFormId();
        injectAll(testSessionId, formId);
    }

    if (lainExtensionState === APP_STATES.STOP_TRACKING) {
        lainExtensionState = APP_STATES.IDLE;
        localStorage.setItem(EXTENSION_STATE, APP_STATES.IDLE);
    }
};

checkAppState();
