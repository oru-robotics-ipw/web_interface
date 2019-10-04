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

import {Param, Ros, Service, ServiceRequest} from "roslib";
import {Robot} from "./robot";
import template_editor from './templates/location-editor.handlebars';
import template_selector from './templates/location-selector.handlebars';
import {Pose2D} from "./types";
import {set_classes, timed_alert} from "./utils";

interface Location extends Pose2D {
    id: number;
    name: string;
}

/**
 * Handle locations: loading, saving and editing.
 */
export class Locations {
    private readonly ros: Ros;
    private readonly robot: Robot;
    private readonly editor_table: HTMLElement;
    private readonly editor_modal: JQuery<HTMLElement>;
    private readonly destination_selector: HTMLSelectElement;
    private readonly add_name: HTMLInputElement;
    private readonly status_alert: HTMLElement;
    private readonly edit_alert: HTMLElement;
    private readonly edit_alert_row: HTMLElement;

    private locations_saved: Map<string, Location>;
    private locations_editor: Map<string, Location>;
    private id_counter: number;

    private readonly next_id_param: Param;
    private readonly locations_param: Param;
    private readonly persist_service: Service;

    constructor(props: {
        ros: Ros;
        robot: Robot;
        editor_modal: JQuery<HTMLElement>;
        editor_table: HTMLElement;
        destination_selector: HTMLSelectElement;
        add_button: HTMLButtonElement;
        add_name: HTMLInputElement;
        save_button: HTMLButtonElement;
        open_button: HTMLButtonElement;
        status_alert: HTMLElement;
        edit_alert: HTMLElement;
        edit_alert_row: HTMLElement;
    }) {
        this.ros = props.ros;
        this.robot = props.robot;
        this.editor_table = props.editor_table;
        this.editor_modal = props.editor_modal;
        this.destination_selector = props.destination_selector;
        this.add_name = props.add_name;
        this.status_alert = props.status_alert;
        this.edit_alert = props.edit_alert;
        this.edit_alert_row = props.edit_alert_row;

        // List of locations
        this.locations_saved = new Map([]);
        this.locations_editor = new Map([]);
        this.id_counter = 0;

        props.add_button.addEventListener('click', () => {
            this.on_add_location();
        });
        props.add_name.addEventListener('keypress', e => {
            if (e.key === "Enter") {
                this.on_add_location();
            }
        });

        props.save_button.addEventListener('click', () => {
            this.locations_saved = new Map(this.locations_editor);
            this.update_locations_selection();
            this.editor_modal.modal('hide');
            this.save_to_parameters();
        });

        props.open_button.addEventListener('click', () => {
            this.locations_editor = new Map(this.locations_saved);
            this.update_locations_editor();
        });

        this.next_id_param = new Param({
            ros: this.ros,
            name: '/web/next_id'
        });

        this.locations_param = new Param({
            ros: this.ros,
            name: '/web/locations'
        });

        this.persist_service = new Service({
            ros: this.ros,
            name: '/config_manager/save_param',
            serviceType: 'ros_parameter_store_msgs/SetParam'
        });

        this.load_from_parameters();
    }

    /**
     * Load location list from ROS parameters
     */
    load_from_parameters(): void {
        this.next_id_param.get(value => {
            this.id_counter = value;
        });
        this.locations_param.get(value => {
            for (const entry of value) {
                this.locations_saved.set(entry.name, entry);
            }
            this.update_locations_selection();
        });
    }

    /**
     * Save location list to ROS parameters
     */
    save_to_parameters(): void {
        this.next_id_param.set(this.id_counter);
        const as_array: Location[] = [];
        this.locations_saved.forEach(v => {
            as_array.push(v);
        });
        this.locations_param.set(as_array);

        // Call service to persist
        for (const param of ['/web/next_id', '/web/locations']) {
            const request = new ServiceRequest({
                param: param
            });
            this.persist_service.callService(request, result => {
                if (result.success) {
                    console.log(`Persisted ${param}`);
                } else {
                    const msg = `Failed to persist ${param}`;
                    timed_alert(this.status_alert, msg, "alert-danger", 5000);
                    console.error(msg);
                }
            });
        }
    }

    /**
     * Called to handle addition of location in editor
     */
    on_add_location(): void {
        const new_name = this.add_name.value;
        if (!new_name) {
            set_classes(this.edit_alert_row, [], ['d-none']);
            this.edit_alert.textContent = 'Name cannot be empty.';
            return;
        }
        if (this.locations_editor.has(new_name)) {
            set_classes(this.edit_alert_row, [], ['d-none']);
            this.edit_alert.textContent = 'That name is already in use.';
            return;
        }
        set_classes(this.edit_alert_row, ['d-none'], ['d-none']);
        const new_id = this.id_counter++;
        console.log(`Adding ${new_name}!`);
        this.locations_editor.set(new_name, {id: new_id, name: new_name, ...this.robot.world_location});
        this.add_name.value = "";
        this.update_locations_editor();
    }

    /**
     * Called to handle removal of location in editor
     *
     * @param location_name Name of location to remove
     */
    on_remove_location(location_name: string): void {
        this.locations_editor.delete(location_name);
        this.update_locations_editor();
    }

    // Update locations in the editor
    update_locations_editor(): void {

        let combined_html = "";

        this.locations_editor.forEach(v => {
            const html = template_editor(v);
            combined_html += html;
        });
        this.editor_table.innerHTML = combined_html;

        this.locations_editor.forEach(v => {
            const remove_button = document.getElementById(`location-${v.id}-remove`);
            remove_button.addEventListener('click', () => {
                this.on_remove_location(v.name);
            });
        });
    }

    // Update locations in selection box
    update_locations_selection(): void {
        let combined_html = "";

        this.locations_saved.forEach(v => {
            const json = JSON.stringify(v);
            const html = template_selector({json: json, ...v});
            combined_html += html;
        });
        this.destination_selector.innerHTML = combined_html;
    }
}
