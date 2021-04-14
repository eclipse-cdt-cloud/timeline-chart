import { TimeGraphLayer } from "./time-graph-layer";
import { TimeGraphGrid } from "../components/time-graph-grid";
import { TimelineChart } from "../time-graph-model";

export class TimeGraphChartGrid extends TimeGraphLayer {

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
        this.unitController.onViewRangeChanged(this._updateHandler);
    }

    update() {
        this.gridComponent.update();
    }

    destroy() : void {
        if (this.unitController) {
            this.unitController.removeViewRangeChangedHandler(this._updateHandler);
            this.unitController.removeSelectionRangeChangedHandler(this._updateHandler);
        }
        super.destroy();
    }

}