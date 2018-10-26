import { TimeGraphComponent } from "./time-graph-component";

export class TimeGraphStateController {
    private _canvasWidth: number;
    private _graphWidth: number;
    private _zoomFactor: number;
    private _positionOffset: {
        x: number;
        y: number;
    };
    private _components: TimeGraphComponent[];
    private _contexts: Map<string, CanvasRenderingContext2D>;

    constructor() {
        this._components = [];
        this._contexts = new Map();
    }

    get canvasWidth(): number {
        return this._canvasWidth;
    }
    set canvasWidth(value: number) {
        this._canvasWidth = value;
    }

    get graphWidth(): number {
        return this._graphWidth;
    }
    set graphWidth(value: number) {
        this._graphWidth = value;
    }

    get zoomFactor(): number {
        return this._zoomFactor;
    }
    set zoomFactor(value: number) {
        this._zoomFactor = value;
    }

    get positionOffset(): {
        x: number;
        y: number;
    } {
        return this._positionOffset;
    }
    set positionOffset(value: {
        x: number;
        y: number;
    }) {
        this._positionOffset = value;
    }

    get components(): TimeGraphComponent[] {
        return this._components;
    }
    addComponent(component: TimeGraphComponent) {
        this.addContext(component.id, component.context);
        this._components.push(component);
    }

    addContext(id: string, ctx: CanvasRenderingContext2D) {
        if (!this._contexts.get(id)) {
            this._contexts.set(id, ctx);
            ctx.canvas.addEventListener('mousedown', (ev: MouseEvent) => {
                
            });
        }
    }


}