# Embedded chat history widget

The embedded agent application allows your live agents to view a chat history of the end user's conversation with Watson Assistant to better understand their needs.

## How it works

Starting with web chat 4.5.0, as part of the [startChat](./API.md#startChat) method, a second parameter is passed to the startChat method. This `startChatOptions` parameter is an object with options and metadata about the chat. See [the StartChatOptions type](../src/types/serviceDesk.ts) for more information.

Located at `startChatOptions.agentAppInfo.sessionHistoryKey` is a string that contains everything web chat needs to securely open a read-only mode of the web chat with a transcript of the end user and Watson Assistant visible. The vast majority of service desks have a way to pass meta information to the agents view and either embed an iFrame or embed HTML and JavaScript. It is up to you to determine how to pass the `sessionHistoryKey` to either the IBM provided iFrame or JavaScript.

## Viewing agent application via iFrame

Some service desks allow you to add an iFrame to the agent page via a server side template language. If that mechanism also allows you to access the `sessionHistoryKey` you can simply embed an iFrame that will render the history of the conversation:

```
<iframe
  src="https://web-chat.global.assistant.watson.appdomain.cloud/loadAgentAppFrame.html?session_history_key=INSERT_KEY_HERE"
  style="width: 380px; height:380px;"
/>
```

The read-only web chat will grow to the size of the iFrame (in this case, 380px X 380px).

## Viewing agent application via HTML/JavaScript

Alternatively, you can load in a JavaScript file that you can feed the `sessionHistoryKey` to.

```
<div id="agent-app-host" style="width: 380px; height: 380px;"></div>
<script src="https://web-chat.global.assistant.watson.appdomain.cloud/loadAgentAppFrame.js" />
<script>
  loadAgentApp(sessionHistoryKey, document.querySelector('#agent-app-host'));
</script>
```

The `loadAgentApp` method takes two arguments. First, the `sessionHistoryKey`. The second argument is a DOM element for the read-only web chat to render to. The web chat will grow to the size of the element and the element should be given a height and width for the web chat to grow to.
