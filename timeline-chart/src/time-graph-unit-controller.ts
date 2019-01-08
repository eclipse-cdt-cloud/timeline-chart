import { TimeGraphRange } from "./time-graph-model";

export class TimeGraphUnitController {
    protected viewRangeChangedHandlers: ((newRange: TimeGraphRange) => void)[];
    protected _viewRange: TimeGraphRange;

    protected selectionRangeChangedHandlers: ((newRange?: TimeGraphRange) => void)[];
    protected _selectionRange?: TimeGraphRange;

    numberTranslator?: (theNumber: number) => string;

    constructor(public absoluteRange: number, viewRange?: TimeGraphRange) {
        this.viewRangeChangedHandlers = [];
        this._viewRange = viewRange || { start: 0, end: absoluteRange };

        this.selectionRangeChangedHandlers = [];
    }

    protected handleViewRangeChange() {
        this.viewRangeChangedHandlers.forEach(handler => handler(this._viewRange));
    }

    protected handleSelectionRangeChange() {
        this.selectionRangeChangedHandlers.forEach(handler => handler(this._selectionRange));
    }

    onViewRangeChanged(handler: (viewRange: TimeGraphRange) => void) {
        this.viewRangeChangedHandlers.push(handler);
    }

    onSelectionRangeChange(handler: (selectionRange: TimeGraphRange) => void) {
        this.selectionRangeChangedHandlers.push(handler);
    }

    get viewRange(): TimeGraphRange {
        return this._viewRange;
    }
    set viewRange(newRange: TimeGraphRange) {
        if (newRange.end > newRange.start) {
            this._viewRange = { start: newRange.start, end: newRange.end };
        }
        if (newRange.start < 0) {
            this._viewRange.start = 0;
        }
        if (this._viewRange.end > this.absoluteRange) {
            this._viewRange.end = this.absoluteRange;
        }
        this.handleViewRangeChange();
    }

    get selectionRange(): TimeGraphRange | undefined {
        return this._selectionRange;
    }
    set selectionRange(value: TimeGraphRange | undefined) {
        this._selectionRange = value;
        this.handleSelectionRangeChange();
    }

    get viewRangeLength(): number {
        return this._viewRange.end - this._viewRange.start;
    }
}