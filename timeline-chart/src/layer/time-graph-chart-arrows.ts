import { TimeGraphArrowComponent, TimeGraphArrowCoordinates } from "../components/time-graph-arrow";
import { TimeGraphElementPosition } from "../components/time-graph-component";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";

export class TimeGraphChartArrows extends TimeGraphChartLayer {

    protected arrows: Map<TimelineChart.TimeGraphArrow, TimeGraphArrowComponent>;

    protected afterAddToContainer() {
        this.unitController.onViewRangeChanged(() => this.update());

        this.rowController.onVerticalOffsetChangedHandler(verticalOffset => {
            this.layer.position.y = -verticalOffset;
        });
    }

    protected getCoordinates(arrow: TimelineChart.TimeGraphArrow): TimeGraphArrowCoordinates {
        const relativeStartPosition = arrow.range.start - this.unitController.viewRange.start;
        const start: TimeGraphElementPosition = {
            x: this.getPixels(relativeStartPosition),
            y: (arrow.sourceId * this.rowController.rowHeight) + (this.rowController.rowHeight / 2)
        }
        const end: TimeGraphElementPosition = {
            x: this.getPixels(relativeStartPosition + arrow.range.end - arrow.range.start),
            y: (arrow.destinationId * this.rowController.rowHeight) + (this.rowController.rowHeight / 2)
        }
        return { start, end };
    }

    protected addArrow(arrow: TimelineChart.TimeGraphArrow) {
        const coords = this.getCoordinates(arrow);
        const arrowComponent = new TimeGraphArrowComponent('arrow', coords);
        this.arrows.set(arrow, arrowComponent);
        this.addChild(arrowComponent);
    }

    addArrows(arrows: TimelineChart.TimeGraphArrow[]): void {
        if (!this.stateController) {
            throw ('Add this TimeGraphChartArrows to a container before adding arrows.');
        }
        this.arrows = new Map();
        arrows.forEach(arrow => {
            this.addArrow(arrow);
        })
    }

    protected update(): void {
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

}