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

import TurndownService from 'turndown';

import { MessageRequest, MessageResponse } from '../../types/message';
import { User } from '../../types/profiles';
import { ServiceDesk, ServiceDeskFactoryParameters } from '../../types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from '../../types/serviceDeskCallback';
import { stringToMessageResponseFormat } from '../../utils';

declare global {
  interface Window {
    watsonTranscript: [Record<string, string>];
    watsonContext: {
      firstName: string;
      lastName: string;
      emailAddress: string;
    };
  }
}

/**
 * Formatting in Oracle console is output as html tags, at time of implementation Watson would parse the html tags
 * but they would stay in the message. This service replaces the html tags with markdown which the frontend webchat
 * handles fine.
 *
 * NB this may no longer be required.
 */
const tdService = new TurndownService();
tdService.addRule('text style', {
  filter: ['span'],
  replacement: (content, node) => {
    const nodeText = (node as HTMLElement).outerHTML;

    if (nodeText.includes('bold')) {
      return `** ${content} **`;
    }
    if (nodeText.includes('italic')) {
      return `* ${content} *`;
    }

    return content;
  },
});

/**
 * This class returns startChat, endChat, sendMessageToAgent, userTyping and
 * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
 */
class OracleB2CServiceDesk implements ServiceDesk {
  agentProfile: AgentProfile;
  callback: ServiceDeskCallback;
  user: User;
  sessionID: string;
  siteName: string;
  channelToken: string;
  sessionServerResponse: string;
  domain: string;
  pool: string;

  constructor(parameters: ServiceDeskFactoryParameters) {
    this.callback = parameters.callback;
    this.user = { id: '' };
  }

  /**
   * Requests Oracle Cloud for a new session and stores response details.
   * If user has provided credentials, this can be included to identify user within Oracle Cloud.
   */
  async authenticate(): Promise<void> {
    // Takes user details from watsonContext and uses this to create identifiable session
    const userInfo = window.watsonContext;
    const body = userInfo
      ? {
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          emailAddress: userInfo.emailAddress,
        }
      : {};

    // TODO Define your own Oracle Cloud authorization endpoint
    const authUrl = 'http://localhost:3000/auth';

    const resp = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const auth = await resp.json();
    console.log(auth);

    const { siteName, channelToken, sessionServerResponse } = auth;
    const { domain, pool } = JSON.parse(sessionServerResponse);

    // Store session details
    this.siteName = siteName;
    this.channelToken = channelToken;
    this.sessionServerResponse = sessionServerResponse;
    this.domain = domain;
    this.pool = pool;
  }

  /**
   * POSTs various requests to Oracle Cloud that manage chat, for more details see:
   * https://docs.oracle.com/en/cloud/saas/b2c-service/21b/cxscc/rest-endpoints.html
   *
   * @param method request method, see above url for list of available method endpoints.
   * @param payload request body, see above url for any required body parameters.
   *
   * @returns Returns the json response from Oracle Cloud.
   */
  async requestOracle(method: string, payload: Record<string, any> = {}): Promise<Record<string, any>> {
    const reqUrl = `https://${this.domain}/engagement/api/consumer/${this.siteName}/v1/${method}?pool=${this.pool}`;
    const SessionId = this.sessionID ? this.sessionID : undefined;

    console.log(reqUrl);

    const resp = await fetch(reqUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.channelToken}`,
        SessionId,
      },
      body: JSON.stringify(payload),
    });

    return resp.json();
  }

  /**
   * Sends the user's conversation with Watson to the agent.
   * Requires frontend implmentation to store messages into window.watsonTranscript.
   */
  async sendTranscript(): Promise<void> {
    if (window.watsonTranscript !== undefined) {
      try {
        // Sends as rich text (HTML tags)
        const formatted = window.watsonTranscript.map((message) => `<b>${message.sender}:</b> ${message.body}`);
        let formattedString = formatted.join('<br><br>');
        formattedString = `<b>Bot Transcript</b>${formattedString}`; // Add header
        await this.requestOracle('postMessage', { body: formattedString, richText: true });
      } catch (e) {
        console.warn(e);
      }
    }
  }

  /**
   * Actively polls Oracle Cloud to retrieve new messages
   * Assigns callbacks depending on incoming messageName, for all message types and descriptions see:
   * https://docs.oracle.com/en/cloud/saas/b2c-service/20a/cxscc/op-engagement-api-consumer-fqsitename-v1-getmessages-post.html
   */
  async pollSystemMessages(): Promise<void> {
    let connected = true;

    const processMessages = (messages: [any]) => {
      messages.forEach((message) => {
        console.log(message);
        switch (message.messageName) {
          case 'RNEngagementWaitInformationChangedMessage':
            this.callback.updateAgentAvailability({
              position_in_queue: message.position,
              estimated_wait_time: Math.ceil(message.expectedWaitTimeSeconds / 60),
            });
            break;
          case 'RNEngagementParticipantAddedMessage':
            this.callback.agentJoined({ nickname: message.name, id: message.clientId });
            // Send transcript when agent joins chat
            this.sendTranscript();

            // Sends Oracle Cloud defined greeting to user
            this.callback.sendMessageToUser(
              stringToMessageResponseFormat(tdService.turndown(message.greeting)),
              message.clientId,
            );
            break;
          case 'RNEngagementMessagePostedMessage':
            this.callback.sendMessageToUser(
              stringToMessageResponseFormat(tdService.turndown(message.body)),
              message.clientId,
            );
            break;
          case 'RNEngagementActivityChangedMessage':
            switch (message.mode) {
              case 'RESPONDING':
                this.callback.agentTyping(true);
                break;
              case 'LISTENING':
                this.callback.agentTyping(false);
                break;
              default:
                break;
            }
            break;
          case 'RNEngagementParticipantConnectionStateChangedMessage':
            if (message.connectionState !== 'DISCONNECTED') {
              break;
            }
          // eslint-disable-next-line no-fallthrough
          case 'RNEngagementParticipantLeftMessage':
          case 'RNEngagementConcludedMessage':
            this.callback.agentEndedChat();
            this.sessionID = undefined;
            connected = false;
            break;
          default:
            break;
        }
      });
    };

    while (connected) {
      // eslint-disable-next-line no-await-in-loop
      const response = await this.requestOracle('getMessages');
      const { systemMessages } = response;
      processMessages(systemMessages);
    }
  }

  /**
   * Instructs the service desk to start a new chat. If engagement is successful, start polling process and wait
   * for new messages from the agent.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully started a new chat. This does
   * not necessarily mean that an agent has joined the conversation or has read any messages sent by the user.
   */
  async startChat(connectMessage: MessageResponse): Promise<void> {
    const sessionDetails = await this.requestOracle('requestEngagement');
    this.sessionID = sessionDetails.sessionId;
    console.log('sessionId: ', this.sessionID);

    if (this.sessionID) {
      // Start listening to messages
      this.pollSystemMessages();
    } else {
      return Promise.reject();
    }

    return Promise.resolve();
  }

  /**
   * Tells the service desk to terminate the chat.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async endChat(): Promise<void> {
    await this.requestOracle('concludeEngagement');
    this.sessionID = undefined;

    return Promise.resolve();
  }

  /**
   * Sends a message to the agent in the service desk.
   *
   * @param message The message from the user.
   * @param messageID The unique ID of the message assigned by the widget.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void> {
    await this.requestOracle('postMessage', { body: message.input.text });
  }

  /**
   * Tells the service desk if a user has started or stopped typing.
   *
   * This functionality is not currently implemented in the web chat widget.
   *
   * @param isTyping If true, indicates that the user is typing. False indicates the user has stopped typing.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async userTyping(isTyping: boolean): Promise<void> {
    console.log(isTyping);
    await this.requestOracle('activity', { mode: isTyping ? 'RESPONDING' : 'LISTENING' });
  }

  /**
   * Checks if any agents are online and ready to communicate with the user.
   *
   * @param connectMessage The message that contains the transfer_info object that may be used by the service desk
   * so it can perform a more specific check.
   *
   * @returns True if agents are available, false if none are available.
   */
  async areAnyAgentsOnline(connectMessage: MessageResponse): Promise<boolean | null> {
    await this.authenticate();

    // TODO Define Oracle Cloud queue ID for Watson Webchat handoffs
    const queueId = 313;

    // chatProactiveAvailableType can be either 'AGENTS' or 'SESSIONS'
    // SESSIONS is more fine-grained where as AGENTS provides total number of agents with the 'available' status
    const statusPayload = await this.requestOracle('getQueueStats', {
      queueId,
      chatProactiveAvailableType: 'AGENTS',
    });

    console.log(statusPayload);

    return statusPayload.totalAvailableAgents > 0;
  }
}

export { OracleB2CServiceDesk };
