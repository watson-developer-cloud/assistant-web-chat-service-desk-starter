# Web chat service desk extension starter

This repo provides a set of example and starter kit service desk integrations for use with watsonx Assistant web chat – to allow end-users on web chat to escalate to a human agent. We provide starter kits to common live agent platforms, like Genesys Cloud, and also show you how to build custom integrations to other platforms.

## Overview

This repo provides an example development and production build environment as well as code examples for adding your own client-side service desk integration with web chat for watsonx Assistant. You can use the tools in this repo to build an independently deployable JavaScript bundle of your integration, or you can copy the example code into your own application for build and deployment. These integrations can be shared between teams and also can be submitted as potential contributions to the main web chat project. If you're interested in contributing to this project or proposing that your integration be offered in watsonx Assistant, see [CONTRIBUTING.md](./CONTRIBUTING.md).

**Important:** This is an open source project of example implementations to help people get started on their own custom code. Any custom code used with watsonx Assistant is the responsibility of the developer and is not covered by IBM support. If you find a bug in these examples, please submit a pull request with a fix. See [CONTRIBUTING.md](./CONTRIBUTING.md).

To find out if your company's tool is feasible for this approach, check out our Adoption Guide [here](./docs/ADOPTION_GUIDE.md). If you'd like some help to build an integration, [you can contact us](https://www.ibm.com/watson/assistant-integrations/?utm_medium=webchatbyosd).

## Example Implementations
We provide reference implementations that provide fully functional integrations with popular service desks. These implementations, while functional, are examples only, and have not been vetted for production use.

- [Generic Example](./src/example/webChat)
- [eGain](./src/egain/webChat)
- [Enghouse](./src/enghouse) (3rd party UI)
- [Genesys Cloud](./src/genesys/webChat)
- [Kustomer](./src/kustomer/webChat)
- [NICE inContact](./src/incontact/webChat)
- [Oracle Cloud B2C](./src/oracle/webChat)
- [Twilio Flex](./src/flex/webChat)

## Custom integrations between web chat and service desks

To create a custom integration with a service desk, review the [web chat API documentation](https://web-chat.global.assistant.watson.cloud.ibm.com/docs.html?to=service-desks-custom-sd) that includes instructions on how to create an integration and how to enable it for use by web chat. A custom integration can be done without using any of the resources in this repository as long as the integration satisfies the API contract required by web chat.

### Integration with web chat using the build process in this repo

This repo can be used as an isolated tool to build and test your integration with your web application (but it is not required). The basic steps to use it are:

1. Use the build process in this repo to build a javascript bundle of your integration. This will produce a `servicedesk.bundle.js` file. Each integration should have a README describing in detail the steps necessary to build it.
2. Upload the `servicedesk.bundle.js` file to a hosting location where the file can be downloaded and included in your application.
3. Add a script tag to your application's HTML file that will load your integration. This will expose a global `WebChatServiceDeskFactory` function that can be provided to web chat.
4. Add the configuration option to web chat to use `WebChatServiceDeskFactory`.

```html
<!-- The servicedesk.bundle.js is the script this repo will generate. You are responsible for finding a place to host it. -->
<script>
  function loadWebChat() {
    // Regular web chat embed script.
    window.watsonAssistantChatOptions = {
      integrationID: "YOUR_INTEGRATION_ID",
      region: "YOUR_REGION",
      serviceInstanceID: "YOUR_SERVICE_INSTANCE_ID",
      onLoad: function(instance) {
        instance.render();
      },
      // The function that this project exports and is contained in servicedesk.bundle.js.
      serviceDeskFactory: window.WebChatServiceDeskFactory,
    };
    setTimeout(function(){const t=document.createElement('script');t.src='https://web-chat.global.assistant.watson.appdomain.cloud/versions/' + (window.watsonAssistantChatOptions.clientVersion || 'latest') + '/WatsonAssistantChatEntry.js';document.head.appendChild(t);});
  }

  // This will load the service desk bundle. Using a setTimeout allows it to load without blocking the main page from loading.
  setTimeout(function () {
    const script = document.createElement('script');
    script.src = 'YOUR_HOST/servicedesk.bundle.js';
    // Make sure to only load web chat once this bundle has been loaded.
    script.onload = loadWebChat;
    document.head.appendChild(script);
  });
</script>
```

## Types of integrations

There are two basic types of integrations provided in this repo.

1. A seamless integration with the existing web chat UI. The user will use the web chat input field to send messages to an agent and messages from an agent will be displayed in the same message list along with messages from watsonx Assistant. These integrations require fully implementing the service desk integration API provided by web chat.
2. A custom panel implementation embedding a 3rd party chat widget. The user will switch to a different panel where they will see a different UI created by a 3rd party. A different field from the standard web chat input field will generally be available and messages to and from the agent will be displayed in a separate view and not part of the messages from watsonx Assistant. These integrations generally require a lot less code and only require embedding another existing widget into web chat, but can result in an inconsistent user or visual experience. 

## Prerequisites

The scripts and some of the code in this repository rely on having [Node.js](https://nodejs.org/en/download/) installed but not all the custom service desks do if run on their own. Some of the example code may be copied into your own application without needing NodeJS. Refer to each service desk for more specific dependencies.

## Displaying the chat history to your human agent ("agent app")

watsonx Assistant will pass configuration needed to display a chat history widget in your live agent application interface. This agent application will contain a copy of the conversation your customer had with watsonx Assistant for your live agent to be able to view. Visit [the agent app documentation](https://web-chat.global.assistant.watson.cloud.ibm.com/docs.html?to=service-desks-custom-sd#agent-app) to learn more.

## Development

To set up your development environment, first fork this repository. 

To run the default example, go to the [`src/example/webChat`](src/example/webChat) directory and follow the instructions in the [README.md](src/example/webChat/README.md).

To enable linting rules specific to this project on your IDE or Code Editor run `npm install` from the root project directory.

It is recommended you follow the same pattern and add your service-desk-specific files to the [./src/](./src/) directory as well. All the code is heavily commented via JSDoc and contains TypeScript type definitions for all properties passed to functions.

### Production build

Supporting compatible browsers and all other build concerns are handled for you. Just run `npm run build`, and `dist/servicedesk.bundle.js` is generated. Embed this file *before* the web chat embed script, and it will make `window.WebChatServiceDeskFactory` available for use.

### Tests

This project uses [jest](https://jestjs.io/) as its testing framework with TypeScript capabilities enabled. Tests should be under a `__tests__` subdirectory and should have file names in the following format: `FILE_TO_BE_TESTED_NAME.test.ts`.

To run the defined tests, run `npm run test`.

### TypeScript resources

This repository is written in TypeScript. Because the web chat is also written in TypeScript, IBM can standardize and release service desk extensions also written in TypeScript into the main project. The official TypeScript documentation is very thorough and has many valuable resources, starting with [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html). If you are using a modern text editor, you will quickly discover how useful it is to right-click on a complex object argument in a function and view its detailed type definition!
