import { TimeGraphAxisScale } from "./time-graph-axis-scale";
import { TimeGraphRect } from "./time-graph-component";
import { TimeGraphUnitController } from "../time-graph-unit-controller";
import { TimeGraphStateController } from "../time-graph-state-controller";

export interface TimeGraphGridStyle extends TimeGraphRect {
    lineColor?: number
}

export class TimeGraphGrid extends TimeGraphAxisScale {

    constructor(id: string,
        protected _options: TimeGraphGridStyle,
        protected rowHeight: number,
        protected unitController: TimeGraphUnitController,
        protected stateController: TimeGraphStateController) {
        super(id, _options, unitController, stateController);
    }

    protected addEvents() { }

    render(): void {
        this.renderVerticalLines(false, this._options.lineColor || 0xdddddd, () => ({ lineHeight: this.stateController.canvasDisplayHeight }));
    }
}