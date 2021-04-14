import { TimeGraphRectangle } from "../components/time-graph-rectangle";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphLayer } from "./time-graph-layer";

export class TimeGraphChartSelectionRange extends TimeGraphLayer {
    protected selectionRange?: TimeGraphRectangle;
    protected color: number = 0x0000ff;
    private _viewRangeUpdateHandler: { (): void; (viewRange: TimelineChart.TimeGraphRange): void; (viewRange: TimelineChart.TimeGraphRange): void; };
    private _updateHandler: { (): void; (selectionRange: TimelineChart.TimeGraphRange): void; (selectionRange: TimelineChart.TimeGraphRange): void; };

    constructor(id: string, style?: { color?: number }) {
        super(id);
        if (style && style.color) {
            this.color = style.color;
        }
    }

    protected updateScaleAndPosition() {
        if (this.unitController.selectionRange && this.selectionRange) {
            this.selectionRange.rectOptions.position.x = this.getPixels(this.unitController.selectionRange.start - this.unitController.viewRange.start);
            this.selectionRange.rectOptions.width = this.getPixels(this.unitController.selectionRange.end - this.unitController.selectionRange.start)
            this.selectionRange.update();
        }
    }

    protected afterAddToContainer() {
        this._viewRangeUpdateHandler = () => {
            this.updateScaleAndPosition();
        };

        this._updateHandler = (): void => this.update();
        this.unitController.onViewRangeChanged(this._viewRangeUpdateHandler);
        this.unitController.onSelectionRangeChange(this._updateHandler);
        this.update();
    }

    protected removeSelectionRange() {
        this.removeChildren();
        delete this.selectionRange;
    }

    update() {
        if (this.unitController.selectionRange) {
            const firstCursorPosition = this.getPixels(this.unitController.selectionRange.start - this.unitController.viewRange.start);
            const secondCursorPosition = this.getPixels(this.unitController.selectionRange.end - this.unitController.viewRange.start);
            if (secondCursorPosition !== firstCursorPosition) {
                if (!this.selectionRange) {
                    this.selectionRange = new TimeGraphRectangle({
                        color: this.color,
                        opacity: 0.2,
                        position: {
                            x: firstCursorPosition,
                            y: 0
                        },
                        height: this.stateController.canvasDisplayHeight,
                        width: secondCursorPosition - firstCursorPosition
                    });
                    this.addChild(this.selectionRange);
                } else {
                    this.selectionRange.update({
                        color: this.color,
                        opacity: 0.2,
                        position: {
                            x: firstCursorPosition,
                            y: 0
                        },
                        height: this.stateController.canvasDisplayHeight,
                        width: secondCursorPosition - firstCursorPosition
                    })
                }
            } else {
                this.removeSelectionRange();
            }
        } else {
            this.removeSelectionRange();
        }
    }

    destroy() : void {
        if (this.unitController) {
            this.unitController.removeViewRangeChangedHandler(this._viewRangeUpdateHandler);
            this.unitController.removeSelectionRangeChangedHandler(this._updateHandler);
        }
        super.destroy();
    }
}