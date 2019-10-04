import {Message} from "roslib";
import * as std_msgs from "./std_msgs";

/** Simplified battery status for usage in web UI */
export class SimpleBatteryStatus extends Message {
    header: std_msgs.Header;

    /** True if battery is low */
    battery_low: boolean;
    /** True if charging */
    is_charging: boolean;
    /** True when fully charged and in the charging station */
    is_fully_charged: boolean;

    constructor(values: {
        header?: std_msgs.Header;
        battery_low?: boolean;
        is_charging?: boolean;
        is_fully_charged?: boolean;
    }) {
        super(values);
    }

}
