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

/**
 * Copy and paste this file into a new folder to get started.
 */
import { MessageRequest, MessageResponse } from '../../../../common/types/message';
import { User } from '../../../../common/types/profiles';
import {
  ServiceDesk,
  ServiceDeskFactoryParameters,
  ServiceDeskStateFromWAC,
  StartChatOptions,
} from '../../../../common/types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from '../../../../common/types/serviceDeskCallback';
/**
 * This class returns startChat, endChat, sendMessageToAgent, updateState, userTyping, userReadMessages and
 * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
 */
class ServiceDeskTemplate implements ServiceDesk {
  agentProfile: AgentProfile;
  callback: ServiceDeskCallback;
  user: User;
  sessionID: string;

  constructor(parameters: ServiceDeskFactoryParameters) {
    this.callback = parameters.callback;
    this.user = { id: '' };
    this.sessionID = '';
  }

  /**
   * Instructs the service desk to start a new chat. This should be called immediately after the service desk
   * instance has been created. It will make the appropriate calls to the service desk and begin communicating back
   * to the calling code using the callback produce to the instance. This may only be called once per instance.
   *
   * Most service desks have a way to embed a custom iFrame into the agent view, as well as a way to pass metadata
   * into that iFrame. startChatOptions.agentAppInfo contains metadata for you to be able to render the conversation
   * history with Watson Assistant to your agents in a custom iFrame and this data should be passed via whatever
   * methods the service desk you are using uses.
   *
   * @param connectMessage The original server message response that caused the connection to an agent. It will
   * contain specific information to send to the service desk as part of the connection. This can includes things
   * like a message to display to a human agent.
   * @param startChatOptions Starting with version 4.5.0 of web chat, a set of options that can be applied when
   * starting a new chat. This includes metadata on how to add chat transcripts to your agent's view.
   * @returns Returns a Promise that resolves when the service desk has successfully started a new chat. This does
   * not necessarily mean that an agent has joined the conversation or has read any messages sent by the user.
   */
  async startChat(connectMessage: MessageResponse, startChatOptions?: StartChatOptions): Promise<void> {}

  /**
   * Tells the service desk to terminate the chat.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async endChat(): Promise<void> {}

  /**
   * Sends a message to the agent in the service desk.
   *
   * @param message The message from the user.
   * @param messageID The unique ID of the message assigned by the widget.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void> {}

  /**
   * Informs the service desk of a change in the state of the web chat that is relevant to the service desks. These
   * values may change at any time.
   *
   * @param state The current values of pieces of state from the main chat.
   */
  updateState(state: ServiceDeskStateFromWAC): void {}

  /**
   * Tells the service desk if a user has started or stopped typing.
   *
   * This functionality is not currently implemented in the web chat widget.
   *
   * @param isTyping If true, indicates that the user is typing. False indicates the user has stopped typing.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async userTyping(isTyping: boolean): Promise<void> {}

  /**
   * Informs the service desk that the user has read all the messages that have been sent by the service desk.
   *
   * This functionality is not currently implemented in the web chat widget.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async userReadMessages(): Promise<void> {}

  /**
   * Checks if any agents are online and ready to communicate with the user.
   *
   * @param connectMessage The message that contains the transfer_info object that may be used by the service desk
   * so it can perform a more specific check.
   * @returns True if some agents are available or false if no agents are available. This may also return null which
   * means the availability status of agents is unknown or the service desk doesn't support this information.
   */
  async areAnyAgentsOnline(connectMessage: MessageResponse): Promise<boolean | null> {
    return null;
  }
}

export { ServiceDeskTemplate };
