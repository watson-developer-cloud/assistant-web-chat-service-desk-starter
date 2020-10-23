# Web chat service desk extension starter

A starter kit for building custom service integrations for Watson Assistant web chat. This starter kit requires web chat version 3.0.0 or above.

## Overview

This project provides a development and production build environment for adding your own client-side service desk implementations to the web chat integration for Watson Assistant. These extensions can be shared between teams and also can be submitted as potential contributions to the the main web chat project. If you're interested in contributing to this project or proposing that your integration be offered in Watson Assistant, see [./CONTRIBUTING.md](./CONTRIBUTING.md).

### Technical requirements and scope

The service desks must support client-side integrations using a browser-based (usually WebSockets or long-polling) API to connect from the service desk API to within the web chat browser.

### Currently out of scope

The following items are not currently in scope for this starter kit and would be your responsibility to implement if you need them:

- History of the conversation for the human agent to view
- Security support (this varies depending on the service desk, but most require generating and sending valid JWTs with messages to the agent)
- Routing to specific agents
- Behavior when all agents are offline

### Adding the service desk extension to the web chat

In order to make this project available to your web chat, you simply need to pass the generated factory into your normal web chat embed code.

```html
<!-- This is the script we will generate. You are responsible for finding a place to host it. -->
<script src="YOUR_HOST/servicedesk.bundle.js"></script>

<!-- You can and should do something like the below to make sure loading the script is non-blocking.
<script>
  window.WebChatServiceDeskFactory = {};
  setTimeout(function(){const t=document.createElement('script');t.src='YOUR_HOST/servicedesk.bundle.js';document.head.appendChild(t);});
</script>
-->

<!-- Regular web chat embed script -->
<script>
  window.watsonAssistantChatOptions = {
    integrationID: "YOUR_INTEGRATION_ID",
    region: "YOUR_REGION",
    serviceInstanceID: "YOUR_SERVICE_INSTANCE_ID",
    onLoad: function(instance) {
      instance.render();
    },
    // The function that this project exports.
    serviceDeskFactory: window.WebChatServiceDeskFactory,
  };
  setTimeout(function(){const t=document.createElement('script');t.src='https://web-chat.global.assistant.watson.appdomain.cloud/loadWatsonAssistantChat.js';document.head.appendChild(t);});
</script>
```

## Prerequisites

- [Node.js](https://nodejs.org/en/download/)

## Example Implementations
We provide reference implementations that provide fully functional integrations with popular service desks. 
These implementations, while functional, are examples only, and have not been vetted for production use.

- [Genesys PureCloud](./src/middleware/genesys)  
- [Twilio Flex](./src/middleware/flex) 

## Development

To set up your development environment, first fork this repository. 

Copy `.env-sample` to `.env` and change the `SERVICE_DESK_CLASS` variable to run the target service desk implementation. If you do not provide any value, it will run the Mock service desk that we provide by default.

If you are running an integration which needs middleware, then `src/middleware` folder has a corresponding folders for middlewares which has instructions on how to run the middleware.

Run `npm install` 

Then run `npm run dev` to get a development environment running in your browser on port `9000`.

The files you will be editing are in the `src` directory, starting with the [buildEntry.ts](./src/buildEntry.ts) file. This script returns the `WebChatServiceDeskFactory` function that is available at `window.WebChatServiceDeskFactory` when this file is built. This function is what you will pass into the web chat configuration object as the `serviceDeskFactory`.

You will note that this file imports a mock service desk from [./src/serviceDesks/exampleServiceDesk.ts](./src/serviceDesks/exampleServiceDesk.ts). It is recommended you follow the same pattern and add your service-desk-specific files to the [./src/serviceDesks](./src/serviceDesks) folder as well. You can start by copying the [./src/serviceDesks/serviceDeskTemplate.ts](./src/serviceDesks/serviceDeskTemplate.ts) file. All the code is heavily commented via JSDoc and contains TypeScript type definitions for all properties passed to functions. Once you add your class, import the same in [buildEntry.ts](./src/buildEntry.ts) and then change the `.env` to point to your implementation.

### Documentation

See [./docs/API.md](./docs/API.md) for further API documentation, and [./docs/STEPS.md](./docs/STEPS.md) for a recommended sequence of steps for building an integration.  

### Communicating from the web chat to your service desk

The `serviceDeskFactory` configuration setting expects a factory that returns an object of functions or a class. These functions and the properties passed to the factory are defined in [./src/types/serviceDesk.ts](./src/types/serviceDesk.ts). The web chat will call these functions as needed to communicate with your service desk code.

### Communicating from your service desk to web chat

One of the items passed into the factory is a callback object. These callbacks are defined in [./src/types/serviceDeskCallback.ts](./src/types/serviceDeskCallback.ts). These are the functions you will call inside your service desk code to communicate information back to the web chat.

### Production build

Supporting compatible browsers and all other build concerns are handled for you. Just run `npm run build`, and `dist/servicedesk.bundle.js` is generated. Embed this file *before* the web chat embed script, and it will make `window.WebChatServiceDeskFactory` available for use.

### Tests

This project uses [jest](https://jestjs.io/) as its testing framework with TypeScript capabilities enabled. Tests should be under a `__tests__` subdirectory and should have file names in the following format: `FILE_TO_BE_TESTED_NAME.test.ts`.

To run the defined tests, run `npm run test`.

### TypeScript resources

This repository is written in TypeScript. Because the web chat is also written in TypeScript, IBM can standardize and release service desk extensions also written in TypeScript into the main project. The official TypeScript documentation is very thorough and has many valuable resources, starting with [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html). If you are using a modern text editor, you will quickly discover how useful it is to right-click on a complex object argument in a function and view its detailed type definition!
