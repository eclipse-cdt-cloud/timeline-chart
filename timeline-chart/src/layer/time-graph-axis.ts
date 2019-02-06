import { TimeGraphAxisScale } from "../components/time-graph-axis-scale";
import { TimeGraphLayer } from "./time-graph-layer";
import * as _ from "lodash";

export class TimeGraphAxis extends TimeGraphLayer {

    protected scaleComponent: TimeGraphAxisScale;
    protected controlKeyDown: boolean;

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
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            this.controlKeyDown = event.ctrlKey;
        });
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            this.controlKeyDown = event.ctrlKey;
        });
        const mw = _.throttle((ev: WheelEvent) => {
            if (this.controlKeyDown) {
                // ZOOM AROUND MOUSE POINTER
                let newViewRangeLength = this.unitController.viewRangeLength;
                let xOffset = 0;
                let moveX = false;
                if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) {
                    xOffset = -(ev.deltaX / this.stateController.zoomFactor);
                    moveX = true;
                } else {
                    const zoomPosition = (ev.offsetX / this.stateController.zoomFactor);
                    const deltaLength = (ev.deltaY / this.stateController.zoomFactor);
                    newViewRangeLength += deltaLength;
                    xOffset = ((zoomPosition / this.unitController.viewRangeLength) * deltaLength);
                }
                let start = this.unitController.viewRange.start - xOffset;
                if (start < 0) {
                    start = 0;
                }
                let end = start + newViewRangeLength;
                if (end > this.unitController.absoluteRange) {
                    end = this.unitController.absoluteRange;
                    if (moveX) {
                        start = end - newViewRangeLength;
                    }
                }
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
            return false;
        });
        this.onCanvasEvent('mousewheel', mw);
        this.onCanvasEvent('wheel', mw);
        this.scaleComponent = new TimeGraphAxisScale(
            this.id + '_scale',
            this.getOptions(),
            this.unitController,
            this.stateController
        );
        this.addChild(this.scaleComponent);

        this.unitController.onSelectionRangeChange(() => this.update());
        this.unitController.onViewRangeChanged(() => this.update());
    }

    update() {
        this.scaleComponent.update(this.getOptions());
    }
}