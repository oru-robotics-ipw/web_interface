import {Message} from "roslib";
import {Time} from "./builtin";

/**
 * Standard metadata for higher-level stamped data types.
 * This is generally used to communicate timestamped data
 * in a particular coordinate frame. */
export class Header extends Message {
    /** sequence ID: consecutively increasing ID */
    seq: number;
    /** Two-integer timestamp that is expressed as:
     * * stamp.sec: seconds (stamp_secs) since epoch (in Python the variable is called 'secs')
     * * stamp.nsec: nanoseconds since stamp_secs (in Python the variable is called 'nsecs')
     * time-handling sugar is provided by the client library
     */
    stamp: Time;
    /** Frame this data is associated with
     * 0: no frame
     * 1: global frame
     */
    frame_id: string;

    constructor(values: {
        seq?: number;
        stamp?: Time;
        frame_id?: string;
    }) {
        super(values);
    }

}

export class Bool extends Message {
    data: boolean;

    constructor(values: {
        data?: boolean;
    }) {
        super(values);
    }
}

export class UInt16 extends Message {
    data: number;

    constructor(values: {
        data?: number;
    }) {
        super(values);
    }

}
