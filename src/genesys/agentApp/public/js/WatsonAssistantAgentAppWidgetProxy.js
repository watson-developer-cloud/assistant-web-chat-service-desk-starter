/**
 * (C) Copyright IBM Corp. 2021.
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

const GENESYS_CLIENT_ID = '<GENESYS_OAUTH_CLIENT_ID>';

const redirectUri = `${window.location.protocol}//${window.location.hostname}${window.location.pathname}`;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const platformClient = require('platformClient');

// PureCloud Platform API
const client = platformClient.ApiClient.instance;
client.setPersistSettings(true, 'InteractionWidgetProxy');

// Specific Platform API Instances
const conversationsApi = new platformClient.ConversationsApi();

const lifecycleStatusMessageTitle = 'Interaction Widget Proxy';
const lifecycleStatusMessageId = 'lifecycle-statusMsg';

/** 
 * Parse the query parameters to get the pcEnvironment variable so we can setup
 * the API client against the proper Genesys Cloud region.
 *
 * Note: Genesys Cloud will send us pcEnvironment, pcLangTag, and pcConversationId
 *       when the iframe is first initialized.  However, we'll come through this code
 *       again after the implicit grant redirect, and those parameters won't be there
 *       So we have to check if we were able to parse out the environment or not.
 */
let integrationQueryString = '';
if (window.location.search.length !== 0) {
  integrationQueryString = window.location.search.substring(1);
} else if (window.location.hash.length !== 0) {
  integrationQueryString = window.location.hash.substring(1);
}
const appParams = parseAppParameters(integrationQueryString);

console.log(`Initializing platform client for region: ${appParams.pcEnvironment}`);
client.setEnvironment(appParams.pcEnvironment);

// Create instance of Client App SDK
const myClientApp = new window.purecloud.apps.ClientApp({
  pcEnvironment: appParams.pcEnvironment,
});

// Log the PureCloud environment (i.e. AWS Region)
console.log(`PureCloud API Client Environment: ${client.environment}`);
console.log(`PureCloud ClientApp Environment: ${myClientApp.pcEnvironment}`);
console.log(`PureCloud ClientApp Version: ${window.purecloud.apps.ClientApp.version}`);
console.log(`PureCloud ClientApp About: ${window.purecloud.apps.ClientApp.about()}`);

initializeApplication();

/**
 * Bootstrap Listener
 */
myClientApp.lifecycle.addBootstrapListener(() => {
  logLifecycleEvent('App Lifecycle Event: bootstrap', true);
  initializeApplication();
});

/**
 * Focus Listener
 */
function onAppFocus() {
  logLifecycleEvent('App Lifecycle Event: focus', true);

  myClientApp.alerting.showToastPopup(lifecycleStatusMessageTitle, 'App Focused', {
    id: lifecycleStatusMessageId,
  });
}
myClientApp.lifecycle.addFocusListener(onAppFocus);

/**
 * Blur Listener
 */
function onAppBlur() {
  logLifecycleEvent('App Lifecycle Event: blur', true);

  myClientApp.alerting.showToastPopup(lifecycleStatusMessageTitle, 'App Blurred', {
    id: lifecycleStatusMessageId,
  });
}
myClientApp.lifecycle.addBlurListener(onAppBlur);

/**
 * Stop Listener
 */
myClientApp.lifecycle.addStopListener(() => {
  logLifecycleEvent('App Lifecycle Event: stop', true);

  // Clean up other, persistent listeners
  myClientApp.lifecycle.removeFocusListener(onAppFocus);
  myClientApp.lifecycle.removeBlurListener(onAppBlur);

  myClientApp.lifecycle.stopped();

  myClientApp.alerting.showToastPopup(lifecycleStatusMessageTitle, 'App Stopped', {
    id: lifecycleStatusMessageId,
    type: 'error',
    showCloseButton: true,
  });

  logLifecycleEvent('Notified Genesys Cloud of Successful App Stop', false);
});

function logLifecycleEvent(logText, incomingEvent) {
  console.log(logText);
}

async function initializeApplication() {
  console.log('Performing application bootstrapping');

  try {
    /**
     * Perform Implicit Grand Authentication
     * 
     * Note: Pass the query string parameters in the 'state' parameter so that they are returned
     *       to us after the implicit grant redirect.
     */
    const userAuthData = await client.loginImplicitGrant(GENESYS_CLIENT_ID, redirectUri, {
      state: integrationQueryString
    });

    console.log(`User Authenticated: ${JSON.stringify(userAuthData)}`);

    const conversationData = await conversationsApi.getConversation(appParams.pcConversationId);

    const customer = conversationData.participants.find((participant) => participant.purpose === 'customer');
    console.log(customer);
    if (customer !== undefined) {
      let {
        sessionHistoryKey
      } = customer.attributes;

      // Pull session history key from phone uui data
      if (!sessionHistoryKey && customer.attributes.uuiData) {
        sessionHistoryKey = customer.attributes.uuiData;
      }
      if (sessionHistoryKey) {
        window.location.href = `https://web-chat.global.assistant.watson.cloud.ibm.com/loadAgentAppFrame.html?session_history_key=${sessionHistoryKey}`;
      } else {
        console.error('Could not load Watson Assistant Agent App, session history key is missing');
      }
    }

    logLifecycleEvent('Notified Genesys Cloud of Successful App Bootstrap', false);
  } catch (error) {
    // Handle failure response
    console.error(error);
  }
}

function parseAppParameters(queryString) {
  console.log(`Interaction Widget Proxy Query String: ${queryString}`);

  let appParams = null;

  if (queryString.length !== 0) {
    const urlSearchParams = new URLSearchParams(queryString);

    if (urlSearchParams.get('state')) {
      const stateValue = urlSearchParams.get('state');
      console.log(`state = ${urlSearchParams.get('state')}`);
      const stateValueDecoded = decodeURIComponent(stateValue);
      console.log(`decoded state = ${stateValueDecoded}`);

      appParams = parseAppParameters(decodeURIComponent(stateValueDecoded));
    } else {
      appParams = Object.fromEntries(urlSearchParams);
    }
  }

  return appParams;
}