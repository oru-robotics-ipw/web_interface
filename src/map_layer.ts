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
import {Layer} from "./layer";
import * as map_web_republisher from "./ros_types/map_web_republisher";
import * as nav_msgs from "./ros_types/nav_msgs";
import {Point2D} from "./types";

/**
 * Handles the map canvas layer and computing general scaling factors
 */
export class MapLayer extends Layer {
    private readonly background_colour: string;
    private readonly url: string;
    private readonly image: HTMLImageElement;
    private readonly map_metadata_listener: Topic;

    private scale_factor: number;
    private map_metadata: nav_msgs.MapMetaData;

    /**
     * Constructor
     *
     * @param canvas  Canvas to work with
     * @param ros     ROS connection
     * @param url     URL to map file
     */
    constructor(canvas: HTMLCanvasElement, ros: Ros, url: string) {
        super(canvas, ros);
        this.ctx.imageSmoothingEnabled = false;
        this.background_colour = getComputedStyle(document.documentElement).getPropertyValue(
            "--map-background-colour");
        this.url = url;
        this.image = new Image();
        this.map_metadata_listener = new Topic({
            ros: this.ros,
            name: '/web/map_updated',
            messageType: 'map_web_republisher/MapStatus'
        });

        this.scale_factor = 0;
        // Create some dummy values to avoid race conditions on loading the page
        this.map_metadata = new nav_msgs.MapMetaData({
            resolution: 1.0,
            width: 1.0,
            height: 1.0
        });

        // Set up event handlers
        this.image.onload = (): void => {
            // Based on https://stackoverflow.com/questions/14757659/loading-an-image-onto-a-canvas-with-javascript
            this.compute_scale_factor();
            this.redraw();
            console.log("Map image loaded");
            this.dispatchEvent(new Event('map_image_loaded'));
        };
        this.map_metadata_listener.subscribe((message: map_web_republisher.MapStatus) => {
            this.map_metadata = message.info;
            console.log("Map metadata received");
            this.image.src = this.url + `?s=${message.header.stamp.secs}&ns=${message.header.stamp.nsecs}`;
            this.dispatchEvent(new Event('map_metadata_changed'));
        });
    }

    compute_scale_factor(): void {
        // We want to scale equally in all directions
        this.scale_factor = Math.min(this.canvas.width / this.image.width,
            this.canvas.height / this.image.height);
    }

    redraw(): void {
        this.ctx.fillStyle = this.background_colour;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.scale(this.scale_factor, this.scale_factor);
        // Draw image
        this.ctx.drawImage(this.image, 0, 0);
        this.ctx.restore();
    }

    // Coordinate conversion functions

    /**
     * World coordinate to map coordinate
     *
     * @param coord  Coordinate to convert
     * @returns Converted coordinate.
     */
    world2map(coord: Point2D): Point2D {
        const map_x = (coord.x - this.map_metadata.origin.position.x) / this.map_metadata.resolution;
        const map_y = (coord.y - this.map_metadata.origin.position.y) / this.map_metadata.resolution;
        return {x: map_x, y: map_y};
    }

    /**
     * Map coordinate to world coordinate
     *
     * @param coord  Coordinate to convert
     * @returns Converted coordinate.
     */
    map2world(coord: Point2D): Point2D {
        const world_x = coord.x * this.map_metadata.resolution + this.map_metadata.origin.position.x;
        const world_y = coord.y * this.map_metadata.resolution + this.map_metadata.origin.position.y;
        return {x: world_x, y: world_y};
    }

    /**
     * Map coordinate to image coordinate
     *
     * @param coord  Coordinate to convert
     * @returns Converted coordinate.
     */
    map2image(coord: Point2D): Point2D {
        return {
            x: coord.x * this.scale_factor,
            y: (this.map_metadata.height - coord.y) * this.scale_factor
        };
    }

    /**
     * Image coordinate to map coordinate
     *
     * @param coord  Coordinate to convert
     * @returns Converted coordinate.
     */
    image2map(coord: Point2D): Point2D {
        return {
            x: coord.x / this.scale_factor,
            y: this.map_metadata.height - coord.y / this.scale_factor
        };
    }

    /**
     * World coordinate to image coordinate
     *
     * @param coord  Coordinate to convert
     * @returns Converted coordinate.
     */
    world2image(coord: Point2D): Point2D {
        return this.map2image(this.world2map(coord));
    }

    /**
     * Image coordinate to world coordinate
     *
     * @param coord  Coordinate to convert
     * @returns Converted coordinate.
     */
    image2world(coord: Point2D): Point2D {
        return this.map2world(this.image2map(coord));
    }

    /**
     * Checks if map metadata has been loaded so that coordinate conversion will work.
     */
    is_ready(): boolean {
        return 'origin' in this.map_metadata;
    }
}
