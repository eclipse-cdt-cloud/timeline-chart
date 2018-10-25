import { TimeAxis } from "./time-axis";

export class TimeLineChart {

    protected timeAxisMap: Map<string, TimeAxis> = new Map();

    protected ctx?: CanvasRenderingContext2D;

    constructor(id: string) {
        const container = document.getElementById(id);
        if (container) {
            const canvas: HTMLCanvasElement = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            canvas.id = id + '_time-line-view-canvas';
            canvas.className = 'timeline-canvas';
            container.appendChild(canvas);
            this.ctx = canvas.getContext('2d') || undefined;
        } else {
            throw (`No container with id ${id} available.`);
        }
    }

    protected render() {
        this.timeAxisMap.forEach((ta) => {
            if (this.ctx) {
                ta.render(this.ctx);
                const tlvs = ta.getTimelineViews();
                tlvs.forEach((tlv) => {
                    if (this.ctx) {
                        tlv.render(this.ctx);
                    }
                });
            }
        })
    }

    addTimeAxis(id: string, ta: TimeAxis) {
        this.timeAxisMap.set(id, ta);
        this.render();
    }
}