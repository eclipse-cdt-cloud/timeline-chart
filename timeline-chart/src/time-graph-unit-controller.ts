import { TimelineChart } from "./time-graph-model";
import { BIMath } from './bigint-utils';
import { TimeGraphRenderController } from "./time-graph-render-controller";

export class TimeGraphUnitController {

    
    protected viewRangeChangedHandlers: ((oldRange: TimelineChart.TimeGraphRange, newRange: TimelineChart.TimeGraphRange) => void)[];
    protected _viewRange: TimelineChart.TimeGraphRange;
    
    /**
     * This determines the world size.
     * worldRenderFactor = 1 renders one extra viewRange to the left and right,
     *      so there are three viewRanges rendered.
     */
    private _worldRenderFactor = 1;

    protected _worldRange: TimelineChart.TimeGraphRange;

    protected selectionRangeChangedHandlers: ((newRange?: TimelineChart.TimeGraphRange) => void)[];
    protected _selectionRange?: TimelineChart.TimeGraphRange;

    protected _offset: bigint = BigInt(0);

    protected _renderer: TimeGraphRenderController;
    /**
     *  Create a string from the given number, which is shown in TimeAxis.
     *  Or return undefined to not show any text for that number.
     */
    numberTranslator?: (theNumber: bigint) => string | undefined;
    scaleSteps?: number[]

    constructor(public absoluteRange: bigint, viewRange?: TimelineChart.TimeGraphRange) {
        this._viewRange = viewRange || { start: BigInt(0), end: absoluteRange };
        this._worldRange = this._viewRange;
        
        this.viewRangeChangedHandlers = [];
        this.selectionRangeChangedHandlers = [];
        
        this.updateWorldRangeFromViewRange();
        this._renderer = new TimeGraphRenderController();
    }

    protected handleViewRangeChange(oldRange: TimelineChart.TimeGraphRange) {
        this.viewRangeChangedHandlers.forEach(handler => handler(oldRange, this._viewRange));
    }

    protected handleSelectionRangeChange() {
        this.selectionRangeChangedHandlers.forEach(handler => handler(this._selectionRange));
    }

    onViewRangeChanged(handler: (oldRange: TimelineChart.TimeGraphRange, viewRange: TimelineChart.TimeGraphRange) => void) {
        this.viewRangeChangedHandlers.push(handler);
    }

    removeViewRangeChangedHandler(handler: (oldRange: TimelineChart.TimeGraphRange, viewRange: TimelineChart.TimeGraphRange) => void) {
        const index = this.viewRangeChangedHandlers.indexOf(handler);
        if (index > -1) {
            this.viewRangeChangedHandlers.splice(index, 1);
        }
    }

    updateWorldRangeFromViewRange() {
        const deltaV = this.viewRange.end - this.viewRange.start;
        const start = this.viewRange.start - BIMath.multiply(deltaV, this.worldRenderFactor);
        const end = this.viewRange.end + BIMath.multiply(deltaV, this.worldRenderFactor);
        return this.worldRange = { start, end };
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
        // Making a deep copy
        const oldRange = {
            start: this._viewRange.start,
            end: this._viewRange.end
        };

        if (newRange.end > newRange.start) {
            this._viewRange = { start: newRange.start, end: newRange.end };
        }
        if (newRange.start < 0) {
            this._viewRange.start = BigInt(0);
        }
        if (this._viewRange.end > this.absoluteRange) {
            this._viewRange.end = this.absoluteRange;
        }
        this.handleViewRangeChange(oldRange);
    }

    get worldRange(): TimelineChart.TimeGraphRange {
        return this._worldRange;
    }

    set worldRange(newRange: TimelineChart.TimeGraphRange) {
        if (newRange.end > newRange.start) {
            this._worldRange = { start: newRange.start, end: newRange.end };
        }
        if (newRange.start < 0) {
            this._worldRange.start = BigInt(0);
        }
        if (this._worldRange.end > this.absoluteRange) {
            this._worldRange.end = this.absoluteRange;
        }
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

    get worldRangeLength(): bigint {
        return this._worldRange.end - this._worldRange.start;
    }

    get offset(): bigint {
        return this._offset;
    }

    set offset(offset: bigint) {
        this._offset = offset;
    }

    get worldRenderFactor(): number {
        return this._worldRenderFactor;
    }

    set worldRenderFactor(n: number) {
        this._worldRenderFactor = n;
    }

}
