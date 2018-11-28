import { TimeGraphComponent, TimeGraphStyledRect } from "./time-graph-component";
import { TimeGraphRow } from "./time-graph-row";
import { TimeGraphRowElementModel } from "../time-graph-model";

export interface TimeGraphRowElementStyle {
    color?: number
    height?: number
    borderWidth?: number
    borderColor?: number
}

export class TimeGraphRowElement extends TimeGraphComponent {

    protected rectangleOptions: TimeGraphStyledRect;

    constructor(
        id: string,
        protected _options: TimeGraphRowElementModel,
        protected _row: TimeGraphRow,
        style: TimeGraphRowElementStyle = { color: 0xfffa66, height: 14 }
    ) {
        super(id);
        const height = style.height || 14;
        const position = {
            x: this._options.range.start,
            y: this._row.position.y - (height / 2)
        };
        const width = this._options.range.end - this._options.range.start;
        this.rectangleOptions = {
            color: style.color,
            height,
            position,
            width,
            borderRadius: 2
        };
    }

    get model(): TimeGraphRowElementModel {
        return this._options;
    }

    get row(): TimeGraphRow {
        return this._row;
    }

    set style(style: TimeGraphRowElementStyle) {
        if (style.color !== undefined) {
            this.rectangleOptions.color = style.color;
        }
        if (style.height !== undefined) {
            this.rectangleOptions.height = style.height;
        }
        if(style.borderColor !== undefined){
            this.rectangleOptions.borderColor = style.color;
        }
        if(style.borderWidth !== undefined) {
            this.rectangleOptions.borderWidth = style.borderWidth;
        }
        this.update();
    }

    render() {
        this.rect(this.rectangleOptions);
    }
}