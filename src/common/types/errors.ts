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
 * All the types to manage error handling from the service desk are here. We currently support errors when connecting
 * and errors that can happen that cause the session to disconnect.
 */

/**
 * The possible events that may have some form of error status.
 */
enum ErrorType {
  /**
   * This is used to indicate the state of errors that can occur while connecting to an agent.
   */
  CONNECTING = 1,

  /**
   * This is used to indicate the state of errors that can happen any time during a chat where the service desk
   * implementation has lost a connection to the back-end.
   */
  DISCONNECTED = 2,
}

/**
 * The type for the information passed to {@link ServiceDeskCallback#setErrorStatus}. It is a discriminating union
 * where the {@link #type} property is the discriminating value that determines which child interface is to be used.
 */
type ServiceDeskErrorInfo = ConnectingErrorInfo | DisconnectedErrorInfo;

/**
 * This is the parent interface for the information passed to {@link ServiceDeskCallback#setErrorStatus}. It is used
 * as a discriminating union where the {@link #type} property is the discriminating value that determines which
 * child interface is to be used.
 */
interface BaseErrorInfo {
  /**
   * An optional value that will be logged to the console as an error.
   */
  logInfo?: unknown;
}

/**
 * The interface used for connecting errors.
 */
interface ConnectingErrorInfo extends BaseErrorInfo {
  /**
   * The discriminating value for this type.
   */
  type: ErrorType.CONNECTING;
}

/**
 * This interface is used when the service desk in the chat client becomes disconnected from the remote service desk.
 */
interface DisconnectedErrorInfo extends BaseErrorInfo {
  /**
   * The discriminating value for this type.
   */
  type: ErrorType.DISCONNECTED;

  /**
   * Indicates if the service desk has become disconnected. A value of true can be passed that will indicate that a
   * previous disconnection is over and the service desk is now connected again.
   */
  isDisconnected: boolean;
}

export { ServiceDeskErrorInfo, ErrorType };
