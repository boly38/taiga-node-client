# Taiga node client

NodeJS [Taiga](https://www.taiga.io/) ReST client - rely on [Taiga ReST API](https://docs.taiga.io/api.html)

## Features
- login
- list projects
- select project
- list user stories status
- select user stories status
- dry remove user stories by status
- remove user stories by status
- remove a user story by id

## Requirements

A sample usage is defined into `index.js`

To setup Taiga client, you could rely on constructor options or environment variables.

### Example of Environment variable setup

```
export HTTPS_PROXY=http://myproxy:8080  (optional)
export TAIGA_API_ENDPOINT=https://taiga.mycompany.com
export TAIGA_API_USERNAME=toto@yoyo.fr
export TAIGA_API_PASSWORD=totoSuperS3cretPassword
```

### Setup sample 

To do only one time:
```
git clone https://github.com/boly38/taiga-node-client.git
cd taiga-node-client/
npm install
```

### Run sample 

Usage:
```
node index.js
```
or
```
TAIGA_DEBUG=1 node index.js
```

## How to contribute

You're not a dev ? just submit an issue (bug, improvements, questions).
else suggest your [PR](https://github.com/boly38/taiga-node-client/pulls) with motivations in a dedicated issue.
