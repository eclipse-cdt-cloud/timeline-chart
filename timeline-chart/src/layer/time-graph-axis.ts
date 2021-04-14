import { TimeGraphAxisScale } from "../components/time-graph-axis-scale";
import { TimeGraphLayer } from "./time-graph-layer";
import * as _ from "lodash";
import { TimelineChart } from "../time-graph-model";

export class TimeGraphAxis extends TimeGraphLayer {

    protected scaleComponent: TimeGraphAxisScale;
    protected controlKeyDown: boolean;
    private _updateHandler: { (): void; (selectionRange: TimelineChart.TimeGraphRange): void; (viewRange: TimelineChart.TimeGraphRange): void; (viewRange: TimelineChart.TimeGraphRange): void; (selectionRange: TimelineChart.TimeGraphRange): void; };
    private _mouseWheelHandler: _.DebouncedFunc<(ev: WheelEvent) => boolean>;
    private _keyUpHandler: { (event: KeyboardEvent): void; (this: Document, ev: KeyboardEvent): any; };
    private _keyDownHandler: { (event: KeyboardEvent): void; (this: Document, ev: KeyboardEvent): any; };

    constructor(id: string, protected style?: { color?: number, lineColor?: number }) {
        super(id);
    }

    protected getOptions() {
        let color;
        let lineColor;
        if (this.style) {
            color = this.style.color;
            lineColor = this.style.lineColor;
        }
        return {
            height: this.stateController.canvasDisplayHeight,
            width: this.stateController.canvasDisplayWidth,
            position: {
                x: 0,
                y: 0
            },
            color,
            lineColor
        }
    }

    protected afterAddToContainer() {
        this.controlKeyDown = false
        this._keyDownHandler = (event: KeyboardEvent) => {
            this.controlKeyDown = event.ctrlKey;
        };
        document.addEventListener('keydown', this._keyDownHandler);
        this._keyUpHandler = (event: KeyboardEvent) => {
            this.controlKeyDown = event.ctrlKey;
        };
        document.addEventListener('keyup', this._keyUpHandler);
        this._mouseWheelHandler = _.throttle((ev: WheelEvent) => {
            if (this.controlKeyDown) {
                // ZOOM AROUND MOUSE POINTER
                const zoomPosition = (ev.offsetX / this.stateController.zoomFactor);
                const zoomIn = ev.deltaY < 0;
                const newViewRangeLength = Math.max(1, Math.min(this.unitController.absoluteRange,
                    this.unitController.viewRangeLength * (zoomIn ? 0.8 : 1.25)));
                const center = this.unitController.viewRange.start + zoomPosition;
                const start = Math.max(0, Math.min(this.unitController.absoluteRange - newViewRangeLength,
                    center - zoomPosition * newViewRangeLength / this.unitController.viewRangeLength));
                const end = start + newViewRangeLength;    
                this.unitController.viewRange = {
                    start,
                    end
                }
            } else {
                // PANNING
                const shiftStep = ev.deltaY;
                const oldViewRange = this.unitController.viewRange;
                let start = oldViewRange.start + (shiftStep / this.stateController.zoomFactor);
                if (start < 0) {
                    start = 0;
                }
                let end = start + this.unitController.viewRangeLength;
                if (end > this.unitController.absoluteRange) {
                    start = this.unitController.absoluteRange - this.unitController.viewRangeLength;
                    end = start + this.unitController.viewRangeLength;
                }
                this.unitController.viewRange = { start, end }
            }
            ev.preventDefault();
            return false;
        });
        this.onCanvasEvent('mousewheel', this._mouseWheelHandler);
        this.onCanvasEvent('wheel', this._mouseWheelHandler);
        this.scaleComponent = new TimeGraphAxisScale(
            this.id + '_scale',
            this.getOptions(),
            this.unitController,
            this.stateController
        );
        this.addChild(this.scaleComponent);

        this._updateHandler = (): void => this.update();
        this.unitController.onSelectionRangeChange(this._updateHandler);
        this.unitController.onViewRangeChanged(this._updateHandler);
    }

    update() {
        this.scaleComponent.update(this.getOptions());
    }

    destroy() : void {
        if (this.unitController) {
            this.unitController.removeViewRangeChangedHandler(this._updateHandler);
            this.unitController.removeSelectionRangeChangedHandler(this._updateHandler);
        }
        if (this._mouseWheelHandler) {
            this.removeOnCanvasEvent('mousewheel', this._mouseWheelHandler);
            this.removeOnCanvasEvent('wheel', this._mouseWheelHandler);
        }
        if (this._keyDownHandler) {
            document.removeEventListener('keydown', this._keyDownHandler);
        }
        if (this._keyUpHandler) {
            document.removeEventListener('keyup', this._keyUpHandler);
        }
        super.destroy();
    }
}