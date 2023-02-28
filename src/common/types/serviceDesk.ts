/**
 * (C) Copyright IBM Corp. 2020, 2022.
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

import { MessageRequest, MessageResponse } from './message';
import { ServiceDeskCallback } from './serviceDeskCallback';

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
   * @param startChatOptions Additional configuration for startChat. Added in 4.5.0 of web chat.
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
   * Sends a message to the agent in the service desk.
   *
   * @param message The message from the user.
   * @param messageID The unique ID of the message assigned by the widget.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void>;

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
   * @since Web chat 5.1.1. Earlier versions of web chat will not call this function.
   */
  userTyping?(isTyping: boolean): Promise<void>;

  /**
   * Informs the service desk that the user has read all the messages that have been sent by the service desk.
   *
   * This functionality is not currently implemented in the web chat widget.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  userReadMessages?(): Promise<void>;

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

export { ServiceDesk, ServiceDeskFactoryParameters, ServiceDeskStateFromWAC, StartChatOptions };
