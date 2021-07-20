export class BaseManager {
    protected Main: Main
    constructor(Main: Main) {
        this.Main = Main;
    }
}

import MCServerManager from "./MCServer";
import WebhookManager from "./WebServer";
import axios from "axios";

const packageJSON = require("../package.json");
const auth = require("../auth.json");
const config = require("../config.json");

try {
    require("source-map-support").install();
} catch (e) {
    //Don't really need accurate traces on the hoster
}

axios({
    method: "GET",
    url: "https://api.github.com/repos/Vanilla-Redone/Backend-Webhook-Wrapper/releases",
}).then((response) => {
    if (response.status === 200) {
        const tagName = response.data[0]?.tag_name as string|undefined;

        if (tagName && packageJSON.version) {
            if (!(tagName.endsWith(packageJSON.version))) {
                console.warn(`Hey! You might be out of date. Check the repo to see if there is a newer version.\nhttps://github.com/Vanilla-Redone/Backend-Webhook-Wrapper\n(Detected: ${packageJSON.version} | Found: ${tagName})`);
            }
        }
    }
}).catch(() => {/* */});

export interface AuthData {
    authToken: string
}

export interface ConfigData {
    port: number
    serverPath: string
    startIn: string
    RAM: number
    serverPort: number
}

interface BaseExpectedPayload {
    time: number
}

export interface PostExpectedPayload extends BaseExpectedPayload {
    time: number
    action: "ACTIVATE"|"DEACTIVATE"
}

export interface GetExpectedPayload extends BaseExpectedPayload {
    type: "GET_PROCESS"|"GET_SERVER_STATUS"
}

export type PossibleStates = "ONLINE"|"OFFLINE"|"BOOTING"

export interface PostResponse {
    changed: boolean
    oldState: PossibleStates
    newState: PossibleStates
}

export interface FilteredMcServerData {
    onlinePlayers?: number,
    maxPlayers?: number
    version?: string,
    favicon?: string,
    description?: string,
}

export interface BaseQueryResponse {
    state: PossibleStates
}
export interface ServerQueryResponse extends BaseQueryResponse {
    state: "ONLINE"|"OFFLINE",
    serverInfo?: FilteredMcServerData //Defined if state=="ONLINE"
}   

export default class Main {
    authData
    configData

    MCServerManager
    WebhookManager
    constructor(authData: AuthData, configData: ConfigData) {
        this.authData = authData;
        this.configData = configData;

        this.MCServerManager = new MCServerManager(this);
        this.WebhookManager = new WebhookManager(this);
    }

    start(): void {
        this.WebhookManager.createWebhookServer();
    }
}

new Main(auth, config).start();