import {Message} from "roslib";
import {Time} from "./builtin";
import * as geometry_msgs from "./geometry_msgs";

/** This hold basic information about the characteristics of the OccupancyGrid */
export class MapMetaData extends Message {

    /** The time at which the map was loaded */
    map_load_time: Time;
    /** The map resolution [m/cell] */
    resolution: number;
    /** Map width [cells] */
    width: number;
    /** Map height [cells] */
    height: number;
    /**
     * The origin of the map [m, m, rad].  This is the real-world pose of the
     * cell (0,0) in the map.
     */
    origin: geometry_msgs.Pose;

    constructor(values: {
        map_load_time?: Time;
        resolution?: number;
        width?: number;
        height?: number;
        origin?: geometry_msgs.Pose;
    }) {
        super(values);
    }

}
