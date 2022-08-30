import { TimeGraphComponent, TimeGraphStyledRect, TimeGraphElementPosition } from "./time-graph-component";
import { TimeGraphRow } from "./time-graph-row";
import { TimelineChart } from "../time-graph-model";
import { FontController } from "../time-graph-font-controller";
import * as PIXI from "pixi.js";

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
            this.clearLabel();
            return;
        }
        const textObj = new PIXI.BitmapText(this.model.label, { fontName: fontName });
        const textWidth = textObj.getLocalBounds().width;
        let textObjX = position.x + textPadding;
        const textObjY = position.y + textPadding;
        let displayLabel = "";

        if (displayWidth > textWidth) {
            textObjX = position.x + (displayWidth - textWidth) / 2;
            displayLabel = labelText;
        }
        else {
            const textScaler = displayWidth / textWidth;
            const index = Math.min(Math.floor(textScaler * labelText.length), labelText.length - 1)
            const partialLabel = labelText.substr(0, Math.max(index - 3, 0));
            if (partialLabel.length > 0) {
                displayLabel = partialLabel.concat("...");
            }
        }
        if (displayLabel === "") {
            this.clearLabel();
            return;
        }
        if (displayLabel === this.model.label) {
            textObj.x = textObjX;
            textObj.y = textObjY;
            this.displayObject.addChild(textObj);
        } else {
            const newTextObj = new PIXI.BitmapText(displayLabel, { fontName: fontName });
            newTextObj.x = textObjX;
            newTextObj.y = textObjY;
            this.displayObject.addChild(newTextObj);
        }
    }

    clearLabel() {
        this.displayObject.children.forEach(element => element.destroy());
        this.displayObject.removeChildren();
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
        this.clearLabel();
        super.clear()
    }
}
