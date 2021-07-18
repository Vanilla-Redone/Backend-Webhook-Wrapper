import Main, { BaseManager } from ".";
import fs from "fs";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import { status } from "minecraft-server-util";

export default class MCServerManager extends BaseManager {
    private processActive: boolean
    process?: ChildProcess
    booting = false
    constructor(Main: Main) {
        super(Main);
        this.processActive = false;
    }

    async startProcess(): Promise<boolean> {
        if (this.processActive || this.booting) return false;

        if (!fs.existsSync(this.Main.configData.serverPath)) {
            console.error("TARGET SERVER PATH DNE");
            return false;
        }

        if (!(path.extname(this.Main.configData.serverPath) === ".jar")) {
            console.error("TARGET SERVER PATH NOT .jar");
            return false;
        }

        if (!fs.existsSync(this.Main.configData.startIn)) {
            console.error("TARGET START PATH DNE");
            return false;
        }

        console.log("STARTING SERVER CHILD");

        this.process = spawn("java", [`-Xms${this.Main.configData.RAM}G`, `-Xmx${this.Main.configData.RAM}G`, "-jar", this.Main.configData.serverPath, "-nogui"], {
            cwd: this.Main.configData.startIn
        });

        this.booting = true;
        
        this.process?.stdout?.on("data", (data) => {
            console.log(`THE CHILD SPEAKS: ${data}`);
        });
        this.process.once("exit", (code) => console.log(`THE CHILD IS DEAD: ${code}`));

        setTimeout(() => {
            this.pingServer();
        }, 30000);

        return true;
    }

    queryIntendedState(): "ONLINE"|"OFFLINE"|"BOOTING" {
        console.log("PROCESS STATE QUERY RECEIVED");

        if (!this.booting && !this.processActive) return "OFFLINE";

        if (this.booting) return "BOOTING";

        return this.processActive ? "ONLINE" : "OFFLINE";
    }

    async queryUpServer(): Promise<boolean> {
        console.log("SERVER STATE QUERY RECEIVED");

        return this.pingServer();
    }

    async stopProcess(): Promise<boolean> {
        if (!this.processActive && !this.booting) return false;

        console.log("ATTEMPTING TO KILL CHILD SERVER");

        if (this.processActive) this.process?.stdin?.write("stop\n", (err) => console.error(err));

        sleep(this.processActive ? 15000 : 0).then(() => {
            try {
                this.process?.kill();
                this.processActive = false;
                this.booting = false;
                this.process = undefined;
            } catch(e) {
                return false;
            }
        });

        return true;
    }

    private async pingServer(): Promise<boolean> {
        try {
            const result = await status("localhost", {timeout: 5000, port: this.Main.configData.serverPort});
            if (result) {
                if (this.booting || !this.processActive) {
                    this.booting = false;
                    this.processActive = true;
                }
                return true;
            }

            return false;
        } catch(e) {
            return false;
        }
    }
}

function sleep(time: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}