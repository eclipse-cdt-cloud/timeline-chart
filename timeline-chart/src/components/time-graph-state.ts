import { TimeGraphComponent, TimeGraphStyledRect, TimeGraphElementPosition } from "./time-graph-component";
import { TimeGraphRow } from "./time-graph-row";
import { TimelineChart } from "../time-graph-model";
import { FontController } from "../time-graph-font-controller";
import * as PIXI from "pixi.js-legacy";

export interface TimeGraphStateStyle {
    color?: number
    opacity?: number
    height?: number
    borderWidth?: number
    borderColor?: number
}

export class TimeGraphStateComponent extends TimeGraphComponent<TimelineChart.TimeGraphState> {

    static fontController: FontController = new FontController();

    protected _options: TimeGraphStyledRect;
    private textLabelObject: PIXI.BitmapText | undefined;
    private textWidth: number;

    constructor(
        id: string,
        model: TimelineChart.TimeGraphState,
        xStart:  number,
        xEnd: number,
        protected _row: TimeGraphRow,
        protected _style: TimeGraphStateStyle = { color: 0xfffa66, height: 14 },
        protected displayWidth: number,
        displayObject?: PIXI.Graphics
    ) {
        super(id, displayObject, model);
        const height = _row.height === 0 ? 0 : Math.min(_style.height || 14, _row.height - 1);
        const position = {
            x: xStart,
            y: this._row.position.y + ((this.row.height - height) / 2)
        };
        // min width of a state should never be less than 1 (for visibility)
        const width = Math.max(1, xEnd - xStart);
        this._options = {
            color: _style.color,
            opacity: _style.opacity,
            height,
            position,
            width,
            displayWidth,
            borderRadius: 2,
            borderWidth: _style.borderWidth || 0,
            borderColor: _style.borderColor || 0x000000
        };
    }

    renderLabel() {
        if (!this.model.label) {
            return;
        }
        const fontName = TimeGraphStateComponent.fontController.getFontName(this._options.color ? this._options.color : 0, this._options.height - 2) ||
            TimeGraphStateComponent.fontController.getDefaultFontName();
        const position = {
            x: this._options.position.x + this._options.width < 0 ? this._options.position.x : Math.max(0, this._options.position.x),
            y: this._options.position.y
        }
        const displayWidth = this._options.displayWidth ? this._options.displayWidth : 0;
        const labelText = this.model.label;
        const textPadding = 0.5;
        if (displayWidth < 3) {
            if (this.textLabelObject) {
                this.textLabelObject.text = "";
            }
            return;
        }

        let addLabel = false;
        if (!this.textLabelObject) {
            this.textLabelObject = new PIXI.BitmapText(this.model.label, { fontName: fontName });
            this.textWidth = this.textLabelObject.getLocalBounds().width;
            addLabel = true;
        } 

        let textObjX = position.x + textPadding;
        const textObjY = position.y + textPadding;
        let displayLabel = "";

        if (displayWidth > this.textWidth) {
            textObjX = position.x + (displayWidth - this.textWidth) / 2;
            displayLabel = labelText;
        }
        else {
            const textScaler = displayWidth / this.textWidth;
            const index = Math.min(Math.floor(textScaler * labelText.length), labelText.length - 1)
            const partialLabel = labelText.substr(0, Math.max(index - 3, 0));
            if (partialLabel.length > 0) {
                displayLabel = partialLabel.concat("...");
            }
        }

        this.textLabelObject.text = displayLabel;

        if (displayLabel === "") {
            return;
        }

        this.textLabelObject.alpha = this._options.opacity ?? 1;
        this.textLabelObject.x = textObjX;
        this.textLabelObject.y = textObjY;

        if (addLabel) {
            this.displayObject.addChild(this.textLabelObject);
        }
    }

    get height(): number {
        return this._options.height;
    }

    get width(): number {
        return this._options.width;
    }

    get position(): TimeGraphElementPosition {
        return this._options.position;
    }

    get row(): TimeGraphRow {
        return this._row;
    }

    get style() {
        return this._style;
    }

    set style(style: TimeGraphStateStyle) {
        if (style.color !== undefined) {
            this._options.color = style.color;
        }
        if (style.opacity !== undefined) {
            this._options.opacity = style.opacity;
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
            this._options.displayWidth = opts.displayWidth;
        }
        super.update();
    }

    render() {
        this.rect(this._options);
        this.renderLabel();
    }

    clear() {
        super.clear()
    }
}
