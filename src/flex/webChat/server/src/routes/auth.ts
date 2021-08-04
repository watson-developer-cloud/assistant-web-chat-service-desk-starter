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
import * as dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import twilio from 'twilio';
import AccessToken, { ChatGrant } from 'twilio/lib/jwt/AccessToken';

// initialize the dotenv
dotenv.config();

export const AuthRouter = express.Router({
  strict: true,
});

AuthRouter.get('/', async (_req: Request, res: Response) => {
  const twilioAccountSid = process.env.ACCOUNT_ID || '';
  console.log(twilioAccountSid);
  const authToken = process.env.AUTH_TOKEN || '';
  const client = twilio(twilioAccountSid, authToken);
  const flexFlowSid = process.env.FLEX_FLOW_ID || '';
  let channelId = '';
  const identity = 'jane@example.com';
  const channel = client.flexApi.channel
    .create({
      target: identity,
      identity,
      chatUserFriendlyName: 'Jane',
      chatFriendlyName: 'Chat with Jane',
      flexFlowSid,
    })
    .then((channel) => {
      console.log(`Received channel with channel.sid: ${channel.sid}`);
      channelId = channel.sid;
    });
  await channel;

  // Used when generating any kind of tokens
  const twilioApiKey = process.env.API_KEY || '';
  const twilioApiSecret = process.env.API_SECRET || '';

  // Used specifically for creating Programmable Chat tokens
  const serviceSid = process.env.CHAT_SERVICE_ID || '';
  const appName = 'console-token-snippet';
  const deviceId = 'someiosdeviceid';
  const endpointId = `${appName}:${identity}:${deviceId}`;

  // Create a "grant" which enables a client to use Chat as a given user,
  // on a given device
  const chatGrant = new ChatGrant({
    serviceSid,
    endpointId,
  });

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, { identity, ttl: 40000 });
  token.addGrant(chatGrant);

  // Serialize the token to a JWT string
  console.log(token.toJwt());
  return res.json({ channelId: `${channelId}`, token: `${token.toJwt()}`, identity });
});
