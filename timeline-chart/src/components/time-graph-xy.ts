import { TimeGraphComponent } from "./time-graph-component";
import { TimelineChart } from "../time-graph-model";

export interface TimeGraphXYStyle {
    color?: number
    opacity?: number
    thickness?: number
}

export class TimeGraphXYComponent extends TimeGraphComponent<TimelineChart.TimeGraphXYSeries> {

    constructor(
        id: string,
        model: TimelineChart.TimeGraphXYSeries,
        protected _xCoordinates: number[],
        protected _rowHeight: number,
        protected _rowY: number,
        protected _style: TimeGraphXYStyle = {}
    ) {
        super(id, undefined, model);
    }

    render() {
        const color = this._style.color ?? this._model.color ?? 0x0000ff;
        const opacity = this._style.opacity ?? 1;
        const thickness = this._style.thickness ?? 1.5;
        const points = this._model.points;

        if (points.length < 2 || this._xCoordinates.length !== points.length) {
            return;
        }

        this._displayObject.lineStyle(thickness, color, opacity);

        const padding = 2;
        const drawHeight = this._rowHeight - padding * 2;

        // moveTo first point
        const y0 = this._rowY + padding + drawHeight * (1 - points[0].value);
        this._displayObject.moveTo(this._xCoordinates[0], y0);

        for (let i = 1; i < points.length; i++) {
            const y = this._rowY + padding + drawHeight * (1 - points[i].value);
            this._displayObject.lineTo(this._xCoordinates[i], y);
        }
    }
}
