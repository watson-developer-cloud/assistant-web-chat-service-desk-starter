/**
 * (C) Copyright Kustomer 2020.
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
import {
  ServiceDesk,
  ServiceDeskFactoryParameters,
  StartChatOptions,
} from '../../../../common/types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from '../../../../common/types/serviceDeskCallback';
import { stringToMessageResponseFormat } from '../../../../common/utils';
import { onMessageSentResponse, onAgentTypingActivityResponse, onConversationEndedResponse, onConversationCreateResponse, onSendMessageResponse } from './kustomerTypes';
/**
 * This class returns startChat, endChat, sendMessageToAgent, updateState, userTyping, userReadMessages and
 * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
 */

const WATSON_TRANSFER_MESSAGE = "'Watson Assistant has transfer a chat. Please look at the chat history to get the full context of the conversation.";

class KustomerServiceDesk implements ServiceDesk {
  agentProfile: AgentProfile = { id: 'liveagent', nickname: '' };
  callback: ServiceDeskCallback;
  sessionHistoryKey: string;
  kustomerConversationId: string = "";
  isChatInit: boolean = false;
  jwt: string;

  constructor(parameters: ServiceDeskFactoryParameters) {
    this.callback = parameters.callback;
    this.jwt = '';
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
    const t = this;
    this.jwt = 'YOUR_JWT_TOKEN'; //If your user is login, pass JWT token here
    this.sessionHistoryKey = startChatOptions.agentAppInfo.sessionHistoryKey;
    KustomerCore.init({
      brandId: process.env.BRANDID
    }, function (chatSettings: any) {
      //You can describe the customer here if you do not have a JWT token
      KustomerCore.describeCustomer({
        attributes: {
          emails: ['YOUR_CUSTOMER_EMAIL']
        }
      });
      const returnValue = KustomerCore.isChatAvailable();
      if (returnValue === 'online') {
        t.initChat();
      }
    });
    return Promise.resolve();
  }

  /**
   * Tells the service desk to terminate the chat.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async endChat(): Promise<void> {
    KustomerCore.endConversation({
      conversationId: this.kustomerConversationId
    }, function (response: onConversationEndedResponse, error: any) {
      console.log('conversation ended');
    });
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
    let messageObj = {
      conversationId: this.kustomerConversationId,
      body: message.input.text,
    };
    // Send message with a callback
    KustomerCore.sendMessage(messageObj, function (respsone: onSendMessageResponse, error: any) {
      console.log('Message sent!');
    });

    return Promise.resolve();
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
        conversationId: this.kustomerConversationId,
        typing: true,
      });
      return Promise.resolve();
    } else {
      return Promise.resolve();
    }
  }

  /**
   * Informs the service desk that the user has read all the messages that have been sent by the service desk.
   *
   * This functionality is not currently implemented in the web chat widget.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async userReadMessages(): Promise<void> {
    KustomerCore.markRead({
      conversationId: this.kustomerConversationId
    });
    console.log('userReadMessages');
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
    return null;
  }

  private onMessageReceivedHandler = (response: onMessageSentResponse, error: any) => {
    if (response.direction === "out") {
      if (!this.agentProfile.nickname) {
        this.agentProfile.nickname = response.sentBy.displayName;
        this.callback.agentJoined(this.agentProfile);
      } else if (this.agentProfile.nickname != response.sentBy.displayName) {
        this.agentProfile.nickname = response.sentBy.displayName;
        this.callback.beginTransferToAnotherAgent(this.agentProfile)
      }
      this.callback.sendMessageToUser(stringToMessageResponseFormat(response.body), this.agentProfile.id);
    }
  }

  private onMessageSent = (response: onMessageSentResponse, error: any) => {
    console.log('onMessageSent, this is your agent response', response);
  }

  private onAgentTypingActivity = (response: onAgentTypingActivityResponse, error: any) => {
    if (response && response.typing === true) {
      this.callback.agentTyping(true);
    } else if (response && response.typing === false) {
      this.callback.agentTyping(false);
    }
  }

  private onConversationCreate = (response: any, error: any) => {
    if (this.isChatInit) return;
    if (this.jwt) {
      //Customer authenicate chat
      Kustomer.login({
        jwtToken: this.jwt
      });
    }
    const t = this;
    //Passing Session History Key to Kustomer
    KustomerCore.describeConversation({
      conversationId: response.conversationId,
      customAttributes: {
        watsonAssistantSessionHistoryStr: t.sessionHistoryKey
      }
    })
    const messageObj = {
      conversationId: response.conversationId,
      body: WATSON_TRANSFER_MESSAGE,
    };
    KustomerCore.sendMessage(messageObj, function (response: onSendMessageResponse, error: any) {
      console.log('Message sent!');
    });
    this.isChatInit = true;
    this.kustomerConversationId = response.conversationId;
  }

  private onConversationEndedHandler = (response: onConversationEndedResponse, error: any) => {
    if (response && response.ended == true) {
      this.callback.agentEndedChat();
    }
  }

  private async initChat(): Promise<void> {
    KustomerCore.addListener('onMessageReceived', this.onMessageReceivedHandler);
    KustomerCore.addListener('onAgentTypingActivity', this.onAgentTypingActivity);
    KustomerCore.addListener('onMessageSent', this.onMessageSent);
    KustomerCore.addListener('onConversationCreate', this.onConversationCreate);
    KustomerCore.addListener('onConversationEnded', this.onConversationEndedHandler)
    KustomerCore.createConversation({},
      (response: onConversationCreateResponse, error: any) => {
        if (error) {
          console.log("handle the error");
        } else {
          console.log("handle the response")
        }
      });
    return Promise.resolve();
  }
}

export { KustomerServiceDesk };
