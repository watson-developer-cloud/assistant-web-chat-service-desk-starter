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

/**
 * This class returns startChat, endChat, sendMessageToAgent, updateState, userTyping, userReadMessages and
 * areAnyAgentsOnline to be exposed to web chat through src/buildEntry.ts.
 */
class ExampleServiceDesk implements ServiceDesk {
  agentProfile: AgentProfile;
  callback: ServiceDeskCallback;
  user: User;
  sessionID: string;
  constructor(parameters: ServiceDeskFactoryParameters) {
    this.callback = parameters.callback;
    this.user = { id: '' };
    this.sessionID = '';
    this.agentProfile = EXAMPLE_AGENT_PROFILE;
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
    // Most service desks have a way to embed a custom iFrame into the agent view, as well as a way to pass metadata
    // into that iFrame. startChatOptions.agentAppInfo contains metadata for you to be able to render the conversation
    // history with Watson Assistant to your agents in a custom iFrame and this data should be passed via whatever
    // methods the service desk you are using uses.

    // In your real implementation you will want to grab this.user and this.sessionID to make available to your service desk.
    return runSteps(this, sendConnectToAgent(this, connectMessage));
  }

  /**
   * Tells the service desk to terminate the chat.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async endChat(): Promise<void> {
    this.agentProfile = EXAMPLE_AGENT_PROFILE;
  }

  /**
   * Sends a message to the agent in the service desk.
   *
   * @param message The message from the user.
   * @param messageID The unique ID of the message assigned by the widget.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void> {
    return runSteps(this, sendMessageToUser(this, message));
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
}

/**
 * Each mockStep specifies a time to wait before processing and a callback. These are passed as an array for us to
 * simply mock multi-step behavior.
 */
interface MockStep {
  /**
   * The amount of time in milliseconds to wait after the previous step.
   */
  delay: number;

  /**
   * The callback to call to run this step.
   */
  callback: (instance: ExampleServiceDesk) => void;

  /**
   * Indicates if this step should return the given promise from the sendMessageToAgent function. This should be on
   * the last step.
   */
  returnPromise?: Promise<void>;
}

const JIM_ID = 'jim';
const MCCOY_ID = 'leonard';

const EXAMPLE_AGENT_PROFILE: AgentProfile = {
  id: JIM_ID,
  nickname: 'Kirk',
};

const EXAMPLE_AGENT_PROFILE_2: AgentProfile = {
  id: MCCOY_ID,
  nickname: 'McCoy',
};

// Messages
const STRINGS = {
  hello_leonard: 'Hello, I am Dr. Leonard McCoy. How can I help?',
  hello_jim: 'Hello, I am Captain James T. Kirk. How can I help?',
  instructions: `You can send the following messages to get a specific response from me:<br/>
<u><b>help</b></u>: I will repeat these instructions.
<u><b>someone else</b></u>: I will transfer you to someone else.
<u><b>disconnect and reconnect</b></u>: I will simulate the service desk connect disconnecting and then reconnecting.
<u><b>end chat</b></u>: I will simulate the agent ending the chat.
`,
  random_leonard: [
    `I'm a doctor, not a physicist!`,
    `I'm a doctor, not an engineer!`,
    `I'm a doctor, not a veterinarian!`,
  ],
  random_jim: [
    `You know the greatest danger facing us is ourselves, an irrational fear of the unknown. But there's no such thing as the unknown - only things temporarily hidden, temporarily not understood.`,
    `There's another way to survive — mutual trust and help.`,
    `Fire photon torpedoes!`,
  ],
};

/**
 * A switch statement that routes the request to either one of our hard coded examples or to a random returned message.
 */
function sendMessageToUser(instance: ExampleServiceDesk, message: MessageRequest): MockStep[] {
  instance.callback.agentTyping(false);
  switch (message?.input?.text?.toLowerCase()) {
    case 'help':
      return sendInstructions(instance);
    case 'someone else':
      return sendTransferAgent(instance);
    case 'disconnect and reconnect':
      return sendDisconnectAndReconnect(instance);
    case 'end chat':
      return sendEndChat(instance);
    default:
      return sendRandomMessage(instance);
  }
}

/**
 * Mocks creating a new session, letting web chat know that there is a wait, having the agent join and then sending
 * some messages back to web chat.
 */
function sendConnectToAgent(instance: ExampleServiceDesk, connectMessage: MessageResponse): MockStep[] {
  // You can use pre:send and pre:receive to build up a history of the previous message to send to the agent.
  // See https://web-chat.global.assistant.watson.cloud.ibm.com/docs.html?to=api-events
  console.log('Agent was sent the following info', connectMessage);
  return [
    {
      delay: 1000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.updateAgentAvailability({ estimated_wait_time: 1 });
      },
    },
    {
      delay: 5000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentJoined(instance.agentProfile);
        instance.callback.agentTyping(true);
      },
    },
    {
      delay: 1000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentTyping(false);
        instance.callback.sendMessageToUser(
          stringToMessageResponseFormat(getHelloMessage(instance)),
          instance.agentProfile.id,
        );
      },
    },
    {
      delay: 1000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentTyping(true);
      },
    },
    {
      delay: 1000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentTyping(false);
        instance.callback.sendMessageToUser(
          stringToMessageResponseFormat(STRINGS.instructions),
          instance.agentProfile.id,
        );
      },
    },
  ];
}

/**
 * Returns mock steps to send the instructions back to the web chat.
 */
function sendInstructions(instance: ExampleServiceDesk): MockStep[] {
  return [
    {
      delay: 1000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentReadMessages();
        instance.callback.agentTyping(true);
      },
    },
    {
      delay: 1000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentTyping(false);
        instance.callback.sendMessageToUser(
          stringToMessageResponseFormat(STRINGS.instructions),
          instance.agentProfile.id,
        );
      },
    },
  ];
}

/**
 * Sends a random mock message back.
 */
function sendRandomMessage(instance: ExampleServiceDesk): MockStep[] {
  return [
    {
      delay: 500,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentReadMessages();
        instance.callback.agentTyping(true);
      },
    },
    {
      delay: 2000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentTyping(false);
        instance.callback.sendMessageToUser(
          stringToMessageResponseFormat(randomMessage(instance)),
          instance.agentProfile.id,
        );
      },
    },
  ];
}

/**
 * This example has two agents. This method will mock a transfer between them.
 */
function sendTransferAgent(instance: ExampleServiceDesk): MockStep[] {
  return [
    {
      delay: 500,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.beginTransferToAnotherAgent();
      },
    },
    {
      delay: 1000,
      callback: (instance: ExampleServiceDesk) => {
        // Set the agentProfile on the class to be able to reference.
        instance.agentProfile = instance.agentProfile.id === JIM_ID ? EXAMPLE_AGENT_PROFILE_2 : EXAMPLE_AGENT_PROFILE;

        // Let web chat know a new agent has joined.
        instance.callback.agentJoined(instance.agentProfile);
        instance.callback.agentTyping(true);
      },
    },
    {
      delay: 2000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentTyping(false);
        instance.callback.sendMessageToUser(
          stringToMessageResponseFormat(getHelloMessage(instance)),
          instance.agentProfile.id,
        );
      },
    },
    {
      delay: 500,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentTyping(true);
      },
    },
    {
      delay: 2000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.agentTyping(false);
        instance.callback.sendMessageToUser(
          stringToMessageResponseFormat(STRINGS.instructions),
          instance.agentProfile.id,
        );
      },
    },
  ];
}

/**
 * Sends the error status back to web chat mocking the service desk disconnecting and reconnecting.
 */
function sendDisconnectAndReconnect(instance: ExampleServiceDesk): MockStep[] {
  return [
    {
      delay: 1000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.setErrorStatus({ type: ErrorType.DISCONNECTED, isDisconnected: true });
      },
    },
    {
      delay: 3000,
      callback: (instance: ExampleServiceDesk) => {
        instance.callback.setErrorStatus({ type: ErrorType.DISCONNECTED, isDisconnected: false });
      },
    },
  ];
}

/**
 * Calls the instance.callback.agentLeftChat() method to make the web chat aware that the agent has left.
 */
function sendEndChat(instance: ExampleServiceDesk): MockStep[] {
  return [
    {
      delay: 0,
      callback: (instance: ExampleServiceDesk) => {
        // This method will let web chat know the agent has ended the chat.
        instance.callback.agentEndedChat();
      },
    },
  ];
}

/**
 * Returns a random message depending on which agent is active.
 */
function randomMessage(instance: ExampleServiceDesk): string {
  const items = instance.agentProfile.id === JIM_ID ? STRINGS.random_jim : STRINGS.random_leonard;
  const index = Math.floor(Math.random() * items.length);
  const message = items[index];
  return message;
}

/**
 * Returns the hello message string depending on which agent is active.
 */
function getHelloMessage(instance: ExampleServiceDesk): string {
  return instance.agentProfile.id === JIM_ID ? STRINGS.hello_jim : STRINGS.hello_leonard;
}

/**
 * This function will run a series of steps to simulate some interaction between the agent and a user with pauses
 * in between each step as defined.
 */
function runSteps(instance: ExampleServiceDesk, steps: MockStep[]): Promise<void> {
  let totalTime = 0;
  steps.forEach((step) => {
    totalTime += step.delay;
    setTimeout(() => {
      step.callback(instance);
    }, totalTime);
  });

  const lastStep = steps[steps.length - 1];
  return lastStep.returnPromise || Promise.resolve();
}

export { ExampleServiceDesk };
