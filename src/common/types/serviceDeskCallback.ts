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

import { ServiceDeskErrorInfo } from './errors';
import { MessageResponse } from './message';
import { AgentProfile } from './profiles';

/**
 * This interface represents the operations that a service desk integration can call on web chat when it wants web
 * chat to do something. When a service desk integration instance is created, web chat will provide an
 * implementation of this interface to the integration for it to use.
 */
interface ServiceDeskCallback {
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
   */
  sendMessageToUser(message: MessageResponse, agentID: string): void;

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
}

/**
 * Information about the current availability of an agent while a user is waiting to be connected. If these are not set
 * the web chat will provide generic messaging letting the user know that a request for an agent has been sent.
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

export { AgentAvailability, AgentProfile, ServiceDeskCallback };
