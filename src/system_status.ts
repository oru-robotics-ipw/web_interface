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
import * as am_driver from "./ros_types/am_driver";
import * as oru_ipw_msgs from "./ros_types/oru_ipw_msgs";
import {MessageConstants, ros_get_message_constants} from "./utils";

/**
 * Metadata about a button that can be disabled
 */
interface ButtonDisableData {
    /**
     * Button that can be disabled
     */
    button: HTMLButtonElement;
    /**
     * Default tooltip to restore to when button is not disabled.
     */
    default_tooltip: string;
}

/**
 * Handles system status and control
 */
export class SystemStatus {
    // Statuses
    public is_charging: boolean;
    public is_in_charging_station: boolean;
    public is_in_collision: boolean;
    public is_stopped: boolean;
    public is_soft_estop: boolean;

    private readonly ros: Ros;
    private readonly battery_status_sub: Topic;
    private readonly sensor_status_sub: Topic;
    private readonly system_status_element: HTMLElement;
    private readonly battery_status_element: HTMLElement;
    private readonly disable_on_dock_buttons: ButtonDisableData[];

    // Dynamically constructed object that provides us with the message constants from ROS for am_driver/SensorStatus.
    private sensor_constants: MessageConstants;

    constructor(options: {
        ros: Ros;
        system_status_element: HTMLElement;
        battery_status_element: HTMLElement;
        disable_on_dock_buttons: HTMLButtonElement[];
    }) {
        this.ros = options.ros;
        this.system_status_element = options.system_status_element;
        this.battery_status_element = options.battery_status_element;
        this.disable_on_dock_buttons = [];

        this.is_charging = false;
        this.is_in_charging_station = false;
        this.is_in_collision = false;
        this.is_stopped = false;
        this.is_soft_estop = false;
        this.sensor_constants = {};

        for (const entry of options.disable_on_dock_buttons) {
            // Store default tooltips for later use
            this.disable_on_dock_buttons.push({
                default_tooltip: entry.getAttribute('title'),
                button: entry
            });
        }

        this.battery_status_sub = new Topic({
            ros: this.ros,
            name: "/battery/status",
            throttle_rate: 10 * 1000,
            messageType: "oru_ipw_msgs/SimpleBatteryStatus"
        });
        this.sensor_status_sub = new Topic({
            ros: this.ros,
            name: "/hrp/sensor_status",
            throttle_rate: 10 * 1000,
            messageType: "am_driver/SensorStatus"
        });

        // Get the constants from the message
        ros_get_message_constants(
            this.ros,
            this.sensor_status_sub.messageType,
            (data: MessageConstants) => {
                this.sensor_constants = data;
            });

        this.sensor_status_sub.subscribe((msg: am_driver.SensorStatus) => {
            //console.log("Sensor status:", msg);
            this.is_charging = (msg.sensorStatus & <number>this.sensor_constants.SENSOR_STATUS_CHARGING) !== 0;
            this.is_in_charging_station = (msg.sensorStatus & <number>this.sensor_constants.SENSOR_STATUS_IN_CS) !== 0;
            this.is_in_collision = (msg.sensorStatus & <number>this.sensor_constants.SENSOR_STATUS_COLLISION) !== 0;
            this.is_stopped = (msg.sensorStatus & <number>this.sensor_constants.SENSOR_STATUS_USER_STOP) !== 0;

            this.update_buttons();
            this.update_status_msg();
        });

        this.battery_status_sub.subscribe((msg: oru_ipw_msgs.SimpleBatteryStatus) => {
            let status = "";
            if (msg.battery_low) {
                status += '<span class="text-danger">BATTERY LOW!</span>';
            } else if (msg.is_fully_charged) {
                status += 'Fully charged';
            }
            if (msg.is_charging) {
                status += ' <span class="text-info">[Charging]</span>';
            }

            if (status === '') {
                status = "Normal";
            }

            this.battery_status_element.innerHTML = status;
        });
    }

    public on_soft_estop(ev: CustomEvent<{status: boolean}>): void {
        this.is_soft_estop = ev.detail.status;
        this.update_status_msg();
        this.update_buttons();
    }

    private update_status_msg(): void {
        const statuses = [];

        if (this.is_in_collision) {
            statuses.push('<span class="text-danger">COLLIDED!</span>');
        }

        if (this.is_in_charging_station) {
            statuses.push('Docked');
        }

        if (this.is_stopped) {
            statuses.push('STOPPED');
        }
        else if (this.is_soft_estop) {
            statuses.push('Soft emergency stop engaged');
        }

        // Should we have nothing out of the ordinary put some text in there.
        if (statuses.length === 0) {
            statuses.push("Normal");
        }


        this.system_status_element.innerHTML = statuses.join(', ');
    }

    private update_buttons(): void {
        // We can't go if charging.
        const any_estop_active = this.is_charging || this.is_stopped || this.is_soft_estop;
        let msg: string = null;
        if (this.is_charging) {
            msg = "Charging, cannot automatically undock. Manually pull the robot out of the charging dock.";
        } else if (this.is_stopped) {
            msg = "Stopped, press the Start button on the robot and close the lid to enable it.";
        } else if (this.is_soft_estop) {
            msg = "Soft emergency stop active. You can disable it with the green button in upper right corner.";
        }
        for (const entry of this.disable_on_dock_buttons) {
            entry.button.disabled = any_estop_active;
            entry.button.setAttribute("title", msg === null ? entry.default_tooltip : msg);
        }
    }
}
