import WebSocket from "ws";
import { Access } from "./access";
import * as events from "events";

type callback = (data:any)=>void;

export class Luxtronik2 extends events.EventEmitter{
    private queue:callback[] = [];

    constructor(private readonly ws:WebSocket, public readonly access: Access){
        super();
    }

    public disconnect():void{
        this.ws.close();
    }

    private async sendRequest(cmd:string):Promise<any>{
        return new Promise<any>((resolve, reject)=>{
            this.queue.push(resolve);
            this.ws.send(cmd);
        })
    }

    private onmessage(data:any){
        if (this.queue.length <= 0)
            return;

        const fn = this.queue.shift()!;

        fn(data);
    }
    
    public on(event: 'close', listener: (this: Luxtronik2) => void): this{
        addEventListener(event, listener);
        return this;
    }

    public static async connect(ip:string, password:string, timeout: number = 100, handshakeTimeout: number = 100): Promise<Luxtronik2>{
        return new Promise((resolve, reject)=>{
            const ws = new WebSocket(`ws://${ip}:8214`, "Lux_WS", { timeout: timeout, handshakeTimeout: handshakeTimeout});

            const messageDispatcher = {
                onmessage : (data: any)=>{
                    try{
                        let lx :Luxtronik2;
                        lx = new Luxtronik2(ws, Access.fromXml(data as string, (id)=>{
                            return lx.sendRequest("GET;"+id);
                        }));

                        messageDispatcher.onmessage =  lx.onmessage.bind(lx);
                        
                        ws.on("close", (ws)=>{lx.emit("close", lx)});

                        resolve(lx);
                    }catch(e){
                        reject(e);
                    }
                }
            }

            ws.on('error', reject);
            ws.on('message', (data: any)=>{
               messageDispatcher.onmessage(data)     
            });

            ws.on('open', function open() {
                ws.send("LOGIN;"+password)
              });

            
        })
          

    }
}