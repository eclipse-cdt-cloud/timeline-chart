import { TimeGraphComponent, TimeGraphStyledRect, TimeGraphElementPosition } from "./time-graph-component";
import { TimeGraphRow } from "./time-graph-row";
import { TimelineChart } from "../time-graph-model";

export interface TimeGraphRowElementStyle {
    color?: number
    height?: number
    borderWidth?: number
    borderColor?: number
    minWidthForLabels?: number
    renderLabels?: boolean
}

export class TimeGraphRowElement extends TimeGraphComponent {

    height: number;
    position: TimeGraphElementPosition;

    protected label: PIXI.Text;
    protected labelCharWidths: number[] = [];
    protected labelStyle: PIXI.TextStyle;
    protected dotsWidth: number;
    protected minWidthForLabels: number;

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
        if (_style.renderLabels) {
            this.minWidthForLabels = _style.minWidthForLabels || 40;
            this.labelStyle = new PIXI.TextStyle({ fontSize: this.height * 0.75 });
            const dotsMetrics = PIXI.TextMetrics.measureText('...', this.labelStyle);
            this.dotsWidth = dotsMetrics.width;
            const chars = this.model.label ? this.model.label.split('') : [];
            chars.forEach(char => {
                const { width } = PIXI.TextMetrics.measureText(char, this.labelStyle);
                this.labelCharWidths.push(width);
            });
        }
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

    renderLabel() {
        if (this.model.label && this._options.width > this.minWidthForLabels) {
            if (this.label && this.label.texture) {
                this.label.destroy();
            }

            let truncated = false;
            let splitAt = 0;

            this.labelCharWidths.reduce((prev: number, curr: number, idx: number) => {
                const w = prev + curr;
                if ((w + this.dotsWidth > this._options.width - 5) && !truncated) {
                    truncated = true;
                    splitAt = idx;
                }
                return w;
            });

            let newLabel = truncated ? this.model.label.slice(0, splitAt) : this.model.label;
            newLabel = truncated ? newLabel + '...' : newLabel;
            this.label = new PIXI.Text(newLabel, {
                fontSize: this._options.height * 0.75,
                fill: 0x000000
            });
            this.label.x = this._options.position.x + 2;
            this.label.y = this._options.position.y;

            this._displayObject.addChild(this.label);
        } else if (this.label && this.label.texture) {
            this.label.destroy();
        }
    }

    render() {
        this.rect(this._options);
        this.style.renderLabels && this.renderLabel();
    }
}