# Contributing

We welcome contributions! Because this code ends up in our commercially licensed cloud and on prem offerings, we need a bit of process. We need to be sure of the provenance of your contribution and that we have the ability to use it and redistribute it. We welcome contributions to improve our project!

Make sure you read our [coding standards](./docs/CODING_STANDARDS.md) and [pull request process](./docs/PULL_REQUESTS.md) before submitting code.

Who were the authors of your contribution and did you author all the code, or did any of it come from elsewhere? To contribute to our project, fork and clone it, create a branch, and submit a pull request. Here's a good [set of instructions](https://www.dataschool.io/how-to-contribute-on-github/).

Does this code show up in another IBM offering or is part of an IBM contracted services engagement? If it does, that's not necessarily a problem, we just need to know.

For support, we will maintain the repository, we encourage contributions and improvements to any part of our code!

## Intellectual Property

We take intellectual property seriously. We need to be sure of the provenance of your contribution and that we have the ability to include it in our project and redistribute it under our open source [license](./LICENSE). When you submit your PR, you're asserting that you have authored all the code in the PR and that you have the right to contribute it to our project.

## Implementation Requirements

To be accepted as an example implementation of the web chat service desk integration API, you must provide code that implements the [documented API](API.md).

**Important**: If you are making a service desk integration available for general use, keep in mind that a customer using your integration may not be using the latest version of web chat. If you are relying on specific features only available in later versions of web chat, make sure to document that requirement in the README for your integration. You may also wish to require a customer to provide the instance of web chat being used (e.g. by making it a constructor argument). You can then call [getWidgetVersion](https://web-chat.global.assistant.watson.cloud.ibm.com/docs.html?to=api-instance-methods#getWidgetVersion) to determine what version is being used.