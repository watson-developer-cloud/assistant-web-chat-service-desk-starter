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

export const LOG_PREFIX = '[eGainServiceDesk]';

// Indicates that an endpoint is "going away", such as a server going down or a browser having navigated away from a page.
export const SOCKET_TIMEOUT_CODE = 1001;

// An expression used to find HTML links in the incoming message.
export const FIND_LINKS = /<a .*?href="(.*?)".*?>(.*?)<\/a>/g;

// Used to replace an HTML link with a markdown link.
export const REPLACE_LINKS_WITH_MARKDOWN = '[$2]($1)';

// The following fields must be filled in from the information gathered during the account setup. Please refer to the README for detailed instructions.
export const AGENT_AVAILABILITY = '';

export const INITIALIZE = '';

export const WEBSOCKET = '';

export const CUSTOMER_ID = '';
