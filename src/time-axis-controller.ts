import { TimeAxis } from "./time-axis";
import { TimeGraphRange } from "./time-graph";

export class TimeAxisController {

    protected totalRange: TimeGraphRange;
    protected visibleRange: TimeGraphRange;

    constructor(protected timeAxis: TimeAxis) {

    }
}