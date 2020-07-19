import "mocha";
import {Luxtronik2} from "./luxtronik2";
import { expect } from "chai";
import { throws } from "./throws";

const wpIp = "192.168.178.29";
const PW = process.env.HEATING_PUMP_PW || "012345";

console.log(process.env.HEATING_PUMP_PW)

describe("Luxtronik2", ()=>{
    describe("connect", ()=>{
        it("returns instance", async ()=>{
            const lx = await Luxtronik2.connect(wpIp, PW);
            lx.disconnect();
            expect(lx).not.eq(null);
        })

        it("throws on unreachable IP", async ()=>{
            expect(await throws(async ()=> await Luxtronik2.connect("127.0.0.1", PW))).eq(true);
        })
        it("throws on wrong IP", async ()=>{
            expect(await throws(async ()=> await Luxtronik2.connect("127.a", PW))).eq(true);
        })
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
    })
});