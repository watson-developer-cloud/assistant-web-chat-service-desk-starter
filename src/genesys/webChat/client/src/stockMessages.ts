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

interface TEMPLATES {
  MESSAGE_TO_USER: string;
  ERROR_MESSAGE_TO_USER: string;
  SUMMARY: (string: any) => string;
  PREFIX_MESSAGE_TO_AGENT: string;
  POSTFIX_MESSAGE_TO_AGENT: string;
  MISSING_TOPIC: string;
}

export const messages: TEMPLATES = {
  PREFIX_MESSAGE_TO_AGENT: 'This customer needs assistance, below is a summary of the requested need.', // 'In the Watson Assistant widget to the right you can review the entire conversation',
  SUMMARY: (topic: any) => `Summary: ${topic !== undefined ? topic : messages.MISSING_TOPIC}`,
  POSTFIX_MESSAGE_TO_AGENT: 'To respond directly to the customer address them here.',
  MESSAGE_TO_USER: `<strong>Live agent support</strong><br>I'll notify you when an agent answers your request. Response times vary based on availability.`,
  ERROR_MESSAGE_TO_USER:
    "Hmmm... I'm experiencing some difficulties. I need a human agent to manually continue the conversation.",
  MISSING_TOPIC: 'Missing topic',
};
