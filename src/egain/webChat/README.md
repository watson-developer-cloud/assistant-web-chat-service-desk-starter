# eGain ServiceDesk Integration Example

This documentation provides the steps to setup an integration between Watson Assistant and eGain's Advisor Desktop.

**Important:** This is a reference implementation that provides an example of a fully functional integration. Make any necessary changes and perform robust testing before deploying this integration in production.

This reference implementation supports the core features of an eGain integration. If you want to customize or extend it to add more features, follow the procedure described in the [README](../../../README.md) for this repository.

## Overview

The integration example consists of client-side code that runs in the user's browser and manages the communication between the user and agent. This is an integration of eGain Conversation Hub with service desk API that is fully supported by the Watson Assistant web chat integration. (For more information about this API, see [ServiceDesk API](https://github.com/watson-developer-cloud/assistant-web-chat-service-desk-starter/blob/main/docs/API.md)).

## Prerequisites

1. Configure your eGain Conversation Hub tenant using the steps listed under the section Bring-Your-Own-Channel with eGain Virtual Assistant steps and using this postman script BYOC with eGain VA Conversation API Setup.postman_collection.json from [here](https://ebrain.egain.com/kb/devcentral/content/EASY-8283/Bring-Your-Own-Channel).

2. To configure Conversation Hub, the following credentials are required:
    - Tenant clientId and clientSecret
    - Customer client app authentication credentials (username and password)
    - Customer client app callback URL
    Please contact your eGain customer representative to receive the above mentioned credentials.

3. Once the Conversation Hub is configured, to run this implementation the following credentials are required
    - Customer client app clientId and clientSecret - Obtained from Step 2
    - Channel type, account address and entrypoint Id - Obtained from Step 2
    - Initalizer, Registration and Websocket URL - Provided by eGain customer representative

## Required setup

1. If you haven't done so already, follow the setup steps in the root-level [README](../../../README.md#development) to make sure you can run an instance of [ExampleServiceDesk](../../example/webChat/README.md).

2. Register your webchat integration with eGain, by sending the information gathered from the previous step. The IBMIntegrationId is the id of the watson assistant you have configured through IBM's console.

    - Send an HTTP POST request to the `Registration URL` with the payload format shown below:

      ```
      {
          "IBMIntegrationId": "XXXXXX",
          "clientId": "XXXXXX",
          "clientSecret": "XXXXXX",
          "channelType": "XXXXXX",
          "accountAddress": "XXXXXX"
      }
      ```

3. In the file `src/egain/webChat/client/eGainTypes.ts`, add the intializer URL to `INTIALIZE` and the websocket URL to `WEBSOCKET` fields. Update the`AGENT_AVAILABILITY` field with the domain name and the entrypoint id.

## Try it out

To start up the client locally in `localhost`, follow these steps:

1. Go to the client directory in [src/egain/webChat/client](./client).

1. From the client directory [src/egain/webChat/client](./client) run:
    - `npm install` to install the dependencies.
    - `npm run dev` to get a development environment running in your browser on port `9000`.

You should now be able to start a web chat session in a browser, and within the web chat, escalate to an agent to trigger the eGain Service Desk integration. For more information about how to start a web chat session using this integration, see the starter kit [README](../../../README.md#development).

## Hosting

To host this integration, choose any of the steps mentioned [here](../../../README.md#custom-integrations-between-web-chat-and-service-desks)

## Supported features

**Start chat with an agent:** The `startChat()` function in [`eGainServiceDesk.ts`](./client/src/eGainServiceDesk.ts) triggers the integration with eGain's Advisor Desktop by creating a chat session.

**End chat:** The chat can be ended by either the user or the agent. This happens when either party leaves or closes the chat session, and when the user refreshes the browser.

**Message exchange:** Both the user and the agent can exchange text messages.

**Typing indicator:** Support for agent typing is implemented.

**Agent availability:** Agent availability has been implemented.
