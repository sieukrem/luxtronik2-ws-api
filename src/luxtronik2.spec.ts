import "mocha";
import {Luxtronik2} from "./luxtronik2";
import { expect } from "chai";
import { throws } from "./throws";
import WebSocket from "ws";

const wpIp = process.env.HEATING_PUMP_IP || "192.168.178.27";
const PW = process.env.HEATING_PUMP_PW || "012345";

console.log(process.env.HEATING_PUMP_PW)

async function sleep(millis:number) : Promise<void> {
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            resolve();
        }, millis);
    })
}

describe("Luxtronik2", ()=>{
    describe("connect", ()=>{
        it("returns instance", async ()=>{
            const lx = await Luxtronik2.connect(wpIp, PW);
            lx.disconnect();
            expect(lx).not.eq(null);
        }).timeout(20000)

        it("throws on unreachable IP", async ()=>{
            expect(await throws(async ()=> await Luxtronik2.connect("127.0.0.1", PW))).eq(true);
        })
        it("throws on wrong IP", async ()=>{
            expect(await throws(async ()=> await Luxtronik2.connect("127.a", PW))).eq(true);
        })
        it("throws on handshakeTimeout", async ()=>{
            expect(await throws(async ()=> await Luxtronik2.connect(wpIp, PW, 10000,2))).eq(true);
        }).timeout(20000)
    });

    describe("access",()=>{
        describe("get", ()=>{
            it("returns temperature", async ()=>{

                const lx = await Luxtronik2.connect(wpIp, PW);
                try{
                    const tempInfo = await (await (await lx.access.get("Informationen")).get("Temperaturen")).get("Vorlauf");
                    expect(tempInfo).not.eq(null);
                }finally{
                    lx.disconnect();
                }
            })
        })
        describe("names", ()=>{
            it("log", async ()=>{

                const lx = await Luxtronik2.connect(wpIp, PW);
                try{
                    console.log(lx.access.names());
                    console.log(await (await (await lx.access.get("Informationen")).get("Fehlerspeicher")).names());
                    console.log((await (await lx.access.get("Informationen")).get("Temperaturen")).names());
                    console.log((await (await (await lx.access.get("Informationen")).get("Temperaturen")).get("Aussentemperatur")).value());
                }finally{
                    lx.disconnect();
                }
            })
        })
    });

    describe("connection terminated",()=>{
        it("when not used longer than timeout", async ()=>{
            const lx = await Luxtronik2.connect(wpIp, PW, 1000);
            try{
                await sleep(2000)
                expect( await throws(async ()=>{
                   await (await (await lx.access.get("Informationen")).get("Temperaturen")).get("Vorlauf");
                })).eq(true);
            }finally{
                lx.disconnect();
            }
        }).timeout(5000);
    });
});