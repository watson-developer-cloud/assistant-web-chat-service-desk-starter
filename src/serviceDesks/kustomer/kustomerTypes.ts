/**
 * (C) Copyright Kustomer 2020.
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

export interface onMessageSentResponse {
    messageId: string,
    body: string,
    createdAt: string,
    direction: string,
    conversationId: string,
    attachments: any,
    meta: {
        template: any,
        articles: any
    },
    sentBy: {
        type: string
        id: string,
        displayName: string,
        avatarUrl: string
    }
}

export interface onAgentTypingActivityResponse {
    conversationId: string,
    user: {
        avatarUrl: string,
        displayName: string,
    },
    typing: boolean
}


export interface onSatisfactionReceivedResponse {
    conversationId: string,
    satisfactionId: string,
    timetoken: string,
    form: {
      description: string,
      introduction: string,
      name: string,
      followupQuestion: string,
      ratingPrompt: string,
      scale: {
        options: string,
        labelLow: string,
        labelHigh: string,
        type: string,
      },
    },
    response: {
      rating: number,
      followupAnswer: string,
    },
}

export interface onConversationEndedResponse {
    conversationId: string,
    createdAt: string,
    ended: boolean
}


export interface onConversationCreateResponse {
    conversationId: string,
    createdAt: string,
    ended: boolean,
    isInAssistantMode: boolean 
}

export interface onSendMessageResponse {
    messageId: string,
    body: string,
    createdAt: string,
    direction: string,
    conversationId: string,
    attachments: any
}