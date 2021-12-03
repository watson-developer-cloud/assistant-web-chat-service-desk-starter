/**
 * (C) Copyright IBM Corp. 2021.
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
// eslint-disable-next-line import/no-extraneous-dependencies
import * as Flex from '@twilio/flex-ui';
// eslint-disable-next-line import/no-extraneous-dependencies
import { FlexPlugin } from 'flex-plugin';

const PLUGIN_NAME = 'WatsonAssistantAgentAppPlugin';

export default class WatsonAssistantAgentAppPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started. Use this to modify any
   * UI components or attach to the actions framework.
   */
  async init(flex: typeof Flex): Promise<void> {
    flex.CRMContainer.defaultProps.uriCallback = (task: Flex.ITask) => {
      // Pull the session history from the task attributes
      if (task?.attributes?.sessionHistoryKey) {
        const { sessionHistoryKey } = task.attributes;
        return `https://web-chat.global.assistant.watson.cloud.ibm.com/loadAgentAppFrame.html?session_history_key=${sessionHistoryKey}`;
      }
      // Return an empty string to indicate to not load the agent app iframe since there isn't any session history key in the attributes
      return '';
    };
  }
}
