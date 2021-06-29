# Oracle Cloud B2C Service Integration Example

This is a functioning service desk integration between Watson Assistant and Oracle Cloud's [B2C Service](https://docs.oracle.com/en/cloud/saas/b2c-service/21b/index.html) (previously Oracle Service Cloud).

**Important:**  This is a reference implementation that provides an example of a fully functional integration. Make any necessary changes and perform robust testing before deploying this integration in production.

This reference implementation supports the core features of an Oracle B2C integration. If you want to customize or extend it to add more features, follow the procedure described in the [README](../../../README.md) for this repository.

You can refer to these Oracle docs and resources for more information about using the B2C Service API:

  - [REST APIs](https://docs.oracle.com/en/cloud/saas/b2c-service/21b/cxscc/index.html)

## Overview

The Oracle B2C Service integration consists of two main components: client-side code that runs in the user's browser, and server-side code that you host.

The client-side component manages the communication between the user and the agent. It implements the service desk API that is fully supported by the Watson Assistant web chat integration. (For more information about this API, see [ServiceDesk API](https://github.com/watson-developer-cloud/assistant-web-chat-service-desk-starter/blob/main/docs/API.md)).

The communication uses the B2C Service, where details can be found at [B2C Service APIs](https://docs.oracle.com/en/cloud/saas/b2c-service/21b/cxscc/rest-endpoints.html).

## Setting up

1. If you haven't done so already, follow the setup steps in the root-level [README](../../../README.md) to make sure you can run an instance of [ExampleServiceDesk](../../serviceDesks/exampleServiceDesk.ts).

1. In the `middleware/oracle` subdirectory, rename or copy `.env-sample` to `.env`.

1. In the `.env` file, update the values to the credentials from your B2C Service.
    - `TOKEN_URL`: Url path for fetching session token.
    - `API_KEY`: If endpoint is self-hosted and/or otherwise requires an API key, include here.

1. From the `middleware/oracle` directory, run `npm i`.

1. From the `middleware/oracle` directory, run `npm start`. This starts a server on port `3000` of your local machine.

1. Go to the project root directory and edit the `.env` file:
 
    - Update the `SERVICE_DESK_CLASS` variable to `OracleB2CServiceDesk`.

1. From the project root directory, run `npm run dev`. If you've linked everything to your B2C Service correctly, you should be able to connect to an available agent.

You should now be able to start a web chat session in a browser, and within the web chat, escalate to an agent to trigger the Oracle B2C Service integration. For more information about how to start a web chat session using this integration, see the starter kit [README](../../../README.md#development).
