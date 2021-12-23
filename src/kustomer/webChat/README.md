# Kustomer Integration Example

This is a functioning service desk integration between Watson Assistant and Kustomer. 

**Important:**  This is a reference implementation that provides an example of a fully functional integration. Make any necessary changes and perform robust testing before deploying this integration in production.

This reference implementation supports the core features of a Kustomer integration. If you want to customize or extend it to add more features, follow the procedure described in the [README](../../../README.md) for this repository.

## Overview

This integration is based on the functionality of Kustomer Chat Core SDK, which allows client side to communicate with Kustomer Chat Platform. 

The following Kustomer resources provide some useful guides on Kustomer custom chat implementation:
  - [Build your own UI](https://developer.kustomer.com/chat-sdk/v2.0-Web/docs/build-your-own-ui)

  - [Core API Reference](https://developer.kustomer.com/chat-sdk/v2.0-Web/docs/core-api-reference)

  - [Authenticate chat](https://developer.kustomer.com/chat-sdk/v2.0-Web/docs/authenticate-chat-with-jwt-token)

  - [Chat Management: Settings](https://kustomer.kustomer.help/en_us/chat-settings-B1sdKbtz7) 

## Setting up

1. If you haven't done so already, follow the setup steps in the root-level [README](../../../README.md#development) to make sure you can run an instance of [ExampleServiceDesk](../../example/webChat/README.md).

2. Update [kustomerServiceDesk.ts](./client/src/kustomerServiceDesk.ts) if you will be incorporating JWT token authentication or only describing your customer

3. Create and install a private app in your Kustomer instance using the [`exampleApp.json`](./client/exampleApp.json) as a template. Go [here](https://developer.kustomer.com/kustomer-apps-platform/docs/creating-an-app) to learn more about app development. 

4. Edit the index.html in the top directory to include the follow script

```
<script src="https://cdn.kustomerapp.com/chat-web/core.js" data-kustomer-api-key="YOUR_KUSTOMER_API_KEY"></script>

```

5. Go to the client directory in [src/kustomer/webChat/client](./client).

6. From the client directory [src/kustomer/webChat/client](./client) run:
    - `npm i`
    - `npm run dev`


You should now be able to start a web chat session in a browser, and within the web chat, escalate to an agent to trigger the Kustomer integration. For more information about how to start a web chat session using this integration, see the starter kit [README](../../../README.md#development).

## Supported features

- **Start chat with an agent:** The `startChat()` function in [`kustomerServiceDesk.ts`](./client/src/kustomerServiceDesk.ts) triggers the integration with Kustomer by creating a chat session.

- **End chat:** The chat can be ended by either the user or the agent. This happens when either party leaves or closes the chat session.

- **User authentication:** By providing a JWT token, user's can have their conversation be authenticated

