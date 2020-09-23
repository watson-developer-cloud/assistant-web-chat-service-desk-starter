# Steps for implementing a service desk integration - Genesys specific

****Keep the following things in mind as you work through these steps:**

- **Typing**. Make a new file in `src/types`, and try to build type interfaces for input from the service desk as you go.

- **Error handling**. As a general rule, implementing generic error handling as you go will make it easier to build out a more robust error handling flow later on.

1. Fork the repository. Run `npm run dev` to ensure that the example (default) setup is working properly.

2. Take the appropriate setup steps in the service desk client (setting up a web chat deployment or similar)

    - For Genesys, create a [web chat widget](https://help.mypurecloud.com/articles/create-a-widget-for-web-chat/), and [find your organization ID](https://help.mypurecloud.com/faq/how-do-i-find-my-organization-id/)

3. Copy [serviceDeskTemplate.ts](../src/serviceDesks/serviceDeskTemplate.ts) and give it a new, descriptive name. Then modify [buildEntry.ts](../src/buildEntry.ts) so that it's importing and building from your new file (instead of [exampleServiceDesk.ts](../src/serviceDesks/exampleServiceDesk.ts)).

These Genesys docs and resources will help in implementing the core chat features in the following steps:

- [Guest Chat Client - JavaScript](https://developer.mypurecloud.com/api/rest/client-libraries/javascript-guest/index.html)
- [Guest Chat APIs](https://developer.mypurecloud.com/api/webchat/guestchat.html)
- [Guest Chat Client API documentation](https://developer.mypurecloud.com/api/rest/client-libraries/javascript-guest/WebChatApi.html)
- [Guest Chat Client API source code](https://github.com/MyPureCloud/purecloud-guest-chat-client-javascript/blob/9599e33609a87358671532b10e53fad24e592373/build/src/purecloud-guest-chat-client/api/WebChatApi.js)

4. Implement `startChat` to establish a connection with the service desk. This function might involve a number of steps to establish the chat environment, such as:

    - Importing / requiring your service desk's API client (you may be able to do this outside of startChat() if you don't need the client loaded in the browser).

    - Opening a chat channel

    - Connecting an end user to the service desk

    - Implementing handling of incoming messages from the service desk (just setting up the control flow for different message types, without actually handling them, is sufficient at this stage).

    Abstraction is useful here; don't be afraid to add functions that go beyond the `ServiceDesk` interface functionality.

5. Implement connecting to a human agent in `this.callback.agentJoined`.

6. Implement `sendMessageToAgent`. Once `startChat` is working properly, this step should be fairly straightforward.

7. Implement receiving messages from the service desk. Depending on your service desk platform, this might encompass several different message types. Start with chat text messages from the human agent to the end user using `this.callback.sendMessageToUser`

8. Implement the functions for ending the chat.

    - For an end user ending the chat, implement `endChat`

    - For a human agent ending the chat, implement `this.callback.agentEndedChat`. The appropriate place to call this function depends on the particular service desk platform being used.

9. Implement the logic supporting agent transfer in the following functions:

    - `this.callback.beginTransferToAnotherAgent` to initiate a transfer

    - `this.callback.agentLeftChat` for the first agent leaving the chat

    - `this.callback.agentJoined` (again) for the new agent joining

    Be sure to consider the difference in behavior between when the first agent joins at the beginning of the chat and when an agent transfer occurs. Both situations use `this.callback.agentJoined`, but differentiating between the two cases is important.

10. Implement the ["nice-to-haves"](#optional-functionality-checklist):

    - **Updating the web chat state**

        - If your service desk requires the current `sessionID`, `userID`, or `locale` at any time, you need to implement `updateState` and invoke it in `startChat` at minimum.
            - For Genesys, this is required in order to supply the service desk with a value for `displayName`.

    - **Typing indicators**, to the extent your service desk supports them:
        - Human agent typing: `this.callback.agentTyping`
        - End user typing: `userTyping`

    - **Read receipts**:

        - If your service desk supports reception and posting of read receipts from the end user, you can implement `userReadMessages`.

        - If your service desk supports sending read receipts from the human agent, you can implement `this.callback.agentReadMessages`.

        **Note:** Currently, the web chat does not support sending read receipts to the service desk. (This support might be added in a later version.)

    - **Agent nickname and avatar**. If you can get these from your service desk, you can provide them as properties of the `AgentProfile` that you pass to `this.callback.AgentJoined`:

        - `AgentProfile.nickname`
        - `AgentProfile.profile_picture_url`

11. Implement error handling, including recognizing errors from the service desk to the extent your service desk API allows. Use `this.callback.setErrorStatus` to post error information in the web chat and in the console.

12. Implement user authentication. Provide a means to authenticate the web chat to the service desk. Note that this cannot be done securely in the browser. Instead, use a secure middleware server to do the following:

    - Store authentication credentials
    - Make authenticated calls to your service desk API
    - Return the required user authentication information (such as a token)

    Implementation of this step will vary significantly, depending on how your service desk provider handles authentication, its API, and how you'll choose to handle authentication for your middleware server.
        - For Genesys, you'll need to:
            - [Set up an OAuth client](https://help.mypurecloud.com/articles/create-an-oauth-client/) that uses a client credentials grant
            - [Make a request to that OAuth client](https://developer.mypurecloud.com/api/rest/authorization/use-client-credentials.html) for an access token (see [here](https://developer.mypurecloud.com/api/tutorials/oauth-client-credentials/?language=nodejs&step=1) for a tutorial)

    - A simple (insecure) implementation of this for Genesys is shown [here](https://github.ibm.com/Ryan-Glassman/genesys-purecloud/tree/master/example-server). Further documentation on authenticated chat flow for Genesys can be found [here](https://developer.mypurecloud.com/api/webchat/authenticated-chat.html).

    After you have implemented authentication, change your chat implementation in the service desk tooling (for Genesys, this change will need to be made in the web chat widget) to require authentication. Then test to make sure that establishing a chat succeeds only if the user is properly authenticated.

13. If possible, provide more information about agent availability and wait status. If your service desk provides information about the user's place in the queue, agent availability, or wait time:

    - Implement `areAnyAgentsOnline` in order to check for agent availability.

    - Provide availability information to the end user using `this.callback.updateAgentAvailability`.

    Make sure your error-handling flow includes cases in which it is not possible to connect the end user to an agent (for example, if no agents are available).

    - For Genesys, these links will be helpful for querying the queue for information:
        - [Get Number of On-Queue Agents using Genesys Cloud SDK](https://developer.mypurecloud.com/api/tutorials/number-of-agent-in-queue/?language=python&step=1)
        - [Queue query](https://developer.mypurecloud.com/api/rest/v2/analytics/queue.html)

## Core Functionality Checklist

The following functions must be implemented in your service desk:

- [ ] Starting a chat
- [ ] End user ending chat
- [ ] Human agent ending chat
- [ ] Sending messages
- [ ] Receiving messages (this implementation depends on the service desk platform being used; consult your service desk's API)
  - [ ] Posting messages from human agent to web chat
  - [ ] Properly handling messages for control flow, to the extent your service desk API uses them
- [ ] Agent transfer
- [ ] Robust error handling

## Optional Functionality Checklist

The following functions are considered "nice-to-haves":

- [ ] Updating the web chat state
- [ ] Agent nickname and avatar
- [ ] Typing indicators (in both directions)
- [ ] Read receipts (from end user to human agent)
- [ ] Complete info on agent availability (this should be implemented to the extent your service desk API allows)
- [ ] User authentication (the necessity of this will depend on the client)
