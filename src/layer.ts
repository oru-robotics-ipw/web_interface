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

import {Ros} from 'roslib';
import {Point2D, Pose2D} from "./types";

/**
 * Base class handling a canvas layer
 */
export class Layer {
    public readonly canvas: HTMLCanvasElement;
    protected readonly ctx: CanvasRenderingContext2D;
    protected readonly ros: Ros;

    /**
     * Constructor
     * @param canvas Canvas to work with
     * @param ros Ros connection
     */
    constructor(canvas: HTMLCanvasElement, ros: Ros) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.ros = ros;
    }

    redraw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw_circle(coord: Point2D, strokeStyle: string): void {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(coord.x, coord.y, 5, 0, 2 * Math.PI, false);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.stroke();
        this.ctx.restore();
    }

    draw_line(start_coord: Point2D, end_coord: Point2D, strokeStyle: string): void {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(start_coord.x, start_coord.y);
        this.ctx.lineTo(end_coord.x, end_coord.y);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.stroke();
        this.ctx.restore();
    }

    draw_pose(coord: Pose2D, strokeStyle: string, pointer_length = 10): void {
        this.draw_circle(coord, strokeStyle);
        // Note - instead of + for y, because of left handed coordinate system.
        this.draw_line(coord,
            {
                x: coord.x + pointer_length * Math.cos(coord.theta),
                y: coord.y - pointer_length * Math.sin(coord.theta)
            },
            strokeStyle);
    }
}
