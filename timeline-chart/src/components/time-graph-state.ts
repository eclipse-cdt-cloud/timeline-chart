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

const LABEL_CACHE_SIZE = 10;

export class TimeGraphStateComponent extends TimeGraphComponent<TimelineChart.TimeGraphState> {

    static fontController: FontController = new FontController();

    protected _options: TimeGraphStyledRect;
    private textWidth: number;
    private labelCache: Map<number, PIXI.BitmapText> = new Map<number, PIXI.BitmapText>();

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

        // Clear the label
        this.displayObject.removeChildren();

        const fontName = TimeGraphStateComponent.fontController.getFontName(this._options.color ? this._options.color : 0, this._options.height - 2) ||
            TimeGraphStateComponent.fontController.getDefaultFontName();
        const position = {
            x: this._options.position.x + this._options.width < 0 ? this._options.position.x : Math.max(0, this._options.position.x),
            y: this._options.position.y
        }
        const displayWidth = this._options.displayWidth ? this._options.displayWidth : 0;
        const textPadding = 0.5;
        if (displayWidth < 3) {
            return;
        }

        // If there is no label previously displayed, we get the width of the full label
        if (this.textWidth === undefined) {
            const bitmapText = new PIXI.BitmapText(this.model.label, { fontName: fontName });
            this.textWidth = bitmapText.getLocalBounds().width; //Get the text width
        }

        let textObjX = position.x + textPadding;
        const textObjY = position.y + textPadding;
        let textScaler = 1;

        if (displayWidth > this.textWidth) {
            textObjX = position.x + (displayWidth - this.textWidth) / 2;
        }
        else {
            textScaler = displayWidth / this.textWidth;
        }

        let displayObject = this.getDisplayLabelObject(this.model.label, textScaler, fontName);
        if (displayObject) {
            displayObject.alpha = this._options.opacity ?? 1;
            displayObject.x = textObjX;
            displayObject.y = textObjY;
            this.displayObject.addChild(displayObject);
        }
    }

    private getDisplayLabelObject(stateFullLabel: string, textScaler: number, fontName: string): PIXI.BitmapText | undefined {
        if (textScaler > 0 && textScaler <= 1) {
            let displayObject = this.labelCache.get(textScaler);

            if (displayObject) {
                return displayObject;
            }

            // Generate the new label
            let displayLabel = "";
            if (textScaler < 1) {
                const index = Math.min(Math.floor(textScaler * stateFullLabel.length), stateFullLabel.length - 1)
                const partialLabel = stateFullLabel.substr(0, Math.max(index - 3, 0));
                if (partialLabel.length > 0) {
                    displayLabel = partialLabel.concat("...");
                }
            } else {
                displayLabel = stateFullLabel;
            }

            /*
            * Update the cache using a FIFO policy since the users are
            * more likely to zoom in/out once or twice, rather than multiple.
            */
            if (this.labelCache.size === LABEL_CACHE_SIZE) {
                // The keys are returned in order of insertion
                const firstKey = this.labelCache.keys().next().value;
                const updateObject = this.labelCache.get(firstKey);

                if (updateObject) {
                    this.labelCache.delete(firstKey);
                    updateObject.text = displayLabel;
                    displayObject = updateObject;
                    this.labelCache.set(textScaler, displayObject);
                }
            } else {
                displayObject = new PIXI.BitmapText(displayLabel, { fontName: fontName });
                this.labelCache.set(textScaler, displayObject);
            }

            return displayObject;
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
