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
import { parse } from 'node-html-parser';

import { ErrorType } from '../../../../common/types/errors';
import { MessageRequest, MessageResponse } from '../../../../common/types/message';
import { User } from '../../../../common/types/profiles';
import {
  ServiceDesk,
  ServiceDeskFactoryParameters,
  ServiceDeskStateFromWAC,
  StartChatOptions,
} from '../../../../common/types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from '../../../../common/types/serviceDeskCallback';
import { stringToMessageResponseFormat } from '../../../../common/utils';
import { eGainConstants } from './eGainTypes';
/**
 * This class returns startChat, endChat, sendMessageToAgent, updateState, userTyping, userReadMessages and
 * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
 */
class EgainServiceDesk implements ServiceDesk {
  callback: ServiceDeskCallback;
  user: User;

  /**
   * The profile information for the current agent.
   */
  agentProfile: AgentProfile;

  /**
   * The ID representing the current session with the agent.
   */
  sessionID: string;

  /**
   * The websocket object that messages are passed through.
   */
  socket: WebSocket;

  /**
   * The ID representing the integration instance eGain's service desk is connected to.
   */
  IBMIntegrationId: string;

  /**
   * A boolean to represent if the agent has ended the conversation.
   */
  agentEnded: boolean;

  constructor(parameters: ServiceDeskFactoryParameters) {
    this.callback = parameters.callback;
    this.agentProfile = {
      id: '',
      nickname: 'Agent',
      profile_picture_url: '', // This is not yet implemented.
    };
    this.agentEnded = false;
  }
  // Public ServiceDesk Methods
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
  async startChat(connectMessage: MessageResponse, startChatOptions?: StartChatOptions): Promise<void> {
    this.IBMIntegrationId = window.watsonAssistantChatOptions.integrationID;
    const userId = this.user.id;
    const sessionId = this.sessionID;

    const initialized = await this.initialize(this.IBMIntegrationId, sessionId, userId);

    if (initialized) {
      try {
        await this.openWebSocket(`${eGainConstants.WEBSOCKET}?userId=${userId}&sessionId=${sessionId}`);
      } catch (error) {
        this.callback.setErrorStatus({
          logInfo: error,
          type: ErrorType.CONNECTING,
        });
        return Promise.reject();
      }
    }
    return Promise.resolve();
  }

  /**
   * Calls the service desk to authorize and initialize chat.
   *
   * @returns Returns a boolean.
   */
  async initialize(IBMIntegrationId: string, sessionId: string, userId: string): Promise<boolean> {
    const buffer = Buffer.from(IBMIntegrationId);
    const authToken = buffer.toString('base64');
    try {
      const response = await fetch(eGainConstants.INITIALIZE, {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          userId,
        }),
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          Authorization: authToken,
        },
      });
      if (!response.ok) {
        throw new Error(`error status: ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error('error: ', error);
      return Promise.reject();
    }
  }

  async handleMessage(event: string): Promise<void> {
    if (event.includes('href=')) {
      const link = this.getLink(event);
      this.callback.sendMessageToUser(stringToMessageResponseFormat(link), '');
    } else {
      let message = this.sanitize(JSON.stringify(event));
      try {
        message = JSON.parse(message);
      } catch (error) {
        console.error('An error occurred while parsing the message: ', error);
        return Promise.reject(error);
      }

      let messageContent;
      let messageType;

      if (this.sessionID === message.authorization) {
        if ('status' in message) {
          this.callback.agentTyping(false);
          if (message.status === 'Conversation ended') {
            this.socket.close();
          }
        } else if ('eGainMessage' in message) {
          messageType = message.eGainMessage.type;
          if (messageType === 'agent.unavailable') {
            messageContent = message.eGainMessage.value.reason;
            this.areAnyAgentsOnline(false);
          } else if (messageType === 'conversation.state') {
            messageContent = message.eGainMessage.value.status;
            if (messageContent === 'escalated') {
              this.callback.agentJoined(this.agentProfile);
            }
          } else if (messageType === 'text') {
            this.callback.agentTyping(false);
            this.agentProfile.nickname = message.eGainMessage.agentName;
            messageContent = message.eGainMessage.value;
            if (messageContent === 'agent.end.conversation') {
              this.agentEnded = true;
              this.callback.agentEndedChat();
            } else {
              this.callback.sendMessageToUser(stringToMessageResponseFormat(messageContent), '');
            }
          } else if (messageType === 'typing.start') {
            this.callback.agentTyping(true);
          } else if (messageType === 'typing.end') {
            this.callback.agentTyping(false);
          } else {
            console.error('Unknown message type');
          }
        }
      } else {
        return Promise.reject();
      }
    }
    return Promise.resolve();
  }

  /**
   * This method is used to parse hyperlinks
   *
   * @returns Returns a string.
   */
  getLink(link: string): string {
    const root = parse(link);
    const result = root.childNodes[1].rawText;
    return result;
  }

  sanitize(message: string): string {
    return message.replace(/\\/g, '').replace(/"\{/g, '{').replace(/\}"/g, '}');
  }

  async openWebSocket(uri: string): Promise<any> {
    const userId = this.user.id;
    const sessionId = this.sessionID;
    const { IBMIntegrationId } = this;
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(uri);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const eGainServiceDesk = this;

        this.socket.onopen = function onOpen(e) {
          const message = {
            userId,
            sessionId,
            IBMIntegrationId,
          };
          this.send(JSON.stringify(message));
        };

        this.socket.onmessage = function onMessage(event: Event) {
          this.handleMessage(event.data);
        }.bind(this);

        this.socket.onclose = function onClose(event) {
          if (event.wasClean) {
            eGainServiceDesk.callback.setErrorStatus({
              logInfo: 'socket disconnected',
              type: ErrorType.CONNECTING,
            });
            eGainServiceDesk.openSocketToEnd(
              `${eGainConstants.WEBSOCKET}?userId=${eGainServiceDesk.user.id}&sessionId=${eGainServiceDesk.sessionID}`,
            );
          }
        };

        this.socket.onerror = function onError(error) {
          console.error('error: ', error);
          return reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async openSocketToEnd(uri: string): Promise<any> {
    const userId = this.user.id;
    const sessionId = this.sessionID;
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(uri);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const eGainServiceDesk = this;

        this.socket.onopen = function onOpen(e) {
          eGainServiceDesk.endChat();
        };

        this.socket.onmessage = function onMessage(event: Event) {
          this.handleMessage(event.data);
        }.bind(this);

        this.socket.onclose = function onClose(event) {
          if (event.wasClean) {
            eGainServiceDesk.callback.setErrorStatus({
              logInfo: 'socket disconnected',
              type: ErrorType.CONNECTING,
            });
          }
          eGainServiceDesk.callback.agentEndedChat();
        };

        this.socket.onerror = function onError(error) {
          console.error('error: ', error);
          return reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calls the service desk to terminate the chat.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async endChat(): Promise<void> {
    const sessionId = this.sessionID;
    return new Promise((resolve, reject) => {
      try {
        if (!this.agentEnded) {
          this.socket.send(
            JSON.stringify({
              IBMIntegrationId: this.IBMIntegrationId,
              sessionId,
              message: 'End conversation',
            }),
          );
        }
      } catch (error) {
        return reject(error);
      }
      return resolve();
    });
  }

  /**
   * Sends a message to the agent in the service desk.
   *
   * @param message The message from the user.
   * @param messageID The unique ID of the message assigned by the widget.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket.send(
          JSON.stringify({
            IBMIntegrationId: this.IBMIntegrationId,
            sessionId: this.sessionID,
            message: message.input.text,
          }),
        );
      } catch (error) {
        return reject(error);
      }
      return resolve();
    });
  }

  /**
   * Checks if any agents are online and ready to communicate with the user.
   *
   * @returns True if agents are available, false if none are available.
   */
  async areAnyAgentsOnline(): Promise<any> {
    let isAvailable = false;
    try {
      const response = await fetch(eGainConstants.AGENT_AVAILABILITY, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`error status: ${response.status}`);
      }
      const result = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(result, 'text/xml');
      const resultArray = Array.from(xmlDoc.getElementsByTagName('agentAvailability'));
      const resultString = resultArray[0].getAttribute('available');
      if (resultString === 'true') {
        isAvailable = true;
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return isAvailable;
  }

  /**
   * Informs the service desk of a change in the state of the web chat that is relevant to the service desks. These
   * values may change at any time.
   *
   * @param state The current values of pieces of state from the main chat.
   */
  updateState(state: ServiceDeskStateFromWAC): void {
    this.user = { id: state.userID };
    this.sessionID = state.sessionID;
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
    // eGain service desk does not support userTyping functionality.
    return Promise.resolve();
  }
}

export { EgainServiceDesk };
