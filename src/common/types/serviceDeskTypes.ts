/* eslint-disable header/header */
/**
 * (C) Copyright IBM Corp. 2020, 2023.
 *
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 */

// The latest version of this file can be found at
// https://web-chat.global.assistant.watson.cloud.ibm.com/serviceDesks/serviceDeskTypes.ts.

/**
 * This is the public interface for a human agent service desk integration. This is the interface between the chat
 * widget and the implementation of the human agent interface with one of the various supported service desks.
 */
interface ServiceDesk {
  /**
   * Returns a name for this service desk integration. This value should reflect the name of the service desk that is
   * being integrated to. This information will be reported to IBM and may be used to gauge interest in various
   * service desks for the possibility of creating fully supported out-of-the-box implementations.
   *
   * This value is required for custom service desks and may have a maximum of 40 characters.
   */
  getName(): string;

  /**
   * Instructs the service desk to start a new chat. This will be called when a user requests to connect to an agent
   * and web chat initiates the process (typically when the user clicks the button on the "Connect to Agent" card).
   * It will make the appropriate calls to the service desk to start the chat and will make use of the callback to
   * inform web chat when an agent joins or messages are received.
   *
   * This may be called multiple times by web chat. If a user begins a chat with an agent, ends the chat and then
   * begins a new chat with an agent, this function will be called again.
   *
   * If the integration is unable to start a chat (such as if the service desk is down or no agents are available)
   * then this function should throw an error to let web chat know that the chat could not be started.
   *
   * The {@link areAnyAgentsOnline} function is called before this function is called and is called as soon as a
   * "connect_to_agent" message has been received from the assistant. This determines if the "Connect to Agent" card
   * should be displayed to the user or if the "no agents are available" message configured in the skill should be
   * shown instead.
   *
   * @param connectMessage The original server message response that caused the connection to an agent. It will
   * contain specific information to send to the service desk as part of the connection. This can include things
   * like a message to display to a human agent.
   * @param startChatOptions Additional configuration for startChat.
   * @returns Returns a Promise that resolves when the service desk has successfully started a new chat. This does
   * not necessarily mean that an agent has joined the conversation or has read any messages sent by the user.
   */
  startChat(connectMessage: MessageResponse, startChatOptions: StartChatOptions): Promise<void>;

  /**
   * Tells the service desk to terminate the chat.
   *
   * @param info Additional info that may be provided as part of ending the chat.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  endChat(info: EndChatInfo): Promise<void>;

  /**
   * Sends a message to the agent in the service desk. Note that the message text may be empty if the user has
   * selected files to upload and has not chosen to include a message to go along with the files. The text will not
   * be empty if no files are included.
   *
   * @param message The message from the user.
   * @param messageID The unique ID of the message assigned by the widget.
   * @param additionalData Additional data to include in the message to the agent.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  sendMessageToAgent(message: MessageRequest, messageID: string, additionalData: AdditionalDataToAgent): Promise<void>;

  /**
   * Informs the service desk of a change in the state of the web chat that is relevant to the service desks. These
   * values may change at any time.
   */
  updateState?(state: ServiceDeskStateFromWAC): void;

  /**
   * Tells the service desk if a user has started or stopped typing.
   *
   * @param isTyping If true, indicates that the user is typing. False indicates the user has stopped typing.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  userTyping?(isTyping: boolean): Promise<void>;

  /**
   * Checks if any agents are online and can connect to a user when they become available. This does not necessarily
   * mean that an agent is immediately available; when a chat is started, the user may still have to wait for an
   * agent to become available. The callback function {@link ServiceDeskCallback.updateAgentAvailability} is used to
   * give the user more up-to-date information while they are waiting for an agent to become available.
   *
   * @param connectMessage The message that contains the transfer_info object that may be used by the service desk,
   * so it can perform a more specific check.
   * @returns True if some agents are available or false if no agents are available. This may also return null which
   * means the availability status of agents is unknown or the service desk doesn't support this information.
   */
  areAnyAgentsOnline?(connectMessage: MessageResponse): Promise<boolean | null>;

  /**
   * Indicates that the user has selected some files to be uploaded but that the user has not yet chosen to send
   * them to the agent. This method can use this as an opportunity to perform any early validation of the files in
   * order to display an error to the user. It should not actually upload the files at this point. If the user
   * chooses to send the files to the agent, they will be included later when {@link #sendMessageToAgent} is called.
   *
   * This method may be called multiple times before a user sends the files.
   *
   * If there are errors in the files, this method should use {@link ServiceDeskCallback#setFileUploadStatus} to update
   * the status with an error message. The user will not be able to upload any files until any files in error are
   * removed.
   */
  filesSelectedForUpload?(uploads: FileUpload[]): void;

  /**
   * Tells the service desk that the user has requested to stop sharing their screen.
   */
  screenShareStop?(): Promise<void>;
}

/**
 * The parameters that are passed to a service desk factory.
 */
interface ServiceDeskFactoryParameters {
  /**
   * The callback used by the service desk to communicate with the widget.
   */
  callback: ServiceDeskCallback;

  /**
   * The instance of web chat being used. See https://web-chat.global.assistant.watson.cloud.ibm.com/docs.html?to=api-instance-methods
   * for documentation of the possible methods and properties that are available on this object. But use this with care
   * since what exactly is available here can be different depending on the version of web chat that is being used.
   * You can use the getWidgetVersion instance method to determine this. If the service desk needs to rely on features
   * that are not available on all versions of web chat, you can use the widget version to log an error or warning.
   *
   * Since this property was added in version 7.1.0 of web chat, you should make sure to check to see that a value
   * here exists before accessing any methods or properties on it.
   *
   * @since Web chat 7.1.0. This value will be undefined in earlier versions.
   */
  instance: unknown;
}

/**
 * This interface represents the pieces of web chat state that can be provided to the service desks. Any of these
 * bits of state may be updated at any time and the service desks need to be prepared to handle the changes to these
 * values.
 */
interface ServiceDeskStateFromWAC {
  /**
   * The current session ID. This may change at any point if the user's session times out and a new session is created.
   */
  sessionID: string;

  /**
   * The ID of the current user. This can be changed when a user becomes authenticated.
   */
  userID: string;

  /**
   * The current locale.
   */
  locale: string;
}

/**
 * Options for startChat.
 */
interface StartChatOptions {
  agentAppInfo: AgentAppInfo;
}

/**
 * This data is used to configure a read only web chat inside the service desk.
 */
interface AgentAppInfo {
  /**
   * A string that is separated by `::` that can be used to create a PublicConfig. It includes base connect
   * info like integrationID, etc., and by pass JWT security with a one time auth code. The data inside this
   * string can change at any time, and it should be used only to pass data to the agent application.
   */
  sessionHistoryKey: string;
}

/**
 * Additional info that may be provided when a chat is ended.
 */
interface EndChatInfo<TPayloadType = unknown> {
  /**
   * Before a chat is ended, a 'agent:pre:endChat' is fired. The payload value assigned to this event by a listener
   * is provided here.
   */
  preEndChatPayload: TPayloadType;
}

/**
 * This interface represents the operations that a service desk integration can call on web chat when it wants web
 * chat to do something. When a service desk integration instance is created, web chat will provide an
 * implementation of this interface to the integration for it to use.
 */
interface ServiceDeskCallback {
  /**
   * Updates web chat with the capabilities supported by the service desk. Some of these capabilities may support
   * being changed dynamically and can be updated at any time.
   *
   * @param capabilities The set of capabilities to update. Only properties that need to be changed need to be included.
   */
  updateCapabilities(capabilities: Partial<ServiceDeskCapabilities>): void;

  /**
   * Sends updated availability information to the chat widget for a user who is waiting to be connected to an
   * agent (e.g. the user is number 2 in line). This may be called at any point while waiting for the connection to
   * provide newer information.
   *
   * Note: Of the fields in the AgentAvailability object, only one of position_in_queue and estimated_wait_time can be
   * rendered in the widget. If both fields are provided, estimated_wait_time will take priority and the
   * position_in_queue field will be ignored.
   *
   * @param availability The availability information to display to the user.
   */
  updateAgentAvailability(availability: AgentAvailability): void;

  /**
   * Informs the chat widget that an agent has joined the chat.
   */
  agentJoined(profile: AgentProfile): void;

  /**
   * Informs the chat widget that the agent has read all the messages that have been sent to the service desk.
   */
  agentReadMessages(): void;

  /**
   * Tells the chat widget if an agent has started or stopped typing.
   *
   * @param isTyping If true, indicates that the agent is typing. False indicates the agent has stopped typing.
   */
  agentTyping(isTyping: boolean): void;

  /**
   * Sends a message to the chat widget from an agent. To display an error message to user, specify response_type:
   * 'inline_error' in MessageResponse, this also displays an error icon as well as hides the agent's avatar from user.
   *
   * @param message The message to display to the user.
   * @param agentID The ID of the agent who is sending the message.
   * @since 6.7.0 The message parameter may be a simple string in addition to a MessageResponse.
   */
  sendMessageToUser(message: MessageResponse | string, agentID: string): void;

  /**
   * Informs the chat widget that a transfer to another agent is in progress. The agent profile information is
   * optional if the service desk doesn't have the information available. This message simply tells the chat widget
   * that the transfer has started. The service desk should inform the widget when the transfer is complete by
   * sending a {@link agentJoined} message later.
   */
  beginTransferToAnotherAgent(profile?: AgentProfile): void;

  /**
   * Informs the chat widget that the agent has left the conversation. This does not end the conversation itself,
   * rather the only action that occurs is the visitor receives the agent left status message. If the user sends
   * another message, it is up to the service desk to decide what to do with it.
   */
  agentLeftChat(): void;

  /**
   * Informs the chat widget that the agent has ended the conversation.
   */
  agentEndedChat(): Promise<void>;

  /**
   * Sets the state of the given error type.
   *
   * @param errorInfo Details for the error whose state is being set.
   */
  setErrorStatus(errorInfo: ServiceDeskErrorInfo): void;

  /**
   * Updates the status of a file upload. The upload may either be successful or an error may have occurred. The
   * location of a file upload may be in one of two places. The first occurs when the user has selected a file to be
   * uploaded but has not yet sent the file. In this case, the file appears inside the web chat input area. If an
   * error is indicated on the file, the error message will be displayed along with the file and the user must
   * remove the file from the input area before a message can be sent.
   *
   * The second occurs after the user has sent the file and the service desk has begun to upload the file. In this
   * case, the file no longer appears in the input area but appears as a sent message in the message list. If an
   * error occurs during this time, an icon will appear next to the message to indicate an error occurred and an
   * error message will be added to the message list.
   *
   * @param fileID The ID of the file upload to update.
   * @param isError Indicates that the upload has an error or failed to upload.
   * @param errorMessage An error message to display along with a file in error.
   */
  setFileUploadStatus(fileID: string, isError?: boolean, errorMessage?: string): Promise<void>;

  /**
   * Requests that the user share their screen with the agent. This will present a modal dialog to the user who must
   * respond before continuing the conversation. This method returns a Promise that resolves when the user has
   * responded to the request or the request times out.
   *
   * @returns Returns a Promise that will resolve with the state the of the request. This Promise will reject if no
   * chat with an agent is currently running.
   */
  screenShareRequest(): Promise<ScreenShareState>;

  /**
   * Informs web chat that a screen sharing session has ended or been cancelled. This may occur while waiting for a
   * screen sharing request to be accepted or while screen sharing is in progress.
   */
  screenShareEnded(): Promise<void>;
}

/**
 * Information about the current availability of an agent while a user is waiting to be connected. If these are not set
 * the web chat will provide generic messaging letting the user know that a request for an agent has been sent.
 *
 * Note that only one of these fields will be used by web chat if more than one has been assigned a value. Priority
 * first goes to estimated_wait_time, then position_in_queue, and then message.
 */
interface AgentAvailability {
  /**
   * The current position of the user in a queue. E.g. "You are number 2 in line."
   */
  position_in_queue?: number;

  /**
   * The estimated wait time for the user in minutes. E.g. "Current wait time is 2 minutes."
   */
  estimated_wait_time?: number;

  /**
   * A custom message to display to the user containing the updated status. This may contain markdown.
   *
   * @since Web chat 6.7.0. This value will be ignored if used with earlier versions of web chat.
   */
  message?: string;
}

/**
 * Profile information about a specific agent that can be used to display information to the user.
 */
interface AgentProfile {
  /**
   * A unique identifier for this agent.
   */
  id: string;

  /**
   * The visible name for the agent. Can be the full name or just a first name.
   */
  nickname: string;

  /**
   * A url pointing to an avatar for the agent. JPG, GIF, etc. accepted. Minimum size of 64px x 64px.
   */
  profile_picture_url?: string;
}

/**
 * Minimum values of a user profile.
 */
interface User {
  /**
   * A unique identifier for this user.
   */
  id: string;
}

/**
 * Shape of the response from a service desk when passed to web chat.
 */
interface MessageResponse {
  /**
   * Assistant output to be rendered or processed by the client.
   */
  output: MessageOutput;

  /**
   * A unique identifier for this individual message.
   */
  id?: string;

  /**
   * Additional properties.
   *
   * @see https://cloud.ibm.com/apidocs/assistant-v2#message
   */
  [prop: string]: any;
}

/**
 * Shape of the output from the response from a service desk when passed to web chat.
 */
interface MessageOutput {
  /**
   * Responses intended to be processed by a generic channel. Normally, you would show one GenericItem with the
   * response_type set to "text".
   */
  generic: GenericItem[];

  /**
   * Additional properties.
   *
   * @see https://cloud.ibm.com/apidocs/assistant-v2#message
   */
  [prop: string]: any;
}

/**
 * A very basic definition of possible response types.
 */
interface GenericItem {
  /**
   * The type of response returned. This would normally be set to "text".
   */
  response_type: string;

  /**
   * If the response_type is text, insert the text returned here.
   */
  text?: string;

  /**
   * Additional properties.
   *
   * @see https://cloud.ibm.com/apidocs/assistant-v2#message
   */
  [prop: string]: any;
}

/**
 * Shape of the response from web chat to the service desk.
 */
interface MessageRequest {
  /**
   * The input data to the assistant to make in this request.
   */
  input: MessageInput;

  /**
   * Additional properties.
   *
   * @see https://cloud.ibm.com/apidocs/assistant-v2#message
   */
  [prop: string]: any;
}

/**
 * Shape of the input for the response from web chat to the service desk.
 */
interface MessageInput {
  /**
   * The text of the user input. This string cannot contain carriage return, newline, or tab characters.
   */
  text: string;

  /**
   * The source of the user input. Defined by service desks.
   */
  source: User;

  /**
   * Additional properties.
   *
   * @see https://cloud.ibm.com/apidocs/assistant-v2#message
   */
  [prop: string]: any;
}

/**
 * The possible events that may have some form of error status.
 */
enum ErrorType {
  /**
   * This error is meant to be displayed while the user is attempting to connect to a service desk and before an
   * agent has joined. If this error is generated by the service desk, it is expected that the service desk will
   * treat the chat as having ended (or never started).
   */
  CONNECTING = 1,

  /**
   * This is used to indicate the state of errors that can happen any time during a chat where the service desk
   * implementation has lost a connection to the back-end. If this error occurs while the user is waiting for an
   * agent to join, it will be treated as a {@link CONNECTING} error instead.
   */
  DISCONNECTED = 2,
}

/**
 * The type for the information passed to {@link ServiceDeskCallback#setErrorStatus}. It is a discriminating union
 * where the {@link #type} property is the discriminating value that determines which child interface is to be used.
 */
type ServiceDeskErrorInfo = ConnectingErrorInfo | DisconnectedErrorInfo;

/**
 * This is the parent interface for the information passed to {@link ServiceDeskCallback#setErrorStatus}. It is used
 * as a discriminating union where the {@link #type} property is the discriminating value that determines which
 * child interface is to be used.
 */
interface BaseErrorInfo {
  /**
   * An optional value that will be logged to the console as an error.
   */
  logInfo?: unknown;
}

/**
 * This error is meant to be displayed while the user is attempting to connect to a service desk and before an
 * agent has joined. If this error is generated by the service desk, it is expected that the service desk will
 * treat the chat as having ended (or never started).
 */
interface ConnectingErrorInfo extends BaseErrorInfo {
  /**
   * The discriminating value for this type.
   */
  type: ErrorType.CONNECTING;

  /**
   * An optional message that is displayed to the user in the bot view. If this value is not provided, a default
   * message will be shown instead.
   *
   * @since Web chat 6.7.0. This value will be ignored if used with earlier versions of web chat.
   */
  messageToUser?: string;
}

/**
 * This is used to indicate the state of errors that can happen any time during a chat where the service desk
 * implementation has lost a connection to the back-end. If this error occurs while the user is waiting for an
 * agent to join, it will be treated as a {@link CONNECTING} error instead.
 */
interface DisconnectedErrorInfo extends BaseErrorInfo {
  /**
   * The discriminating value for this type.
   */
  type: ErrorType.DISCONNECTED;

  /**
   * Indicates if the service desk has become disconnected. A value of true can be passed that will indicate that a
   * previous disconnection is over and the service desk is now connected again.
   */
  isDisconnected: boolean;
}

interface ConnectToAgentItem extends GenericItem {
  /**
   * A label identifying the topic of the conversation, derived from the user_label property of the relevant node.
   */
  topic?: string;

  /**
   * A message to be sent to the human agent who will be taking over the conversation.
   */
  message_to_human_agent?: string;

  /**
   * Dialog node id that was used to determine the topic.
   */
  dialog_node?: string;

  /**
   * Contains the message to be rendered if escalate to agent is requested and there are agent(s) available.
   */
  agent_available?: {
    message: string;
  };

  /**
   * Contains the message to be rendered if escalate to agent is requested and there are no agents available.
   */
  agent_unavailable?: {
    message: string;
  };

  /**
   * Additional information necessary to transfer agents.
   */
  transfer_info?: TransferInfo;
}

/**
 * Additional information needed during the escalation process.
 */
interface TransferInfo {
  /**
   * A key used by the service desk to securely load the session history, for example in the agent application.
   * It contains multiple values delimited by double colons ('::').
   * It follows the pattern:
   * ${ region }::${ version }::${ authCode }::${ sessionID }::${ integrationID }::${ serviceInstanceID }::${ subscriptionID }
   * Can be deserialized using the SessionHistoryKey.from() function
   */
  session_history_key?: string;

  /**
   * Each service desk may require different information to start the connection. It can be account details or security information.
   * This is a bucket of all the service desk specific properties.
   */
  additional_data?: {
    [k: string]: string;
  };

  /**
   * Some service desk do the routing to the specific agent or group via metadata in the context.
   * Other service desk rely on the service to decide which Agent/Team/Skill should this conversation be escalated to.
   * In those use cases, the service will set the assignee.
   */
  assignee?: any;

  /**
   * Presented to the agent as the first message of a conversation. Its value is determined by a combination of `message_to_human_agent` and `topic`.
   * If `message_to_human_agent` does not exist, the service will replace it with a default message explaining the conversation has been escalated
   * from a virtual assistant.
   */
  summary_message_to_agent?: GenericItem[];

  /**
   * Deprecated. A message to present to the user when an escalation occurred.
   * Initially, the intention was to populate the Web chat Connect to Agent response card with this text.
   */
  message_to_user?: string;

  /**
   * An Escalation can occur due to different reasons. It is expected that the channel will show a different message based on the reason.
   */
  reason?: {
    /**
     * The reason for the escalation.
     */
    type: string;

    /**
     * Deprecated. Intended to be shown in the card when there is a special reason.
     */
    message?: string;
  };

  /**
   * Contains information to route the escalated conversation to the appropriate service desk department or queue.
   */
  target?: {
    [service_desk: string]: {
      [routing_info: string]: any;
    };
  };
}

/**
 * This is a set of additional data that may be included when the user sends a message to an agent.
 */
interface AdditionalDataToAgent {
  /**
   * A set of files that user has selected to upload to an agent. This value may be undefined if there are no files
   * to upload.
   */
  filesToUpload?: FileUpload[];
}

/**
 * An interface that represents a file to upload and it's current upload status.
 */
interface FileUpload {
  /**
   * A unique ID for the file.
   */
  id: string;

  /**
   * The file to upload.
   */
  file: File;

  /**
   * The current upload status.
   */
  status: 'complete' | 'edit' | 'uploading';

  /**
   * Indicates if the file contains an error or failed to upload.
   */
  isError?: boolean;

  /**
   * If the file failed to upload, this is an optional error message to display.
   */
  errorMessage?: string;
}

/**
 * The set of capabilities and parameters that are supported by the service desk.
 */
interface ServiceDeskCapabilities {
  /**
   * Indicates that file uploads may be performed by the user.
   */
  allowFileUploads: boolean;

  /**
   * If file uploads are allowed, this indicates if more than one file may be selected at a time. The default is false.
   */
  allowMultipleFileUploads: boolean;

  /**
   * If file uploads are allowed, this is the set a file types that are allowed. This is filled into the "accept"
   * field for the file input element.
   */
  allowedFileUploadTypes: string;
}

/**
 * The possible state changes for a screen sharing request.
 */
enum ScreenShareState {
  /**
   * Indicates the screen sharing was accepted by the user.
   */
  ACCEPTED = 'accepted',

  /**
   * Indicates the screen sharing was declined by the user.
   */
  DECLINED = 'declined',

  /**
   * Indicates the screen sharing request was cancelled.
   */
  CANCELLED = 'cancelled',

  /**
   * Indicates that screen sharing has ended.
   */
  ENDED = 'ended',
}

export {
  ServiceDesk,
  ServiceDeskFactoryParameters,
  ServiceDeskStateFromWAC,
  StartChatOptions,
  ServiceDeskCapabilities,
  ServiceDeskCallback,
  BaseErrorInfo,
  ConnectingErrorInfo,
  DisconnectedErrorInfo,
  ErrorType,
  TransferInfo,
  AgentAppInfo,
  AgentProfile,
  AgentAvailability,
  ConnectToAgentItem,
  GenericItem,
  EndChatInfo,
  User,
  MessageInput,
  MessageOutput,
  MessageResponse,
  ServiceDeskErrorInfo,
  MessageRequest,
  AdditionalDataToAgent,
  FileUpload,
  ScreenShareState,
};
