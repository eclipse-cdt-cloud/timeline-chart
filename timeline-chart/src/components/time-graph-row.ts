import { TimeGraphComponent, TimeGraphElementPosition, TimeGraphParentComponent, TimeGraphStyledRect } from "./time-graph-component";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphStateComponent } from "./time-graph-state";

export interface TimeGraphRowStyle {
    backgroundColor?: number
    backgroundOpacity?: number
    lineThickness?: number
    lineColor?: number
    lineOpacity?: number
}

export class TimeGraphRow extends TimeGraphComponent<TimelineChart.TimeGraphRowModel> implements TimeGraphParentComponent {

    protected states: TimeGraphStateComponent[] = [];

    constructor(
        id: string,
        protected _options: TimeGraphStyledRect,
        protected _rowIndex: number,
        model: TimelineChart.TimeGraphRowModel,
        protected _style: TimeGraphRowStyle = { lineOpacity: 0.5, lineThickness: 1, backgroundOpacity: 0 }) {
        super(id, undefined, model);
    }

    get rowIndex(): number {
        return this._rowIndex;
    }

    render() {
        this.rect({
            color: this._style.backgroundColor,
            opacity: this._style.backgroundOpacity,
            height: this._options.height,
            width: this._options.width,
            position: this._options.position
        });
        this.hline({
            color: this._style.lineColor || 0xeeeeee,
            opacity: this._style.lineOpacity || 0.5,
            thickness: this._style.lineThickness || 1,
            width: this._options.width,
            position: {
                x: this._options.position.x,
                y: this._options.position.y + (this._options.height / 2)
            }
        });
    }

    get position(): TimeGraphElementPosition {
        return this._options.position;
    }

    get height(): number {
        return this._options.height;
    }

    // Gets called by TimeGraphLayer. Don't call it unless you know what you are doing.
    addChild(state: TimeGraphStateComponent) {
        this.states.push(state);
        this._displayObject.addChild(state.displayObject);
    }

    get style() {
        return this._style;
    }

    set style(style: TimeGraphRowStyle) {
        if (style.backgroundColor !== undefined) {
            this._options.color = style.backgroundColor;
        }
        if (style.backgroundOpacity !== undefined) {
            this._style.backgroundOpacity = style.backgroundOpacity;
        }
        if (style.lineColor) {
            this._style.lineColor = style.lineColor;
        }
        if (style.lineOpacity) {
            this._style.lineOpacity = style.lineOpacity;
        }
        if (style.lineThickness) {
            this._style.lineThickness = style.lineThickness;
        }
        this.update();
    }
}