# ServiceDesk API

## Web Chat to Service Desk communication

To be implemented by the developer. Implementation template can be found in [../src/serviceDesks/serviceDeskTemplate.ts](../src/serviceDesks/serviceDeskTemplate.ts).

### startChat

```ts
async startChat(connectMessage: MessageResponse): Promise<void>
```

Opens the chat with the service desk and performs any necessary setup steps.

**Parameters:**

- `connectMessage: MessageResponse`: Provided by the web chat and containing the `connect_to_agent` response as defined in the Watson Assistant tooling.

**Returns:**

- `Promise<void>`: A Promise that resolves when the service desk has successfully started a new chat. This does not necessarily mean that an agent has joined the conversation or read any messages sent by the user.

### endChat

```ts
async endChat() : Promise<void>
```

Instructs the service desk to terminate the chat. Called when the end user ends the chat.

**Returns:**

- `Promise<void>`: A Promise that resolves when the service desk has successfully handled the call and ended the chat.

### sendMessageToAgent

```ts
async sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void>
```

Sends a message to the agent in the service desk.

**Parameters:**

- `message: MessageRequest`: The message from the user.
- `messageID: string`: The unique ID of the message assigned by the web chat widget.

**Returns:**

- `Promise<void>`: A Promise that resolves when the service desk has successfully handled the call (the message has been sent without error).

### updateState

```ts
updateState(state: ServiceDeskStateFromWAC): void
```

Informs the service desk of a change in the state of the web chat that is relevant to the service desks. These values may change at any time.

**Parameters:**

- `state: ServiceDeskStateFromWAC`: The current values of pieces of state from the main chat.

### userTyping (not currently implemented)

```ts
async userTyping(isTyping: boolean): Promise<void>
```

Indicates to the service desk that the user has started or stopped typing. This functionality is not currently implemented in the web chat widget.

**Parameters:**

- `isTyping : boolean`: Indicates whether the user is typing.

**Returns:**

- `Promise<void>`: A Promise that resolves when the service desk has successfully handled the call.

### userReadMessages [not currently implemented]

```ts
async userReadMessages(): Promise<void>
```

Informs the service desk that the user has read all the messages that have been sent by the service desk. This functionality is not currently implemented in the web chat widget.

**Returns:**

- `Promise<void>`: A Promise that resolves when the service desk has successfully handled the call.

### areAnyAgentsOnline

```ts
async areAnyAgentsOnline(connectMessage: MessageResponse): Promise<boolean | null>
```

Checks to determine whether any agents are online and ready to communicate with the user.

**Parameters:**

- `connectMessage: MessageResponse`: The message that contains the `transfer_info` object that can be used by the service desk to perform a more specific check.

**Returns:**

- `Promise<boolean | null>`: Whether agents are available. This can also return `null`, which means that availability of agents is unknown or that the service desk does not provide this information.

## Service Desk to Web Chat communication

Provided to the developer as callbacks. Type definitions can be found in [../src/types/serviceDeskCallback.ts](../src/types/serviceDeskCallback.ts). These callbacks are used within a `ServiceDesk` implementation by calling `this.callback.<callback-name>()`.

### updateAgentAvailability

```ts
updateAgentAvailability(availability: AgentAvailability): void
```

Sends updated availability information to the chat widget for a user who is waiting to be connected to an agent. This function can be called at any point during the wait in order to provide newer information.

**Parameters:**

- `availability: AgentAvailability`: The availability information to display to the user. This can be an empty object; if it is, the web chat provides a generic message indicating that the user will be connected to a live agent as soon as possible. See [../src/types/serviceDeskCallback.ts](../src/types/serviceDeskCallback.ts) for `AgentAvailability` type definition.

### agentJoined

```ts
agentJoined(profile: AgentProfile): void
```

Informs the chat widget that an agent has joined the chat.

**Parameters:**

- `profile: AgentProfile`: The metadata about the agent. See [../src/types/profiles.ts](../src/types/profiles.ts) for `AgentProfile` type definition.

### agentReadMessages

```ts
agentReadMessages(): void
```

Informs the chat widget that the agent has read all the messages that have been sent to the service desk.

### agentTyping

```ts
agentTyping(isTyping: boolean): void
```

Indicates whether the agent has started or stopped typing.

**Parameters:**

- `isTyping: boolean`: `True` indicates that the agent is typing (a typing indicator is shown in the web chat widget). `False` indicates the agent has stopped typing (any typing indicator in the web chat widget, it is removed).

### sendMessageToUser

```ts
sendMessageToUser(message: MessageResponse, agentID: string): void
```

Sends a message from the agent to the chat widget.

**Parameters:**

- `message: MessageResponse`: The message to display to the user.
- `agentID: string`: The ID of the agent who is sending the message.

### beginTransferToAnotherAgent

```ts
beginTransferToAnotherAgent(profile?: AgentProfile): void
```

Informs the chat widget that a transfer to another agent is in progress. The service desk should inform the widget when the transfer is complete by sending an `agentJoined()` message later.

**Parameters:**

- `profile?: AgentProfile`: Optional. If this is provided, the message displayed to the user includes information about the agent to whom they are being transferred.

### agentLeftChat

```ts
agentLeftChat(): void
```

Informs the chat widget that the agent has left the conversation. This does not end the conversation, but the user receives a status message informing them that the agent has left the chat. If the user sends another message, it is up to the service desk to decide what to do with it.

### agentEndedChat

```ts
agentEndedChat(): void
```

Informs the chat widget that the agent has ended the conversation.

### setErrorStatus

```ts
setErrorStatus(errorInfo: ServiceDeskErrorInfo): void
```

Sends an error message to the user and sets the state of the given error type.

**Parameters:**

- `errorInfo: ServiceDeskErrorInfo`: Details for the error whose state is being set. See [../src/types/errors.ts](../src/types/errors.ts) for `ServiceDeskErrorInfo` type definition.
