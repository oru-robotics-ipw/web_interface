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

import {Matrix, matrix} from "mathjs";
import {Ros} from "roslib";
import {TypeDef} from "./ros_types/rosapi";
import {Point2D, Pose2D, Quaternion} from "./types";

/**
 * Get the theta (yaw) from a ROS quaternion
 * This code is a conversion of tf2::getYaw (C++) to JavaScript (ES6).
 *
 * @param q  Quaternion
 * @returns Angle in radians, counterclockwise from x axis.
 */
export function get_yaw(q: Quaternion): number {
    const sqx = q.x * q.x;
    const sqy = q.y * q.y;
    const sqz = q.z * q.z;
    const sqw = q.w * q.w;

    // Cases derived from https://orbitalstation.wordpress.com/tag/quaternion/
    const sarg = -2 * (q.x * q.z - q.w * q.y) / (sqx + sqy + sqz + sqw); /* normalization added from urdfom_headers */

    let yaw;
    if (sarg <= -0.99999) {
        yaw = -2 * Math.atan2(q.y, q.x);
    } else if (sarg >= 0.99999) {
        yaw = 2 * Math.atan2(q.y, q.x);
    } else {
        yaw = Math.atan2(2 * (q.x * q.y + q.w * q.z), sqw + sqx - sqy - sqz);
    }
    return yaw;
}

/**
 * Euclidean distance between points.
 *
 * @param a A point
 * @param b Another point
 */
export function distance_l2(a: Point2D, b: Point2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Create a ROS quaternion out of yaw
 * @param theta  Angle in xy plane, radians, counterclockwise from x axis.
 * @returns Quaternion object
 */
export function yaw_to_quaternion(theta: number): Quaternion {
    return {x: 0, y: 0, z: Math.sin(theta / 2.0), w: Math.cos(theta / 2.0)};
}

/**
 * Like zip() from python.
 *
 * Based on https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
 *
 * @param lists Arrays to zip
 * @returns  Array of "tuples"
 */
export function zip<T>(lists: Array<Array<T>>): Array<Array<T>> {
    return lists[0].map((_, c) => lists.map(row => row[c]));
}

/**
 * Dictionary of all the constants defined in a ROS message.
 */
export interface MessageConstants {
    [key: string]: string | number | boolean;
}

/**
 * Get message constants from ROS into an object
 *
 * @param ros           ROS connection.
 * @param message_type  ROS message type, eg. my_package/MyMessage
 * @param callback      Callback that is provided the decoded message constants
 */
export function ros_get_message_constants(
    ros: Ros, message_type: string,
    callback: (data: MessageConstants) => void): void {
    ros.getMessageDetails(message_type, (data: TypeDef[]) => {
        const parsed = zip<string | number>([
            data[0].constnames,
            data[0].constvalues.map((v: string) => {
                return parseInt(v);
            })
        ]);
        callback(Object.fromEntries(parsed));
    });
}

/**
 * Update CSS classes for an element
 *
 * @param element         Element to modify
 * @param add_names     Classes to add
 * @param remove_names  Classes to remove
 */
export function set_classes(element: HTMLElement, add_names: string[], remove_names: string[]): void {
    const class_list = element.classList;
    for (const c of remove_names) {
        class_list.remove(c);
    }
    for (const c of add_names) {
        class_list.add(c);
    }
}

type Alerts = 'alert-info' | 'alert-success' | 'alert-danger' | 'alert-warning';

/**
 * Update an alert element to change colour and contents.
 *
 * @param alert_element  Element to modify
 * @param visible        Should the alert be visible or hidden?
 * @param message        Message to set
 * @param status         Type of alert (bootstrap CSS class)
 * @param html           Set to true if message is HTML instead of plain text.
 */
export function update_alert_status(alert_element: HTMLElement,
                                    visible: boolean,
                                    message: string,
                                    status: Alerts,
                                    html = false): void {
    set_classes(alert_element, [status], ['alert-info', 'alert-success', 'alert-danger', 'alert-warning']);
    set_classes(alert_element, visible ? [] : ['d-none'], ['d-none']);
    if (html) {
        alert_element.innerHTML = message;
    } else {
        alert_element.textContent = message;
    }
}

/**
 * Display an alert for a limited amount of time.
 *
 * @param alert_element  Element to modify
 * @param message        Message to set
 * @param status         Type of alert (bootstrap CSS class)
 * @param timeout        How long to display message for.
 * @param html           Set to true if message is HTML instead of plain text.
 */
export function timed_alert(alert_element: HTMLElement,
                            message: string,
                            status: Alerts,
                            timeout: number,
                            html = false): void {
    update_alert_status(alert_element, true, message, status, html);
    window.setTimeout(() => {
            update_alert_status(alert_element, false, message, status, html);
        },
        timeout);
}

/**
 * Get computed CSS of element
 *
 * @param element_id   Element ID to lookup.
 * @param property_id  CSS selector to read.
 * @returns CSS value
 */
export function get_css(element_id: string, property_id: string): string {
    return window.getComputedStyle(document.getElementById(element_id), null).getPropertyValue(property_id);
}

/**
 * Convert 2D pose to a 3x3 transformation matrix
 *
 * @param pose Pose to convert
 */
export function pose_to_matrix(pose: Pose2D): Matrix {
    return matrix([
        [Math.cos(pose.theta), -Math.sin(pose.theta), pose.x],
        [Math.sin(pose.theta), Math.cos(pose.theta), pose.y],
        [0, 0, 1]]);
}

/**
 * Convert a 3x3 transformation matrix to a pose
 *
 * @param matrix Matrix to convert
 */
export function matrix_to_pose(matrix: Matrix): Pose2D {
    return {
        x: matrix.get([0, 2]),
        y: matrix.get([1, 2]),
        theta: Math.atan2(matrix.get([1, 0]), matrix.get([0, 0]))
    };
}
