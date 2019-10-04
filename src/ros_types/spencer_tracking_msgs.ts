import {Message} from "roslib";
import {Duration} from "./builtin";
import * as geometry_msgs from "./geometry_msgs";
import * as std_msgs from "./std_msgs";

/** Message with all currently tracked persons */
export class TrackedPersons extends Message {
    header: std_msgs.Header;
    tracks: TrackedPerson[];

    constructor(values: {
        header?: std_msgs.Header;
        tracks?: TrackedPerson[];
    }) {
        super(values);
    }

}

/** Message defining a tracked person */
export class TrackedPerson extends Message {
    track_id: number;
    is_occluded: boolean;
    is_matched: boolean;
    detection_id: number;
    age: Duration;

    /** The following fields are extracted from the Kalman state x and its covariance C */
    pose: geometry_msgs.PoseWithCovariance;
    twist: geometry_msgs.TwistWithCovariance;

    constructor(values: {
        track_id?: number;
        is_occluded?: boolean;
        is_matched?: boolean;
        detection_id?: number;
        age?: Duration;
        pose?: geometry_msgs.PoseWithCovariance;
        twist?: geometry_msgs.TwistWithCovariance;
    }) {
        super(values);
    }

}
