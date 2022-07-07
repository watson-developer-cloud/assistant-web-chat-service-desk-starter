# Web chat service desk extension starter

This repo provides a set of example and starter kit service desk integrations for use with Watson Assistant web chat – to allow end-users on web chat to escalate to a human agent. We provide starter kits to common live agent platforms, like Genesys Cloud, and also show you how to build custom integrations to other platforms.

## Overview

This repo provides a development and production build environment for adding your own client-side service desk implementations to the web chat integration for Watson Assistant. These extensions can be shared between teams and also can be submitted as potential contributions to the main web chat project. If you're interested in contributing to this project or proposing that your integration be offered in Watson Assistant, see [./CONTRIBUTING.md](./CONTRIBUTING.md).

**Important:** Any custom code used with Watson Assistant is the responsibility of the developer and is not covered by IBM support.

To find out if your company's tool is feasible for this approach, check out our Adoption Guide [here](./docs/ADOPTION_GUIDE.md). If you'd like some help to build an integration, [contact us here](https://www.ibm.com/watson/assistant-integrations/?utm_medium=webchatbyosd).

## Example Implementations
We provide reference implementations that provide fully functional integrations with popular service desks. These implementations, while functional, are examples only, and have not been vetted for production use.

- [Generic Example](./src/example/webChat)
- [Genesys Cloud](./src/genesys/webChat)
- [Twilio Flex](./src/flex/webChat)
- [NICE inContact](./src/incontact/webChat)
- [Oracle Cloud B2C](./src/oracle/webChat)
- [Kustomer](./src/kustomer/webChat)

## Custom integrations between web chat and service desks

In order for web chat to integrate with a custom service desk, there are two basic steps that need to happen:

1. Code must be written that communicates with the service desk (such as by starting a conversation or sending a message to a human agent) and satisfies the API contract defined by web chat.
2. Web chat needs to be given access to that code, so it can run it.

This repository is intended to help with both of these steps and can be used to build a deployable javascript bundle containing your custom service desk integration. However, it is not required to use any of the processes or tools in this repository for that. If you have your own front-end application and infrastructure for your website you can copy the appropriate code from step 1 above into your application and build and deploy it using your existing infrastructure; it is not required for the integration to be built and deployed separately.

You can read more information with our [api documentation](./docs/API.md).

### Integration with web chat, the simple version

If you have implemented a service integration that satisfies the web chat API, getting web chat to use it only requires providing a factory function that can create a new instance of your integration. Below contains an example of an empty integration (that doesn't do any communicating with a service desk) to show how to register an integration with web chat. Your integration does not have to be built into a separate javascript bundle or hosted separately from the rest of your front-end application.

```html
<script>
  // Your custom service desk integration which can be located anywhere in your codebase.
  class MyServiceDesk {
    constructor(callback) {
      this.callback = callback;
    }
    startChat() {
      console.log('Starting chat');
    }
    endChat() {
      console.log('Ending chat');
    }
    sendMessageToAgent() {
      console.log('Sending message to agent');
    }
  }
    
  // Regular web chat embed script.
  window.watsonAssistantChatOptions = {
    integrationID: "YOUR_INTEGRATION_ID",
    region: "YOUR_REGION",
    serviceInstanceID: "YOUR_SERVICE_INSTANCE_ID",
    onLoad: function(instance) {
      instance.render();
    },

    // **** The important part. This creates an instance of your integration.
    serviceDeskFactory: (parameters) => new MyServiceDesk(parameters.callback),
  };
  setTimeout(function(){const t=document.createElement('script');t.src='https://web-chat.global.assistant.watson.appdomain.cloud/versions/' + (window.watsonAssistantChatOptions.clientVersion || 'latest') + '/WatsonAssistantChatEntry.js';document.head.appendChild(t);});
</script>
```

### Integration with web chat, using the build process in this repo

This repo can be used as an isolated tool to build and test your integration with your web application. The basic steps to use it are:

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

## Configuration
Tailor web chat to your needs by initializing it with your own custom options. The web chat configuration options are defined by the parameters of watsonAssistantChatOptions.

In addition to the parameters listed [here](https://web-chat.global.assistant.watson.cloud.ibm.com/docs.html?to=api-configuration#configurationobject), it supports the following options:

#### serviceDesk
```
serviceDesk: {
  availabilityTimeoutSeconds: 30,
}
```

- `availabilityTimeoutSeconds`: The timeout value in seconds to use when determining agent availability. When a connect_to_agent response is received, the system will ask the service desk if any agents are available. If no response is received within the timeout window, the system will return "false" to indicate no agents are available. The default in web chat is 5 seconds.

## Prerequisites

- [Node.js](https://nodejs.org/en/download/)

## Development

To set up your development environment, first fork this repository. 

To run the default example, go to the [`src/example/webChat`](src/example/webChat) directory and follow the instructions in the [README.md](src/example/webChat/README.md).

To enable linting rules specific to this project on your IDE or Code Editor run `npm install` from the root project directory.

It is recommended you follow the same pattern and add your service-desk-specific files to the [./src/](./src/) directory as well. All the code is heavily commented via JSDoc and contains TypeScript type definitions for all properties passed to functions.

### Documentation

See [./docs/API.md](./docs/API.md) for further API documentation, and [./docs/STEPS.md](./docs/STEPS.md) for a recommended sequence of steps for building an integration.  

### Communicating from the web chat to your service desk

The `serviceDeskFactory` configuration setting expects a factory that returns an object of functions or a class. These functions and the properties passed to the factory are defined in [./src/types/serviceDesk.ts](./src/types/serviceDesk.ts). The web chat will call these functions as needed to communicate with your service desk code.

### Communicating from your service desk to web chat

One of the items passed into the factory is a callback object. These callbacks are defined in [./src/types/serviceDeskCallback.ts](./src/types/serviceDeskCallback.ts). These are the functions you will call inside your service desk code to communicate information back to the web chat.

### Displaying the chat history to your human agent

As of the 4.5.0 release of web chat, Watson Assistant will pass configuration needed to display a chat history widget in your live agent application interface. This agent application will contain a copy of the conversation your customer had with Watson Assistant for your live agent to be able to view. Visit ['./docs/AGENT_APP.md'](./docs/AGENT_APP.md) to learn more.

### Production build

Supporting compatible browsers and all other build concerns are handled for you. Just run `npm run build`, and `dist/servicedesk.bundle.js` is generated. Embed this file *before* the web chat embed script, and it will make `window.WebChatServiceDeskFactory` available for use.

### Tests

This project uses [jest](https://jestjs.io/) as its testing framework with TypeScript capabilities enabled. Tests should be under a `__tests__` subdirectory and should have file names in the following format: `FILE_TO_BE_TESTED_NAME.test.ts`.

To run the defined tests, run `npm run test`.

### Currently out of scope

The following items are not currently in scope for this starter kit and would be your responsibility to implement if you need them:

- Security support (this varies depending on the service desk, but most require generating and sending valid JWTs with messages to the agent)
- Routing to specific agents
- Behavior when all agents are offline

### TypeScript resources

This repository is written in TypeScript. Because the web chat is also written in TypeScript, IBM can standardize and release service desk extensions also written in TypeScript into the main project. The official TypeScript documentation is very thorough and has many valuable resources, starting with [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html). If you are using a modern text editor, you will quickly discover how useful it is to right-click on a complex object argument in a function and view its detailed type definition!
