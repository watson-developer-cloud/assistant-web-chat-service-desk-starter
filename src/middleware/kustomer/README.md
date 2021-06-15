# Kustomer Integration Example

This is a functioning service desk integration between Watson Assistant and Kustomer. 

**Important:**  This is a reference implementation that provides an example of a fully functional integration. Make any necessary changes and perform robust testing before deploying this integration in production.

This reference implementation supports the core features of a Kustomer integration. If you want to customize or extend it to add more features, follow the procedure described in the [README](../../../README.md) for this repository.

## Overview

This integration is based on the functionality of Kustomer Chat Core SDK which allows client side to communicate with Kustomer Chat Platform. 

The following Kustomer resources provide some useful guides on Kustomer custom chat implementation:
  - [Build your own UI](https://developer.kustomer.com/chat-sdk/v2.0-Web/docs/build-your-own-ui)

  - [Core API Reference](https://developer.kustomer.com/chat-sdk/v2.0-Web/docs/core-api-reference)

  - [Authenticate chat](https://developer.kustomer.com/chat-sdk/v2.0-Web/docs/authenticate-chat-with-jwt-token)

  - [Chat Management: Settings](https://kustomer.kustomer.help/en_us/chat-settings-B1sdKbtz7) 

## Setting up

1. If you haven't done so already, follow the setup steps in the root-level [README](../../../README.md) to make sure you can run an instance of [ExampleServiceDesk](../../serviceDesks/exampleServiceDesk.ts).

2. Replace .env-sample in the project directory with .env-sample found in src/middleware/kustomer subdirectory.

3. In the root of the project directory, copy .env-sample to .env.

4. Edit the .env file and modify the SERVICE_DESK_CLASS variable to KustomerServiceDesk. This is the name of the class for the Kustomer implementation in kustomer.ts. Modify the BRAND_ID variable to your own brand Id. Modify the JWT_TOKEN variable to your own mock JWT token. You can find more information about chat brand [here](https://kustomer.kustomer.help/multi-brand-chat-SkItrr3w). You can find more information about chat authentication [here](https://developer.kustomer.com/chat-sdk/v2.0-Web/docs/authenticate-chat-with-jwt-token). 

5. Replace index.html in the project directory with index.html found in src/middleware/kustomer subdirectory.

6. In index.html, please replace `YOUR_KUSTOMER_API` with your own Kustomer API key. 

7. From the project root directory, run `npm run dev`. If you've linked everything to your Kustomer org correctly, you should be able to connect to an agent in Kustomer.
