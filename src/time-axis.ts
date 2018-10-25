import { TimeAxisController } from "./time-axis-controller";

export class TimeAxis {

    protected readonly _controller: TimeAxisController;

    constructor() {
        this._controller = new TimeAxisController(this);
    }

    get controller(): TimeAxisController {
        return this._controller;
    }

}