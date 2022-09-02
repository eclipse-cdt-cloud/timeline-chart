import { TimeGraphViewportLayer } from "./time-graph-viewport-layer";
import { TimeGraphGrid } from "../components/time-graph-grid";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphAxisLayerOptions } from "./time-graph-axis";

export class TimeGraphChartGrid extends TimeGraphViewportLayer {

    protected gridComponent: TimeGraphGrid;
    private _updateHandler: { (): void; (viewRange: TimelineChart.TimeGraphRange): void; (viewRange: TimelineChart.TimeGraphRange): void; (selectionRange: TimelineChart.TimeGraphRange): void; };;

    constructor(id: string, protected rowHeight: number, protected lineColor?: number) {
        super(id);
    }

    protected afterAddToContainer() {
        this.gridComponent = new TimeGraphGrid('', {
            height: this.stateController.canvasDisplayHeight,
            position: { x: 0, y: 0 },
            width: this.stateController.canvasDisplayWidth,
            lineColor: this.lineColor
        }, this.rowHeight, this.unitController, this.stateController);
        this.addChild(this.gridComponent);
        this._updateHandler = (): void => this.update();
        this.stateController.onWorldRender(this._updateHandler);
    }

    update(opts?: TimeGraphAxisLayerOptions) {
        this.gridComponent.update(opts);
    }

    destroy() : void {
        if (this.unitController) {
            this.stateController.removeWorldRenderHandler(this._updateHandler);
            this.unitController.removeSelectionRangeChangedHandler(this._updateHandler);
        }
        super.destroy();
    }

}