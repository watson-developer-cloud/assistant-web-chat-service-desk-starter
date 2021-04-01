# Adoption Guide
This guide is meant to provide more context to the existing documentation on our APIs and architecture, as well as provide concrete examples of how BYOSD has worked with other service desks.

To successfully create a BYOSD integration with an existing service desk, developers will need to implement the functions listed in our [API documention](./docs/API.md), following these [developer guidelines](./docs/STEPS.md). In order to be able to implement these APIs, however, the developer will need access to certain exposed API endpoints of the service desk application, so that information can be communicated between the WA chat widget and the service desk application.

**Core "must have" Functionality:** startChat, endChat, sendMessageToAgent

**Additional "nice to have" Functionality:** updateState, areAnyAgentsOnline, userTyping, userReadMessages

**Note:** The specific parameters of the APIs are up to the service desk application to decide - as you will see in the example implementations from Genesys and Twilio Flex, their API structure, parameters, and return values vary depending on their internal code structure. At the end of the day, as long as the essential information is retrievable, how you expose these APIs is completely up to you.

## API Context
### startChat
Called upon escalation to execute whatever necessary steps exist to create a conversation with an agent in the service desk.
- Need: Endpoint(s) that will configure/begin a chat session with an agent. If your service allows user authentication as well, we will need endpoints that enable this. For instance, if your service desk uses a special kind of authentication token that is generated based on certain keys or IDs, we will need an endpoint/guide on how to generate those tokens, and will also need be able to set/send those tokens back to the service desk.
- Examples:
   * Genesys: [postWebchatGuestConversations(...)](https://developer.mypurecloud.com/api/rest/client-libraries/javascript-guest/WebChatApi.html#createwebchatconversationresponse_postwebchatguestconversations_body_), [ApiClient.instance.setJwt(...)](https://developer.mypurecloud.com/api/rest/client-libraries/javascript/#authentication)
   * Twilio: [create(...)](https://www.twilio.com/docs/flex/developer/messaging/api/chat-channel?code-sample=code-create-channel&code-language=Java&code-sdk-version=8.x), [getChannelByUniqueName(...)](./src/serviceDesks/twilio/twilioFlex.ts#L64), [ChatGrant(...)](./src/middleware/flex/src/routes/auth.ts#L60), [AccessToken(...)](./src/middleware/flex/src/routes/auth.ts#L67)

### endChat
Called when the user clicks "End live chat" in the widget to end the conversation with the agent.
- Need: Endpoint that will stop a conversation with an agent.
- Examples:
   * Genesys: [deleteWebchatGuestConversationMember(...)](https://developer.mypurecloud.com/api/rest/client-libraries/javascript-guest/WebChatApi.html#deleteWebchatGuestConversationMember)
   * Twilio: [leave(...)](./src/serviceDesks/twilio/twilioFlex.ts#L176)

### sendMessageToAgent
Used to relay user messages from WA chat to service desk, within a chat session with a live agent.
- Need: Endpoint for sending a message to the service desk conversation that was opened through startChat.
- Examples:
   * Genesys: [postWebchatGuestConversationMemberMessages(...)](https://developer.mypurecloud.com/api/rest/client-libraries/javascript-guest/WebChatApi.html#webchatmessage_postwebchatguestconversationmembermessages_conversationid__memberid__body_)
   * Twilio: [sendMessage(...)](./src/serviceDesks/twilio/twilioFlex.ts#L195)

### updateState (optional)
Called to update information on the state of the service desk. Specifically, the sessionID, userID, and locale define the state. Depending on your implementation, you may wish to receive updates on changes in sessionId (for example, due to a session timeout from the user being idle). If so, we need an endpoint that will allow us to notify the service desk of these updates. 
- Need: Endpoint that allows WA web chat to notify the service desk of changes in the state.

### areAnyAgentsOnline (optional)
Called to check agent availability when a user requests escalation to an agent, so that WA can render the appropriate response.
- Need: Endpoint that returns some sort of agent availability information. This could be a simple true/false, total number of agents available, list of agents available, etc.

### ~~userTyping (optional)~~
Called when its known that the user is typing. _This is currently not implemented in our web chat widget, but may become available in the future._
- Need: Endpoint that allows WA web chat to notify the service desk that the user is currently typing.

### ~~userReadMessages (optional)~~
Called when user has read the agent message. _This is currently not implemented in our web chat widget, but may become available in the future._
- Need: Endpoint that allows WA web chat to notify the service desk that the user has read all agent messages.

## Service Desk to Web Chat Communication
Lastly, we also need to be able to listen to events from the service desk, so that the WA chat widget can respond (all our available callback functions are listed and described [here](./docs/API.md#service-desk-to-web-chat-communication)). 

For instance, when an "agent is typing" event is posted, then we need to let our widget know to render the typing indicator. When an agent message is received from the service desk, we need to relay the message to the user. Therefore, there needs to be a designated way to continuously receive events from the service desk during a conversation. With [Genesys](./src/serviceDesks/genesys/genesysServiceDesk.ts), this was done via a web socket, and with [Twilio Flex](./src/serviceDesks/twilio/twilioFlex.ts), their API provides a channel on which we can listen to events. We recommend looking at their implementations for clarity.
