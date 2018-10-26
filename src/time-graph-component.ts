export interface TimeGraphRect {
    color?: string
    x: number
    y: number
    w: number
    h: number
}

export interface TimeGraphLine {
    start: {
        x: number
        y: number
    }
    end: {
        x: number
        y: number
    }
    width?: number
    color?: string
}

export abstract class TimeGraphComponent {

    protected _ctx: CanvasRenderingContext2D;
    private _id: string;

    constructor(id: string) {
        this._id = id;
    }

    get id(): string {
        return this._id;
    }

    set context(ctx: CanvasRenderingContext2D) {
        this._ctx = ctx;
    }

    get context(): CanvasRenderingContext2D {
        return this._ctx;
    }

    abstract render(): void;

    rect(opts: TimeGraphRect) {
        const {x,y,w,h, color} = opts;
        this._ctx.fillStyle = color || 'rgb(0,0,0)';
        this._ctx.fillRect(x,y,w,h);
    }

    line(opts: TimeGraphLine){
        this._ctx.beginPath();
        this._ctx.moveTo(opts.start.x, opts.start.y);
        this._ctx.lineTo(opts.end.x, opts.end.y);
        this._ctx.lineWidth = opts.width || 1;
        this._ctx.strokeStyle = opts.color || 'rgb(0,0,0)';
        this._ctx.stroke();
    }
}