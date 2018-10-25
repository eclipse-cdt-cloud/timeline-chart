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
        protected idx: number,
        protected row: TimeGraphRow,
        protected range: TimeGraphRange
    ) {
        super();
        this.height = 20;
        this.ypos =(this.height * this.idx) + this.height/2;
        this.width = this.range.endTime - this.range.startTime;
    }

    render() {
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.ypos);
        this.ctx.lineTo(this.width, this.ypos);
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        this.ctx.stroke();

        this.row.states.forEach(state => {
            const timeGraphState = new TimeGraphStateView(state, this.ypos, this.range);
            timeGraphState.setContext(this.ctx);
            timeGraphState.render();
        });
    }

}