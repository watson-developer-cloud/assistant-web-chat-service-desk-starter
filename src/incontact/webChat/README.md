# NICE inContact Integration Example

This is a functioning service desk integration between watsonx Assistant and NICE inContact.

**Important:**  This is a reference implementation that provides an example of a fully functional integration. Make any necessary changes and perform robust testing before deploying this integration in production.

This reference implementation supports the core features of a NICE inContact integration. If you want to customize or extend it to add more features, follow the procedure described in the [README](../../../README.md) for this repository.

You can refer to these NICE inContact docs and resources for more information about using the NICE inContact Patron API:

  - [Getting Started with Access Tokens](https://developer.niceincontact.com/Documentation/UserHubGettingStarted)
  - [Patron APIs](https://developer.niceincontact.com/API/PatronAPI)

Note: This implementation only supports UserHub accounts, and has not been tested for Central accounts. 
## Overview

The NICE inContact integration consists of two main components: client-side code that runs in the user's browser, and server-side code that you host.

The client-side component manages the communication between the user and the agent. It implements the service desk API that is fully supported by the watsonx Assistant web chat integration. (For more information about this API, see [ServiceDesk API](https://github.com/watson-developer-cloud/assistant-web-chat-service-desk-starter/blob/main/docs/API.md)).

The communication uses the Patron API, which can be found at [Patron APIs](https://developer.niceincontact.com/API/PatronAPI).

## Setting up

1. If you haven't done so already, follow the setup steps in the root-level [README](../../../README.md) to make sure you can run an instance of [ExampleServiceDesk](../../../src/example/webChat/README.md).

1. If you haven't done so already, [set up chat](https://help.nice-incontact.com/content/acd/channels/chat/setupchat.htm) using your InContact admin account.

    1. Create a [Campaign](https://help.incontact.com/spring20/en/Content/ACD/Campaigns/CampaignsOverview.htm?tocpath=System%20Administration%7CSkills%20and%20Campaigns%7CCampaigns%7C_____0): A campaign is a grouping of skills that serve a common business purpose.
        - Navigate to ACD > Contact Settings > Campaigns > Create New 
        - Give it a name.

    1. Create a [Skill](https://help.incontact.com/spring20/en/Content/ACD/Skills/Skills.htm?tocpath=System%20Administration%7CSkills%20and%20Campaigns%7CSkills%7C_____0): A skill routes each contact to the available agents who can best meet the contact's needs.
        - Navigate to ACD > Contact Settings > ACD Skills > Create New > Single Skill
        - `Media Type`: Chat
        - `Media Name`: Give it a name
        - `Campaign`: Select appropriate campaign. This can be from the above step, or an existing one.
        - Tick `Show Agent Typing Indicator`

    1. Assign Skill to a User:
        - Navigate to ACD > ACD Users
        - Select a user to add the skill to.
        - Click `Skills` tab.
        - Under `Add Skills` select skill and click `Add Skill`.
        - Under `Assigned Skills` click `Save Proficiencies`.
        - Go back to `ACD Skills` and click on your newly created skill. **Take note of the `Skill ID`**.

    1. Create [Script](https://help.incontact.com/spring20/en/Content/Studio/Scripts/ScriptTypesOverview.htm?tocpath=Contact%20Center%20Tools%7CStudio%7CScripts%7C_____0): a script is a network of actions that route and manage customer traffic for a contact center.
        - Using a Windows machine, [download Studio](https://help.incontact.com/spring20/en/Content/Studio/Application/DownloadAndInstallStudio.htm?tocpath=Contact%20Center%20Tools%7CStudio%7C_____1)
        - [Create and save a simple chat script](https://help.nice-incontact.com/content/acd/chat/setupchat.htm?tocpath=ACD%7CACD%7CChat%7C_____1).
        - Alternatively, you can also import an existing script.

    1. Create [Point of Contact](https://help.incontact.com/spring20/en/Content/ACD/PointsOfContact/PointsOfContactOverview.htm?tocpath=System%20Administration%7CSkills%20and%20Campaigns%7CPoints%20Of%20Contact%7C_____0): A point of contact (POC) is an entry point that an inbound contact uses to initiate an interaction. For a Chat interaction, this is a GUID that identifies the chat channel.
        - Navigate to ACD > Contact Settings > Points of Contact > Create New > Single Point of Contact
        - `Media Type`: Chat
        - `Name`: Give it a name
        - `Point of Contact` should auto-populate. **Take note of this GUID**.
        - `Skill`: Select previously created skill
        - `Script`: Select previously created script
        - Click `Create Point of Contact`

1. In the `src/incontact/webChat/server` subdirectory, rename or copy `.env-sample` to `.env`.

1. In the `.env` file, update the values to the credentials from your NICE inContact account.
    - `INCONTACT_ACCESS_KEY_ID` and `INCONTACT_ACCESS_KEY_SECRET`: Follow [Getting Started](https://developer.niceincontact.com/Documentation/UserHubGettingStarted) to generate these keys.
        - **WARNING:** The access key SECRET is only shown once. Store it in a safe location before exiting.
    - `INCONTACT_ACCESS_KEY_API_URI`: URI to the Access Key API. i.e. `https://{YOUR-DOMAIN}.nice-incontact.com`, where `{YOUR-DOMAIN}` can be one of `na1`, `au1`, and `eu1`.
    - `INCONTACT_API_URI`: URI to the InContact REST API, i.e. `https://api-{YOUR-CLUSTER}.nice-incontact.com`
    - `INCONTACT_VERSION`: The version of InContact's REST API to use. Default value is `v20.0`.
    - `INCONTACT_POINTOFCONTACT`: The previously noted Point of Contact GUID.
    - `INCONTACT_SKILL`: The previously noted Skill ID.

1. From the `src/incontact/webChat/server` directory, run `npm i`.

1. From the `src/incontact/webChat/server` directory, run `npm start`. This starts a server on port `3000` of your local machine.

1. Go to the client directory in [src/incontact/webChat/client](./client). Rename or copy `.env-sample` to `.env`. In the `.env` file: 
    - Add `SERVER_BASE_URL` variable to where your middleware is deployed. For instance, if you deployed locally, this value would be `http://localhost:3000`.

1. From the InContact web chat client directory [src/incontact/webChat/client](./client) run:
    - `npm i`
    - `npm run dev`

    If you've linked everything to your NICE inContact account correctly, you should be able to connect to an agent in NICE inContact.

You should now be able to start a web chat session in a browser, and within the web chat, escalate to an agent to trigger the NICE inContact integration. For more information about how to start a web chat session using this integration, see the starter kit [README](../../../README.md#development).
