import { TimeGraphArrowComponent, TimeGraphArrowHead } from "../components/time-graph-arrow";
import { TimeGraphElementPosition } from "../components/time-graph-component";
import { TimeGraphArrow } from "../time-graph-model";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";
// import ArrowHead from "./arrowhead.png";

export class TimeGraphChartArrows extends TimeGraphChartLayer {

    protected arrows: TimeGraphArrow[];

    protected afterAddToContainer() {
        this.unitController.onViewRangeChanged(() => this.update());

        this.rowController.onVerticalOffsetChangedHandler(verticalOffset => {
            this.layer.position.y = -verticalOffset;
        });
    }

    protected addArrow(arrow: TimeGraphArrow) {
        const relativeStartPosition = arrow.range.start - this.unitController.viewRange.start;
        const start: TimeGraphElementPosition = {
            x: relativeStartPosition * this.stateController.zoomFactor,
            y: (arrow.sourceId * this.rowController.rowHeight) + (this.rowController.rowHeight / 2)
        }
        const end: TimeGraphElementPosition = {
            x: (relativeStartPosition + arrow.range.end - arrow.range.start) * this.stateController.zoomFactor,
            y: (arrow.destinationId * this.rowController.rowHeight) + (this.rowController.rowHeight / 2)
        }
        const arrowComponent = new TimeGraphArrowComponent('arrow', { start, end });
        this.addChild(arrowComponent);
        const arrowHead = new TimeGraphArrowHead('arrowHead', { start, end });
        this.addChild(arrowHead);
    }

    addArrows(arrows: TimeGraphArrow[]): void {
        if (!this.stateController) {
            throw ('Add this TimeGraphChartArrows to a container before adding arrows.');
        }
        this.arrows = [];
        arrows.forEach(arrow => {
            this.arrows.push(arrow);
            this.addArrow(arrow);
        })
    }

    protected update(): void {
        // PIXI.loader
        //     .add(ArrowHead)
        //     .load((() => {
        //     let sprite = new PIXI.Sprite(
        //         PIXI.loader.resources[ArrowHead].texture
        //     );
        //     sprite.x = 100;
        //     sprite.y = 100;
        //     this.stage.addChild(sprite);
        // }).bind(this));

        if (this.arrows) {
            this.removeChildren();
            this.addArrows(this.arrows);
        }
    }

}