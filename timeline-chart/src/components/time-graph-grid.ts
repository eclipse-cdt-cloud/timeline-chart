import { TimeGraphAxisScale } from "./time-graph-axis-scale";
import { TimeGraphRect } from "./time-graph-component";
import { TimeGraphUnitController } from "../time-graph-unit-controller";
import { TimeGraphStateController } from "../time-graph-state-controller";

export class TimeGraphGrid extends TimeGraphAxisScale {

    constructor(id: string,
        protected _options: TimeGraphRect,
        protected rowHeight: number,
        protected unitController: TimeGraphUnitController,
        protected stateController: TimeGraphStateController) {
        super(id, _options, unitController, stateController);
    }

    protected addEvents() { }

    render(): void {
        this.renderVerticalLines(this.stateController.canvasDisplayHeight, 0xdddddd);
    }
}