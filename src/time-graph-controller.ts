import { TimeGraphComponent } from "./time-graph-component";
import { TimeGraphContainer } from "./time-graph";

export class TimeGraphController {
    protected _originalGraphWidth: number;
    protected _zoomFactor: number;
    protected _initialZoomFactor: number;
    protected _oldZoomFactor: number;
    protected _positionOffset: {
        x: number;
        y: number;
    };
    protected _oldPositionOffset: {
        x: number;
        y: number;
    };
    protected _components: TimeGraphComponent[];
    protected _contexts: Map<string, TimeGraphContainer>;

    protected zoomChangedHandler: (() => void)[];
    protected positionChangedHandler: (() => void)[];

    constructor(protected _canvasWidth: number, protected _graphWidth: number) {
        this._components = [];
        this._contexts = new Map();
        this._originalGraphWidth = _graphWidth;
        this._initialZoomFactor = _canvasWidth / _graphWidth;
        this._graphWidth = this._originalGraphWidth * this._initialZoomFactor;
        this._zoomFactor = this._initialZoomFactor;
        this._oldZoomFactor = this._zoomFactor;
        this._positionOffset = { x: 0, y: 0 };
        this._oldPositionOffset = { x: 0, y: 0 };
        this.zoomChangedHandler = [];
        this.positionChangedHandler = [];
    }

    protected handleZoomChange() {
        this.zoomChangedHandler.map(handler => handler());
    }
    protected handlePositionChange() {
        this.positionChangedHandler.map(handler => handler());
    }

    onZoomChanged(handler: () => void) {
        this.zoomChangedHandler.push(handler);
    }
    onPositionChanged(handler: () => void) {
        this.positionChangedHandler.push(handler);
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

    get initialZoomFactor(): number {
        return this._initialZoomFactor;
    }

    get zoomFactor(): number {
        return this._zoomFactor;
    }
    set zoomFactor(value: number) {
        this._zoomFactor = value;
        this._graphWidth = this._zoomFactor * this._originalGraphWidth;
        this.handleZoomChange();
    }

    get oldZoomFactor(): number {
        return this._oldZoomFactor;
    }
    set oldZoomFactor(value: number) {
        this._oldZoomFactor = value;
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
        this.handlePositionChange();
    }

    get oldPositionOffset(): {
        x: number;
        y: number;
    } {
        return this._oldPositionOffset;
    }
    set oldPositionOffset(value: {
        x: number;
        y: number;
    }) {
        this._oldPositionOffset = value;
    }

    get components(): TimeGraphComponent[] {
        return this._components;
    }
    addComponent(component: TimeGraphComponent) {
        this.addContext(component.id, component.context);
        this._components.push(component);
    }

    addContext(id: string, ctx: TimeGraphContainer) {
        if (!this._contexts.get(id)) {
            this._contexts.set(id, ctx);

        }
    }
}