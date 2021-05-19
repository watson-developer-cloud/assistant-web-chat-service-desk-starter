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

import { ErrorType } from '../../types/errors';
import { MessageRequest, MessageResponse } from '../../types/message';
import { ServiceDesk, ServiceDeskFactoryParameters, ServiceDeskStateFromWAC } from '../../types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from '../../types/serviceDeskCallback';
import { stringToMessageResponseFormat } from '../../utils';
import { InContactSession } from './inContactTypes';

class InContactServiceDesk implements ServiceDesk {
  callback: ServiceDeskCallback;

  state: any;

  /**
   * Object obtained from a call to the endpoint that is needed for all calls.
   */
  session: InContactSession;

  /**
   * The profile information for the current agent.
   */
  agent: AgentProfile = { id: 'liveagent', nickname: 'Live Agent' };

  /**
   * The object that controls the current polling operation. A new object is created each time polling begins and
   * that polling can be stopped by setting the value in here to true.
   */
  private poller: { stop: boolean };

  /**
   * The URL of the server that will make requests to Patron API
   */
  private SERVER_BASE_URL: string = process.env.SERVER_BASE_URL || 'http://localhost:3000';

  constructor(parameters: ServiceDeskFactoryParameters) {
    this.callback = parameters.callback;
  }

  async endChat(): Promise<void> {
    // Stop polling as we don't want to keep doing it even if we fail to tell inContact the chat is over. We'll stop the current poller and clear this so we can get a new poller the next time we start polling.
    if (this.poller) {
      this.poller.stop = true;
      this.poller = undefined;
    }

    try {
      const request = await fetch(`${this.SERVER_BASE_URL}/incontact/end`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(this.session),
      });
      await request.json();
    } catch (error) {
      throw new Error(error);
    }

    return Promise.resolve();
  }

  async sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void> {
    try {
      const request = await fetch(`${this.SERVER_BASE_URL}/incontact/post`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...this.session, message: message.input.text, label: 'User' }),
      });
      await request.json();
    } catch (error) {
      throw new Error(error);
    }
    return Promise.resolve();
  }

  async startChat(connectMessage: MessageResponse): Promise<void> {
    try {
      const request = await fetch(`${this.SERVER_BASE_URL}/incontact/start`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const output = await request.json();
      if (output.chatSessionId) {
        this.session = output;
      }
    } catch (error) {
      throw new Error(error);
    }

    // The before unload event is fired when the window, the document and its resources are about to be unloaded.
    window.addEventListener('unload', (event) => {
      navigator.sendBeacon(`${this.SERVER_BASE_URL}/incontact/end`, JSON.stringify(this.session)); // https://golb.hplar.ch/2018/09/beacon-api.html
    });

    try {
      await this.startPolling();
    } catch (error) {
      throw new Error(error);
    }

    return Promise.resolve();
  }

  updateState(state: ServiceDeskStateFromWAC): void {
    this.state = state;
  }

  private async startPolling(): Promise<void> {
    const poller = { stop: false };
    this.poller = poller;

    do {
      try {
        // eslint-disable-next-line no-await-in-loop
        const request = await fetch(`${this.SERVER_BASE_URL}/incontact/get`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(this.session),
        });
        // eslint-disable-next-line no-await-in-loop
        const output = await request.json();
        if (output.status) {
          switch (output.status) {
            case 'Active':
              // For production, should change this to load in actual agent profile info
              this.callback.agentJoined(this.agent);
              break;
            case 'Waiting':
              try {
                // eslint-disable-next-line no-await-in-loop
                const request = await fetch(`${this.SERVER_BASE_URL}/incontact/queue`, {
                  method: 'POST',
                  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                  body: JSON.stringify(this.session),
                });
                // eslint-disable-next-line no-await-in-loop
                const output = await request.json();
                if (output.queue !== undefined) {
                  // Add one since queue value is 0 when there is no line
                  this.callback.updateAgentAvailability({ position_in_queue: output.queue + 1 });
                }
              } catch (error) {
                // Do not stop polling when queue call fails
                console.error('Unable to retrieve queue information.');
              }
              break;
            case 'Disconnected':
              this.callback.agentEndedChat();
              poller.stop = true;
              break;
            default:
              break;
          }
        }

        if (output.typing !== undefined) {
          this.callback.agentTyping(output.typing);
        }

        // Update active agent - not currently functional, but can be used to update agent profile if you can retrieve agent information from InContact
        if (output.agent?.id) {
          if (this.agent.id !== output.agent.id) {
            this.callback.agentJoined(output.agent);
            this.agent = output.agent;
          }
        }

        // If there are new messages from agent, relay to user
        if (output.messages?.length > 0) {
          for (let i = 0; i < output.messages.length; i++) {
            this.callback.sendMessageToUser(stringToMessageResponseFormat(output.messages[i]), this.agent.id);
          }
        }

        if (output.error) {
          this.callback.setErrorStatus({ type: ErrorType.DISCONNECTED, isDisconnected: true });
          poller.stop = true;
        }

        // Set updated chatSessionId as provided by InContact
        if (output.chatSessionId) {
          this.session.chatSessionId = output.chatSessionId;
        }
      } catch (error) {
        this.callback.setErrorStatus({ type: ErrorType.DISCONNECTED, isDisconnected: true });
        poller.stop = true;
      }
    } while (!poller.stop);

    return Promise.resolve();
  }
}

export { InContactServiceDesk };
