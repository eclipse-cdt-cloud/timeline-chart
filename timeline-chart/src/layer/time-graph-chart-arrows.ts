import { TimeGraphLayer } from "./time-graph-layer";
import { TimeGraphArrowComponent, TimeGraphArrowHead } from "../components/time-graph-arrow";
import { TimeGraphElementPosition } from "../components/time-graph-component";
import { TimeGraphArrow } from "../time-graph-model";
// import ArrowHead from "./arrowhead.png";

export class TimeGraphChartArrows extends TimeGraphLayer {

    protected rowHeight: number;
    protected arrows: TimeGraphArrow[];

    protected afterAddToContainer() {
        this.unitController.onViewRangeChanged(() => this.update());
    }

    protected addArrow(arrow: TimeGraphArrow, rowHeight: number) {
        const relativeStartPosition = arrow.range.start - this.unitController.viewRange.start;
        const start: TimeGraphElementPosition = {
            x: relativeStartPosition * this.stateController.zoomFactor,
            y: (arrow.sourceId * rowHeight) + (rowHeight / 2)
        }
        const end: TimeGraphElementPosition = {
            x: (relativeStartPosition + arrow.range.end - arrow.range.start) * this.stateController.zoomFactor,
            y: (arrow.destinationId * rowHeight) + (rowHeight / 2)
        }
        const arrowComponent = new TimeGraphArrowComponent('arrow', { start, end });
        this.addChild(arrowComponent);
        const arrowHead = new TimeGraphArrowHead('arrowHead', { start, end });
        this.addChild(arrowHead);
    }

    addArrows(arrows: TimeGraphArrow[], rowHeight: number): void {
        if (!this.stateController) {
            throw ('Add this TimeGraphChartArrows to a container before adding arrows.');
        }
        this.rowHeight = rowHeight;
        this.arrows = [];
        arrows.forEach(arrow => {
            this.arrows.push(arrow);
            this.addArrow(arrow, rowHeight);
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

        // if (this.arrows && this.rowHeight) {
        //     this.removeChildren();
        //     this.addArrows(this.arrows, this.rowHeight);
        // }
    }

}