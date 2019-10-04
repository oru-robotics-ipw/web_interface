import {Message} from "roslib";
import * as std_msgs from "./std_msgs";

/** This contains the position of a point in free space */
export class Point extends Message {
    x: number;
    y: number;
    z: number;

    constructor(values: {
        x?: number;
        y?: number;
        z?: number;
    }) {
        super(values);
    }
}

/** This represents an orientation in free space in quaternion form. */
export class Quaternion extends Message {
    x: number;
    y: number;
    z: number;
    w: number;

    constructor(values: {
        x?: number;
        y?: number;
        z?: number;
        w?: number;
    }) {
        super(values);
    }
}

/** A representation of pose in free space, composed of position and orientation. */
export class Pose extends Message {
    position: Point;
    orientation: Quaternion;

    constructor(values: {
        position?: Point;
        orientation?: Quaternion;
    }) {
        super(values);
    }
}

/** A Pose with reference coordinate frame and timestamp */
export class PoseStamped extends Message {
    header: std_msgs.Header;
    pose: Pose;

    constructor(values: {
        header?: std_msgs.Header;
        pose?: Pose;
    }) {
        super(values);
    }
}

/** This represents a pose in free space with uncertainty. */
export class PoseWithCovariance extends Message {
    pose: Pose;

    /** Row-major representation of the 6x6 covariance matrix
     * The orientation parameters use a fixed-axis representation.
     * In order, the parameters are:
     * (x, y, z, rotation about X axis, rotation about Y axis, rotation about Z axis)
     */
    covariance: number[];

    constructor(values: {
        pose?: Pose;
        covariance?: number[];
    }) {
        super(values);
    }
}

/** This expresses velocity in free space with uncertainty. */
export class TwistWithCovariance extends Message {
    twist: Twist;

    /** Row-major representation of the 6x6 covariance matrix
     * The orientation parameters use a fixed-axis representation.
     * In order, the parameters are:
     * (x, y, z, rotation about X axis, rotation about Y axis, rotation about Z axis)
     */
    covariance: number[];

    constructor(values: {
        twist?: Twist;
        covariance?: number[];
    }) {
        super(values);
    }
}

/** This expresses velocity in free space broken into its linear and angular parts. */
export class Twist extends Message {
    linear: Vector3;
    angular: Vector3;

    constructor(values: {
        linear?: Vector3;
        angular?: Vector3;
    }) {
        super(values);
    }
}

/** This represents a vector in free space.
 * It is only meant to represent a direction. Therefore, it does not
 * make sense to apply a translation to it (e.g., when applying a
 * generic rigid transformation to a Vector3, tf2 will only apply the
 * rotation). If you want your data to be translatable too, use the
 * geometry_msgs/Point message instead.
 */
export class Vector3 extends Message {
    x: number;
    y: number;
    z: number;

    constructor(values: {
        x?: number;
        y?: number;
        z?: number;
    }) {
        super(values);
    }
}
