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

import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import secure from 'express-secure-only';
import helmet from 'helmet';
import http from 'http';
import nocache from 'nocache';
import R from 'ramda';

import config from './config';
import { endSession, getMessage, getQueue, getSession, getToken, postMessage } from './incontact';

const app = express();

app.enable('strict routing');
app.enable('trust proxy');

if (process.env.NODE_ENV === 'production') {
  app.use(secure());
}

app.use(cors());
app.use(helmet({ frameguard: false, contentSecurityPolicy: false }));
app.use(compression());
app.use(nocache());
app.use(
  rateLimit({
    windowMs: 60000, // How long in milliseconds to keep records of requests in memory.
    max: 0, // Max number of connections during windowMs milliseconds before sending a 429 response. Set to 0 to disable.
  }),
);
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/incontact/queue', async (req, res) => {
  const token = R.path(['body', 'token'], req);

  const output = await getQueue(token, config);
  if (output.error) {
    return res.status(output.code).json({ error: output.error });
  }

  const queue = R.pathOr(0, ['skillActivity', 0, 'queueCount'], output);
  return res.status(200).json({ queue });
});

app.post('/incontact/start', async (req, res) => {
  const authorization = await getToken(config);

  if (authorization.error) {
    return res.status(authorization.code).json({ error: authorization.error });
  }

  const token = R.path(['access_token'], authorization);

  const session = await getSession(token, config);
  if (session.error) {
    return res.status(session.code).json({ error: session.error });
  }

  const output = R.mergeDeepRight(session, { token });
  return res.status(200).json(output);
});

app.post('/incontact/get', async (req, res) => {
  const chatSessionId = R.path(['body', 'chatSessionId'], req);
  const token = R.path(['body', 'token'], req);

  const result = await getMessage(token, chatSessionId, config);
  if (result.error && result.code !== 304 && result.code !== 404) {
    return res.status(result.code).json({ error: result.error });
  }

  const iterator = {};

  if (result.code === 304) {
    iterator.chatSessionId = req.body.chatSessionId;
    iterator.messages = [];
  } else if (result.code === 404) {
    iterator.chatSessionId = req.body.chatSessionId;
    iterator.messages = [{ Type: 'Status', Status: 'Disconnected' }];
  } else {
    iterator.chatSessionId = result.chatSession;
    iterator.messages = result.messages;
  }

  const messages = [];

  let agent;
  let typing;
  let status;

  iterator.messages = iterator.messages.filter((message) => {
    return message.Label !== 'User';
  });

  for (let i = 0; i < iterator.messages.length; i++) {
    const incontact = iterator.messages[i];

    const Party =
      (incontact.PartyTypeValue === 'System' && incontact.PartyTypeId === 1) ||
      (incontact.PartyTypeValue === 'Agent' && incontact.PartyTypeId === 2);
    const Status = incontact.Type === 'Status';
    const Text = incontact.Type === 'Text' || incontact.Type === 'Ask';
    const AgentTyping = incontact.Type === 'AgentTyping';
    const Label = incontact.Label ? R.includes('|', incontact.Label) : undefined;

    if (Status) {
      status = incontact.Status;
    }

    if (Text && Party) {
      if (incontact.Text !== '$Localized:ChatSessionEnded') {
        messages.push(incontact.Text);
      }
    }

    if (AgentTyping) {
      typing = incontact.IsTyping === 'True';
    }

    if (Label) {
      const parts = incontact.Label.split('|');
      agent = { id: parts[1], nickname: parts[0] };
    }
  }

  const output = {
    chatSessionId: iterator.chatSessionId,
    messages,
    status,
    typing,
    agent,
  };

  return res.status(200).json(output);
});

app.post('/incontact/post', async (req, res) => {
  const chatSessionId = R.path(['body', 'chatSessionId'], req);
  const message = R.path(['body', 'message'], req);
  const token = R.path(['body', 'token'], req);
  const label = R.path(['body', 'label'], req);

  const result = await postMessage(token, chatSessionId, label, message, config);
  if (result.error) {
    return res.status(result.code).json({ error: result.error });
  }
  return res.status(200).json({ post: true });
});

app.post('/incontact/end', async (req, res) => {
  if (typeof req.body === 'string') {
    req.body = JSON.parse(req.body);
  }

  const chatSessionId = R.path(['body', 'chatSessionId'], req);
  const token = R.path(['body', 'token'], req);

  const result = await endSession(token, chatSessionId, config);
  if (result.error) {
    return res.status(result.code).json({ error: result.error });
  }
  return res.status(200).json({ end: true });
});

http.createServer(app).listen(config.app.port, () => {
  console.log(`Worker ${process.pid} is listening to all incoming requests on ${config.app.port} port`);
});
