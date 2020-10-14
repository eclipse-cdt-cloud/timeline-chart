import { TimeGraphComponent, TimeGraphStyledRect, TimeGraphElementPosition } from "./time-graph-component";
import { TimeGraphRow } from "./time-graph-row";
import { TimelineChart } from "../time-graph-model";
import { FontController } from "../time-graph-font-controller"
import * as PIXI from "pixi.js-legacy";

export interface TimeGraphRowElementStyle {
    color?: number
    height?: number
    borderWidth?: number
    borderColor?: number
}

export class TimeGraphRowElement extends TimeGraphComponent {

    height: number;
    position: TimeGraphElementPosition;
    textWidth: number = 0;
    static fontController: FontController = new FontController();

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
        // min width of a state should never be less than 1 (for visibility)
        const width = Math.max(1, this.range.end - this.range.start);
        this._options = {
            color: _style.color,
            height: this.height,
            position: this.position,
            width,
            borderRadius: 2,
            borderWidth: _style.borderWidth || 0,
            borderColor: _style.borderColor || 0x000000
        };

        if (this._model.label) {
            const fontName = TimeGraphRowElement.fontController.getFontName(this._options.color ? this._options.color : 0, this._options.height - 2);
            const labelTextObj = new PIXI.BitmapText(this._model.label, { fontName: fontName ? fontName : TimeGraphRowElement.fontController.getDefaultFontName() });
            this.textWidth = labelTextObj.getLocalBounds().width;
        }
    }

    renderLabel() {
        const position = this._options.position;
        const width = this._options.width;
        const textWidth = this.textWidth;
        const labelText = this._model.label;
        const fontName = TimeGraphRowElement.fontController.getFontName(this._options.color ? this._options.color : 0, this._options.height - 2);

        if (this.displayObject.children.length) {
            let textObj = this.displayObject.getChildAt(0) as PIXI.BitmapText;
            textObj.x = position.x;
            textObj.y = position.y;
        }
        if (textWidth && labelText) {
            if (width <= 0.1 * textWidth && this.displayObject.children.length) {
                this.displayObject.removeChildAt(0);
            }
            else if (width > 0.1 * textWidth) {
                let textObjX = position.x + 0.5;
                let textObjY = position.y + 0.5;
                let textStr = "";

                if (width > textWidth) {
                    textObjX = position.x + (width - textWidth) / 2;
                    textStr = labelText;
                }
                else {
                    let textScaler = width / textWidth;
                    let index = Math.min(Math.floor(textScaler * labelText.length), labelText.length - 1)
                    let partialLabel = labelText.substr(0, Math.max(index - 4, 0));
                    if (partialLabel.length > 0) {
                        textStr = partialLabel.concat("...");
                    }
                }

                if (this.displayObject.children.length !== 0) {
                    this.displayObject.removeChildAt(0);
                }

                this.displayObject.addChild(new PIXI.BitmapText(textStr, { fontName: fontName }));
                let textObj = this.displayObject.getChildAt(0) as PIXI.BitmapText;
                textObj.x = textObjX;
                textObj.y = textObjY;
            }
        }
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
        // this.rectTruncated(this._options);
        this.rect(this._options);
        this.renderLabel();
    }
}
