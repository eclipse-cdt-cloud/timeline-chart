import { TimeGraphLayer } from "./time-graph-layer";
import { TimeGraphGrid } from "../components/time-graph-grid";

export class TimeGraphChartGrid extends TimeGraphLayer {

    protected gridComponent: TimeGraphGrid;

    constructor(id:string, protected rowHeight: number){
        super(id);
    }

    protected init() {
        this.gridComponent = new TimeGraphGrid(this.unitController, this.stateController, this.rowHeight);
        this.addChild(this.gridComponent);
        this.unitController.onViewRangeChanged(() => this.update());
    }

    update() {
        this.gridComponent.update();
    }

}