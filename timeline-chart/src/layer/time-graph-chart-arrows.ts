import { TimeGraphArrowComponent, TimeGraphArrowCoordinates } from "../components/time-graph-arrow";
import { TimeGraphElementPosition } from "../components/time-graph-component";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";

export class TimeGraphChartArrows extends TimeGraphChartLayer {

    protected arrows: Map<TimelineChart.TimeGraphArrow, TimeGraphArrowComponent>;
    private _updateHandler: { (): void; (viewRange: TimelineChart.TimeGraphRange): void; (viewRange: TimelineChart.TimeGraphRange): void; };

    protected afterAddToContainer() {
        this._updateHandler = (): void => this.update();
        this.unitController.onViewRangeChanged(this._updateHandler);

        this.rowController.onVerticalOffsetChangedHandler(verticalOffset => {
            this.layer.position.y = -verticalOffset;
        });
    }

    protected getCoordinates(arrow: TimelineChart.TimeGraphArrow): TimeGraphArrowCoordinates {
        const relativeStartPosition = arrow.range.start - this.unitController.viewRange.start;
        const start: TimeGraphElementPosition = {
            x: this.getPixel(relativeStartPosition),
            y: (arrow.sourceId * this.rowController.rowHeight) + (this.rowController.rowHeight / 2)
        }
        const end: TimeGraphElementPosition = {
            x: this.getPixel(relativeStartPosition + arrow.range.end - arrow.range.start),
            y: (arrow.destinationId * this.rowController.rowHeight) + (this.rowController.rowHeight / 2)
        }
        return { start, end };
    }

    protected addArrow(arrow: TimelineChart.TimeGraphArrow) {
        const coords = this.getCoordinates(arrow);
        const arrowComponent = new TimeGraphArrowComponent('arrow', arrow, coords);
        this.arrows.set(arrow, arrowComponent);
        this.addChild(arrowComponent);
    }

    addArrows(arrows: TimelineChart.TimeGraphArrow[]): void {
        if (!this.stateController) {
            throw ('Add this TimeGraphChartArrows to a container before adding arrows.');
        }
        if (this.arrows) {
            this.removeChildren();
        }
        this.arrows = new Map();
        arrows.forEach(arrow => {
            this.addArrow(arrow);
        })
    }

    update(): void {
        if (this.arrows) {
            for (const arrow of this.arrows.keys()) {
                this.updateArrow(arrow);
            }
        }
    }

    protected updateArrow(arrow: TimelineChart.TimeGraphArrow) {
        const { start, end } = this.getCoordinates(arrow);
        const arrowComponent = this.arrows.get(arrow);
        if (arrowComponent) {
            arrowComponent.update({ start, end });
        }
    }

    destroy() : void {
        if (this.unitController) {
            this.unitController.removeViewRangeChangedHandler(this._updateHandler);
        }
        super.destroy();
    }
}