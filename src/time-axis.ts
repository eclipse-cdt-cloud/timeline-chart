import { TimeGraphComponent } from "./time-graph-component";

export class TimeAxis extends TimeGraphComponent {

    render() {
        this.rect({
            color: 'rgb(200,200,200)',
            h: this._ctx.canvas.height,
            w: 6000, // TODO magic number width of the time-graph
            x: 0,
            y: 0
        });
    }

}