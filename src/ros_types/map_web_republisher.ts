import {Message} from "roslib";
import * as nav_msgs from "./nav_msgs";
import * as std_msgs from "./std_msgs";

export class MapStatus extends Message {
    header: std_msgs.Header;
    info: nav_msgs.MapMetaData;

    constructor(values: {
        header?: std_msgs.Header;
        info?: nav_msgs.MapMetaData;
    }) {
        super(values);
    }

}
