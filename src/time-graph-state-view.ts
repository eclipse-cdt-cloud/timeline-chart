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

    constructor(protected cid: string, protected state: TimeGraphState, yPosition: number, protected range: TimeGraphRange) {
        super(cid);

        // TODO this calculation of the initial offset must be calculated differently later
        this.start = state.range.startTime - range.startTime;
        this.end = state.range.endTime - range.startTime;

        // TODO magic number 10 is the half of the row height...must come from a central style-config-provider later.
        this.y = yPosition-10;
        // TODO magic number 20 must come from a central style-config-provider later.
        this.height = 20;
    }

    render() {
        this.rect({
            color: 'rgb(200,0,0)',
            x: this.start,
            y: this.y,
            w: this.end-this.start,
            h: this.height
        });
    }
}