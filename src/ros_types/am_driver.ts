import {Message} from "roslib";
import * as std_msgs from "./std_msgs";

export class SensorStatus extends Message {
    // Note: Sensor status is a bitmask
    static readonly SENSOR_STATUS_HMB_CTRL: number = 1;
    static readonly SENSOR_STATUS_OUTSIDE: number = 2;
    static readonly SENSOR_STATUS_COLLISION: number = 4;
    static readonly SENSOR_STATUS_LIFTED: number = 8;
    static readonly SENSOR_STATUS_TOO_STEEP: number = 16;
    static readonly SENSOR_STATUS_PARKED: number = 32;
    static readonly SENSOR_STATUS_IN_CS: number = 64;
    static readonly SENSOR_STATUS_USER_STOP: number = 128;
    static readonly SENSOR_STATUS_CFG_NEEDED: number = 256;
    static readonly SENSOR_STATUS_DISC_ON: number = 512;
    static readonly SENSOR_STATUS_LOOP_ON: number = 1024;
    static readonly SENSOR_STATUS_CHARGING: number = 2048;

    static readonly OPERATIONAL_MODE_OFFLINE: number = 0;
    static readonly OPERATIONAL_MODE_MANUAL: number = 1;
    static readonly OPERATIONAL_MODE_RANDOM: number = 2;

    static readonly MOWER_INTERNAL_STATUS_OFF: number = 0;
    static readonly MOWER_INTERNAL_STATUS_WAIT_SAFETY_PIN: number = 1;
    static readonly MOWER_INTERNAL_STATUS_STOPPED: number = 2;
    static readonly MOWER_INTERNAL_STATUS_FATAL_ERROR: number = 3;
    static readonly MOWER_INTERNAL_STATUS_PENDING_START: number = 4;
    static readonly MOWER_INTERNAL_STATUS_PAUSED: number = 5;
    static readonly MOWER_INTERNAL_STATUS_IN_OPERATION: number = 6;
    static readonly MOWER_INTERNAL_STATUS_RESTRICTED: number = 7;
    static readonly MOWER_INTERNAL_STATUS_ERROR: number = 8;

    static readonly CONTROL_STATE_UNDEFINED: number = 0;
    static readonly CONTROL_STATE_IDLE: number = 1;
    static readonly CONTROL_STATE_INIT: number = 2;
    static readonly CONTROL_STATE_MANUAL: number = 3;
    static readonly CONTROL_STATE_RANDOM: number = 4;
    static readonly CONTROL_STATE_PARK: number = 5;

    header: std_msgs.Header;
    sensorStatus: number;
    operationalMode: number;
    mowerInternalState: number;
    controlState: number;

    constructor(values: {
        header?: std_msgs.Header;
        sensorStatus?: number;
        operationalMode?: number;
        mowerInternalState?: number;
        controlState?: number;
    }) {
        super(values);
    }
}


export class Mode extends Message {
    // To not break the API of /cmd_mode, this message is actually sent as a
    // std_msgs/UInt16. The valid constants are however defined here.

    // Enter manual (ROS controlled) mode
    static readonly MODE_MANUAL: number = 144;
    // Enter random mode
    static readonly MODE_RANDOM: number = 145;

    // Disable/enable grass cutting
    static readonly MODE_CUTTING_DISC_OFF: number = 146;
    static readonly MODE_CUTTING_DISC_ON: number = 147;

    // Some predefined heights for the disc
    static readonly MODE_CUTTING_HEIGHT_60: number = 148;
    static readonly MODE_CUTTING_HEIGHT_40: number = 149;

    // Enter park mode
    static readonly MODE_PARK: number = 256;

    // Enable loop detection
    static readonly MODE_LOOP_ON: number = 272;
    // Disable loop detection
    static readonly MODE_LOOP_OFF: number = 273;

    // Inject collisions
    static readonly MODE_COLLISION_INJECT: number = 274;
    static readonly MODE_COLLISIONS_DISABLED: number = 275;
    static readonly MODE_COLLISIONS_ENABLED: number = 276;

    // Various sounds
    static readonly MODE_SOUND_KEY_CLICK: number = 1024;
    static readonly MODE_SOUND_CLICK: number = 1025;
    static readonly MODE_SOUND_CHARGING_CONNECTED: number = 1026;
    static readonly MODE_SOUND_CHARGING_DISCONNECTED: number = 1027;
    static readonly MODE_SOUND_DOUBLE_BEEP: number = 1028;
    static readonly MODE_SOUND_LONG_BEEP: number = 1029;
    static readonly MODE_SOUND_FAULT: number = 1030;
    static readonly MODE_SOUND_START_CUTTING: number = 1031;
    static readonly MODE_SOUND_ALARM_WARNING: number = 1032;
    static readonly MODE_SOUND_ALARM_1: number = 1033;
    static readonly MODE_SOUND_ALARM_2: number = 1034;
    static readonly MODE_SOUND_ALARM_5: number = 1035;
    static readonly MODE_SOUND_ALARM_10: number = 1036;
    static readonly MODE_SOUND_TONE_1: number = 1037;
    static readonly MODE_SOUND_OFF: number = 1038;

    // Follow modes
    static readonly MODE_FOLLOW_MANUAL: number = 1040;
    static readonly MODE_FOLLOW_G1: number = 1041;
    static readonly MODE_FOLLOW_G2: number = 1042;
    static readonly MODE_FOLLOW_G3: number = 1043;

    // System commands
    static readonly MODE_SHUTDOWN: number = 4096;
    static readonly MODE_REBOOT: number = 4097;

    constructor(values: {}) {
        super(values);
    }
}
