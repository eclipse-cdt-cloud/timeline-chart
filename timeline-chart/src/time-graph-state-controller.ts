import { TimeGraphUnitController } from "./time-graph-unit-controller";

export class TimeGraphStateController {
    oldPositionOffset: {
        x: number;
        y: number;
    };
    
    snapped: boolean;

    protected ratio: number;

    protected _canvasDisplayWidth: number;
    protected _canvasDisplayHeight: number;

    protected _zoomFactor: number;
    protected _initialZoomFactor: number;
    protected _positionOffset: {
        x: number;
        y: number;
    };

    protected zoomChangedHandlers: (() => void)[];
    protected positionChangedHandlers: (() => void)[];
    protected canvasDisplayWidthChangedHandlers: (() => void)[];

    constructor(protected canvas: HTMLCanvasElement, protected unitController: TimeGraphUnitController) {
        this.ratio = window.devicePixelRatio;
        this._canvasDisplayWidth = this.canvas.width / this.ratio;
        this._canvasDisplayHeight = this.canvas.height / this.ratio;
        this._initialZoomFactor = this.zoomFactor;
        this._positionOffset = { x: 0, y: 0 };
        this.oldPositionOffset = { x: 0, y: 0 };
        this.zoomChangedHandlers = [];
        this.positionChangedHandlers = [];
        this.canvasDisplayWidthChangedHandlers = [];
        this.snapped = false;
    }

    protected handleZoomChange() {
        this.zoomChangedHandlers.forEach(handler => handler());
    }
    protected handlePositionChange() {
        this.positionChangedHandlers.forEach(handler => handler());
    }
    protected handleCanvasDisplayWidthChange() {
        this.canvasDisplayWidthChangedHandlers.forEach(handler => handler());
    }

    onZoomChanged(handler: () => void) {
        this.zoomChangedHandlers.push(handler);
    }
    onPositionChanged(handler: () => void) {
        this.positionChangedHandlers.push(handler);
    }
    onCanvasDisplayWidthChanged(handler: () => void) {
        this.canvasDisplayWidthChangedHandlers.push(handler);
    }

    /**
        It is not the width of the canvas display buffer but of the canvas element in browser. Can be different depending on the display pixel ratio.
    */
    get canvasDisplayWidth() {
        return this._canvasDisplayWidth;
    }

    updateDisplayWidth() {
        this._canvasDisplayWidth = this.canvas.width / this.ratio;
    }

    /**
        It is not the heigth of the canvas display buffer but of the canvas element in browser. Can be different depending on the display pixel ratio.
    */
    get canvasDisplayHeight() {
        return this._canvasDisplayHeight;
    }

    updateDisplayHeight() {
        this._canvasDisplayHeight = this.canvas.height / this.ratio;
    }

    get initialZoomFactor(): number {
        return this._initialZoomFactor;
    }

    get zoomFactor(): number {
        this._zoomFactor = this.canvasDisplayWidth / Number(this.unitController.viewRangeLength);
        return this._zoomFactor;
    }

    get absoluteResolution(): number {
        return this.canvasDisplayWidth / Number(this.unitController.absoluteRange);
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

}