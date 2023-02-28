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

import { ErrorType } from 'common/types/errors';
import { MessageRequest, MessageResponse } from 'common/types/message';
import { ServiceDesk, ServiceDeskFactoryParameters, StartChatOptions } from 'common/types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from 'common/types/serviceDeskCallback';
import { stringToMessageResponseFormat } from 'common/utils';

import {
  OnAgentTypingActivityResponse,
  OnConversationCreateResponse,
  OnConversationEndedResponse,
  OnMessageSentResponse,
  OnSendMessageResponse,
} from './kustomerTypes';

/**
 * This class returns startChat, endChat, sendMessageToAgent, updateState, userTyping, userReadMessages and
 * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
 */

/**
 * Default message that is sent to the agent when the conversation is escalated to the agent.
 */
const WATSON_TRANSFER_MESSAGE =
  'Watson Assistant has transferred a chat. Please look at the chat history to get the full context of the conversation.';

/**
 * Default name for the conversation title that is created in Kustomer
 */
const CONVERSATION_TITLE = 'Watson Assistant Chat';

class KustomerServiceDesk implements ServiceDesk {
  agentProfile: AgentProfile;
  callback: ServiceDeskCallback;

  /**
   * The sessionHistoryKey needed for displaying the chat history to the agent
   */
  sessionHistoryKey: string;

  /**
   * The ID of the conversation that is generated at the start of a transfer. Needed for sending user message, and ending the conversation.
   */
  conversationId: string = null;

  /**
   * Flag to check if KustomerCore has been initialize
   */
  isKustomerInitialized: boolean = false;

  constructor(parameters: ServiceDeskFactoryParameters) {
    this.callback = parameters.callback;
  }

  /**
   * Returns a name for this service desk integration. This value should reflect the name of the service desk that is
   * being integrated to. This information will be reported to IBM and may be used to gauge interest in various
   * service desks for the possibility of creating fully supported out-of-the-box implementations.
   *
   * This value is required for custom service desks and may have a maximum of 40 characters.
   */
  getName() {
    return 'kustomer';
  }

  /**
   * Instructs the service desk to start a new chat. This should be called immediately after the service desk
   * instance has been created. It will make the appropriate calls to the service desk and begin communicating back
   * to the calling code using the callback produce to the instance. This may only be called once per instance.
   *
   * @param connectMessage The original server message response that caused the connection to an agent. It will
   * contain specific information to send to the service desk as part of the connection. This can include things
   * like a message to display to a human agent.
   * @returns Returns a Promise that resolves when the service desk has successfully started a new chat. This does
   * not necessarily mean that an agent has joined the conversation or has read any messages sent by the user.
   */
  async startChat(connectMessage: MessageResponse, startChatOptions: StartChatOptions): Promise<void> {
    await this.ensureInit();
    if (KustomerCore.isChatAvailable().availability !== 'online') {
      throw new Error('No agents are available to chat right now');
    }
    this.sessionHistoryKey = startChatOptions.agentAppInfo.sessionHistoryKey;
    await this.initChat();
  }

  /**
   * Tells the service desk to terminate the chat.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async endChat(): Promise<void> {
    KustomerCore.endConversation(
      {
        conversationId: this.conversationId,
      },
      (response: OnConversationEndedResponse, error: any) => {
        if (error) {
          console.error('Unable to notify Kustomer Platform that the customer ended the conversation.', error);
        }
        console.log('Conversation ended');
      },
    );
  }

  /**
   * Sends a message to the agent in the service desk.
   *
   * @param message The message from the user.
   * @param messageID The unique ID of the message assigned by the widget.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void> {
    const messageObj = {
      conversationId: this.conversationId,
      body: message.input.text,
    };
    return new Promise((resolve, reject) => {
      KustomerCore.sendMessage(messageObj, (response: OnSendMessageResponse, error: any) => {
        if (error) {
          reject(error);
        } else {
          console.log('Message sent!');
          resolve();
        }
      });
    });
  }

  /**
   * Tells the service desk if a user has started or stopped typing.
   *
   * This functionality is not currently implemented in the web chat widget.
   *
   * @param isTyping If true, indicates that the user is typing. False indicates the user has stopped typing.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async userTyping(isTyping: boolean): Promise<void> {
    if (isTyping) {
      KustomerCore.sendTypingActivity({
        conversationId: this.conversationId,
        typing: true,
      });
    }
  }

  /**
   * Checks if any agents are online and ready to communicate with the user.
   *
   * @param connectMessage The message that contains the transfer_info object that may be used by the service desk
   * so it can perform a more specific check.
   * @returns True if some agents are available or false if no agents are available. This may also return null which
   * means the availability status of agents is unknown or the service desk doesn't support this information.
   */
  async areAnyAgentsOnline(connectMessage: MessageResponse): Promise<boolean | null> {
    await this.ensureInit();
    return KustomerCore.isChatAvailable().availability === 'online';
  }

  private onMessageReceivedHandler = (response: OnMessageSentResponse, error: any) => {
    if (error) {
      // If there is a problem with the event listener, we want the user to try again and restart the conversation.
      this.callback.setErrorStatus({
        logInfo: error,
        type: ErrorType.DISCONNECTED,
        isDisconnected: true,
      });
      return;
    }
    if (response.direction === 'out') {
      if (!this.agentProfile) {
        this.agentProfile = {
          nickname: response.sentBy.displayName,
          id: response.sentBy.id,
        };
        this.callback.agentJoined(this.agentProfile);
        // Transfer occurs when a different agent sends a message to the user.
      } else if (this.agentProfile.id !== response.sentBy.id) {
        this.agentProfile = {
          nickname: response.sentBy.displayName,
          id: response.sentBy.id,
        };
        this.callback.beginTransferToAnotherAgent(this.agentProfile);
        this.callback.agentJoined(this.agentProfile);
      }
      this.callback.sendMessageToUser(stringToMessageResponseFormat(response.body), this.agentProfile.id);
    }
  };

  private onAgentTypingActivity = (response: OnAgentTypingActivityResponse, error: any) => {
    if (response?.typing === true) {
      this.callback.agentTyping(true);
    } else if (response?.typing === false) {
      this.callback.agentTyping(false);
    }
  };

  private onConversationEndedHandler = (response: OnConversationEndedResponse, error: any) => {
    if (response?.ended === true) {
      this.conversationId = null;
      this.callback.agentEndedChat();
    }
  };

  private async initChat(): Promise<void> {
    return new Promise((resolve, reject) => {
      KustomerCore.createConversation(
        {
          title: CONVERSATION_TITLE,
        },
        (response: OnConversationCreateResponse, error: any) => {
          if (error) {
            reject(error);
          } else {
            // Sending a static message to the agent.
            const messageObj = {
              conversationId: response.conversationId,
              body: WATSON_TRANSFER_MESSAGE,
            };
            this.conversationId = response.conversationId;
            KustomerCore.sendMessage(messageObj, (response: OnSendMessageResponse, error: any) => {
              if (error) {
                // If message is not delivered to the agent, the conversation is set as draft and agent will not be able to interact with it. Better to have the user restart and try again.
                reject(error);
              } else {
                // Calling describeConversation will send the session history key to the agent so that the embedded web chat agent app can show the conversation history to the agent.
                KustomerCore.describeConversation(
                  {
                    conversationId: response.conversationId,
                    customAttributes: {
                      watsonAssistantSessionHistoryStr: this.sessionHistoryKey,
                    },
                  },
                  (response: any, error: any) => {
                    if (error) {
                      // If an error occurs it means the agent can't see the conversation history but we still want to allow the conversation to continue so we are not going to reject the promise here.
                      console.error('Unable to map session history on the conversation.', error);
                    } else {
                      resolve();
                    }
                  },
                );
              }
            });
          }
        },
      );
    });
  }

  /**
   * Ensures that the KustomerCore library has been initialized and the appropriate listeners are added.
   */
  private ensureInit(): Promise<void> {
    if (!this.isKustomerInitialized) {
      return new Promise((resolve, reject) => {
        KustomerCore.init({}, (chatSetting: any, error: any) => {
          if (error) {
            reject(error);
          } else {
            KustomerCore.addListener('onMessageReceived', this.onMessageReceivedHandler);
            KustomerCore.addListener('onAgentTypingActivity', this.onAgentTypingActivity);
            KustomerCore.addListener('onConversationEnded', this.onConversationEndedHandler);
            this.isKustomerInitialized = true;
            resolve();
          }
        });
      });
    }
    return Promise.resolve();
  }
}

export { KustomerServiceDesk };
