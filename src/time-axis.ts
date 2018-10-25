import { TimeAxisController } from "./time-axis-controller";
import { TimelineView } from "./timeline-view";

export class TimeAxis {

    protected readonly _controller: TimeAxisController;

    protected timelineViews: Map<string, TimelineView> = new Map();

    constructor() {
        this._controller = new TimeAxisController(this);
    }

    get controller(): TimeAxisController {
        return this._controller;
    }

    addTimelineView(id: string, tlv: TimelineView): void {
        this.timelineViews.set(id, tlv);
    }

    getTimelineViews(): Map<string, TimelineView> {
        return this.timelineViews;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(200,200,200,0.4)';
        ctx.fillRect(-50, 0, 300, 10);
    }
}