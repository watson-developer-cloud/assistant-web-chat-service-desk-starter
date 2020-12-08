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

import axios from 'axios';
import R from 'ramda';

const makeRequest = (options) => {
  return new Promise((resolve) => {
    axios(options)
      .then((output) => {
        return resolve(R.path(['data'], output));
      })
      .catch((output) => {
        const code = R.pathOr(500, ['response', 'status'], output);
        const error = R.pathOr('Internal Server Error', ['response', 'statusText'], output);
        return resolve({ error, code });
      });
  });
};

const getToken = (config) => {
  return new Promise((resolve) => {
    const key = Buffer.from(
      `${config.incontact.appName}@${config.incontact.vendorName}:${config.incontact.appId}`,
    ).toString('base64');

    const options = {
      method: 'POST',
      url: `${config.incontact.apiUri}/InContactAuthorizationServer/Token`,
      headers: {
        Authorization: `Basic ${key}`,
      },
      data: {
        grant_type: 'password',
        username: config.incontact.username,
        password: config.incontact.password,
        scope: '',
      },
      responseType: 'json',
    };

    makeRequest(options).then((output) => {
      return resolve(output);
    });
  });
};

const getSession = (token, config) => {
  return new Promise((resolve) => {
    const options = {
      method: 'POST',
      url: `${config.incontact.apiUri}/inContactAPI/services/${config.incontact.version}/contacts/chats`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        pointOfContact: config.incontact.pointOfContact,
        parameters: ['P1', config.incontact.skill, 'P3', 'P4'],
        mediaType: 3,
      },
      responseType: 'json',
    };

    makeRequest(options).then((output) => {
      return resolve(output);
    });
  });
};

const getMessage = (token, chatSessionId, config) => {
  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      url: `${config.incontact.apiUri}/inContactAPI/services/${config.incontact.version}/contacts/chats/${chatSessionId}?timeout=10`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'json',
    };

    makeRequest(options).then((output) => {
      return resolve(output);
    });
  });
};

const postMessage = (token, chatSessionId, label, message, config) => {
  return new Promise((resolve) => {
    const options = {
      method: 'POST',
      url: `${config.incontact.apiUri}/inContactAPI/services/${config.incontact.version}/contacts/chats/${chatSessionId}/send-text`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { label, message },
      responseType: 'json',
    };

    makeRequest(options).then((output) => {
      return resolve(output);
    });
  });
};

const endSession = async (token, chatSessionId, config) => {
  return new Promise((resolve) => {
    const options = {
      method: 'DELETE',
      url: `${config.incontact.apiUri}/inContactAPI/services/${config.incontact.version}/contacts/chats/${chatSessionId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'json',
    };

    makeRequest(options).then((output) => {
      return resolve(output);
    });
  });
};

const getQueue = async (token, config) => {
  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      url: `${config.incontact.apiUri}/inContactAPI/services/${config.incontact.version}/skills/${config.incontact.skill}/activity`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'json',
    };

    makeRequest(options).then((output) => {
      return resolve(output);
    });
  });
};

module.exports = {
  getToken,
  getSession,
  getQueue,
  getMessage,
  postMessage,
  endSession,
};
