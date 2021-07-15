export class BaseManager {
    protected Main: Main
    constructor(Main: Main) {
        this.Main = Main
    }
}

import MCServerManager from "./MCServer"
import WebhookManager from "./WebServer"
const auth = require("../auth.json");
const config = require("../config.json");

try {
    require("source-map-support").install();
} catch (e) {
    //Don't really need accurate traces on the hoster
}

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

export interface PostResponse {
    changed: boolean
    oldStatus: "ONLINE"|"OFFLINE"|"BOOTING"
    newStatus: "ONLINE"|"OFFLINE"|"BOOTING"
}

export interface QueryResponse {
    state: "ONLINE"|"OFFLINE"|"BOOTING"
}

export default class Main {
    authData
    configData

    MCServerManager
    WebhookManager
    constructor(authData: AuthData, configData: ConfigData) {
        this.authData = authData
        this.configData = configData

        this.MCServerManager = new MCServerManager(this)
        this.WebhookManager = new WebhookManager(this)
    }

    start() {
        this.WebhookManager.createWebhookServer()
    }
}

new Main(auth, config).start()