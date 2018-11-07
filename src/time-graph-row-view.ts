import { TimeGraphState, TimeGraphStateView } from "./time-graph-state-view";
import { TimeGraphComponent } from "./time-graph-component";
import { TimeGraphRange, TimeGraphApplication } from "./time-graph";
import { TimeGraphController } from "./time-graph-controller";

export interface TimeGraphRow {
    start?: number
    end?: number
    states: TimeGraphState[]
}

export class TimeGraphRowView extends TimeGraphComponent {

    protected height: number;
    protected ypos: number;
    protected width: number;

    constructor(
        protected cid: string,
        app: TimeGraphApplication,
        protected rowIdx: number,
        protected row: TimeGraphRow,
        protected range: TimeGraphRange,
        timeGraphController: TimeGraphController
    ) {
        super(cid, app, timeGraphController);
        this.height = 20;
        this.ypos = (this.height * this.rowIdx) + this.height / 2;
        this.width = this.range.end - this.range.start;
    }

    render() {
        this.line({
            start: { x: 0, y: this.ypos },
            end: { x: this.width, y: this.ypos },
            color: 0x000000,
            opacity: 0.2,
            width: 1
        });

        this.row.states.forEach(state => {
            const timeGraphState = new TimeGraphStateView(this.id + state.label + state.range.start, this.app, state, this.ypos, this.range, this.controller);
            timeGraphState.render();
        });
    }

}