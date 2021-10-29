# Steps for implementing a service desk integration

This document outlines a suggested sequence of steps for building a service desk integration using this repository. It is intended as a guide, and you can follow it to whatever extent you choose. At the end of this document are checklists for [core functionality](#core-functionality-checklist) and [optional functionality](#optional-functionality-checklist).

**Note:** Prebuilt reference implementations are available that implement the core features of integrations for [Genesys Cloud](../src/genesys/webChat/server) and [Twilio Flex](../src/flex/webChat/server). You can use this process described in this document if you want to further customize or extend these reference implementations to include additional features.

Keep the following things in mind as you work through these steps:

- **Typing**. Make a new file in `src/types`, and build type interfaces for input from the service desk as you go.

- **Error Handling**. As a general rule, implementing generic error handling as you go makes it easier to build a robust error-handling flow later on.

## Steps

1. Fork this repository. 

1. Take the appropriate setup steps in the service desk client. Your service desk should have a JavaScript client, and you will need to follow the setup instructions related to that client to get started.

    For example, Genesys Cloud requires that you create a [web chat widget](https://help.mypurecloud.com/articles/create-a-widget-for-web-chat/) and [find your organization ID](https://help.mypurecloud.com/faq/how-do-i-find-my-organization-id/).

1. Copy the [src/example](../src/example/) directory and give it a new descriptive name.

1. Modify [buildEntry.ts](../src/example/webChat/client/src/buildEntry.ts) in your copied directory to match the name for your new class.

1. Run `npm install`. Then run `npm run dev` to start get development environment running.

1. Implement `startChat()` to establish a connection with the service desk. This function might involve a number of steps to establish the chat environment, such as:

    - Importing or requiring your service desk's API client (you might be able to do this outside of `startChat()` if you don't need the client loaded in the browser).

    - Opening a chat channel.

    - Connecting an end user to the service desk.

    - Implementing handling of incoming messages from the service desk (at this stage, it is sufficient to just set up the control flow for different message types, without actually handling them).

    Abstraction is useful here; don't be afraid to add functions that go beyond the `ServiceDesk` interface.

1. Implement connecting to a human agent in `this.callback.agentJoined()`.

1. Implement `sendMessageToAgent()`. Once `startChat()` is working properly, this step should be fairly straightforward.

1. Implement receiving messages from the service desk. Depending on your service desk platform, this might encompass several different message types. Start with chat text messages from the human agent to the end user using `this.callback.sendMessageToUser()`.

1. Implement the functions for ending the chat:

    - For an end user ending the chat, implement `endChat()`.

    - For a human agent ending the chat, implement `this.callback.agentEndedChat()`. The appropriate place to call this function depends on the particular service desk platform being used.

1. Implement the logic supporting agent transfer in the following functions:

    - `this.callback.beginTransferToAnotherAgent()` to initiate a transfer

    - `this.callback.agentLeftChat()` for the first agent leaving the chat

    - `this.callback.agentJoined()` (again) for the new agent joining

    Be sure to consider the difference in behavior between when the first agent joins at the beginning of the chat and when an agent transfer occurs. Both situations use `this.callback.agentJoined()`, but differentiating between the two cases is important.

1. Implement any [optional features](#optional-functionality-checklist) needed for your integration:

    - **Updating the web chat state**

        - If your service desk requires the current `sessionID`, `userID`, or `locale` at any time, implement `updateState()` and invoke it in `startChat()`.

            **Note:** For a Genesys Cloud integration, this is required in order to provide the service desk with a value for `displayName`. The Genesys Cloud [reference implementation](../src/genesys/webChat/server/README.md) implements this functionality.

    - **Typing indicators**, to the extent your service desk supports them:
        - Human agent typing: `this.callback.agentTyping()`
        - End user typing: `userTyping()`

    - **Read receipts**:

        - If your service desk supports reception and posting of read receipts from the end user, you can implement `userReadMessages()`.

        - If your service desk supports sending read receipts from the human agent, you can implement `this.callback.agentReadMessages()`.

        **Note:** Currently, the web chat does not support sending read receipts to the service desk. (This support might be added in a later version.)

    - **Agent nickname and avatar**. If you can retrieve these values from your service desk, you can provide them as properties of the `AgentProfile` that you pass to `this.callback.AgentJoined()`:

        - `AgentProfile.nickname`
        - `AgentProfile.profile_picture_url`

1. Implement error handling, including recognizing errors from the service desk to the extent your service desk API allows. Use `this.callback.setErrorStatus()` to post error information in the web chat and in the console.

1. Implement user authentication. Provide a means to authenticate the web chat to the service desk. Note that this cannot be done securely in the browser. Instead, use a secure middleware server to do the following:

    - Store authentication credentials
    - Make authenticated calls to your service desk API
    - Return the required user authentication information (such as a token)

    Implementation of this step will vary significantly depending on your service desk provider's API, how it handles authentication, and how you choose to handle authentication for your middleware server.

      For example, a Genesys Cloud integration requires that you [set up an OAuth client](https://help.mypurecloud.com/articles/create-an-oauth-client/) that uses a client credentials grant. You can then make a request to the OAuth client using the Genesys PureCloud [REST API](https://developer.mypurecloud.com/api/rest/authorization/use-client-credentials.html) for an access token. (For more information, see [the Genesys PureCloud tutorial](https://developer.mypurecloud.com/api/tutorials/oauth-client-credentials/?language=nodejs&step=1).) See the Genesys Cloud [reference implementation](../src/genesys/webChat/server/README.md) for a simple example.

      For more information about authenticated chat flow for Genesys Cloud, see the [Genesys PureCloud API documentation](https://developer.mypurecloud.com/api/webchat/authenticated-chat.html).

      After you have implemented authentication, change your chat implementation in the service desk tooling (for example, the web chat widget in Genesys) to require authentication. Then test to make sure that establishing a chat succeeds only if the user is properly authenticated.

1. If possible, provide more information about agent availability and wait status. If your service desk provides information about the user's place in the queue, agent availability, or wait time:

    - Implement `areAnyAgentsOnline()` in order to check for agent availability.

    - Provide availability information to the end user using `this.callback.updateAgentAvailability()`.

    Make sure your error-handling flow includes cases in which it is not possible to connect the end user to an agent (for example, if no agents are available).

      For example, a Genesys Cloud integration would use the PureCloud REST API to submit a [queue query](https://developer.mypurecloud.com/api/rest/v2/analytics/queue.html). (For more information, see the Genesys Cloud [tutorial](https://developer.mypurecloud.com/api/tutorials/number-of-agent-in-queue/?language=python&step=1).

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
