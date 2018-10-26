import { TimeGraphState, TimeGraphStateView } from "./time-graph-state-view";
import { TimeGraphComponent } from "./time-graph-component";
import { TimeGraphRange } from "./time-graph";

export interface TimeGraphRow {
    states: TimeGraphState[]
}

export class TimeGraphRowView extends TimeGraphComponent {

    protected height: number;
    protected ypos: number;
    protected width: number;

    constructor(
        protected cid: string,
        protected rowIdx: number,
        protected row: TimeGraphRow,
        protected range: TimeGraphRange
    ) {
        super(cid);
        this.height = 20;
        this.ypos = (this.height * this.rowIdx) + this.height / 2;
        this.width = this.range.endTime - this.range.startTime;
    }

    render() {
        this.line({
            start: { x: 0, y: this.ypos },
            end: { x: this.width, y: this.ypos },
            color: 'rgba(0,0,0,0.2)'
        });

        this.row.states.forEach(state => {
            const timeGraphState = new TimeGraphStateView(this.id + state.label + state.range.startTime, state, this.ypos, this.range);
            timeGraphState.context = this._ctx;
            timeGraphState.render();
        });
    }

}