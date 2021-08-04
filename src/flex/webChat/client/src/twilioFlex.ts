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
import { Client } from 'twilio-chat';
import { Channel } from 'twilio-chat/lib/channel';
import { Member } from 'twilio-chat/lib/member';
import { Message } from 'twilio-chat/lib/message';

import { ConnectToAgentItem, MessageRequest, MessageResponse } from '../../../../common/types/message';
import { User } from '../../../../common/types/profiles';
import { ServiceDesk, ServiceDeskFactoryParameters } from '../../../../common/types/serviceDesk';
import { AgentProfile, ServiceDeskCallback } from '../../../../common/types/serviceDeskCallback';
import { stringToMessageResponseFormat } from '../../../../common/utils';

/**
 * This class returns startChat, endChat, sendMessageToAgent, userTyping and userReadMessages to be exposed to web chat
 * through src/buildEntry.ts.
 */
class TwilioFlex implements ServiceDesk {
  twilioChannel: Channel;
  twilioAgent: Member;
  agentProfile: AgentProfile;
  callback: ServiceDeskCallback;
  user: User;
  sessionID: string;
  constructor(parameters: ServiceDeskFactoryParameters) {
    this.callback = parameters.callback;
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
   * @returns Returns a Promise that resolves when the service desk has successfully started a new chat. This does
   * not necessarily mean that an agent has joined the conversation or has read any messages sent by the user.
   */
  async startChat(connectMessage: MessageResponse): Promise<void> {
    /* 
     The following code will go to the local middleware to fetch Auth information for the Twilio and token for the user.
     Please change the middleware implementation according to your needs. 
     */
    const authPromise = await fetch('http://localhost:4000/auth');
    const channelToken = await authPromise.json();
    console.log(channelToken);
    console.log(JSON.stringify(connectMessage));

    // Change the loglevel according to your needs - warn/error/silent etc.
    const clientOptions: Client.Options = { logLevel: 'info' };
    const client = await Client.create(channelToken.token, clientOptions);
    this.twilioChannel = await client.getChannelByUniqueName(channelToken.channelId);
    const myIdentity = channelToken.identity;
    console.log(`channel status: ${this.twilioChannel.status}`);

    if (this.twilioChannel.status !== 'joined') {
      // the channel status is already joined as this is happening in middleware
      await this.twilioChannel.join();
    }

    this.twilioChannel.on('messageAdded', (msg: Message) => {
      console.log(`New message in channel : ${msg.author}, ${msg.body}`);
      console.log(msg.author, this.agentProfile);
      if (this.agentProfile && msg.author === this.agentProfile.nickname) {
        this.callback.sendMessageToUser(stringToMessageResponseFormat(msg.body), this.agentProfile.id);
        // for complete message consumed implementation refer: https://www.twilio.com/docs/chat/consumption-horizon
        // the following code will crudely set everything as consumed/read
        this.callback.agentReadMessages();
      }
    });

    // A channel's attributes or metadata have changed.
    this.twilioChannel.on('channelUpdated', (channel: Channel) => {
      console.log(`Channel updates: ${channel.updateAttributes}`);
    });

    // const memberCount = this.twilioChannel.getMembersCount();
    // console.log(`memberCount: ${memberCount}`);
    (await this.twilioChannel.getMembers()).forEach((member) => {
      if (member.identity !== myIdentity) {
        // must be an agent
        this.twilioAgent = member;
        this.agentProfile = {
          id: member.sid,
          nickname: member.identity,
        };
        console.log(`Joined Member/agent: ${member.identity}`);
        this.callback.agentJoined(this.agentProfile);
      }
    });

    // Listen for members joining a channel
    this.twilioChannel.on('memberJoined', (member: Member) => {
      this.twilioAgent = member;
      this.agentProfile = {
        id: member.sid,
        nickname: member.identity,
      };

      // this.agentProfile.nickname = member.identity;
      // For Agent Avatar/picture, use the attribute this.agentProfile.profile_picture_url = member.xxxx

      // this could be a agent transfer as well
      this.callback.agentJoined(this.agentProfile);
      console.log(`${member.identity} has joined the channel.`);
    });

    // Listen for members user info changing
    this.twilioChannel.on('memberInfoUpdated', (member: Member) => {
      console.log(`${member.identity} updated their info.`);
    });

    // Listen for members leaving a channel
    this.twilioChannel.on('memberLeft', (member: Member) => {
      console.log(`${member.identity} has left the channel.`);
      this.callback.agentLeftChat();
      // The chat ends here if one of the member drops. However, in case of agent transfer this is not true. This has to be handled accordingly.
      this.callback.agentEndedChat();
    });

    // Listen for members typing
    this.twilioChannel.on('typingStarted', (member: Member) => {
      this.callback.agentTyping(true);
      console.log(`${member.identity} is currently typing.`);
    });

    // Listen for members typing
    this.twilioChannel.on('typingEnded', (member) => {
      this.callback.agentTyping(false);
      console.log(`${member.identity} has stopped typing.`);
    });

    this.twilioChannel.on('memberUpdated', (event) => {
      // updateMemberMessageReadStatus(event.member.identity,
      //                               event.member.lastConsumedMessageIndex,
      //                               event.member.lastConsumptionTimestamp);
      const updatedMember = event.member as Member;
      console.log(`memberUpdated: ${updatedMember}`);
    });

    // instance.callback.beginTransferToAnotherAgent();
    // instance.callback.updateAgentAvailability({ estimated_wait_time: 1 });

    (await this.twilioChannel.getMessages()).items.forEach((msg: Message) => {
      // handle the previous messages. careful consideration should be given to  consumption horizon https://www.twilio.com/docs/chat/consumption-horizon
      console.log(`Message received upfront: ${msg}`);
    });

    const responses = connectMessage.output.generic;
    const connectToAgent = responses.find((value) => value.response_type === 'connect_to_agent') as ConnectToAgentItem;
    if (!connectToAgent) {
      console.error(`No connect to agent response has been configured for this assistant.`);
      return Promise.reject();
    }

    // You can also get connectToAgent.topic and connectToAgent.dialog_node and use it as a first message to the agent.
    // connectToAgent.transfer_info has more information that could be used for routing as well.
    await this.twilioChannel.sendMessage(connectToAgent.message_to_human_agent);
    return Promise.resolve();
  }

  /**
   * Tells the service desk to terminate the chat.
   *
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async endChat(): Promise<void> {
    // Delete a previously created Channel
    await this.twilioChannel.leave();
    // this.twilioChannel.delete().then((channel: Channel) => {
    //   console.log(`Deleted channel: ${channel.sid}`);
    // });
  }

  /**
   * Sends a message to the agent in the service desk.
   *
   * @param message The message from the user.
   * @param messageID The unique ID of the message assigned by the widget.
   * @returns Returns a Promise that resolves when the service desk has successfully handled the call.
   */
  async sendMessageToAgent(message: MessageRequest, messageID: string): Promise<void> {
    // for complete message consumed implementation refer: https://www.twilio.com/docs/chat/consumption-horizon
    // the following code will crudely set everything as consumed/read
    await this.twilioChannel.setAllMessagesConsumed();

    // send the message to the agent
    await this.twilioChannel.sendMessage(message.input.text);
  }

  async userTyping(isTyping: boolean): Promise<void> {
    console.log(`User typing ${isTyping}`);
    this.twilioChannel.typing();
  }
}

export { TwilioFlex };
