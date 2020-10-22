# Example Server

## About

This server provides an example of how one can access [Genesys REST APIs](https://developer.mypurecloud.com.au/api/rest/v2/).
Specifically, it has already implemented how one can authenticate users and how to check if agents are available.

## Setup

- Make sure you've installed the proper npm modules (run `npm i` in this directory)
- Rename ".env-sample" to ".env" and fill in the template with your unique account information.
- You can run a server with `npm start`
- Expose the local server via your cloud environment, alternatively, if you do not have your own hosted environment and you wish to expose your local development, one such possibility  is the usage of [ngrok](https://ngrok.com/): `ngrok http http://localhost:3000`,
- use your `<ngrok-url>` as the authentication URL required in `purecloudSetup.ts`
- use POST `<ngrok-url>/jwt` to obtain a valid JWT to authenticate your code.
