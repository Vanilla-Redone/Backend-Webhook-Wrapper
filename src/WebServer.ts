import Main, { BaseManager, PostExpectedPayload, PostResponse } from ".";
import express from "express";
import crypto from "crypto";
import {json} from "body-parser";
import safeCompare from "safe-compare"

const TIME_SECOND = 1000;

export default class WebhookManager extends BaseManager {
    express
    constructor(Main: Main) {
        super(Main);
        this.express = express();
    }

    createWebhookServer(): void {
        this.express.use(json());
        this.express.post("/hook", async (req, res) => {
            if (!this.checkPostIncoming(req)) {
                res.sendStatus(403);
                return;
            }

            const initialStatus = this.Main.MCServerManager.queryIntendedState();

            switch((req.body as PostExpectedPayload).action) {
                case "ACTIVATE": {
                    const output = await this.Main.MCServerManager.startProcess();
                    res.send({
                        changed: output,
                        oldStatus: initialStatus,
                        newStatus: this.Main.MCServerManager.queryIntendedState()
                    } as PostResponse);
                    
                    break;
                }
                case "DEACTIVATE": {
                    const output = await this.Main.MCServerManager.stopProcess();

                    res.send({
                        changed: output,
                        oldStatus: initialStatus,
                        newStatus: this.Main.MCServerManager.queryIntendedState()
                    } as PostResponse);
                    break;
                }
                default:
                    res.sendStatus(400);
            }
        });

        this.express.get("/hook", async (req, res) => {
            if (!this.checkGetIncoming(req)) {
                res.sendStatus(403);
                return;
            }

            switch(req.body.type) {
                case "GET_PROCESS":
                    res.send({
                        state: this.Main.MCServerManager.queryIntendedState()
                    });
                    break;

                case "GET_SERVER_STATUS":
                    res.send({
                        state: await this.Main.MCServerManager.queryUpServer() ? "ONLINE" : "OFFLINE"
                    });
                    break;

                default:
                    res.sendStatus(400);
            }
        });

        this.express.get("", (req, res) => {
            res.status(200).end();
        });

        this.express.listen(this.Main.configData.port, () => console.log(`🚀 Server running on port ${this.Main.configData.port}`));
    }

    private checkPostIncoming(req: express.Request): boolean {
        if (!this.sharedChecks(req)) return false;

        if (!req.body.action) return false;

        return true;
    }

    public checkGetIncoming(req: express.Request): boolean {
        if (!this.sharedChecks(req)) return false;

        if (!req.body.type) return false;

        return true;
    }

    private sharedChecks(req: express.Request): boolean {
        if (!this.validateSHA(req)) return false;
        if (!req.body.time || isNaN(req.body.time)) return false;
        if (Math.abs(req.body.time - Date.now()) > TIME_SECOND * 15) return false;

        return true;
    }

    private validateSHA(req: express.Request): boolean {
        const expectedSignature = `sha256=${crypto.createHmac("sha256", this.Main.authData.authToken).update(JSON.stringify(req.body)).digest("hex")}`; 

        if (Array.isArray(req.headers["x-hub-signature-256"])) return false;

        return safeCompare(req.headers["x-hub-signature-256"] as string, expectedSignature);
    }
}