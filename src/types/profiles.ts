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

/* eslint-disable camelcase */

/**
 * This file contains the profile objects for both the end user and the agent.
 */

/**
 * Profile information about a specific agent that can be used to display information to the user.
 */
interface AgentProfile {
  /**
   * A unique identifier for this agent.
   */
  id: string;

  /**
   * The visible name for the agent. Can be the full name or just a first name.
   */
  nickname: string;

  /**
   * A url pointing to an avatar for the agent. JPG, GIF, etc accepted. Minimum size of 64px x 64px.
   */
  profile_picture_url?: string;
}

/**
 * Minimum values of a user profile.
 */
interface User {
  /**
   * A unique identifier for this user.
   */
  id: string;
}

export { AgentProfile, User };
