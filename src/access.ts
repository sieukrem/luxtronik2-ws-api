import * as xpath from 'xpath';
import {DOMParser} from "xmldom";
import { throws } from './throws';

export type FetchFn = (id:string)=>Promise<string>;

export class Access{
    private constructor(private readonly context: Element, private readonly fetchFn: FetchFn){

    }

    public async get(name:string): Promise<Access> {
        const selector = `./item[name/text()='${name}']`;
        const nextNode = xpath.select(selector, this.context);
        
        if (nextNode.length==1){
            return Promise.resolve(new Access(await this.fetchSubDocument(nextNode[0] as Element), this.fetchFn));
        }

        throw new Error("Element with name '"+name+"' not found");
    }

    private async fetchSubDocument(el:Element):Promise<Element>{
        if (xpath.select("./item|./value", el).length > 0)
            return Promise.resolve(el);

        const nextData = await this.fetchFn(el.getAttribute("id") as string);

        return Promise.resolve(Access.parse(nextData).documentElement);
    }

    public value():string{
        const valueNode = xpath.select1("./value", this.context);
        if (!valueNode)
            throw new Error("Element does not have value");

        return (valueNode as Element).textContent!;
    }

    public names():string[]{
        return xpath.select("./item/name", this.context).map((el)=>(el as Element).textContent!);
    }

    private static parse(data:string):Document{
        return new DOMParser().parseFromString(data);
    }

    public static fromXml(data : string, fetchFn: FetchFn) : Access   {
        return new Access(this.parse(data).documentElement as Element, fetchFn);
    }

}