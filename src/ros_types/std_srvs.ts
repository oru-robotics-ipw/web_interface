import {ServiceRequest, ServiceResponse} from "roslib";

export class TriggerRequest extends ServiceRequest {
    constructor(values: {}) {
        super(values);
    }

}

export class TriggerResponse extends ServiceResponse {
    success: boolean;
    message: string;

    constructor(values: {
        success?: boolean;
        message?: string;
    }) {
        super(values);
    }

}
