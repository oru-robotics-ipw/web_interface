import {ServiceRequest, ServiceResponse} from "roslib";

export class TifCmdRequest extends ServiceRequest {
    str: string;

    constructor(values: {
        str?: string;
    }) {
        super(values);
    }

}

export class TifCmdResponse extends ServiceResponse {
    str: string;

    constructor(values: {
        str?: string;
    }) {
        super(values);
    }

}
