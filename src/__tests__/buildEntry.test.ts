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

import WebChatServiceDeskFactory from '../buildEntry';
import { EXAMPLE_SERVICE_DESK_FACTORY_PARAMETERS } from '../testHelpers';

describe('src/buildEntry.ts', () => {
  it('correctly initializes an instance of WebChatServiceDeskFactory', () => {
    const obj = WebChatServiceDeskFactory(EXAMPLE_SERVICE_DESK_FACTORY_PARAMETERS());
    expect(typeof obj.startChat).toBe('function');
    expect(typeof obj.endChat).toBe('function');
    expect(typeof obj.sendMessageToAgent).toBe('function');
    if (obj.userTyping) {
      expect(typeof obj.userTyping).toBe('function');
    }
    if (obj.userReadMessages) {
      expect(typeof obj.userReadMessages).toBe('function');
    }
  });
});
