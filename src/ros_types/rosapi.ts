import {Message} from "roslib";

export class TypeDef extends Message {
    type: string;
    fieldnames: string[];
    fieldtypes: string[];
    fieldarraylen: number[];
    examples: string[];
    constnames: string[];
    constvalues: string[];

    constructor(values: {
        type?: string;
        fieldnames?: string[];
        fieldtypes?: string[];
        fieldarraylen?: number[];
        examples?: string[];
        constnames?: string[];
        constvalues?: string[];
    }) {
        super(values);
    }
}
