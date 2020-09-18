import * as PIXI from "pixi.js-legacy"

export type TimeGraphInteractionType = 'mouseover' | 'mouseout' | 'mousemove' | 'mousedown' | 'mouseup' | 'mouseupoutside' | 'click';
export type TimeGraphInteractionHandler = (event: PIXI.InteractionEvent) => void;

export type TimeGraphComponentOptions = {}

export interface TimeGraphElementStyle {
    color?: number
    opacity?: number
    borderWidth?: number
    borderColor?: number
    borderRadius?: number
}
export interface TimeGraphElementPosition {
    x: number
    y: number
}
export interface TimeGraphHorizontalElement {
    position: TimeGraphElementPosition
    width: number
}
export interface TimeGraphVerticalElement {
    position: TimeGraphElementPosition
    height: number
}
export interface TimeGraphLineStyle extends TimeGraphElementStyle {
    thickness?: number
}
export type TimeGraphRect = TimeGraphHorizontalElement & TimeGraphVerticalElement;
export type TimeGraphStyledRect = TimeGraphRect & TimeGraphElementStyle;
export type TimeGraphHorizontalLine = TimeGraphHorizontalElement & TimeGraphLineStyle;
export type TimeGraphVerticalLine = TimeGraphVerticalElement & TimeGraphLineStyle;

export interface TimeGraphParentComponent {
    addChild(child: TimeGraphComponent): void;
}

export abstract class TimeGraphComponent {
    protected _displayObject: PIXI.Graphics;
    protected _options: TimeGraphComponentOptions;

    protected graphicsData: PIXI.GraphicsData;

    constructor(protected _id: string, displayObject?: PIXI.Graphics) {
        this._displayObject = displayObject || new PIXI.Graphics();
    }

    get id(): string {
        return this._id;
    }

    get displayObject(): PIXI.Graphics {
        return this._displayObject;
    }

    clear() {
        this._displayObject.clear();
    }

    update(opts?: TimeGraphComponentOptions) {
        if (opts) {
            this._options = opts;
        }
        this.clear();
        this.render();
    }

    abstract render(): void;

    protected rect(opts: TimeGraphStyledRect) {
        const { position, width, height, color, opacity, borderColor, borderWidth } = opts;
        this.displayObject.lineStyle(borderWidth || 0, borderColor || 0x000000);
        this.displayObject.beginFill((color || 0xffffff), (opacity !== undefined ? opacity : 1));
        this.displayObject.drawRect(position.x + 0.5, position.y + 0.5, width, height);
        this.displayObject.endFill();
    }

    protected rectTruncated(opts: TimeGraphStyledRect) {
        const { position, width, height, color, opacity, borderColor, borderWidth } = opts;
        this.displayObject.lineStyle(borderWidth || 0, borderColor || 0x000000);
        this.displayObject.beginFill((color || 0xffffff), (opacity !== undefined ? opacity : 1));
        if (width > 20) {
            const xpos = position.x + 0.5;
            const ypos = position.y + 0.5;
            const edge = 2;

            this.displayObject.drawPolygon([xpos + edge, ypos,
            xpos + width, ypos, xpos + width, ypos + height, xpos, ypos + height, xpos, ypos + edge, xpos + edge, ypos]);
        } else {
            this.displayObject.drawRect(position.x + 0.5, position.y + 0.5, width, height);
        }
        this.displayObject.endFill();
    }

    protected roundedRect(opts: TimeGraphStyledRect) {
        const { position, width, height, color, opacity, borderColor, borderWidth, borderRadius } = opts;
        this.displayObject.lineStyle(borderWidth || 0, borderColor || 0x000000);
        this.displayObject.beginFill((color || 0xffffff), (opacity !== undefined ? opacity : 1));

        this.displayObject.drawRoundedRect(position.x + 0.5, position.y + 0.5, width, height, borderRadius || 0);

        this.displayObject.endFill();
    }

    protected hline(opts: TimeGraphHorizontalLine) {
        const { position, width, thickness, color, opacity } = opts;
        this.displayObject.lineStyle(thickness || 1, color || 0x000000, (opacity !== undefined ? opacity : 1));
        this.displayObject.moveTo(position.x, position.y + 0.5);
        this.displayObject.lineTo(position.x + width, position.y + 0.5);
    }

    protected vline(opts: TimeGraphVerticalLine) {
        const { position, height, thickness, color, opacity } = opts;
        this.displayObject.lineStyle(thickness || 1, color || 0x000000, (opacity !== undefined ? opacity : 1));
        this.displayObject.moveTo(position.x + 0.5, position.y);
        this.displayObject.lineTo(position.x + 0.5, position.y + height);
    }

    addEvent(event: TimeGraphInteractionType, handler: TimeGraphInteractionHandler, displayObject: PIXI.DisplayObject) {
        displayObject.interactive = true;
        displayObject.on(event, ((e: PIXI.InteractionEvent) => {
            if (handler) {
                handler(e);
            }
        }).bind(this));
    }
}
