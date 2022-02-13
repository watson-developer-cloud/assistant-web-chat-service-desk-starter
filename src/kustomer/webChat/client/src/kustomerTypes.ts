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
declare global {
  const KustomerCore: any;
  const Kustomer: any;
}

export interface OnMessageSentResponse {
  messageId: string;
  body: string;
  createdAt: string;
  direction: string;
  conversationId: string;
  attachments: any;
  meta: {
    template: any;
    articles: any;
  };
  sentBy: {
    type: string;
    id: string;
    displayName: string;
    avatarUrl: string;
  };
}

export interface OnAgentTypingActivityResponse {
  conversationId: string;
  user: {
    avatarUrl: string;
    displayName: string;
  };
  typing: boolean;
}

export interface OnSatisfactionReceivedResponse {
  conversationId: string;
  satisfactionId: string;
  timetoken: string;
  form: {
    description: string;
    introduction: string;
    name: string;
    followupQuestion: string;
    ratingPrompt: string;
    scale: {
      options: string;
      labelLow: string;
      labelHigh: string;
      type: string;
    };
  };
  response: {
    rating: number;
    followupAnswer: string;
  };
}

export interface OnConversationEndedResponse {
  conversationId: string;
  createdAt: string;
  ended: boolean;
}

export interface OnConversationCreateResponse {
  conversationId: string;
  createdAt: string;
  ended: boolean;
  isInAssistantMode: boolean;
}

export interface OnSendMessageResponse {
  messageId: string;
  body: string;
  createdAt: string;
  direction: string;
  conversationId: string;
  attachments: any;
}
