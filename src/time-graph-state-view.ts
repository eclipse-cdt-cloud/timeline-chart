import { TimeGraphRange } from "./time-graph";
import { TimeGraphComponent } from "./time-graph-component";

export interface TimeGraphState {
    range: TimeGraphRange
    label: string
}

export class TimeGraphStateView extends TimeGraphComponent {

    protected start: number;
    protected end: number;
    protected y: number;
    protected height: number;

    constructor(protected state: TimeGraphState, yPosition: number, protected range: TimeGraphRange) {
        super();

        // TODO this calculation of the initial offset must be calculated differently later
        this.start = state.range.startTime - range.startTime;
        this.end = state.range.endTime - range.startTime;

        // TODO magic number 10 is the half of the row height...must come from a central style-config-provider later.
        this.y = yPosition-10;
        // TODO magic number 20 must come from a central style-config-provider later.
        this.height = 20;
    }

    render() {
        this.ctx.fillStyle = 'rgb(200,0,0)';
        this.ctx.fillRect(this.start, this.y, this.end-this.start, this.height);
    }
}