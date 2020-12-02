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

import axios, { AxiosRequestConfig, Method } from 'axios';
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
  GENESYS_CLIENT_SECRET,
  ORGANIZATION_ID,
  DEPLOYMENT_ID,
  QUEUE_TARGET,
  AUTH_SERVER_BASE_URL
} from './config/constants';

// set up rate limiter: maximum of five requests per minute
var RateLimit = require('express-rate-limit');
var limiter = new RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 5
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(limiter);

let accessToken: string;

/**
 * Get setup variables.
 */
app.get('/setup', async (_: express.Request, res: express.Response) => {
  try {
    const env = {
      org_id: ORGANIZATION_ID,
      deployment_id: DEPLOYMENT_ID,
      queue_target: QUEUE_TARGET,
      auth_server_base_url: AUTH_SERVER_BASE_URL,
    }
    res.send(env);
  } catch (error) {
    console.log(error);
    res.status(500);
    res.end("An exception occurred");
  }
});

/**
 * Get auth JWT. At the moment this token is an application level token and doesn't include info on the user.
 */
app.post('/jwt', async (_: express.Request, res: express.Response) => {
  if (!accessToken) await createAccessToken();

  try {
    const token = await userAuthJWT();
    res.send(token);
  } catch (error) {
    console.log(error);
    res.status(500);
    res.end("An exception occurred");
  }
});

/**
 * Get info on agent availability and wait time.
 */
app.post('/availability', async (req: express.Request, res: express.Response) => {
  const { queue_name } = req.body;

  if (!queue_name) return res.status(400).send('No queue name supplied');
  if (!accessToken) await createAccessToken();

  try {
    const agents = await getQueueInfo(queue_name);
    res.send(agents);
  } catch (error) {
    console.log(error);
    res.status(500);
    res.end("An exception occurred");
  }
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

/**
 * Helper function that obtains queue information based on the name.
 */
async function getQueueInfo(queueName: string): Promise<any> {
  const availabilityInfo = {
    estimatedWaitTime: 0,
  };

  const queueId = await getQueueID(queueName);
  if (!queueId) return Promise.reject(new Error(`Unable to locate queue ID for queue name ${queueName}`));

  const [queueQueryResults, estWaitTime] = await Promise.allSettled([queryForQueue(queueId), getEstimatedWaitTime(queueId)]);
  // obtain queue status
  if (queueQueryResults.status === 'fulfilled') Object.assign(availabilityInfo, queueQueryResults.value);
  // obtain wait time details
  if (estWaitTime.status === 'fulfilled') availabilityInfo.estimatedWaitTime = estWaitTime.value;

  if (Object.keys(availabilityInfo).length === 0) {
    return Promise.reject(new Error(`Unable to get availability information for queue name ${queueName}`));
  }

  return availabilityInfo;
}

/**
 * Helper function to grab the queue id based on the name.
 */
async function getQueueID(queueName: string) {
  const queueConfig = buildJSONRequest('GET', GENESYS_QUEUE_URL);
  const qInfo = await axios(queueConfig);

  return qInfo.data.entities.find((q: any) => q.name === queueName).id;
}

/**
 * Helper function that obtains queue information based on id.
 */
async function queryForQueue(queueId: string): Promise<any> {
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

  const queryConfig = buildJSONRequest('POST', GENESYS_ANALYTICS_URL, queryBody);
  const query = await axios(queryConfig);

  const onQueueMetric = query.data.results.find((item: any) => item.data && item.data[0].metric === 'oOnQueueUsers');
  const numberOfOnQueueAgents = onQueueMetric ? onQueueMetric.data[0].stats.count : 0;

  const posInQueue = query.data.results
    .filter((item: any) => item.data && item.data[0].metric === 'oWaiting')
    .map((item: any) => item.data[0].stats.count)
    .reduce((a: number, b: number) => a + b, 0);

  return {
    numberOfOnQueueAgents,
    positionInQueue: posInQueue,
  };
}

/**
 * Helper function that obtains estimated wait time based on id.
 */
async function getEstimatedWaitTime(queueId: string): Promise<number> {
  const url = `${GENESYS_QUEUE_URL}/${queueId}/estimatedwaittime`;

  const waitTimeConfig = buildJSONRequest('GET', url);

  const waitTimeResp = await axios(waitTimeConfig);
  const waitTime = waitTimeResp.data.results[0].estimatedWaitTimeSeconds;

  if (waitTime === undefined) return -1;
  return waitTime / 60;
}

/**
 * Helper function to create an access token based on the OAuth credentials.
 */
async function createAccessToken(): Promise<void> {
  // retrieve access token
  const userAuthConfig: AxiosRequestConfig = {
    method: 'POST',
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
 * Helper function for obtaining JWT based on access token.
 */
async function userAuthJWT(): Promise<string> {
  if (!accessToken) await createAccessToken();

  // use access token to get JWT
  const signedDataConfig = buildJSONRequest('POST', GENESYS_SIGNED_DATA_URL, { body: null });
  const signedData = await axios(signedDataConfig);

  return signedData.data.jwt;
}

/**
 * Helper function that builds JSON request.
 */
function buildJSONRequest(method: Method, url: string, body: any = undefined): AxiosRequestConfig {
  const request: AxiosRequestConfig = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    request.data = JSON.stringify(body);
  }

  return request;
}