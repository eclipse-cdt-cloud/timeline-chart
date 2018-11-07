import { TimeGraphContainer, TimeGraphApplication } from "./time-graph";
import { TimeGraphController } from "./time-graph-controller";

export type TimeGraphInteractionType = 'mouseover' | 'mouseout' | 'mousemove' | 'mousedown' | 'mouseup' | 'mouseupoutside' | 'click';
export type TimeGraphInteractionHandler = (event: PIXI.interaction.InteractionEvent) => void;
export type TimeGraphInteractionHandlerMap = Map<TimeGraphInteractionType, TimeGraphInteractionHandler>

export interface TimeGraphDisplayObject {
    color?: number
    opacity?: number
}

export interface TimeGraphRect extends TimeGraphDisplayObject {
    x: number
    y: number
    w: number
    h: number
}

export interface TimeGraphLine extends TimeGraphDisplayObject {
    start: {
        x: number
        y: number
    }
    end: {
        x: number
        y: number
    }
    width?: number
}

export abstract class TimeGraphComponent {

    protected _ctx: TimeGraphContainer;
    protected _id: string;
    protected _controller: TimeGraphController;
    protected displayObject: PIXI.Graphics;
    protected options: TimeGraphDisplayObject;

    constructor(id: string, protected app: TimeGraphApplication, timeGraphController: TimeGraphController) {
        this._id = id;
        this._ctx = app.stage;
        this._controller = timeGraphController;
        this.displayObject = new PIXI.Graphics();
        this._ctx.addChild(this.displayObject);
    }

    get id(): string {
        return this._id;
    }

    get context(): TimeGraphContainer {
        return this._ctx;
    }

    get controller(): TimeGraphController {
        return this._controller;
    }

    abstract render(): void;

    clear(){
        this.displayObject.clear();
    }

    rect(opts: TimeGraphRect) {
        const { x, y, w, h, color } = opts;
        const c = this.controller;
        const calcX = (x * c.zoomFactor) + c.positionOffset.x ;
        const calcW = w * c.zoomFactor;
        this.displayObject.beginFill((color || 0x000000));
        this.displayObject.drawRect(calcX, y, calcW, h);
        this.displayObject.endFill();
    }

    line(opts: TimeGraphLine) {
        const { width, color } = opts;
        this.displayObject.lineStyle(width || 1, color || 0x000000);
        this.displayObject.moveTo(opts.start.x, opts.start.y);
        this.displayObject.lineTo((opts.end.x * this.controller.zoomFactor), opts.end.y);
    }

    protected addEvent(event: TimeGraphInteractionType, handler: TimeGraphInteractionHandler) {
        this.displayObject.interactive = true;
        this.displayObject.on(event, (e: PIXI.interaction.InteractionEvent) => {
            if (handler) {
                handler(e);
            }
        });
    }
}