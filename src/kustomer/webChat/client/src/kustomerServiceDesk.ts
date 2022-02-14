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

import { MessageRequest, MessageResponse } from '../../../../common/types/message';
import { ServiceDesk, ServiceDeskFactoryParameters, StartChatOptions } from '../../../../common/types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from '../../../../common/types/serviceDeskCallback';
import { stringToMessageResponseFormat } from '../../../../common/utils';
import {
  OnAgentTypingActivityResponse,
  OnConversationCreateResponse,
  OnConversationEndedResponse,
  OnMessageSentResponse,
  OnSendMessageResponse,
  g
} from './kustomerTypes';

/**
 * This class returns startChat, endChat, sendMessageToAgent, updateState, userTyping, userReadMessages and
 * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
 */

/**
 * Default message that is sent to the agent
 */
const WATSON_TRANSFER_MESSAGE =
  'Watson Assistant has transferred a chat. Please look at the chat history to get the full context of the conversation.';

/**
 * Default name for the conversation that is created in Kustomer
 */
const CONVERSATION_TITLE = 'Watson Assistant Chat';

class KustomerServiceDesk implements ServiceDesk {
  agentProfile: AgentProfile = { id: 'liveagent', nickname: '' };
  callback: ServiceDeskCallback;

  /**
   * The sessionHistoryKey needed for displaying the chat history to the agent
   */
  sessionHistoryKey: string;

  /**
   * The ID of the conversation that is generated at the start of a transfer. Needed for sending user message, and ending the conversation.
   */
  conversationId: string = '';

  /**
   * Flag to check if any agent is available. Needed when startChat is excuted before areAnyAgentsOnline
   */
  isAgentAvailable: boolean = false;

  constructor(parameters: ServiceDeskFactoryParameters) {
    this.callback = parameters.callback;
  }

  /**
   * Instructs the service desk to start a new chat. This should be called immediately after the service desk
   * instance has been created. It will make the appropriate calls to the service desk and begin communicating back
   * to the calling code using the callback produce to the instance. This may only be called once per instance.
   *
   * @param connectMessage The original server message response that caused the connection to an agent. It will
   * contain specific information to send to the service desk as part of the connection. This can includes things
   * like a message to display to a human agent.
   * @returns Returns a Promise that resolves when the service desk has successfully started a new chat. This does
   * not necessarily mean that an agent has joined the conversation or has read any messages sent by the user.
   */
  async startChat(connectMessage: MessageResponse, startChatOptions: StartChatOptions): Promise<void> {
    if (!this.isAgentAvailable) {
      const isAgentAvailable = await this.isAgentOnline();
      if (!isAgentAvailable) {
        return Promise.reject();
      }
      this.isAgentAvailable = true;
    }
    this.sessionHistoryKey = startChatOptions.agentAppInfo.sessionHistoryKey;
    this.initChat();
    return Promise.resolve();
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
        console.log('Conversation ended');
      },
    );
    return Promise.resolve();
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
    return Promise.resolve();
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
    const isAgentAvailable = await this.isAgentOnline();
    return isAgentAvailable;
  }

  private onMessageReceivedHandler = (response: OnMessageSentResponse, error: any) => {
    if (response.direction === 'out') {
      if (!this.agentProfile.nickname) {
        this.agentProfile.nickname = response.sentBy.displayName;
        this.agentProfile.id = response.sentBy.id;
        this.callback.agentJoined(this.agentProfile);
      } else if (this.agentProfile.nickname !== response.sentBy.displayName) {
        const newAgentProfile = {
          nickname: response.sentBy.displayName,
          id: response.sentBy.id,
        };
        this.callback.beginTransferToAnotherAgent(newAgentProfile);
        this.callback.agentJoined(newAgentProfile);
      }
      this.callback.sendMessageToUser(stringToMessageResponseFormat(response.body), this.agentProfile.id);
    }
  };

  private onMessageSent = (response: OnMessageSentResponse, error: any) => {
    console.log('Your agent response', response);
  };

  private onAgentTypingActivity = (response: OnAgentTypingActivityResponse, error: any) => {
    if (response?.typing === true) {
      this.callback.agentTyping(true);
    } else if (response && response.typing === false) {
      this.callback.agentTyping(false);
    }
  };

  private onConversationCreate = (response: any, error: any) => {
    if (!response) {
      return;
    }
    const messageObj = {
      conversationId: response.conversationId,
      body: WATSON_TRANSFER_MESSAGE,
    };
    KustomerCore.sendMessage(messageObj, (response: OnSendMessageResponse, error: any) => {
      if (error) {
        console.error('An error occurred when sending a message', error);
      } else {
        console.log('Message sent!');
      }
    });
    this.conversationId = response.conversationId;
  };

  private onConversationEndedHandler = (response: OnConversationEndedResponse, error: any) => {
    if (response && response.ended === true) {
      this.callback.agentEndedChat();
    }
  };

  private initChat(): Promise<void> {
    try {
      this.removeKustomerChatEventListener();
    } finally {
      this.initKustomerChatEventListener();
      KustomerCore.createConversation(
        {
          title: CONVERSATION_TITLE,
        },
        (response: OnConversationCreateResponse, error: any) => {
          if (error) {
            console.error('An error occurred when creating a new conversation', error);
          } else {
            setTimeout(() => {
              KustomerCore.describeConversation({
                conversationId: response.conversationId,
                customAttributes: {
                  watsonAssistantSessionHistoryStr: this.sessionHistoryKey,
                },
              });
            }, 3000);
          }
        },
      );
    }
    return Promise.resolve();
  }

  private initKustomerChatEventListener(): void {
    KustomerCore.addListener('onMessageReceived', this.onMessageReceivedHandler);
    KustomerCore.addListener('onAgentTypingActivity', this.onAgentTypingActivity);
    KustomerCore.addListener('onMessageSent', this.onMessageSent);
    KustomerCore.addListener('onConversationCreate', this.onConversationCreate);
    KustomerCore.addListener('onConversationEnded', this.onConversationEndedHandler);
  }

  private removeKustomerChatEventListener(): void {
    KustomerCore.removeListener('onMessageReceived', this.onMessageReceivedHandler);
    KustomerCore.removeListener('onAgentTypingActivity', this.onAgentTypingActivity);
    KustomerCore.removeListener('onMessageSent', this.onMessageSent);
    KustomerCore.removeListener('onConversationCreate', this.onConversationCreate);
    KustomerCore.removeListener('onConversationEnded', this.onConversationEndedHandler);
  }

  private isAgentOnline(): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        KustomerCore.init({}, (chatSetting: any, error: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(KustomerCore.isChatAvailable().availability === 'online');
          }
        });
      });
    } catch (error) {
      return Promise.reject();
    }
  }
}

export { KustomerServiceDesk };
