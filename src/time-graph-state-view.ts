import { TimeGraphRange, TimeGraphApplication } from "./time-graph";
import { TimeGraphComponent, TimeGraphRect } from "./time-graph-component";
import { TimeGraphController } from "./time-graph-controller";

export interface TimeGraphState {
    range: TimeGraphRange
    label: string
}

export class TimeGraphStateView extends TimeGraphComponent {

    protected start: number;
    protected end: number;
    protected y: number;
    protected height: number;

    constructor(protected cid: string, app: TimeGraphApplication, protected state: TimeGraphState, yPosition: number, protected range: TimeGraphRange, controller: TimeGraphController) {
        super(cid, app, controller);

        // TODO this calculation of the initial offset must be calculated differently later
        this.start = state.range.start - range.start;
        this.end = state.range.end - range.start;

        // TODO magic number 10 is the half of the row height...must come from a central style-config-provider later.
        this.y = yPosition - 10;
        // TODO magic number 20 must come from a central style-config-provider later.
        this.height = 20;
    }

    render() {
        this.options = <TimeGraphRect>{
            color: 0xC80000,
            x: this.start,
            y: this.y,
            w: this.end - this.start,
            h: this.height
        };
        this.addEvent('mouseover', this.handleMouseOver);
        this.addEvent('mouseout', this.handleMouseOut);
        this.addEvent('mousedown', this.handleMouseDown);
        this.addEvent('mouseup', this.handleMouseOut);
        this.rect(this.options as TimeGraphRect);
    }

    protected changeColor(color: number) {
        this.displayObject.clear();
        this.options.color = color;
        this.rect(this.options as TimeGraphRect);
    }

    protected handleMouseOver = ((event: PIXI.interaction.InteractionEvent) => {
        this.changeColor(0x00C800);
    }).bind(this);

    protected handleMouseOut = ((event: PIXI.interaction.InteractionEvent) => {
        this.changeColor(0xC80000);
    }).bind(this);

    protected handleMouseDown = ((event: PIXI.interaction.InteractionEvent) => {
        this.changeColor(0x0000C8);
    }).bind(this);
}