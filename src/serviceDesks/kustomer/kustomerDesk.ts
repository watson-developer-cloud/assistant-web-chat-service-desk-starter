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

import { ErrorType } from '../../types/errors';
import { MessageRequest, MessageResponse } from '../../types/message';
import { User } from '../../types/profiles';
import { ServiceDesk, ServiceDeskFactoryParameters, ServiceDeskStateFromWAC } from '../../types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from '../../types/serviceDeskCallback';
import { stringToMessageResponseFormat } from '../../utils';
 import { onMessageSentResponse, onAgentTypingActivityResponse, onSatisfactionReceivedResponse, onConversationEndedResponse, onConversationCreateResponse, onSendMessageResponse} from './kustomerTypes';
 /**
  * This class returns startChat, endChat, sendMessageToAgent, updateState, userTyping, userReadMessages and
  * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
  */
 class kustomerDesk implements ServiceDesk {
   agentProfile: AgentProfile  = { id: 'liveagent', nickname: };
   callback: ServiceDeskCallback;
   state: any;
   user: User;
   sessionID: string;
   kustomerConversationId: string =  "";
   isChatInit: boolean = false;
   chatTransript: any = ""; 
 
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
    * @param connectMessage The original server message response that caused the connection to an agent. It will
    * contain specific information to send to the service desk as part of the connection. This can includes things
    * like a message to display to a human agent.
    * @returns Returns a Promise that resolves when the service desk has successfully started a new chat. This does
    * not necessarily mean that an agent has joined the conversation or has read any messages sent by the user.
    */
   async startChat(connectMessage: MessageResponse): Promise<void> {
     const t = this; 
     //Adding the chat transcript the first message
    if(connectMessage.context.skills['main skill'].user_defined.transcript) {
        connectMessage.context.skills['main skill'].user_defined.transcript.forEach((messageObject: any) => {
            this.chatTransript += messageObject.user + ': ' + messageObject.message  + '\n\n';
        })
    }
    console.log(this.chatTransript);
    KustomerCore.init({
      //brandId: '600863a3cad7437f4ae80b60'
      brandId: process.env.BRANDID
    }, function (chatSettings: any) {
    //Defining Attributes of the customer
      KustomerCore.describeCustomer({
        attributes: {
          emails: ['marsha@example.com']
        }
      });
      console.log(KustomerCore.isChatAvailable());
      let returnValue = KustomerCore.isChatAvailable(); 
      if(returnValue === 'online') {
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
    }, function (response: onConversationEndedResponse, error: any) 
    {  
        console.log('conversation ended');
        console.log(response);
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
    * Informs the service desk of a change in the state of the web chat that is relevant to the service desks. These
    * values may change at any time.
    *
    * @param state The current values of pieces of state from the main chat.
    */
   updateState(state: ServiceDeskStateFromWAC): void {
    console.log('this is your state', state);
    this.state = state;
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
     if(isTyping) {
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
     console.log('areAnyAgentsOnline', connectMessage)
     return null;
   }

   private onMessageReceivedHandler = (response: onMessageSentResponse, error: any) => {
    console.log('onMessageReceivedHandler, this is your agent response', response);
    if(response.direction === "out") {
      if(!this.agentProfile.nickname) {
        this.agentProfile.nickname = response.sentBy.displayName;
        this.callback.agentJoined(this.agentProfile);
      } else if(this.agentProfile.nickname != response.sentBy.displayName) {
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
     if(response && response.typing === true) {
      this.callback.agentTyping(true);
     } else if (response && response.typing === false) {
      this.callback.agentTyping(false);
     }
   }

   private onConversationCreate = (response: any, error: any) => {
     if(!this.isChatInit) {
      KustomerCore.describeConversation({
        conversationId: response.conversationId,
        customAttributes: {
          watsonSubjectStr: "Watson Conversation"
        }
      })
      let messageObj = {
        conversationId: response.conversationId,
        body: this.chatTransript,
      };
       KustomerCore.sendMessage(messageObj, function (response: onSendMessageResponse, error: any) {
        console.log('Message sent!');
      });
      this.isChatInit = true;
     }
     this.kustomerConversationId = response.conversationId;
   }

   private onConversationEndedHandler = (response: onConversationEndedResponse, error: any) => {
     console.log('onConversationEndedHandler:', response)
      if(response && response.ended == true) {
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


   private async 
 }
 
 export { kustomerDesk };
 