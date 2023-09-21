# Twilio Flex integration example

This is a functioning service desk integration between watsonx Assistant and the Twilio Flex contact center.

**Important:**  This is a reference implementation that provides an example of a fully functional integration. Make any necessary changes and perform robust testing before deploying this integration in production.

## Overview

This integration is based on the concepts described in this [overview](https://www.twilio.com/blog/add-custom-chat-channel-twilio-flex). To deploy this integration, you should be familiar with Twilio Flex and Twilio concepts such as Programmable Chat, Flows, Channels, Studio, and TaskRouter.

The following Twilio resources provide some useful guides on Twilio Flex custom chat implementation:

- [Integrate a Custom Chat Client with Flex](https://www.twilio.com/docs/flex/developer/messaging-orchestration/integrate-custom-chat-client)

- [Building a chat with Twilio, lit-html, Parcel and TypeScript](https://www.twilio.com/blog/2018/05/building-a-chat-with-twilio-lit.html-parcel-and-typescript.html)

- [twilio-flex-custom-webchat GitHub repo](https://github.com/vernig/twilio-flex-custom-webchat)

## Setting up

1. Make sure you have a Twilio Flex instance created, and that you have the necessary privileges for accessing account information.

1. In the `src/flex/webChat/server` directory of this repo, copy `.env-sample` to `.env`.

1. Edit `.env` to add your credentials:

| Config Value  | Description |
| :-------------  |:------------- |
`ACCOUNT_ID` | Your primary Twilio Flex account SID, as shown in the [Twilio console](https://www.twilio.com/console/project/settings).
`AUTH_TOKEN` | Your Auth Token for the Twilio Flex project, as shown in the [Twilio console](https://www.twilio.com/console/project/settings). For more information, see [Auth Tokens and How to Change Them](https://support.twilio.com/hc/en-us/articles/223136027-Auth-Tokens-and-How-to-Change-Them).
`FLEX_FLOW_ID` | The flexFlowSid shown in the bottom right hand corner of the [Developer Setup](https://flex.twilio.com/admin/developers).
`API_KEY` | The API key for accessing the Twilio APIs. Generate an API key using the **Create a new Flex Flow** section of the [Twilio console](https://www.twilio.com/console/project/api-keys).
`API_SECRET` | The secret for the specified API key.
`CHAT_SERVICE_ID` | The Programmable Chat service SID, as shown in the Twilio [Programmable Chat tab](https://www.twilio.com/console/chat/services)

1. Run `npm install` to install the dependencies.

1. Run `npm run dev` to start the middleware server, which authorizes the user with Twilio and helps in setting up the integration. At run time, the watsonx Assistant web chat will call the `/auth` API hosted here for the necessary authentication information.

    **Note:** By default, the local server uses an unsecure `http://` connection. For a production deployment, you must host the server API at a secure public URL using `https://`.

1. To start the client, from another terminal, go to the client directory `src/flex/webChat/client` and run the folowing commands:
    - `npm install`
    - `npm run dev`

You should now be able to start a web chat session in a browser, and within the web chat, escalate to an agent to trigger the Twilio integration. For more information about how to start a web chat session using this integration, see the starter kit [README](../../../README.md#development).

## Supported features

- **Start chat with an agent:** The `startChat()` function in [`twilioFlex.ts`](./client/src/twilioFlex.ts) triggers the integration with Twilio Flex. It calls the local middleware server for authentication information, which you must configure.

- **End chat:** The chat can be ended by either the user or the agent. This happens when either party leaves or closes the Twilio channel that was created when the chat started.

- **Message exchange:** Both the user and the agent can exchange text messages.

- **User authentication:** The Twilio middleware [auth.ts](./src/routes/auth.ts) implements a simple example user authentication by generating a user token. You should update this to accommodate your needs.

- **Agent transfers:** The event listeners set up in [twilioFlex.ts](./client/src/twilioFlex.ts) listen for participants joining and leaving the channel. This example implementation uses the `memberLeft` event to close the chat if an agent leaves; you will need to modify this behavior to support agent transfers.

- **Conversation topic:** The example implementation sends the `message_to_human_agent` attribute from the dialog as the first message to the agent when the conversation starts. However, several other attributes are available within the `connectMessage` object that is passed to the `startChat()` function. For more information, see the documentation for the `topic` property of the `connect_to_agent` response type in the watsonx Assistant [API reference](https://cloud.ibm.com/apidocs/assistant/assistant-v2#message).

- **Agent name and avatar:** The agent name is available in the example implementation. The web chat provides a method to display the agent avatar, but this is not implemented for Twilio Flex.

- **Typing indicator:** The agent typing indicator is implemented in this integration. However, the web chat does not yet support user typing indicators.

- **Read Receipts:** The integration provides basic support for setting read receipts, but to enable this for Twilio Flex, you must modify it to work with Twilio Programmable Chat [Message Consumption Horizon](https://www.twilio.com/docs/chat/consumption-horizon).

- **Agent availability:** Agent availability status is not implemented.

- **Routing:** This example implementation does not implement any support for contact center routing. If you want to implement your own routing support for Twilio Flex, see the following documentation:

  - [Getting Started with TaskRouter](https://www.twilio.com/docs/flex/developer/routing)

  - [Multiple Users and Skills-based Routing](https://www.twilio.com/docs/flex/developer/routing)
