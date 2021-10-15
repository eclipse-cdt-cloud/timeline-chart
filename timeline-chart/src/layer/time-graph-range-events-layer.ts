import { TimeGraphRectangle } from "../components/time-graph-rectangle";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphChartProviders } from "./time-graph-chart";
import { TimeGraphLayer } from "./time-graph-layer";

export class TimeGraphRangeEventsLayer extends TimeGraphLayer {
    protected rangeEvents: Map<TimelineChart.TimeGraphAnnotation, TimeGraphRectangle>;
    protected providers: TimeGraphChartProviders;

    private _viewRangeUpdateHandler: { (): void; (viewRange: TimelineChart.TimeGraphRange): void; (viewRange: TimelineChart.TimeGraphRange): void; };

    constructor(id: string, providers: TimeGraphChartProviders) {
        super(id);
        this.providers = providers;
    }

    protected afterAddToContainer() {
        this._viewRangeUpdateHandler = (): void => this.update();
        this.unitController.onViewRangeChanged(this._viewRangeUpdateHandler);
    }

    protected addRangeEvent(rangeEvent: TimelineChart.TimeGraphAnnotation) {
        const start = this.getPixel(rangeEvent.range.start - this.unitController.viewRange.start);
        const end = this.getPixel(rangeEvent.range.end - this.unitController.viewRange.start);
        const width = end - start;
        const elementStyle = this.providers.rowAnnotationStyleProvider ? this.providers.rowAnnotationStyleProvider(rangeEvent) : undefined;
        const rangeEventComponent = new TimeGraphRectangle({
            color: (elementStyle ? elementStyle.color : 0x000000),
            opacity: (elementStyle ? elementStyle.opacity : 1.0),
            position: {
                x: start,
                y: 0
            },
            height: this.stateController.canvasDisplayHeight,
            width
        });
        this.rangeEvents.set(rangeEvent, rangeEventComponent);
        this.addChild(rangeEventComponent);
    }

    addRangeEvents(rangeEvents: TimelineChart.TimeGraphAnnotation[]): void {
        if (!this.stateController) {
            throw ('Add the TimeGraphRangeEventsLayer to a container before adding range events.');
        }
        if (this.rangeEvents) {
            this.removeChildren();
        }
        this.rangeEvents = new Map();
        rangeEvents.forEach(range => {
            this.addRangeEvent(range);
        })
    }

    update(): void {
        if (this.rangeEvents) {
            for (const range of this.rangeEvents.keys()) {
                this.updateRangeEvent(range);
            }
        }
    }

    protected updateRangeEvent(rangeEvent: TimelineChart.TimeGraphAnnotation) {
        const rangeEventComponent = this.rangeEvents.get(rangeEvent);
        const start = this.getPixel(rangeEvent.range.start - this.unitController.viewRange.start);
        const end = this.getPixel(rangeEvent.range.end - this.unitController.viewRange.start);
        const width = end - start;
        if (rangeEventComponent) {
            rangeEventComponent.update({
                position: {
                    x: start,
                    y: 0
                },
                height: this.stateController.canvasDisplayHeight,
                width
            });
        }
    }

    destroy(): void {
        if (this.unitController) {
            this.unitController.removeViewRangeChangedHandler(this._viewRangeUpdateHandler);
        }
        super.destroy();
    }
}