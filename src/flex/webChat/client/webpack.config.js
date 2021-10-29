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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Dotenv = require('dotenv-webpack');

const options = {
  entry: path.resolve(__dirname, 'src', 'buildEntry.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'servicedesk.bundle.js',
    library: 'WebChatServiceDeskFactory',
    libraryTarget: 'window',
    libraryExport: 'default',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  mode: 'production',
  module: {
    rules: [
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
  plugins: [new Dotenv()],
};

module.exports = options;
