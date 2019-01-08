import { TimeGraphComponent, TimeGraphStyledRect } from "./time-graph-component";

export class TimeGraphRectangle extends TimeGraphComponent {
    constructor(protected opts: TimeGraphStyledRect){
        super('rect');
        this._options = opts;
    }

    render(): void {
        this.rect(this._options as TimeGraphStyledRect);
    }
}