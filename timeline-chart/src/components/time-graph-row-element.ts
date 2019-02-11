import { TimeGraphComponent, TimeGraphStyledRect, TimeGraphElementPosition } from "./time-graph-component";
import { TimeGraphRow } from "./time-graph-row";
import { TimelineChart } from "../time-graph-model";

export interface TimeGraphRowElementStyle {
    color?: number
    height?: number
    borderWidth?: number
    borderColor?: number
}

export class TimeGraphRowElement extends TimeGraphComponent {

    height: number;
    position: TimeGraphElementPosition;

    protected _options: TimeGraphStyledRect;

    constructor(
        id: string,
        protected _model: TimelineChart.TimeGraphRowElementModel,
        protected range: TimelineChart.TimeGraphRange,
        protected _row: TimeGraphRow,
        protected _style: TimeGraphRowElementStyle = { color: 0xfffa66, height: 14 },
        displayObject?: PIXI.Graphics
    ) {
        super(id, displayObject);
        this.height = _style.height || 14;
        this.position = {
            x: this.range.start,
            y: this._row.position.y + ((this.row.height - this.height) / 2)
        };
        const width = this.range.end - this.range.start;
        this._options = {
            color: _style.color,
            height: this.height,
            position: this.position,
            width,
            borderRadius: 2,
            borderWidth: _style.borderWidth || 0,
            borderColor: _style.borderColor || 0x000000
        };
    }

    get model(): TimelineChart.TimeGraphRowElementModel {
        return this._model;
    }

    get row(): TimeGraphRow {
        return this._row;
    }

    get style() {
        return this._style;
    }

    set style(style: TimeGraphRowElementStyle) {
        if (style.color !== undefined) {
            this._options.color = style.color;
        }
        if (style.height !== undefined) {
            this._options.height = style.height;
        }
        if (style.borderColor !== undefined) {
            this._options.borderColor = style.borderColor;
        }
        if (style.borderWidth !== undefined) {
            this._options.borderWidth = style.borderWidth;
        }
        this.update();
    }

    update(opts?: TimeGraphStyledRect) {
        if (opts) {
            this._options.position = opts.position;
            this._options.width = opts.width;
        }
        super.update();
    }

    render() {
        if (this._options.width < 10) {
            this.rect(this._options);
        } else {
            this.rectTruncated(this._options);
        }
    }
}