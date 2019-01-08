import { TimeGraphRectangle } from "../components/time-graph-rectangle";
import { TimeGraphLayer } from "./time-graph-layer";

export class TimeGraphChartSelectionRange extends TimeGraphLayer {
    protected selectionRange: TimeGraphRectangle;
    protected color: number = 0x0000ff;

    constructor(id: string, style?: { color?: number }) {
        super(id);
        if (style && style.color) {
            this.color = style.color;
        }
    }

    protected updateScaleAndPosition() {
        this.layer.position.x = -(this.unitController.viewRange.start * this.stateController.zoomFactor);
        this.layer.scale.x = this.stateController.zoomFactor;
    }

    protected afterAddToContainer() {
        this.unitController.onViewRangeChanged(() => {
            this.updateScaleAndPosition();
        });
        this.updateScaleAndPosition();
        this.unitController.onSelectionRangeChange(() => this.update());
    }

    update() {
        if (this.unitController.selectionRange) {
            const firstCursorPosition = this.unitController.selectionRange.start;
            const secondCursorPosition = this.unitController.selectionRange.end;
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
            }else{
                this.removeChildren();
                delete this.selectionRange;
            }
        }
    }
}