# NICE inContact integration example

This is a functioning service desk integration between Watson Assistant and NICE inContact.

**Important:**  This is a reference implementation that provides an example of a fully functional integration. Make any necessary changes and perform robust testing before deploying this integration in production.

This reference implementation supports the core features of a NICE inContact integration. If you want to customize or extend it to add more features, follow the procedure described in the [README](../../../README.md) for this repository.

You can refer to these NICE inContact docs and resources for more information about using the NICE inContact Patron API:

  - [API Authentication Token documentation](https://developer.niceincontact.com/Documentation/APIAuthenticationToken)
  - [Getting Started](https://developer.niceincontact.com/Documentation/GettingStarted)
  - [Patron APIs](https://developer.niceincontact.com/API/PatronAPI)

## Overview

The NICE inContact integration consists of two main components: client-side code that runs in the user's browser, and server-side code that you host.

The client-side component manages the communication between the user and the agent. It implements the service desk API that is fully supported by the Watson Assistant web chat integration. (For more information about this API, see [ServiceDesk API](https://github.com/watson-developer-cloud/assistant-web-chat-service-desk-starter/blob/main/docs/API.md)).

The communication uses the Patron API, which can be found at [Patron APIs](https://developer.niceincontact.com/API/PatronAPI).

## Setting up

1. If you haven't done so already, follow the setup steps in the root-level [README](../../../README.md) to make sure you can run an instance of [ExampleServiceDesk](../../serviceDesks/exampleServiceDesk.ts).

1. In the `middleware/incontact` subdirectory, rename or copy `.env-sample` to `.env`.

1. In the `.env` file, update the values to the credentials from your NICE inContact account. Follow [Getting Started](https://developer.niceincontact.com/Documentation/GettingStarted) to collect all configuration values. 

1. From the `middleware/incontact` directory, run `npm i`.

1. From the `middleware/incontact` directory, run `npm start`. This starts a server on port 3000 of your local machine.

1. Go to the project root directory and edit the `.env` file:
 
    - Update the `SERVICE_DESK_CLASS` variable to `inContactServiceDesk`.
    - Add `SERVER_BASE_URL` variable to where your middleware is deployed.

1. From the project root directory, run `npm run dev`. If you've linked everything to your NICE inContact account correctly, you should be able to connect to an agent in NICE inContact.

You should now be able to start a web chat session in a browser, and within the web chat, escalate to an agent to trigger the NICE inContact integration. For more information about how to start a web chat session using this integration, see the starter kit [README](../../../README.md#development).
