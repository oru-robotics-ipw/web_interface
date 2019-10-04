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

import {identity, Matrix, multiply} from 'mathjs';
import {Ros, TFClient, Topic} from "roslib";
import {Layer} from "./layer";
import {Map} from "./map";
import * as spencer_tracking_msgs from "./ros_types/spencer_tracking_msgs";
import {Pose2D} from "./types";
import {get_yaw, matrix_to_pose, pose_to_matrix} from "./utils";

/**
 * Layer for drawing observed people
 */
export class People extends Layer {
    private readonly map: Map;
    private readonly people_listener: Topic;
    private readonly tf_client: TFClient;

    private people_poses: Pose2D[];
    private odom_matrix: Matrix;

    /**
     * Constructor
     *
     * @param canvas     Canvas to work with
     * @param ros        ROS connection
     * @param map        Map layer
     * @param tf_client  TF client to use for transformations
     */
    constructor(canvas: HTMLCanvasElement, ros: Ros, map: Map, tf_client: TFClient) {
        super(canvas, ros);
        this.map = map;
        this.tf_client = tf_client;

        this.people_poses = [];
        this.odom_matrix = <Matrix>identity(3);

        // Event listeners
        this.tf_client.subscribe('odom', tf => {
            const x = tf.translation.x;
            const y = tf.translation.y;
            const yaw = get_yaw(tf.rotation);

            // Matrix for converting
            this.odom_matrix = pose_to_matrix({x: x, y: y, theta: yaw});
        });

        this.people_listener = new Topic({
            ros: this.ros,
            name: '/spencer/perception/tracked_persons_confirmed_by_HOG_or_upper_body_or_moving',
            throttle_rate: 100,
            messageType: 'spencer_tracking_msgs/TrackedPersons'
        });
        this.people_listener.subscribe((message: spencer_tracking_msgs.TrackedPersons) => {
            const old_people_poses = this.people_poses;
            this.people_poses = [];
            for (const track of message.tracks) {
                const person = pose_to_matrix({
                    x: track.pose.pose.position.x,
                    y: track.pose.pose.position.y,
                    theta: get_yaw(track.pose.pose.orientation)
                });
                const person_map = matrix_to_pose(<Matrix>multiply(this.odom_matrix, person));
                this.people_poses.push({
                    x: person_map.x,
                    y: person_map.y,
                    theta: person_map.theta
                });
            }
            if (this.people_poses !== old_people_poses) {
                this.redraw();
            }
        });
    }

    redraw(): void {
        super.redraw();
        for (const person of this.people_poses) {
            this.draw_pose({theta: person.theta, ...this.map.world2image(person)},
                "blue");
        }
    }
}
