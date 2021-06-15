/**
 * (C) Copyright Kustomer 2021.
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
import { ServiceDesk, ServiceDeskFactoryParameters } from '../../types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from '../../types/serviceDeskCallback';
import { stringToMessageResponseFormat } from '../../utils';
import { onAgentTypingActivityResponse, onConversationCreateResponse, onConversationEndedResponse, onMessageSentResponse } from './kustomerTypes';
import { createConversation, endConversation, initKustomerCore, isChatAvailable, login, logout, markRead, sendMessage, sendTypingActivity } from './kustomerHelper';
/**
 * This class returns startChat, endChat, sendMessageToAgent, updateState, userTyping, userReadMessages and
 * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
 */

const CONVERSATION_TITLE = 'Watson Assistant';
const AGENT_ID = 'liveagent'

class KustomerServiceDesk implements ServiceDesk {
    agentProfile: AgentProfile;
    callback: ServiceDeskCallback;
    state: any;
    sessionId: string;
    chatTranscript: string;
    brandId: string;
    jwtToken: string;

    constructor(parameters: ServiceDeskFactoryParameters) {
        this.agentProfile = { id: AGENT_ID, nickname: '' };
        this.callback = parameters.callback;
        this.sessionId = '';
        this.chatTranscript = 'Chat Transcript \n\n';
        this.brandId = process.env.BRAND_ID
        this.jwtToken = process.env.JWT_TOKEN;
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
        //Adding the chat transcript the first message
        this.chatTranscript += this.createChatTranscript(connectMessage);
        try {
            const initKustomerCoreResponse = await initKustomerCore(this.brandId);
            if (initKustomerCoreResponse && !this.brandId) {
                this.brandId = initKustomerCoreResponse.settings.brandId;
            }
            const currentChatAvailability = (await isChatAvailable()).availability;
            if (currentChatAvailability && currentChatAvailability == "online") {
                this.initEventListener();
                createConversation(CONVERSATION_TITLE, this.brandId)
                    .then(() => login(this.jwtToken))
                    .then(() => this.sendWatsonTranscript(this.sessionId, this.chatTranscript));
            }
        } catch (error) {
            this.callback.setErrorStatus({
                logInfo: error,
                type: ErrorType.CONNECTING
            });
            console.log(error)
        }
    }

    /**
     * Tells the service desk to terminate the chat.
     *
     * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
     */
    async endChat(): Promise<void> {
        endConversation(this.sessionId).then(() => logout());
        this.endEventListener();
    }

    /**
     * Sends a message to the agent in the service desk.
     *
     * @param message The message from the user.
     * @param messageID The unique ID of the message assigned by the widget.
     * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
     */
    async sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void> {
        if (this.sessionId) {
            const messageObj = {
                conversationId: this.sessionId,
                body: message.input.text,
            };
            sendMessage(messageObj);
        }
    }

    /**
     * Tells the service desk if a user has started or stopped typing.
     *
     * This functionality is not currently implemented in the web chat widget.
     *
     * @param isTyping If true, indicates that the user is typing. False indicates the user has stopped typing.
     * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
     * 
     * Currently not supported - https://github.com/watson-developer-cloud/assistant-web-chat-service-desk-starter/blob/9b5df6762bd0106c6e9f2a3e7676b42d7c0b2de6/docs/API.md
     */
    async userTyping(isTyping: boolean): Promise<void> {
        if (isTyping) {
            sendTypingActivity(this.sessionId)
        }
    }

    /**
     * Informs the service desk that the user has read all the messages that have been sent by the service desk.
     *
     * This functionality is not currently implemented in the web chat widget.
     *
     * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
     * 
     * Currently not supported - https://github.com/watson-developer-cloud/assistant-web-chat-service-desk-starter/blob/9b5df6762bd0106c6e9f2a3e7676b42d7c0b2de6/docs/API.md
     */
    async userReadMessages(): Promise<void> {
        markRead(this.sessionId);
    }

    private onMessageReceivedHandler = (response: onMessageSentResponse, error: any) => {
        if (response && response.direction === "out") {
            if (!this.agentProfile.nickname) {
                this.agentProfile.nickname = response.sentBy.displayName;
                this.callback.agentJoined(this.agentProfile);
            } else if (this.agentProfile.nickname != response.sentBy.displayName) {
                //Transfer to another agent
                this.agentProfile.nickname = response.sentBy.displayName;
                this.callback.beginTransferToAnotherAgent(this.agentProfile)
            }
            this.callback.sendMessageToUser(stringToMessageResponseFormat(response.body), this.agentProfile.id);
        }
    }

    private onAgentTypingActivityHandler = (response: onAgentTypingActivityResponse, error: any) => {
        if (response && response.typing === true) {
            this.callback.agentTyping(true);
        } else if (response && response.typing === false) {
            this.callback.agentTyping(false);
        }
    }

    private onConversationCreateHandler = async (response: onConversationCreateResponse, error: any) => {
        if (response && response.conversationId) {
            try {
                this.sessionId = response.conversationId;
            } catch (error) {
                //Error Handling 
                this.callback.setErrorStatus({
                    logInfo: error,
                    type: ErrorType.CONNECTING
                })
            }
        }
    }

    private onConversationEndedHandler = (response: onConversationEndedResponse, error: any) => {
        if (response && response.ended == true) {
            this.callback.agentEndedChat();
            this.endEventListener();
        }
    }

    private initEventListener(): void {
        KustomerCore.addListener('onMessageReceived', this.onMessageReceivedHandler);
        KustomerCore.addListener('onAgentTypingActivity', this.onAgentTypingActivityHandler);
        KustomerCore.addListener('onConversationCreate', this.onConversationCreateHandler);
        KustomerCore.addListener('onConversationEnded', this.onConversationEndedHandler);
    }

    private endEventListener(): void {
        KustomerCore.removeListener('onMessageReceived', this.onMessageReceivedHandler);
        KustomerCore.removeListener('onAgentTypingActivity', this.onAgentTypingActivityHandler);
        KustomerCore.removeListener('onConversationCreate', this.onConversationCreateHandler);
        KustomerCore.removeListener('onConversationEnded', this.onConversationEndedHandler);
    }

    private sendWatsonTranscript(sessionId: string, chatTranscript: string): void {
        const messageObj = {
            conversationId: sessionId,
            body: chatTranscript,
        };
        sendMessage(messageObj);
    }

    private createChatTranscript(connectMessage: MessageResponse): string {
        let chatTranscript: string = '';
        if (connectMessage.context.skills['main skill'].user_defined.transcript) {
            connectMessage.context.skills['main skill'].user_defined.transcript.forEach((messageObject: any) => {
                chatTranscript += messageObject.user + ': ' + messageObject.message + '\n\n';
            })
        }
        return chatTranscript;
    }
}

export { KustomerServiceDesk };
