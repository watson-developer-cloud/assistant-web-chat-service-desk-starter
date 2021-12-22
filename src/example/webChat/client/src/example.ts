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

import { MessageRequest, MessageResponse } from '../../types/message';
import { User } from '../../types/profiles';
import { ServiceDesk, ServiceDeskFactoryParameters, ServiceDeskStateFromWAC } from '../../types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from '../../types/serviceDeskCallback';
import { stringToMessageResponseFormat } from '../../utils';

/**
 * This class returns startChat, endChat, sendMessageToAgent, updateState, userTyping, userReadMessages and
 * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
 */
class KustomerServiceDesk implements ServiceDesk {
    agentProfile: AgentProfile = { id: 'liveagent', nickname: null };
    callback: ServiceDeskCallback;
    state: any;
    user: User;
    sessionID: string;
    kustomerConversationId: string;
    lastAgentMessage: string;
    lastAgentMessageSentAt: string;
    intervalFetchAgentMessage: any;
    private SERVER_BASE_URL: string = process.env.NODE_RED_URL || 'https://personalnodered.herokuapp.com';

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
        console.log('this your startChatObject', connectMessage);
        let transcript = '';
        if(connectMessage.context.skills['main skill'].user_defined.transcript) {
            connectMessage.context.skills['main skill'].user_defined.transcript.forEach((messageObject: any) => {
                transcript += messageObject.user + ': ' + messageObject.message  + '\n\n';
            })
        }
        try {
            const request = await fetch(`${this.SERVER_BASE_URL}/createConversation`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "customerId": "5fe2a65554f681b99c107941",
                    "transcript": transcript,
                    "lastMessage": "Please look at the Watson transcript to get the context of the conversation."
                })
            })
            const response = await request.json();
            if (response) {
                this.kustomerConversationId = response.conversationId
            }
        } catch (error) {
            return Promise.reject();
        }

        try {
            for (let i = 0; i < 100; i++) {
                await this.fetchUser();
                await this.wait(5000);
                console.log('this is agent profile', this.agentProfile);
                if (this.agentProfile && this.agentProfile.nickname) {
                    this.callback.agentJoined(this.agentProfile);
                    this.intervalFetchAgentMessage = setInterval(() => {
                        console.log('fetch agent chat valules');
                        this.fetchLastedMessageFromAgent();
                    }, 10000);
                    return;
                }
            }
        } catch (error) {
            console.log(error);
        }

        return Promise.resolve();
    }

    /**
     * Tells the service desk to terminate the chat.
     *
     * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
     */
    async endChat(): Promise<void> {
        console.log('this is endChat');
        clearInterval(this.intervalFetchAgentMessage);
        try {
            const request = await fetch(`${this.SERVER_BASE_URL}/userClosedChat`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "conversationId": this.kustomerConversationId
                })
            })
            await request.json();
            
        } catch (error) {
            return Promise.reject();
        }
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
        try {
            const request = await fetch(`${this.SERVER_BASE_URL}/sendMessage`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "conversationId": this.kustomerConversationId,
                    "message": message.input.text
                })
            })
            await request.json();
            
        } catch (error) {
            return Promise.reject();
        }
        this.callback.agentReadMessages();
    
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
        return Promise.resolve();
     }

    /**
     * Informs the service desk that the user has read all the messages that have been sent by the service desk.
     *
     * This functionality is not currently implemented in the web chat widget.
     *
     * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
     */
    async userReadMessages(): Promise<void> {
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

    private async fetchUser(): Promise<void> {
        try {
            const request = await fetch(`${this.SERVER_BASE_URL}/getAgentName?conversationId=${this.kustomerConversationId}`, {
                method: 'GET',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            })
            const response = await request.json();
            console.log('this is your response', response);
            if (response && response.name) {
                this.agentProfile.nickname = response.name;
            }
        } catch (error) {
            console.log('this is your error', error);
            return Promise.reject();
        }
        return Promise.resolve();
    }

    private async wait(ms: number) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        })
    }

    private async fetchLastedMessageFromAgent(): Promise<void> {
        try {
            const request = await fetch(`${this.SERVER_BASE_URL}/getMessage?conversationId=${this.kustomerConversationId}`, {
                method: 'GET',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            })
            const response = await request.json();
            console.log('this is your response', response);
            if (response && response.lastAgentMessage && response.lastAgentMessageSentAt) {
                console.log('this is your previous values', this.lastAgentMessage)
                console.log('this is your previous values', this.lastAgentMessageSentAt)
                console.log(response.lastAgentMessage != this.lastAgentMessage);
                console.log(response.lastAgentMessageSentAt != this.lastAgentMessageSentAt);
                console.log(response.lastAgentMessage != this.lastAgentMessage && response.lastAgentMessageSentAt != this.lastAgentMessageSentAt);
                if(response.lastAgentMessage != this.lastAgentMessage && response.lastAgentMessageSentAt != this.lastAgentMessageSentAt) {
                    this.lastAgentMessage = response.lastAgentMessage;
                    this.lastAgentMessageSentAt = response.lastAgentMessageSentAt
                    console.log('now sending agent message');
                    this.callback.sendMessageToUser(stringToMessageResponseFormat(response.lastAgentMessage), this.agentProfile.id);
                }
            }
        } catch (error) {
            console.log('this is your error', error);
            return Promise.reject();
        }
        return Promise.resolve();
    }
}

export { KustomerServiceDesk };
