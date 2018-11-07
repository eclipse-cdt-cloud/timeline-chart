import { TimeGraphRow, TimeGraphRowView } from "./time-graph-row-view";
import { TimeAxisScale } from "./time-axis-scale";
import { TimeGraphController } from "./time-graph-controller";
import * as PIXI from "pixi.js";

export interface TimeGraphRange {
    start: number
    end: number
}

export interface TimeGraphModel {
    id: string
    name: string
    range: TimeGraphRange
    rows: TimeGraphRow[]
}

export interface TimeGraphContextOptions {
    id: string
    width: number
    height: number
    backgroundColor?: number
}

export type TimeGraphContainer = PIXI.Container
export type TimeGraphApplication = PIXI.Application;

export class TimeGraph {

    protected container?: HTMLElement;
    protected timeGraphWidth: number;
    protected containerWidth: number;
    protected timeGraphController: TimeGraphController;
    protected timeAxisApplication?: TimeGraphApplication;
    protected timeGraphRowsApplication?: TimeGraphApplication;
    protected timeAxis: TimeAxisScale;

    constructor(id: string, protected model: TimeGraphModel) {
        this.container = document.getElementById(id) || undefined;
        if (!this.container) {
            throw (`No container with id ${id} available.`);
        }

        this.timeGraphWidth = this.model.range.end;
        this.containerWidth = this.container.clientWidth;
        this.timeGraphController = new TimeGraphController(this.containerWidth, this.timeGraphWidth);

        this.timeAxisApplication = this.getNewApplication({
            id: 'timeAxis_' + this.model.id,
            height: 30,
            width: this.timeGraphWidth,
            backgroundColor: 0xAA30f0
        });
        if (this.timeAxisApplication) {
            this.timeAxis = new TimeAxisScale('timeAxis_' + this.model.id, this.timeAxisApplication, this.timeGraphController);
        }

        this.timeGraphRowsApplication = this.getNewApplication({
            id: 'timeGraphRows_' + this.model.id,
            width: this.timeGraphWidth,
            height: 200,
            backgroundColor: 0xFFFFFF
        });

        // let fw = true;
        // setInterval(() => {
        //     if (this.timeGraphController.zoomFactor < 2 && fw) {
        //         this.timeGraphController.zoomFactor += 0.01;
        //     } else {
        //         fw = false;
        //         if (this.timeGraphController.zoomFactor > 0.02) {
        //             this.timeGraphController.zoomFactor -= 0.01;
        //         } else {
        //             fw = true;
        //         }
        //     }
        //     this.render();
        // }, 10);

        this.timeGraphController.onZoomChanged(() => {
            this.render();
        });
        this.timeGraphController.onPositionChanged(() => {
            this.render();
        });
    }

    protected getNewApplication(config: TimeGraphContextOptions): TimeGraphApplication | undefined {
        if (this.container) {
            const canvas: HTMLCanvasElement = document.createElement('canvas');
            canvas.width = config.width;
            canvas.height = config.height;
            canvas.id = config.id;
            canvas.className = 'time-graph-canvas';
            const application = new PIXI.Application({
                width: config.width,
                height: config.height,
                view: canvas,
                backgroundColor: config.backgroundColor || 0x000000
            });
            this.container.appendChild(canvas);
            application.stage.height = config.height;
            return application;
        }
    }

    render() {
        this.timeAxis.clear();
        this.timeGraphController.addComponent(this.timeAxis);
        this.timeAxis.render();

        if(this.timeGraphRowsApplication){
            this.timeGraphRowsApplication.stage.removeChildren();
        }
        this.model.rows.forEach((row: TimeGraphRow, idx: number) => {
            if (this.timeGraphRowsApplication) {
                const timeGraphRow = new TimeGraphRowView(this.model.id + 'row' + idx, this.timeGraphRowsApplication, idx, row, this.model.range, this.timeGraphController);
                this.timeGraphController.addComponent(timeGraphRow);
                timeGraphRow.render();
            }
        });
    }
}