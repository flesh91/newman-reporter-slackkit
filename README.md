# newman-reporter-slackkit

Custom [Newman](https://github.com/postmanlabs/newman) reporter to send message to [Slack](https://slack.com/)

<img src="https://raw.githubusercontent.com/flesh91/newman-reporter-slackkit/master/testResults.png?raw=true" width="670"  height="520">

## Before you get started
- Install [Newman](https://github.com/postmanlabs/newman) ``` $ npm run i -g newman ```
- Create a [Slack incoming webhook url](https://api.slack.com/messaging/webhooks)
or
- Create a [Slack bot to send to channel or user dynamically](https://api.slack.com/messaging/sending)

## Installation
 ```CLI
 npm i -g newman-reporter-slackkit
 ```

## Usage
```CLI
 newman run <collectionFile> -e <environmentFile> --suppress-exit-code -r slackmsg --reporter-slackmsg-webhookurl '<webhookurl>'
```

## Usage with channel override bot
```CLI
 newman run <collectionFile> -e <environmentFile> --suppress-exit-code -r slackkit --reporter-slackkit-webhookurl '<https://slack.com/api/chat.postMessage>' --reporter-slackkit-token '<bearer token>' --reporter-slackkit-channel '<channel or userid>'
```

## Reporter Options Optionals
```
 --reporter-slackkit-messageSize '<messageSize>' e.g 150
 --reporter-slackkit-token '<bearer token>' e.g xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT
 --reporter-slackkit-channel '<channel>' e.g #general
 --reporter-slackkit-failuresChannel '<channel>' e.g. #alerts
 --reporter-slackkit-collection '<collectionName> e.g test.json
 --reporter-slackkit-environment '<environmentName> e.g env.json
 --reporter-slackkit-reportingurl '<URL> e.g https://127.0.1/index.html
  --reporter-slackkit-limitFailures '<limitFailures>; e.g 5

```


## Reporter Options
**webhookurl** 
Webhook URL to point to the slack api where results are published

**collection** 
Option to add the name of collection file onto the message

**environment**
Option to add the name of environment file onto the message

**messageSize**
Option to change the message size, defaulted to 100

**token**
Option to use bearer token for slack bots for channel override

**channel**
Option to select channel or user receive the result

**failuresChannel**
Option to select channel or user to receive failures

**limitFailures**
Option to limit the amount failures shown in slack

