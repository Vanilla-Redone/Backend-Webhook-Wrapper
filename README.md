# Vanilla Redone Backend Server Webhook Wrapper
A js project written in typescript to allow webhooks to start, stop and query backend bungeecord servers. It is intended to be run on the same computer as the backend server.


## Webhook Payloads

### Authentication
All requests must hash their body with an authentication token defined in `auth.json` and include the hash in the `x-hub-signature-256` header.

This ts snippet will do that for you:
```ts
import * as crypto from "crypto"
const sampleKey = "abc123xyz"

const samplePayload = {
    time: Date.now(),
    action: "ACTIVATE"
}

const signedHash = "sha256=" + crypto.createHmac("sha256", sampleKey).update(JSON.stringify(samplePayload)).digest("hex")
```
Failure to include this header will cause the server to respond with a 403.


### Requests
All requests are sent to the `/hook` endpoint on the server. The port is configured in `config.json`.

- ❌Failure to include required fields will cause the server to respond with a 403.
- ❌Failure to provide a timestamp within 15 seconds of the server's clock will cause the server to respond with a 403.
- ❌Failure to include the correct data for each field will cause the server to respond with a 400.

- ✔Successful request will respond with a 200 and the data below:

#### Post Request
Use this when you want to activate or deactivate the server
```js
data: {
    "time": number, //The current UNIX timestamp (with milliseconds)
    "action": "ACTIVATE"|"DEACTIVATE" //Ask to activate or deactivate the server 
}
```

Server responds with:
```js
data: {
    "changed": boolean, //Whether the request changed the server status
    "oldState": "ONLINE"|"OFFLINE"|"BOOTING",
    "newState": "ONLINE"|"OFFLINE"|"BOOTING"
}
```

#### Get Request
Use this when you want to query the current state of the server
```js
data: {
    "time": number, //The current UNIX timestamp (with milliseconds)
    "type": "GET_PROCESS"|"GET_SERVER_STATUS" //Get the intended state, or ask the webserver to query whether the minecraft server is up
}
```

Server responds with:
```js
data: {
    "state": "ONLINE"|"OFFLINE"|"BOOTING"
}
```

## Configuration

Two files must be present in the root of the project directory:

### Config
The `config.json` file must contain the following fields:
```js
{
    "port": number, //The port for the webserver to listen on
    "serverPath": string, //The location of the .jar of the server
    "startIn": string, //The location to start the .jar in
    "RAM": number, //The amount of RAM (in gigabytes) to allocate to the .jar
    "serverPort": number //The port the Minecraft server is running on
}
```

### Auth
The `auth.json` file must contain the following fields:
```js
{
    "authToken": string //The authentication token used to generate validation hashes
}
```

## Running
‼You must be using Node v14 or higher

1) Clone the repo or download the release.
2) Install all required packages with `npm install --only=prod` (omit `--only=prod` if building from source)
3) If building from source. Compile with typescript `tsc`

Run `npm start` from the root project directory or run `start.bat` from the same location.