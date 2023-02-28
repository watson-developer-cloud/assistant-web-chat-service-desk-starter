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

import { MessageRequest, MessageResponse } from 'common/types/message';
import {
  ServiceDesk,
  ServiceDeskFactoryParameters,
  ServiceDeskStateFromWAC,
  StartChatOptions,
} from 'common/types/serviceDesk';
import { ServiceDeskCallback } from 'common/types/serviceDeskCallback';
import { stringToMessageResponseFormat } from 'common/utils';
import { v4 as uuidv4 } from 'uuid';

import {
  AGENT_AVAILABILITY,
  CUSTOMER_ID,
  FIND_LINKS,
  INITIALIZE,
  LOG_PREFIX,
  REPLACE_LINKS_WITH_MARKDOWN,
  SOCKET_TIMEOUT_CODE,
  WEBSOCKET,
} from './eGainConstants';

/**
 * This class returns startChat, endChat, sendMessageToAgent, updateState, userTyping, userReadMessages and
 * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
 */
class EgainServiceDesk implements ServiceDesk {
  callback: ServiceDeskCallback;

  /**
   * The ID of the current user.
   */
  userID: string;

  /**
   * An authentication token received upon initialization for the current session.
   */
  sessionToken: string;

  /**
   * The ID representing the current session with the agent.
   */
  sessionId: string;

  /**
   * The websocket object that messages are passed through.
   */
  socket: WebSocket;

  /**
   * A boolean to represent if the agent has ended the conversation.
   */
  agentEnded: boolean;

  constructor(parameters: ServiceDeskFactoryParameters) {
    this.callback = parameters.callback;
  }

  // Public ServiceDesk Methods

  /**
   * Returns a name for this service desk integration. This value should reflect the name of the service desk that is
   * being integrated to. This information will be reported to IBM and may be used to gauge interest in various
   * service desks for the possibility of creating fully supported out-of-the-box implementations.
   *
   * This value is required for custom service desks and may have a maximum of 40 characters.
   */
  getName() {
    return 'egain';
  }

  /**
   * Instructs the service desk to start a new chat. This should be called immediately after the service desk
   * instance has been created. It will make the appropriate calls to the service desk and begin communicating back
   * to the calling code using the callback produce to the instance. This may only be called once per instance.
   *
   * @param connectMessage The original server message response that caused the connection to an agent. It will
   * contain specific information to send to the service desk as part of the connection. This can include things
   * like a message to display to a human agent.
   * @param startChatOptions Starting with version 4.5.0 of web chat, a set of options that can be applied when
   * starting a new chat. This includes metadata on how to add chat transcripts to your agent's view.
   * @returns Returns a Promise that resolves when the service desk has successfully started a new chat. This does
   * not necessarily mean that an agent has joined the conversation or has read any messages sent by the user.
   */
  async startChat(connectMessage: MessageResponse, startChatOptions?: StartChatOptions): Promise<void> {
    this.sessionId = uuidv4();
    this.agentEnded = false;
    await this.initialize(this.sessionId, this.userID);
    await this.openWebSocket(
      `${WEBSOCKET}?userId=${this.userID}&sessionId=${this.sessionId}&sessionToken=${this.sessionToken}`,
    );
  }

  /**
   * Calls the service desk to authorize and initialize chat.
   *
   * @returns This will either throw an error that will be handled by startChat or return nothing.
   */
  async initialize(sessionId: string, userId: string): Promise<void> {
    const response = await fetch(INITIALIZE, {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        userId,
      }),
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
        // The btoa function is deprecated for NodeJS but in a web browser we can use window.btoa to avoid the warning.
        Authorization: window.btoa(CUSTOMER_ID),
      },
    });

    if (!response.ok) {
      console.error(`${LOG_PREFIX} Error initializing`);
      throw new Error(`error status: ${response.status}`);
    }

    const data = await response.json();
    this.sessionToken = data.sessionToken;
  }

  /**
   * Handles the incoming messages on the socket and displays them to the user.
   */
  handleMessage(event: string): void {
    let message;
    try {
      message = JSON.parse(event);
      // The sessionToken generated by the server during initialize is passed back with every message for authentication.
      if (this.sessionToken === message.authorization) {
        if (message.status) {
          if (message.status === 'Conversation ended') {
            this.socket.close();
          }
        } else if (message.eGainMessage) {
          const eGainMessage = JSON.parse(message.eGainMessage);
          let messageContent = eGainMessage.value;
          // If the message contains an HTML link, then extract the URL and send that to the user.
          if (event.includes('href=') && event.includes('<a')) {
            this.callback.sendMessageToUser(stringToMessageResponseFormat(this.extractLinks(messageContent)), '');
          } else {
            const messageType = eGainMessage.type;
            if (messageType === 'agent.unavailable') {
              // When all agents become unavailable after they were first successfully checked by webchat but before an agent is requested. This will terminate the request and requires the user to request an agent again.
              this.callback.agentEndedChat();
            } else if (messageType === 'text') {
              // Removes the agent typing message in case the typing.end message is not recevied.
              this.callback.agentTyping(false);
              if (messageContent === 'agent.end.conversation') {
                this.agentEnded = true;
                this.callback.agentEndedChat();
                this.socket.close();
              } else {
                this.callback.sendMessageToUser(stringToMessageResponseFormat(messageContent), '');
              }
            } else if (messageType === 'typing.start') {
              this.callback.agentTyping(true);
            } else if (messageType === 'typing.end') {
              this.callback.agentTyping(false);
            } else if (messageType === 'agent.join') {
              messageContent = JSON.parse(messageContent);
              this.callback.agentJoined({
                id: '',
                nickname: messageContent.agentName || '',
              });
            } else if (messageType === 'conversation.state') {
              // Unused message type that may be useful in the future.
            } else {
              console.error(`${LOG_PREFIX} Unknown message type:`, messageType);
            }
          }
        }
      } else {
        throw new Error('Unauthorized');
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} An error occurred while handling the message`, error);
    }
  }

  /**
   * Finds all instances of an HTML link in the message and converts them into markdown links. If the link contains a rel or target property, it will add this to the markdown link.
   *
   * @param message The incoming message from the agent containing at least one HTML link.
   */
  extractLinks(message: string): string {
    return message.replace(FIND_LINKS, REPLACE_LINKS_WITH_MARKDOWN);
  }

  /**
   * Opens the websocket connection to pass messages between the user and agent.
   * In the event the socket disconnects due to the default 10 minute time out period being reached, the chat will be ended by the agent.
   *
   * @param uri Uri containing query parameters userId, sessionId, and sessionToken.
   */
  async openWebSocket(uri: string): Promise<void> {
    this.socket = new WebSocket(uri);

    this.socket.onopen = () => {
      this.socket.send(
        JSON.stringify({
          userId: this.userID,
          sessionId: this.sessionId,
          CustomerId: CUSTOMER_ID,
          sessionToken: this.sessionToken,
        }),
      );
    };

    this.socket.onmessage = (event) => {
      return typeof event.data === 'string'
        ? this.handleMessage(event.data)
        : console.error(`${LOG_PREFIX} Unknown event received: ${event.data}`);
    };

    this.socket.onclose = (event) => {
      // If the user or agent does not send any messages for 10 minutes, the socket will time out and automatically disconnect, ending the chat.
      if (event.code === SOCKET_TIMEOUT_CODE) {
        this.callback.agentEndedChat();
      }
    };

    this.socket.onerror = (error) => {
      console.error(`${LOG_PREFIX} Socket error`, error);
    };
  }

  /**
   * Tells the service desk to terminate the chat.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async endChat(): Promise<void> {
    if (!this.agentEnded) {
      this.socket.send(
        JSON.stringify({
          CustomerId: CUSTOMER_ID,
          sessionId: this.sessionId,
          message: 'End conversation',
          sessionToken: this.sessionToken,
        }),
      );
    }
  }

  /**
   * Sends a message to the agent in the service desk.
   *
   * @param message The message from the user.
   * @param messageID The unique ID of the message assigned by the widget.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void> {
    this.socket.send(
      JSON.stringify({
        CustomerId: CUSTOMER_ID,
        sessionId: this.sessionId,
        message: message.input.text,
        sessionToken: this.sessionToken,
      }),
    );
  }

  /**
   * Checks if any agents are online and ready to communicate with the user.
   *
   * @returns True if agents are available, false if none are available.
   */
  async areAnyAgentsOnline(): Promise<boolean | null> {
    const response = await fetch(AGENT_AVAILABILITY);
    if (!response.ok) {
      throw new Error(`error status: ${response.status}`);
    }
    const result = await response.text();
    const xmlDoc = new DOMParser().parseFromString(result, 'text/xml');
    const resultArray = Array.from(xmlDoc.getElementsByTagName('agentAvailability'));
    const resultString = resultArray[0].getAttribute('available');
    return resultString === 'true';
  }

  /**
   * Informs the service desk of a change in the state of the web chat that is relevant to the service desks. These values may change at any time.
   *
   * @param state The current values of pieces of state from the main chat.
   */
  updateState(state: ServiceDeskStateFromWAC): void {
    this.userID = state.userID;
  }

  /**
   * Tells the service desk if a user has started or stopped typing.
   *
   * @param isTyping If true, indicates that the user is typing. False indicates the user has stopped typing.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async userTyping(isTyping: boolean): Promise<void> {
    // eGain service desk does not support userTyping functionality.
  }
}

export { EgainServiceDesk };
