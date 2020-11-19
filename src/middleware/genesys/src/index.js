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

import 'dotenv/config';

import axios from 'axios';
import cors from 'cors';
import express from 'express';
import qs from 'qs';
import {
  PORT,
  GENESYS_ANALYTICS_URL,
  GENESYS_QUEUE_URL,
  GENESYS_SIGNED_DATA_URL,
  GENESYS_TOKEN_URL,
  GENESYS_CLIENT_ID,
  GENESYS_CLIENT_SECRET
} from './config/constants';

const app = express();
app.use(cors());
app.use(express.json());

let accessToken;

/**
 * Get auth JWT. At the moment this token is an application level token and doesn't include info on the user.
 */
app.post('/jwt', async (_, res) => {
  if (!accessToken) await createAccessToken();

  try {
    const token = await userAuthJWT();
    res.send(token);
  } catch (error) {
    res.status(500).send(error);
  }
});

/**
 * Get info on agent availability and wait time
 */
app.post('/availability', async (req, res) => {
  const { queue } = req.body;

  if (!queue) return res.status(400).send('No queue name supplied');

  if (!accessToken) await createAccessToken();

  try {
    const agents = await getQueueInfo(queue);
    return res.send(agents);
  } catch (error) {
    return res.status(500).send(error);
  }
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

async function getQueueInfo(queue) {
  const availabilityInfo = {};

  const queueId = await getQueueID(queue);
  if (!queueId) return Promise.reject(new Error(`Unable to locate queue ID for queue name ${queue}`));

  const [queueQueryResults, estWaitTime] = await Promise.allSettled([queueQuery(queueId), getEstWaitTime(queueId)]);
  // obtain queue status
  if (queueQueryResults.status === 'fulfilled') Object.assign(availabilityInfo, queueQueryResults.value);
  // obtain wait time details
  if (estWaitTime.status === 'fulfilled') availabilityInfo.estimatedWaitTime = estWaitTime.value;

  if (Object.keys(availabilityInfo).length === 0)
    return Promise.reject(new Error(`Unable to get availability information for queue name ${queue}`));

  return availabilityInfo;
}

async function getQueueID(queueName) {
  const queueConfig = buildJSONRequest('get', GENESYS_QUEUE_URL);
  const qInfo = await axios(queueConfig);

  return qInfo.data.entities.find((q) => q.name === queueName).id;
}

/**
 * Helper function - obtain queue information based on id.
 */
async function queueQuery(queueId) {
  const queryBody = {
    filter: {
      type: 'or',
      clauses: [
        {
          type: 'or',
          predicates: [
            {
              type: 'dimension',
              dimension: 'queueId',
              operator: 'matches',
              value: queueId,
            },
          ],
        },
      ],
    },
    metrics: ['oOnQueueUsers', 'oWaiting'],
  };

  const queryConfig = buildJSONRequest('post', GENESYS_ANALYTICS_URL, queryBody);

  const query = await axios(queryConfig);

  const onQueueMetric = query.data.results.find((item) => item.data && item.data[0].metric === 'oOnQueueUsers');

  const numberOfOnQueueAgents = onQueueMetric ? onQueueMetric.data[0].stats.count : 0;

  const posInQueue = query.data.results
    .filter((item) => item.data && item.data[0].metric === 'oWaiting')
    .map((item) => item.data[0].stats.count)
    .reduce((a, b) => a + b, 0);

  return {
    numberOfOnQueueAgents,
    positionInQueue: posInQueue,
  };
}

/**
 * Helper function - obtain estimated wait time based on id.
 */
async function getEstWaitTime(queueId) {
  const url = `${GENESYS_QUEUE_URL}/${queueId}/estimatedwaittime`;

  const waitTimeConfig = buildJSONRequest('get', url);

  const waitTimeResp = await axios(waitTimeConfig);
  const waitTime = waitTimeResp.data.results[0].estimatedWaitTimeSeconds;

  if (waitTime === undefined) return -1;
  return waitTime / 60;
}

/**
 * Helper function to create an access token based on the OAuth credentials
 */
async function createAccessToken() {
  // retrieve access token
  const userAuthConfig = {
    method: 'post',
    url: GENESYS_TOKEN_URL,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${GENESYS_CLIENT_ID}:${GENESYS_CLIENT_SECRET}`,
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify({
      grant_type: 'client_credentials',
    }),
  };

  try {
    const auth = await axios(userAuthConfig);
    accessToken = auth.data.access_token;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Helper function  - obtain JWT based on access token
 */
async function userAuthJWT() {
  if (!accessToken) await createAccessToken();

  // use access token to get JWT
  const signedDataConfig = buildJSONRequest('post', GENESYS_SIGNED_DATA_URL, { body: null });
  const signedData = await axios(signedDataConfig);

  return signedData.data.jwt;
}

function buildJSONRequest(method, url, body = undefined) {
  const request = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) request.data = JSON.stringify(body);

  return request;
}