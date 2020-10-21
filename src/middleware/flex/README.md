twilio-flex
======================

### Running the twilio flex middleware

##### Prerequisites
You need to have a Twilio flex instace created and must have privileges to access account information.

The integration is implemented on the basis of the concepts mentioned [here](https://www.twilio.com/blog/add-custom-chat-channel-twilio-flex). As such you need to be familiar with the Twilio concepts such as Programmable Chats, Flex, Flows, Channels, Studio, Taskrouter etc. 

The following are some useful guides on Twilio Flex custom chat implementation:

* [https://www.twilio.com/blog/add-custom-chat-channel-twilio-flex](https://www.twilio.com/blog/add-custom-chat-channel-twilio-flex)
* [https://www.twilio.com/docs/flex/developer/messaging-orchestration/integrate-custom-chat-client](https://www.twilio.com/docs/flex/developer/messaging-orchestration/integrate-custom-chat-client)
* [https://www.twilio.com/blog/2018/05/building-a-chat-with-twilio-lit.html-parcel-and-typescript.html](https://www.twilio.com/blog/2018/05/building-a-chat-with-twilio-lit.html-parcel-and-typescript.html)
* [https://github.com/vernig/twilio-flex-custom-webchat](https://github.com/vernig/twilio-flex-custom-webchat)

##### Set credentials

1. Copy `.env.sample` to `.env`
2. Plug your credentials into `.env`

You can find the following credentials in your Twilio Console:

| Config Value  | Description |
| :-------------  |:------------- |
`ACCOUNT_ID` | Your primary Twilio Flex account SID - find this [in the console here](https://www.twilio.com/console/project/settings).
`AUTH_TOKEN` | Your auth token for the twilio flex project - find this [in the console here](https://www.twilio.com/console/project/settings). More info [here](https://support.twilio.com/hc/en-us/articles/223136027-Auth-Tokens-and-How-to-Change-Them)
`FLEX_FLOW_ID` | Custom Flex flow SID. You need to use the twilio CLI to create a `custom` flex flow as described [here](https://www.twilio.com/blog/add-custom-chat-channel-twilio-flex)
`API_KEY` | API keys to access Flex APIs. You can generate [here](https://www.twilio.com/console/project/api-keys) in the _Create a new Flex Flow_ section
`API_SECRET` | secret for the `API_KEY`. 
`CHAT_SERVICE_ID` | Programmable chat service SID available [here](https://www.twilio.com/console/chat/services)
##### Install dependencies

```
$ npm install
```

##### Run server

```
$ npm run dev
```

#### Routing
This example implementation does not take an opinion on how you should implement your contact center routing on twilio. The following documentation has information on how the routing is supported in flex and you should change the code necessary to implement the routing.

* [https://www.twilio.com/docs/flex/developer/routing](https://www.twilio.com/docs/flex/developer/routing)
* [https://www.twilio.com/docs/flex/quickstart/flex-routing-skills](https://www.twilio.com/docs/flex/developer/routing)

