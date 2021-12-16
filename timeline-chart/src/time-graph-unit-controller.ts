import { TimelineChart } from "./time-graph-model";

export class TimeGraphUnitController {
    protected viewRangeChangedHandlers: ((newRange: TimelineChart.TimeGraphRange) => void)[];
    protected _viewRange: TimelineChart.TimeGraphRange;

    protected selectionRangeChangedHandlers: ((newRange?: TimelineChart.TimeGraphRange) => void)[];
    protected _selectionRange?: TimelineChart.TimeGraphRange;

    protected _offset: bigint = BigInt(0);

    /**
     *  Create a string from the given number, which is shown in TimeAxis.
     *  Or return undefined to not show any text for that number.
     */
    numberTranslator?: (theNumber: bigint) => string | undefined;
    scaleSteps?: number[]

    constructor(public absoluteRange: bigint, viewRange?: TimelineChart.TimeGraphRange) {
        this.viewRangeChangedHandlers = [];
        this._viewRange = viewRange || { start: BigInt(0), end: absoluteRange };

        this.selectionRangeChangedHandlers = [];
    }

    protected handleViewRangeChange() {
        this.viewRangeChangedHandlers.forEach(handler => handler(this._viewRange));
    }

    protected handleSelectionRangeChange() {
        this.selectionRangeChangedHandlers.forEach(handler => handler(this._selectionRange));
    }

    onViewRangeChanged(handler: (viewRange: TimelineChart.TimeGraphRange) => void) {
        this.viewRangeChangedHandlers.push(handler);
    }

    removeViewRangeChangedHandler(handler: (viewRange: TimelineChart.TimeGraphRange) => void) {
        const index = this.viewRangeChangedHandlers.indexOf(handler);
        if (index > -1) {
            this.viewRangeChangedHandlers.splice(index, 1);
        }
    }

    onSelectionRangeChange(handler: (selectionRange: TimelineChart.TimeGraphRange) => void) {
        this.selectionRangeChangedHandlers.push(handler);
    }

    removeSelectionRangeChangedHandler(handler: (selectionRange: TimelineChart.TimeGraphRange) => void) {
        const index = this.selectionRangeChangedHandlers.indexOf(handler);
        if (index > -1) {
            this.selectionRangeChangedHandlers.splice(index, 1);
        }
    }

    get viewRange(): TimelineChart.TimeGraphRange {
        return this._viewRange;
    }
    set viewRange(newRange: TimelineChart.TimeGraphRange) {
        if (newRange.end > newRange.start) {
            this._viewRange = { start: newRange.start, end: newRange.end };
        }
        if (newRange.start < 0) {
            this._viewRange.start = BigInt(0);
        }
        if (this._viewRange.end > this.absoluteRange) {
            this._viewRange.end = this.absoluteRange;
        }
        this.handleViewRangeChange();
    }

    get selectionRange(): TimelineChart.TimeGraphRange | undefined {
        return this._selectionRange;
    }
    set selectionRange(value: TimelineChart.TimeGraphRange | undefined) {
        this._selectionRange = value;
        this.handleSelectionRangeChange();
    }

    get viewRangeLength(): bigint {
        return this._viewRange.end - this._viewRange.start;
    }

    get offset(): bigint {
        return this._offset;
    }

    set offset(offset: bigint) {
        this._offset = offset;
    }
}
