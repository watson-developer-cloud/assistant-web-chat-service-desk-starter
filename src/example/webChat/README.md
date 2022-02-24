# WebChat Service Desk Integration Example

## Overview

The integration example consists of client-side code that runs in the user's browser and simulates the service desk use 
case of a customer asking to escalate to an agent, requesting an agent and consequently speaking to a mock agent. 
Additionally, it contains template code that can be used to build an integration.

## Development

1. Change to the directory containing the WebChat client code [./client](./client).

1. Run `npm install` to install the dependencies.

1. Run `npm run dev` to get a development environment running in your browser on port `9000`.

The files you will be editing are in the `src/example/webChat/client/src` directory, starting with the 
[buildEntry.ts](./client/src/buildEntry.ts) file. This script returns the `WebChatServiceDeskFactory` function that is 
available at `window.WebChatServiceDeskFactory` when this file is built. This function is what you will pass into the 
web chat configuration object as the `serviceDeskFactory`.

You will note that this file imports a mock service desk from 
[./client/src/exampleServiceDesk.ts](./client/src/exampleServiceDesk.ts). It is recommended you follow the same pattern 
and add your service-desk-specific files to the [/src/](/src/) folder as well. You can start by copying the 
[./client/src/serviceDeskTemplate.ts](../client/src/serviceDeskTemplate.ts) file. All the code is heavily commented 
via JSDoc and contains TypeScript type definitions for all properties passed to functions. Once you add your class, 
import the same in [buildEntry.ts](./client/src/buildEntry.ts) by changing `ServiceDeskTemplate` to the name of your 
class.  

For a recommended sequence of steps for building an integration see [/docs/STEPS.md](/docs/STEPS.md).
