import WebSocket from "ws";
import { Access } from "./access";
import * as events from "events";

type callback = (data: any) => void;

export class Luxtronik2 extends events.EventEmitter {
  private queue: callback[] = [];

  constructor(private readonly ws: WebSocket, public readonly access: Access) {
    super();
  }

  public disconnect(): void {
    this.ws.close();
  }

  private async sendRequest(cmd: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (this.ws.readyState != this.ws.OPEN){
        reject("sendRequest failed, Websocket in state "+this.ws.readyState);
        return;
      }

      this.queue.push(resolve);
      this.ws.send(cmd);
    });
  }

  private onmessage(data: any) {
    if (this.queue.length <= 0) return;

    const fn = this.queue.shift()!;

    fn(data);
  }

  public on(event: "close", listener: (this: Luxtronik2) => void): this {
    addEventListener(event, listener);
    return this;
  }

  public static async connect(
    ip: string,
    password: string,
    timeoutMillis: number = 10000,
    handshakeTimeoutMillis: number = 10000
  ): Promise<Luxtronik2> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(`ws://${ip}:8214`, "Lux_WS", {
          timeout: timeoutMillis,
          handshakeTimeout: handshakeTimeoutMillis,
        });

        var heartbeatTimeout :any = undefined;

        function heartbeat() {
          clearTimeout(heartbeatTimeout);
        
          // Use `WebSocket#terminate()`, which immediately destroys the connection,
          // instead of `WebSocket#close()`, which waits for the close timer.
          // Delay should be equal to the interval at which your server
          // sends out pings plus a conservative assumption of the latency.
          heartbeatTimeout = setTimeout(() => {
            ws.terminate();
            reject("heartbeat exceeded");
          }, timeoutMillis);
      }        

        const messageDispatcher = {
          onmessage: (data: string) => {
            try {
              let lx: Luxtronik2;
              lx = new Luxtronik2(
                ws,
                Access.fromXml(data, (id) => {
                  return lx.sendRequest("GET;" + id);
                })
              );

              messageDispatcher.onmessage = lx.onmessage.bind(lx);

              ws.on("close", (ws) => {
                clearTimeout(heartbeatTimeout);
                lx.emit("close", lx);
              });

              resolve(lx);
            } catch (e) {
              reject(e);
            }
          },
        };

        ws.on("unexpected-response", reject);
        ws.on("error", reject);
        ws.on("message", (data: WebSocket.Data) => {
          heartbeat();
          messageDispatcher.onmessage(data.toString());
        });

        ws.on("open", function open() {
          heartbeat();
          ws.send("LOGIN;" + password);
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
