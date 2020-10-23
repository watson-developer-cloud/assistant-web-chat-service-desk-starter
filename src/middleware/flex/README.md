## Twilio-Flex

### Running the twilio flex

This repo has an example implementation, integrating the Watson Assistant webchat with Twilio Flex contact center. You should only view this as an inspiration and a guide, and make necessary changes to the code to your needs before deploying the code to production. 


##### Prerequisites
You need to have a Twilio flex instace created and must have privileges to access account information.

The integration is implemented on the basis of the concepts mentioned [here](https://www.twilio.com/blog/add-custom-chat-channel-twilio-flex). As such you need to be familiar with the Twilio concepts such as Programmable Chats, Flex, Flows, Channels, Studio, Taskrouter etc. 

The following are some useful guides on Twilio Flex custom chat implementation:

* [https://www.twilio.com/blog/add-custom-chat-channel-twilio-flex](https://www.twilio.com/blog/add-custom-chat-channel-twilio-flex)
* [https://www.twilio.com/docs/flex/developer/messaging-orchestration/integrate-custom-chat-client](https://www.twilio.com/docs/flex/developer/messaging-orchestration/integrate-custom-chat-client)
* [https://www.twilio.com/blog/2018/05/building-a-chat-with-twilio-lit.html-parcel-and-typescript.html](https://www.twilio.com/blog/2018/05/building-a-chat-with-twilio-lit.html-parcel-and-typescript.html)
* [https://github.com/vernig/twilio-flex-custom-webchat](https://github.com/vernig/twilio-flex-custom-webchat)

##### Set credentials

1. Copy `.env-sample` to `.env` in the current `middleware/flex` directory.
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
That should run the server code (middleware) which authorizes the user with Twilio and helps in setting up the integration. At runtime, Watson Assistant webchat will call the `/auth` API hosted here and get the necessary auth information to start the chat with twilio flex.

Please note that the local server is running nonsecure on `http`. For your production, you would have to find a way to host an API to get the information necessary to run the integration.

#### Start the webchat
Now that the twilio middleware is up and ready, you would need to start the web-chat and start playing with the integration.

* Go to the root of the project folder and copy `.env-sample` file from the same directory to `.env`. Modify the `SERVICE_DESK_CLASS` variable to `TwilioFlex`. This is the name of the class for the Twilio implementation in [twilioFlex.ts](../../serviceDesks/twilio/twilioFlex.ts). 
* Run `npm install` 
* Run `npm run dev`. 
* More information on how to run the webchat can be found [here](../../../README.md#development) 
* This should start the webchat by opening a browser, and launching a webchat for Watson Assistant. You can _escalate to an agent_ within the webchat to trigger the twilio integration.

### Functionalities
#### Start chat with an agent
The *startChat()* function in [twilioFlex.ts](../../serviceDesks/twilio/twilioFlex.ts) will trigger the integration with Twilio Flex. It calls the local middleware server for auth information which need to be changed according to your needs. 

#### End chat
Both User and Agent ending the chat is supported. This happens by leaving/closing the twilio channel that was created when the chat begun. 

#### Message exchange
Both User and Agent can exchange text messages.

#### User authentication
The Twilio middleware [auth.ts](./src/routes/auth.ts) does implement a very simple user authentication by generating a user token. Please change this according to your implementation needs.

#### Agent transfers
The event listeners set up in [twilioFlex.ts](../../serviceDesks/twilio/twilioFlex.ts) listens to members joining and leaving the channel. The current implementation closes the chat if an agent leaves (`memberLeft` event), which needs to be changed for agent transfer scenario.

#### Conversation topic
Current implementation sends `message_to_human_agent` attribute from the dialog as the first message to the agent when the conversation starts. However, you do have access to several other attributes within the `connectMessage` object that is available in the *startChat()* function. You can also find this in our public API; Look for `topic` under `connect_to_agent` [response type](https://cloud.ibm.com/apidocs/assistant/assistant-v2#message).

#### Agent name and avatar
The agent name is implemented and available in the current implementation. The webchat does provide a method to display agent avatar/picture, but it is not implemented for Twilio Flex.

#### Typing indicator
Agent typing indicator is implemented. Webchat does not yet support user typing.

#### Read Receipts
There's a crude implementation to set read receipts, but you would have to change it taking [consumption-horizon]( https://www.twilio.com/docs/chat/consumption-horizon) into consideration.

#### Agent availability
Not implemented. Please get in touch with us, if you find a Twilio API to support this feature.

#### Routing
Not Implemented. This example implementation does not take an opinion on how you should implement your contact center routing on twilio. The following documentation has information on how the routing is supported in flex and you should change the code necessary to implement the routing.

* [https://www.twilio.com/docs/flex/developer/routing](https://www.twilio.com/docs/flex/developer/routing)
* [https://www.twilio.com/docs/flex/quickstart/flex-routing-skills](https://www.twilio.com/docs/flex/developer/routing)

