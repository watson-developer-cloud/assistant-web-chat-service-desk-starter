# Kustomer Integration Example

This is a functioning service desk integration between Watson Assistant and Kustomer. 

**Important:**  This is a reference implementation that provides an example of a fully functional integration. Make any necessary changes and perform robust testing before deploying this integration in production.

This reference implementation supports the core features of a Kustomer integration. If you want to customize or extend it to add more features, follow the procedure described in the [README](../../../README.md) for this repository.

## Overview

This integration is based on the functionality of the the Kustomer Core SDK and the Kustomer Chat SDK, which enable a client to communicate with the Kustomer platform.

The following Kustomer resources provide some useful guides on Kustomer custom chat implementation:
  - [Build your own UI](https://developer.kustomer.com/chat-sdk/v2.0-Web/docs/build-your-own-ui)
  - [Core API Reference](https://developer.kustomer.com/chat-sdk/v2.0-Web/docs/core-api-reference)
  - [Authenticate chat](https://developer.kustomer.com/chat-sdk/v2.0-Web/docs/authenticate-chat-with-jwt-token)
  - [Chat Management: Settings](https://kustomer.kustomer.help/en_us/chat-settings-B1sdKbtz7) 

## Required setup

1. If you haven't done so already, follow the setup steps in the root-level [README](../../../README.md#development) to make sure you can run an instance of [ExampleServiceDesk](../../example/webChat/README.md).

1. Within the Kustomer UI, generate a new API key with the role `org.tracking`. Save the generated key.

1. Edit the `index.html` file in the root directory to include the following script:

```javascript
<script src="https://cdn.kustomerapp.com/chat-web/core.js" data-kustomer-api-key="{api_key}"></script>
```
  where `{api_key}` is the API key you generated in the previous step.

1. In the Kustomer UI, create a new attribute on the Conversation klass with the following values:
  - **Display Name**: `Watson Assistant Session History`
  - **Type**: **Single line text**

1. Within the Conversation klass, go to the **Insight Cards** tab.

1. Click **Create Insight Card** and create an Insight Card with the name `Watson Assistant Chat History`. Set the view location to **Insight Panel Card**.

1. Click **View Code** and then click **Convert to Code**. When asked to confirm, type `CONVERT` and then click **I understand, please convert**. Copy and paste the following code:

```javascript
const url ="https://web-chat.global.assistant.watson.appdomain.cloud/loadAgentAppFrame.html?session_history_key=" + _.get(conversation, 'custom.watsonAssistantSessionHistoryStr');
<div>
 <Card src={url} height={380} width={340} context={object.context} />
</div>
```

   Click **Save Changes**.

6. Go to the [`src/kustomer/webChat/client`](./client) client directory.

7. Run the following commands:
  - `npm i`
  - `npm run dev`

You can now start a web chat session in a browser, and within the web chat, escalate to an agent to trigger the Kustomer integration. For more information about how to start a web chat session using this integration, see the starter kit [README](../../../README.md#development).

## Supported features

This example integration supports the following features:

- **Start chat with an agent:** The `startChat()` function in [`kustomerServiceDesk.ts`](./client/src/kustomerServiceDesk.ts) triggers the Kustomer integration by creating a chat session.

- **End chat:** The chat can be ended by either the user or the agent. This happens when either party leaves or closes the chat session.

- **User authentication:** The client can authenticate the conversation by providing a JWT token.
