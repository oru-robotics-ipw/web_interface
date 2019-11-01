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
import {Bool} from "./ros_types/std_msgs";
import {set_classes} from "./utils";

export class Estop extends EventTarget {
    private readonly ros: Ros;
    private readonly estop_button: HTMLButtonElement;
    private readonly reset_button: HTMLButtonElement;
    private readonly estop_status: Topic;
    private readonly estop_setter: Topic;

    constructor(props: {
        ros: Ros;
        estop_button: HTMLButtonElement;
        reset_button: HTMLButtonElement;
    }) {
        super();
        this.ros = props.ros;
        this.estop_button = props.estop_button;
        this.reset_button = props.reset_button;

        this.estop_status = new Topic({
            ros: this.ros,
            name: '/soft_estop/get',
            messageType: 'std_msgs/Bool'
        });

        this.estop_setter = new Topic({
            ros: this.ros,
            name: '/soft_estop/set',
            messageType: 'std_msgs/Bool'
        });

        this.estop_button.addEventListener('click', () => {
            this.estop_setter.publish(<Bool>{data: true});
        });
        this.reset_button.addEventListener('click', () => {
            this.estop_setter.publish(<Bool>{data: false});
        });

        this.estop_status.subscribe((msg: Bool) => {
            this.dispatchEvent(new CustomEvent("estop", {detail: {status: msg.data}}));
            // Make reset button visible while estop is active
            set_classes(this.reset_button, msg.data ? [] : ['d-none'], ['d-none']);
            set_classes(this.estop_button, msg.data ? ['d-none'] : [], ['d-none']);
        });
    }
}