
import "mocha";
import {Access} from "./access";
import { expect } from "chai";
import { throws } from "./throws";

function doNothing(id:string):Promise<string>{return Promise.resolve("")}

describe("Access", ()=>{
    describe("fromXml", ()=>{
        it("works for valid xml",()=>{
            Access.fromXml(`<xml></xml>`, doNothing)
        })
        it("does not fail for invalid xml",()=>{
            Access.fromXml(`xml`, doNothing)
        })
    });

    describe("get", ()=>{
        it("returns Access of child node", async ()=>{
            let called = false;
            const testee = Access.fromXml(`<xml><item><name>blub</name><value>val</value></item></xml>`, ()=>{
                called = true;
                return Promise.resolve("");
            })

            expect(await testee.get("blub")).not.eq(null);

            expect(called).eq(false);
        });

        it("fetches by id", async ()=>{
            let id = "";
            const testee = Access.fromXml(`<item><name>aha</name><item id="0x123"><name>bl</name></item></item>`, (_id)=>{
                id = _id;
                return Promise.resolve(`<xml><item><name>ub</name></item></xml>`);
            })

            expect(await testee.get("bl")).not.eq(null);

            expect(id).eq("0x123");
        })

        it("throws if not found", async ()=>{
            let id = "";
            const testee = Access.fromXml(`<item id="0x123"><name>aha</name></item>`, (_id)=>{
                id = _id;
                return Promise.resolve(`<xml><item><name>haha</name></item></xml>`);
            })

            expect(await throws(async()=>{ await testee.get("blub") })).eq(true);
        })
    })

    describe("names", ()=>{
        it("returns item names", ()=>{
            const testee = Access.fromXml(`<xml><item><name>a</name><value>val</value></item><item><name>b</name><value>val</value></item></xml>`, ()=>{
                return Promise.resolve("");
            })

            expect(testee.names()).eql(["a","b"]);
        })
    })
})