/**
 * (C) Copyright IBM Corp. 2020.
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

/* eslint-disable camelcase */

/**
 * This is the public interface for a human agent service desk. This is the interface between the chat widget and
 * the implementation of the human agent interface with one of the various supported service desks.
 */
interface ServiceDesk {
  /**
   * Instructs the service desk to start a new chat. This should be called immediately after the service desk
   * instance has been created. It will make the appropriate calls to the service desk and begin communicating back
   * to the calling code using the callback produce to the instance. This may only be called once per instance.
   *
   * @param connectMessage The original server message response that caused the connection to an agent. It will
   * contain specific information to send to the service desk as part of the connection. This can includes things
   * like a message to display to a human agent.
   * @param startChatOptions Starting with version 4.5.0 of web chat, a set of options that can be applied when
   * starting a new chat. This includes metadata on how to add chat transcripts to your agent's view.
   * @returns Returns a Promise that resolves when the service desk has successfully started a new chat. This does
   * not necessarily mean that an agent has joined the conversation or has read any messages sent by the user.
   */
  startChat(connectMessage: MessageResponse, startChatOptions?: StartChatOptions): Promise<void>;

  /**
   * Tells the service desk to terminate the chat.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  endChat(): Promise<void>;

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
   *
   * @param state The current values of pieces of state from the main chat.
   */
  updateState?(state: ServiceDeskStateFromWAC): void;

  /**
   * Tells the service desk if a user has started or stopped typing.
   *
   * This functionality is not currently implemented in the web chat widget.
   *
   * @param isTyping If true, indicates that the user is typing. False indicates the user has stopped typing.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
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
   * Checks if any agents are online and ready to communicate with the user.
   *
   * @param connectMessage The message that contains the transfer_info object that may be used by the service desk
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
 * This data is used to configure an read only web chat inside the service desk.
 */
interface AgentAppInfo {
  /**
   * A string that is separated by `::` that can be used to create a PublicConfig. It includes base connect
   * info like integrationID, etc, and by pass JWT security with a one time auth code. The data inside this
   * string can change at any time and it should be used only to pass data to the agent application.
   */
  sessionHistoryKey: string;
}

export { ServiceDesk, ServiceDeskFactoryParameters, ServiceDeskStateFromWAC, StartChatOptions };
