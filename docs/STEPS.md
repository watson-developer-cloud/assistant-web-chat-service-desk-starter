# Steps for implementing a service desk integration

This document outlines a suggested sequence of steps for building a service desk integration using this repository. It is intended as a guide, and you can follow it to whatever extent you choose. At the end of this document are checklists for [core functionality](#core-functionality-checklist) and [optional functionality](#optional-functionality-checklist).

Keep the following things in mind as you work through these steps:

- **Typing**. Make a new file in `src/types`, and build type interfaces for input from the service desk as you go.

- **Error Handling**. As a general rule, implementing generic error handling as you go will make it easier to build a more robust error handling flow later on.

## Steps

1. Fork the repository. Run `npm run dev` to ensure that the example (default) setup is working properly.

1. Take appropriate setup steps in the service desk client. Your service desk should have a JavaScript client, and you will need to follow the setup instructions related to that client to get started.

    For example, Genesys PureCloud requires that you create a [web chat widget](https://help.mypurecloud.com/articles/create-a-widget-for-web-chat/) and [find your organization ID](https://help.mypurecloud.com/faq/how-do-i-find-my-organization-id/).

1. Copy [serviceDeskTemplate.ts](../src/serviceDesks/serviceDeskTemplate.ts) and give it a new, descriptive name.

1. Modify [buildEntry.ts](../src/buildEntry.ts) so that it is importing and building from your new file (instead of [exampleServiceDesk.ts](../src/serviceDesks/exampleServiceDesk.ts)).

1. Implement `startChat` to establish a connection with the service desk. This function might involve a number of steps to establish the chat environment, such as:

    - Importing or requiring your service desk's API client (you may be able to do this outside of startChat() if you don't need the client loaded in the browser).

    - Opening a chat channel.

    - Connecting an end user to the service desk.

    - Implementing handling of incoming messages from the service desk (just setting up the control flow for different message types, without actually handling them, is sufficient at this stage).

    Abstraction is useful here; don't be afraid to add functions that go beyond the `ServiceDesk` interface functionality.

1. Implement connecting to a human agent in `this.callback.agentJoined`.

1. Implement `sendMessageToAgent`. Once `startChat` is working properly, this step should be fairly straightforward.

1. Implement receiving messages from the service desk. Depending on your service desk platform, this might encompass several different message types. Start with chat text messages from the human agent to the end user using `this.callback.sendMessageToUser`.

1. Implement the functions for ending the chat:

    - For an end user ending the chat, implement `endChat`.

    - For a human agent ending the chat, implement `this.callback.agentEndedChat`. The appropriate place to call this function depends on the particular service desk platform being used.

1. Implement the logic supporting agent transfer in the following functions:

    - `this.callback.beginTransferToAnotherAgent` to initiate a transfer

    - `this.callback.agentLeftChat` for the first agent leaving the chat

    - `this.callback.agentJoined` (again) for the new agent joining

    Be sure to consider the difference in behavior between when the first agent joins at the beginning of the chat and when an agent transfer occurs. Both situations use `this.callback.agentJoined`, but differentiating between the two cases is important.

1. Implement the ["nice-to-haves"](#optional-functionality-checklist):

    - **Updating the web chat state**

        - If your service desk requires the current `sessionID`, `userID`, or `locale` at any time, you need to implement `updateState` and invoke it in `startChat` at minimum.

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

1. Implement error handling, including recognizing errors from the service desk to the extent your service desk API allows. Use `this.callback.setErrorStatus` to post error information in the web chat and in the console.

1. Implement user authentication. Provide a means to authenticate the web chat to the service desk. Note that this cannot be done securely in the browser. Instead, use a secure middleware server to do the following:

    - Store authentication credentials
    - Make authenticated calls to your service desk API
    - Return the required user authentication information (such as a token)

    Implementation of this step will vary significantly depending on your service desk provider's API, how it handles authentication, and how you choose to handle authentication for your middleware server. A simple (insecure) implementation for Genesys is shown [here](https://github.ibm.com/Ryan-Glassman/genesys-purecloud/tree/master/example-server). Further documentation on authenticated chat flow for Genesys can be found [here](https://developer.mypurecloud.com/api/webchat/authenticated-chat.html).

    After you have implemented authentication, change your chat implementation in the service desk tooling (for example, the web chat widget in Genesys) to require authentication. Then test to make sure that establishing a chat succeeds only if the user is properly authenticated.

1. If possible, provide more information about agent availability and wait status. If your service desk provides information about the user's place in the queue, agent availability, or wait time:

    - Implement `areAnyAgentsOnline` in order to check for agent availability.

    - Provide availability information to the end user using `this.callback.updateAgentAvailability`.

    Make sure your error-handling flow includes cases in which it is not possible to connect the end user to an agent (for example, if no agents are available).

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
