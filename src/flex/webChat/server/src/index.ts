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
import cors from 'cors';
import express from 'express';

import { PORT } from './config/constants';
import { AuthRouter } from './routes/auth';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/auth', AuthRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
