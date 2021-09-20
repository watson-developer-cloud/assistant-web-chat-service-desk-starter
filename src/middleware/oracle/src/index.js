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

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

require('dotenv').config();

app.use(bodyParser.json());
app.use(cors());

app.post('/auth', async (req, res) => {
  const resp = await fetch(process.env.TOKEN_URL, {
    method: 'POST',
    headers: {
      apikey: process.env.API_KEY,
      'Content-Type': 'application/json',
      mode: 'no-cors',
      'OSvC-CREST-Application-Context': 'Placeholder details',
    },
    body: JSON.stringify(req.body),
  });

  const authInfo = await resp.json();
  res.send(authInfo);
});

app.get('/', (req, res) => {
  res.send('Auth ready');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
