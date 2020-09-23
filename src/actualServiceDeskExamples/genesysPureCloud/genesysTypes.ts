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

export interface ChatResponse {
  id?: string;
  jwt: string;
  eventStreamUri?: string;
  member: {
    id: string;
  };
  eventBody: any;
}

export interface ChatBody {
  organizationId: string;
  deploymentId: string;
  routingTarget: {
    targetType: string;
    targetAddress: string;
  };
  memberAuthToken?: string; // be sure to set this if user auth is required
  memberInfo?: {
    displayName?: string;
    avatarImageUrl?: string;
    lastName?: string;
    firstName?: string;
    email?: string;
    phoneNumber?: string;
    customFields?: { [key: string]: string };
  };
}

export interface MessageEvent {
  topicName: string;
  version: string;
  eventBody: EventBody;
  metadata: EventMetadata;
}

export interface EventBody {
  id: string;
  conversation: {
    id: string;
  };
  sender?: {
    id: string;
  };
  member?: {
    id: string;
    state: GenesysMemberState;
  };
  body?: string;
  bodyType?: GenesysBodyType;
  message?: string;
  timestamp: string;
}

export interface EventMetadata {
  CorrelationId: string;
  type: GenesysMetadataType;
}
export enum GenesysBodyType {
  STD = 'standard',
  MEMBER_JOIN = 'member-join',
  MEMBER_LEAVE = 'member-leave',
}

export enum GenesysMetadataType {
  MEMBER_CHANGE = 'member-change',
  TYPING_IND = 'typing-indicator',
  MESSAGE = 'message',
}

export enum GenesysMemberState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTED = 'CONNECTED',
  ALERTING = 'ALERTING',
}

export enum GenesysErrorText {
  CONNECTION_ERROR = 'Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.',
}

export enum GenesysErrorCode {
  USER_AUTH = 'chat.deployment.require.auth',
  CONV_STATE = 'chat.error.conversation.state',
}

export enum GenesysConstants {
  PLATFORM_CLIENT = 'platformClient',
  SCRIPT_SOURCE = 'https://sdk-cdn.mypurecloud.com/javascript-guest/5.4.0/purecloud-guest-chat-client.min.js',
}

export const HEARTBEAT = 'WebSocket Heartbeat';
export const LOG_PREFIX = '[PURECLOUD SD LOG]';
