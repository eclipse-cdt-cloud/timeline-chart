import { TimeAxisScale } from "./time-axis-scale";
import { TimeGraphRange } from "./time-graph";

export class TimeAxisController {

    protected totalRange: TimeGraphRange;
    protected visibleRange: TimeGraphRange;

    constructor(protected timeAxis: TimeAxisScale) {

    }
}