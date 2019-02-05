import * as PIXI from "pixi.js";
import { TimeGraphUnitController } from "./time-graph-unit-controller";
import { TimeGraphStateController } from "./time-graph-state-controller";
import { TimeGraphLayer } from "./layer/time-graph-layer";
import { TimeGraphRectangle } from "./components/time-graph-rectangle";

export interface TimeGraphContainerOptions {
    id: string
    width: number
    height: number
    backgroundColor?: number
    transparent?: boolean
    classNames?: string
}

export class TimeGraphContainer {

    protected stage: PIXI.Container;
    protected _canvas: HTMLCanvasElement;

    protected stateController: TimeGraphStateController;

    protected layers: TimeGraphLayer[];

    private application: PIXI.Application;

    constructor(protected config: TimeGraphContainerOptions, protected unitController: TimeGraphUnitController, protected extCanvas?: HTMLCanvasElement) {
        let canvas: HTMLCanvasElement
        if (!extCanvas) {
            canvas = document.createElement('canvas');
        } else {
            canvas = extCanvas;
        }
        canvas.style.width = config.width + 'px';
        canvas.style.height = config.height + 'px';
        canvas.width = config.width;
        canvas.height = config.height;
        canvas.id = config.id;
        canvas.className = `time-graph-canvas ${this.config.classNames || ''}`;
        const ratio = window.devicePixelRatio;
        this.application = new PIXI.Application({
            width: canvas.width,
            height: canvas.height,
            view: canvas,
            backgroundColor: config.backgroundColor,
            transparent: config.transparent,
            antialias: true,
            roundPixels: false,
            resolution: ratio,
            autoResize: true
        });
        this.application.stage.height = config.height;

        this.stage = this.application.stage;
        this._canvas = this.application.view;

        this.stateController = new TimeGraphStateController(canvas, unitController);

        this.layers = [];

        const background = new TimeGraphRectangle({
            opacity: 0,
            position: {
                x:0, y:0
            },
            height: this.canvas.height,
            width: this.canvas.width,
            color: 0x550000
        });
        background.render();
        this.stage.addChild(background.displayObject);
    }

    get canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    // if canvas size has changed displayWidth need to be updated for zoomfactor
    reInitCanvasSize(newWidth: number){
        this.application.renderer.resize(newWidth, this.config.height);
        this.stateController.updateDisplayWidth();
        this.layers.forEach(l => l.update());
    }

    addLayer(layer: TimeGraphLayer) {
        this.layers.push(layer);
        layer.initializeLayer(this._canvas, this.stage, this.stateController, this.unitController);
    }
}