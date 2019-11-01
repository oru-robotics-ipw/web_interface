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

import {Ros, Topic} from "roslib";
import {Twist} from "./ros_types/geometry_msgs";

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