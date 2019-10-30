/*
 * Örebro University IPW robot web interface
 * Copyright (C) 2019  Arvid Norlander
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {ActionClient, Goal, Ros, Service, ServiceRequest, Topic} from "roslib";
import {MapLayer} from "./map_layer";
import {Robot} from "./robot";
import {Mode} from "./ros_types/am_driver";
import {Twist} from "./ros_types/geometry_msgs";
import * as move_base_msgs from "./ros_types/move_base_msgs";
import {UInt16} from "./ros_types/std_msgs";
import * as std_srvs from "./ros_types/std_srvs";
import {SystemStatus} from "./system_status";
import {timed_alert, yaw_to_quaternion} from "./utils";

/**
 * Handles the logic of an individual button
 */
class DrivingButton {
    private timer: number | null;

    /**
     * Constructor
     *
     * @param props
     *   * angular: Multiplicative factor for angular component. Multiplied with base speed.
     *   * linear: Multiplicative factor for linear component. Multiplied with base speed.
     *   * parent: Parent object
     *   * button: Button to add event listeners to.
     */
    constructor(props: {
        angular: number;
        linear: number;
        parent: DrivingControls;
        button: HTMLButtonElement;
    }) {
        this.timer = null;

        const start = (): void => {
            if (this.timer !== null) {
                console.warn("Timer already running");
                return;
            }
            this.timer = window.setInterval(
                () => {
                    props.parent.send_twist(
                        props.parent.linear * props.linear,
                        props.parent.angular * props.angular);
                },
                100);
        };

        const stop = (): void => {
            if (this.timer === null) {
                return;
            }
            props.parent.send_twist(0, 0);
            window.clearInterval(this.timer);
            this.timer = null;
        };

        props.button.addEventListener('mousedown', () => {
            start();
        });
        props.button.addEventListener('touchstart', () => {
            start();
        });

        props.button.addEventListener('mouseup', () => {
            stop();
        });

        props.button.addEventListener('mouseleave', () => {
            stop();
        });
        props.button.addEventListener('touchleave', () => {
            stop();
        });
        props.button.addEventListener('touchcancel', () => {
            stop();
        });
    }
}

/**
 * Handles the driving controls
 */
export class DrivingControls {
    // Current speeds
    public linear: number;
    public angular: number;

    private readonly ros: Ros;
    private readonly fwd_button: DrivingButton;
    private readonly rev_button: DrivingButton;
    private readonly left_button: DrivingButton;
    private readonly right_button: DrivingButton;
    private readonly speed_select: HTMLSelectElement;
    private readonly cmd_vel: Topic;

    constructor(options: {
        ros: Ros;
        fwd_button: HTMLButtonElement;
        rev_button: HTMLButtonElement;
        left_button: HTMLButtonElement;
        right_button: HTMLButtonElement;
        speed_select: HTMLSelectElement;
    }) {
        this.ros = options.ros;
        this.fwd_button = new DrivingButton({parent: this, button: options.fwd_button, linear: 1, angular: 0});
        this.rev_button = new DrivingButton({parent: this, button: options.rev_button, linear: -1, angular: 0});
        this.left_button = new DrivingButton({parent: this, button: options.left_button, linear: 0, angular: 1});
        this.right_button = new DrivingButton({parent: this, button: options.right_button, linear: 0, angular: -1});
        this.speed_select = options.speed_select;

        this.cmd_vel = new Topic({
            ros: this.ros,
            name: '/cmd_vel',
            messageType: 'geometry_msgs/Twist'
        });

        this.speed_select.addEventListener('input', () => {
            this.update_speeds();
        });

        this.update_speeds();
    }

    setup_drive_button(button: HTMLButtonElement, linear: number, angular: number): void {
        button.addEventListener('mousedown', () => {
            this.send_twist(linear, angular);
        });
        button.addEventListener('mouseup', () => {
            this.send_twist(0, 0);
        });
    }

    /**
     * Send a twist command for 2D
     *
     * @param linear   Linear speed to set   [m/s]
     * @param angular  Angular speed to set  [rad/s]
     */
    public send_twist(linear: number, angular: number): void {
        const msg = new Twist({
            linear: {
                x: linear,
                y: 0,
                z: 0
            },
            angular: {
                x: 0,
                y: 0,
                z: angular
            }
        });
        this.cmd_vel.publish(msg);
    }

    private update_speeds(): void {
        [this.linear, this.angular] = JSON.parse(this.speed_select.value);
    }

}


/**
 * Handles sending driving & planning commands to robot.
 */
export class Control {
    private readonly ros: Ros;
    private readonly robot: Robot;
    private readonly map: MapLayer;
    private readonly status: SystemStatus;
    private readonly destination_selector: HTMLSelectElement;
    private readonly status_alert: HTMLElement;

    private readonly move_base_client: ActionClient;
    private readonly undock_service: Service;
    private readonly tif_service: Service;
    private readonly mode_cmd: Topic;

    private current_goal: Goal;

    constructor(options: {
        robot: Robot;
        go_button: HTMLButtonElement;
        destination_selector: HTMLSelectElement;
        ros: Ros;
        stop_button: HTMLButtonElement;
        map: MapLayer;
        status: SystemStatus;
        status_alert: HTMLElement;
    }) {
        this.ros = options.ros;
        this.robot = options.robot;
        this.map = options.map;
        this.status = options.status;
        this.destination_selector = options.destination_selector;
        this.status_alert = options.status_alert;

        this.move_base_client = new ActionClient({
            ros: this.ros,
            serverName: '/move_base',
            actionName: 'move_base_msgs/MoveBaseAction',
            timeout: 2,
        });
        this.current_goal = undefined;

        this.undock_service = new Service({
            ros: this.ros,
            name: '/exit_charging_station',
            serviceType: 'std_srvs/Trigger'
        });

        this.tif_service = new Service({
            ros: this.ros,
            name: '/hrp/tif_command',
            serviceType: 'am_driver_safe/TifCmd'
        });

        this.mode_cmd = new Topic({
            ros: this.ros,
            name: '/hrp/cmd_mode',
            messageType: 'std_msgs/UInt16'
        });

        options.go_button.addEventListener("click", () => {
            this.on_go();
        });
        options.stop_button.addEventListener("click", () => {
            this.on_stop();
        });
    }

    on_go(): void {
        const coord_str = this.destination_selector.value;
        const coords = JSON.parse(coord_str);
        console.log("Go to:", coords);
        if (this.status.is_in_charging_station) {
            this.undock_service.callService(new ServiceRequest({}),
                (response: std_srvs.TriggerResponse) => {
                    if (!response.success) {
                        const msg = "Failed to exit charging station:" + response.message;
                        console.log(msg);
                        timed_alert(this.status_alert, msg, "alert-warning", 5000);
                    }
                });
        }
        if (this.current_goal) {
            this.current_goal.cancel();
        }
        this.current_goal = new Goal({
            actionClient: this.move_base_client,
            goalMessage: <move_base_msgs.MoveBaseGoal>{
                target_pose: {
                    header: {
                        frame_id: 'map',
                    },
                    pose: {
                        position: {x: coords.x, y: coords.y, z: 0},
                        orientation: yaw_to_quaternion(coords.theta)
                    }
                }
            }
        });
        this.robot.target_location = {x: coords[0], y: coords[1], theta: coords[2]};

        this.current_goal.on('result', (result: move_base_msgs.MoveBaseActionResult) => {
            console.log('Final Result:', result);
            // Indicate we have finished navigation via a sound.
            // TODO: We don't know if we failed or succeeded.
            // TODO: Move this to another node, this relies on the web page being open
            this.mode_cmd.publish(new UInt16({data: Mode.MODE_SOUND_DOUBLE_BEEP}));
            // Also indicate with a popup, again we don't know if it was successful or not.
            timed_alert(this.status_alert, "Navigation ended", "alert-info", 5000);
            this.remove_goal();
        });

        this.current_goal.send();
        this.mode_cmd.publish(new UInt16({data: Mode.MODE_SOUND_LONG_BEEP}));

    }

    on_stop(): void {
        console.log("Stop command issued!");
        if (this.current_goal) {
            this.current_goal.cancel();
            this.remove_goal();
        }
    }

    remove_goal(): void {
        this.current_goal = undefined;
        this.robot.target_location = undefined;
    }
}
