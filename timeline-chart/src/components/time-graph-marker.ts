import * as PIXI from "pixi.js-legacy";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphRow } from "./time-graph-row";
import { TimeGraphStateComponent, TimeGraphStateStyle } from "./time-graph-state";

export class TimeGraphMarkerState extends TimeGraphStateComponent {

    constructor(
        id: string,
        readonly _model: TimelineChart.TimeGraphMarkerState,
        public xStart:  number,
        public xEnd: number,
        protected _row: TimeGraphRow,
        protected _style: TimeGraphStateStyle = { color: 0xfffa66, height: 14 },
        protected displayWidth: number,
        displayObject?: PIXI.Graphics
    ) {
        super(id, _model, xStart, xEnd, _row, _style, displayWidth, displayObject);
    }

    public get model(): TimelineChart.TimeGraphMarkerState {
        return this._model;
    }

    public get row(): TimeGraphRow {
        return this._row;
    }

}