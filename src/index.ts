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

// Import for side effects (registering with jQuery)
import 'bootstrap/js/src/alert';
import 'bootstrap/js/src/button';
import 'bootstrap/js/src/modal';

import jQuery from 'jquery';
import {Ros, TFClient} from 'roslib';
import {Control} from "./control";
import {DrivingControls} from "./driving_controls";
import {Estop} from "./estop";
import {Destination, Locations, LocationsLayer} from "./locations";
import {MapLayer} from "./map_layer";
import {People} from "./people";
import {Robot} from "./robot";
import './style.scss';
import {SystemStatus} from './system_status';
import {get_css, update_alert_status} from "./utils";

// Resize canvases based on window size.
function resize_to_window(element: HTMLCanvasElement): void {
    element.width = window.innerWidth - parseInt(get_css('main', 'padding-left'))
        - parseInt(get_css('main', 'padding-right'));
    element.height = window.innerHeight - parseInt(get_css('header', 'height'))
        - parseInt(get_css('main', 'margin-top'))
        - parseInt(get_css('main', 'margin-bottom'));
}

// Connecting to ROS
// -----------------

const ros = new Ros({
    url: origin.replace(/https?:\/\/([^\/]+)/, (match, p1) => {
        return `wss://${p1}:9090`;
    }),
    groovyCompatibility: false,
});

const main_alert = document.getElementById("connection-alert");

ros.on('connection', function () {
    update_alert_status(main_alert, false, "Connected", 'alert-success');
    console.log('Connected to websocket server.');
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
ros.on('error', function (error: any) {
    update_alert_status(main_alert, true, "Failed to connect", 'alert-danger');
    console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function () {
    update_alert_status(main_alert, true, "Not connected", 'alert-danger');
    console.log('Connection to websocket server closed.');
});

// Global TF client
const tf_client = new TFClient({
    ros: ros,
    fixedFrame: 'map',
    angularThres: 0.01,
    transThres: 0.01
});

const estop = new Estop({
    ros: ros,
    estop_button: <HTMLButtonElement>document.getElementById('btn-estop'),
    reset_button: <HTMLButtonElement>document.getElementById('btn-reset-estop'),
});

// Objects handling the canvas layers
const map = new MapLayer(<HTMLCanvasElement>document.getElementById('map'), ros, 'maps/map.png');
const robot = new Robot(<HTMLCanvasElement>document.getElementById('robot'), ros, map, tf_client);
const people = new People(<HTMLCanvasElement>document.getElementById('people'), ros, map, tf_client);

const status = new SystemStatus({
    ros: ros,
    system_status_element: document.getElementById('system-status'),
    battery_status_element: document.getElementById('battery-status'),
    disable_on_dock_buttons: [
        <HTMLButtonElement>document.getElementById('btn-go'),
        <HTMLButtonElement>document.getElementById('btn-drive-fwd'),
        <HTMLButtonElement>document.getElementById('btn-drive-rev'),
        <HTMLButtonElement>document.getElementById('btn-drive-left'),
        <HTMLButtonElement>document.getElementById('btn-drive-right'),
    ],
});
estop.addEventListener('estop', (ev: CustomEvent<{ status: boolean }>) => status.on_soft_estop(ev));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const driving_controls = new DrivingControls({
    ros: ros,
    fwd_button: <HTMLButtonElement>document.getElementById('btn-drive-fwd'),
    rev_button: <HTMLButtonElement>document.getElementById('btn-drive-rev'),
    left_button: <HTMLButtonElement>document.getElementById('btn-drive-left'),
    right_button: <HTMLButtonElement>document.getElementById('btn-drive-right'),
    speed_select: <HTMLSelectElement>document.getElementById('select-speed'),
});

const control = new Control({
    ros: ros,
    robot: robot,
    map: map,
    status: status,
    go_button: <HTMLButtonElement>document.getElementById('btn-go'),
    stop_button: <HTMLButtonElement>document.getElementById('btn-stop'),
    destination_selector: <HTMLSelectElement>document.getElementById('select-destination'),
    status_alert: document.getElementById('connection-alert'),
    sound_checkbox: <HTMLInputElement>document.getElementById('check-enable-sound'),
});

const locations = new Locations({
    ros: ros,
    robot: robot,
    editor_modal: jQuery('#editLocationsModal'),
    editor_table: document.getElementById('locations-table'),
    destination_selector: <HTMLSelectElement>document.getElementById("select-destination"),
    add_button: <HTMLButtonElement>document.getElementById("btn-location-add"),
    add_name: <HTMLInputElement>document.getElementById('input-location-name'),
    save_button: <HTMLButtonElement>document.getElementById('btn-location-editor-save'),
    open_button: <HTMLButtonElement>document.getElementById('btn-edit-locations'),
    status_alert: document.getElementById('connection-alert'),
    edit_alert: document.getElementById('edit-alert'),
    edit_alert_row: document.getElementById('edit-alert-row'),
});
const locationsLayer = new LocationsLayer({
    canvas: <HTMLCanvasElement>document.getElementById('locations_canvas'),
    checkbox: <HTMLInputElement>document.getElementById('check-show-locations'),
    tooltip: <HTMLDivElement>document.getElementById('mouse-tooltip'),
    destination_selector: <HTMLSelectElement>document.getElementById("select-destination"),
    ros: ros,
    locations: locations,
    map: map
});
locationsLayer.addEventListener('start_navigation', () => {
    control.on_go();
});
control.addEventListener('robot-goal', (ev: CustomEvent<Destination | null>) => {
    locationsLayer.target_location = ev.detail;
});


const layers = [map, robot, people, locationsLayer];

// Resize all the canvases
function resize_canvas(): void {
    for (const layer of layers) {
        resize_to_window(layer.canvas);
    }
    map.compute_scale_factor();
    for (const layer of layers) {
        layer.redraw();
    }
}

// Setup
window.addEventListener('resize', resize_canvas);
window.addEventListener('orientationchange', resize_canvas);
window.addEventListener('load', () => {
    resize_canvas();
    // Work around weird rendering glitch that don't always properly render all layers to begin with.
    window.setTimeout(() => {
        for (const layer of layers) {
            layer.redraw();
        }
    }, 1000);
});
