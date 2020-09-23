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

import { THREAD_ID_MAIN } from './constants';
import { ServiceDeskErrorInfo } from './types/errors';
import { MessageResponse } from './types/message';
import { AgentProfile } from './types/profiles';
import { ServiceDeskFactoryParameters } from './types/serviceDesk';
import { AgentAvailability } from './types/serviceDeskCallback';

function EXAMPLE_SERVICE_DESK_FACTORY_PARAMETERS(): ServiceDeskFactoryParameters {
  return {
    callback: {
      updateAgentAvailability: jest.fn().mockImplementation((availability: AgentAvailability): void => {}),
      agentJoined: jest.fn().mockImplementation((profile: AgentProfile): void => {}),
      agentReadMessages: jest.fn().mockImplementation((): void => {}),
      agentTyping: jest.fn().mockImplementation((isTyping: boolean): void => {}),
      sendMessageToUser: jest.fn().mockImplementation((message: MessageResponse, agentID: string): void => {}),
      beginTransferToAnotherAgent: jest.fn().mockImplementation((profile?: AgentProfile): void => {}),
      agentLeftChat: jest.fn().mockImplementation((): void => {}),
      agentEndedChat: jest.fn().mockImplementation((): void => {}),
      setErrorStatus: jest.fn().mockImplementation((errorInfo: ServiceDeskErrorInfo): void => {}),
    },
  };
}

function EXAMPLE_CONNECT_MESSAGE(): MessageResponse {
  return {
    output: {
      generic: [
        {
          response_type: 'connect_to_agent',
        },
      ],
    },
    thread_id: THREAD_ID_MAIN,
    id: '1234',
  };
}

export { EXAMPLE_SERVICE_DESK_FACTORY_PARAMETERS, EXAMPLE_CONNECT_MESSAGE };
