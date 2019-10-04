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

import {Ros, TFClient, Transform} from "roslib";
import {Layer} from "./layer";
import {Map} from "./map";
import {Pose2D} from "./types";
import {get_yaw} from "./utils";

/**
 * Handles drawing the robot canvas
 */
export class Robot extends Layer {
    private readonly map: Map;
    private readonly tf_client: TFClient;
    private robot_transform: Transform;

    /**
     * Constructor
     *
     * @param canvas     Canvas to work with
     * @param ros        ROS connection
     * @param map        Map layer
     * @param tf_client  TF manager
     */
    constructor(canvas: HTMLCanvasElement, ros: Ros, map: Map, tf_client: TFClient) {
        super(canvas, ros);
        this.map = map;
        this.robot_transform = undefined;
        this._target_location = undefined;
        this.tf_client = tf_client;

        // Event listeners
        this.tf_client.subscribe('base_link', tf => {
            this.robot_transform = tf;
            this.redraw();
        });

        /*
        this.canvas.addEventListener('click', (event) => {
            const image_coord = [event.offsetX, event.offsetY];
            const world_coord = this.map.image2world(image_coord);
            document.getElementById('coord').textContent = `${world_coord}`;
            //this.draw_circle(image_coord, 'red');
        });
        */
    }

    private _target_location: Pose2D;

    get target_location(): Pose2D {
        return this._target_location;
    }

    set target_location(value: Pose2D) {
        this._target_location = value;
        this.redraw();
    }

    get world_location(): Pose2D {
        return {
            x: this.robot_transform.translation.x,
            y: this.robot_transform.translation.y,
            theta: get_yaw(this.robot_transform.rotation)
        };
    }

    redraw(): void {
        super.redraw();
        if (this.robot_transform) {
            this.draw_pose({
                    theta: get_yaw(this.robot_transform.rotation),
                    ...this.map.world2image(this.robot_transform.translation),
                },
                "green"
            );
        }

        if (this.target_location) {
            this.draw_pose({
                    theta: this.target_location.theta,
                    ...this.map.world2image(this.target_location),
                },
                "red");
        }
    }
}
