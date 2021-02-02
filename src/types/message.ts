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

/* eslint-disable camelcase */

/**
 * This file contains all the types for the shape of inbound and outbound messages from the web chat to the service
 * desk.
 */

import { User } from './profiles';

/**
 * Shape of the response from a service desk when passed to web chat.
 */
export interface MessageResponse {
  // Assistant output to be rendered or processed by the client.
  output: MessageOutput;
  // This should always be set to "agent" when coming from the agent.
  thread_id: string;
  // A unique identifier for this individual message.
  id: string;
  [prop: string]: any;
}

/**
 * Shape of the output from the response from a service desk when passed to web chat.
 */
export interface MessageOutput {
  // Responses intended to be processed by a generic channel. Normally, you would show one GenericItem with the
  // response_type set to "text".
  generic: GenericItem[];
  [prop: string]: any;
}

/**
 * A very basic definition of possible response types.
 */
export interface GenericItem {
  // The type of response returned. This would normally be set to "text".
  response_type: string;
  // If the response_type is text, insert the text returned here.
  text?: string;
  [prop: string]: any;
}

/**
 * Shape of the response from web chat to the service desk.
 */
export interface MessageRequest {
  // The input data to the assistant to make in this request.
  input: MessageInput;
  [prop: string]: any;
}

/**
 * Shape of the input for the response from web chat to the service desk.
 */
export interface MessageInput {
  // The text of the user input. This string cannot contain carriage return, newline, or tab characters.
  text: string;
  // The source of the user input. Defined by service desks.
  source: User;
  [prop: string]: any;
}

export interface ConnectToAgentItem extends GenericItem {
  // A label identifying the topic of the conversation, derived from the user_label property of the relevant node.
  topic?: string;

  // A message to be sent to the human agent who will be taking over the conversation.
  message_to_human_agent?: string;

  // Dialog node id that was used to determine the topic.
  dialog_node?: string;

  // Message to send to user if there is agent is available to respond.
  agent_available?: {
    message: string;
  };

  // Message to send to user if no agents are available to response.
  agent_unavailable?: {
    message: string;
  };

  // Additional information necessary to transfer agents.
  transfer_info?: TransferInfo;
}

export interface TransferInfo {
  // The reason for the escalation.
  reason?: {
    type: string;
  };

  // Contains information to route the escalated conversation to the appropriate service desk department or queue.
  target?: {
    [service_desk: string]: {
      [routing_info: string]: string;
    };
  };
}
