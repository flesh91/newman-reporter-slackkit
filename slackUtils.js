const prettyms = require('pretty-ms');
const axios = require('axios').default;
var jsonminify = require("jsonminify");

let messageSize;

// creates message for slack
function slackMessage(stats, timings, failures, executions, maxMessageSize, collection, environment, channel, reportingUrl) {
    messageSize = maxMessageSize;
    let parsedFailures = parseFailures(failures);
    let skipCount = getSkipCount(executions);
    let failureMessage = `
    {
        "channel": "${channel}",
        "attachments": [
            {
                "color": "#f25b44",
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                        "type": "plain_text",
                            "text": "Tests failed :red_circle:",
                        "emoji": true
                        }
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "text": "Env: *${environment}* | Collection: *${collection}* | Duration: *${prettyms(timings.completed - timings.started)}*",
                                "type": "mrkdwn"
                            }
                        ]
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*TESTS SUMMARY:* \\n> Total Requests: *${stats.requests.total}* \\n> Passed: *${stats.requests.total - parsedFailures.length - skipCount}* \\n> Failed: *${parsedFailures.length}* \\n> Skipped: *${skipCount}* "
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "Detailed report link:"
                        },
                        "accessory": {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Click Me",
                                "emoji": true
                            },
                            "value": "Report",
                            "url": "${reportingUrl}"
                        }
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "type": "plain_text",
                                "text": ":kitsoft: Kitsoft QA 2022",
                                "emoji": true
                            }
                        ]
                    }
                ]
            }
        ]  
    }
    `
    let successMessage = `
    {
        "channel": "${channel}",
        "attachments": [
            {
                "color": "#29a745",
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "Tests passed :large_green_circle:",
                            "emoji": true
                        }
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "text": "Env: *${environment}* | Collection: *${collection}* | Duration: *${prettyms(timings.completed - timings.started)}*",
                                "type": "mrkdwn"
                            }
                        ]
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*TESTS SUMMARY:* \\n• Total Requests: *${stats.requests.total}* \\n• Passed: *${stats.requests.total - parsedFailures.length - skipCount}* \\n• Failed: *${parsedFailures.length}* \\n• Skipped: *${skipCount}* "
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "Detailed report link:"
                        },
                        "accessory": {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Click Me",
                                "emoji": true
                            },
                            "value": "Report",
                            "url": "${reportingUrl}"
                        }
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "type": "plain_text",
                                "text": ":kitsoft: Kitsoft QA 2022",
                                "emoji": true
                            }
                        ]
                    }
                ]
            }
        ]  
    }
    `
    return jsonminify(`
    ${failures.length > 0 ? failureMessage : successMessage}
    `);
}

function getSkipCount(executions) {
    return executions.reduce((acc, execution) => {
        if (execution.assertions) {
            if (execution.assertions[0].skipped) {
                acc = acc + 1;
            };
        };
        return acc;
    }, 0);
}

// Takes fail report and parse it for further processing
function parseFailures(failures) {
    return failures.reduce((acc, failure, index) => {
        if (index === 0) {
            acc.push({
                name: failure.source.name || 'No Name',
                tests: [{
                    name: failure.error.name || 'No test name',
                    test: failure.error.test || 'connection error',
                    message: failure.error.message || 'No Error Message'
                }]
            });
        } else if (acc[acc.length - 1].name !== failure.source.name) {
            acc.push({
                name: failure.source.name || 'No Name',
                tests: [{
                    name: failure.error.name || 'No test name',
                    test: failure.error.test || 'connection error',
                    message: failure.error.message || 'No Error Message'
                }]
            });
        } else {
            acc[acc.length - 1].tests.push({
                name: failure.error.name || 'No test name',
                test: failure.error.test || 'connection error',
                message: failure.error.message || 'No Error Message'
            })
        }
        return acc;
    }, []);
}

// Takes failMessages and create Error messages for each failures
function failErrors(parsedErrors) {
    return parsedErrors.map((error, index) => {
        return `
        {
            "value": "*\`${index + 1}. ${error.name} - ${error.test}\`*",
            "short": false
        },
        {
            "value": "• ${cleanErrorMessage(error.message, messageSize)}",
            "short": false
        }`;
    }).join();
}

function cleanErrorMessage(message, maxMessageSize) {
    // replaces the quotes and double quotes in order for the message to be valid json format
    // as well as cutting messages to size 100 and truncating it with ...
    let filteredMessage = message.replace(/["']/g, "")
    filteredMessage = filteredMessage.replace('expected', 'Expected -')
    if (filteredMessage.length > maxMessageSize) {
        return `${filteredMessage.substring(0, maxMessageSize)}...`;
    }
    return filteredMessage;
}

// sends the message to slack via POST to webhook url
async function send(url, message, token) {
    const payload = {
        method: 'POST',
        url,
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        data: message
    };
    let result;
    try {
        result = await axios(payload);
    } catch (e) {
        result = false;
        console.error(`Error in sending message to slack ${e}`);
    }
    return result;
}

exports.slackUtils = {
    send,
    slackMessage
};