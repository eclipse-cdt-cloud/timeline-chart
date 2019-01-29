import { TimeGraphComponent, TimeGraphParentComponent } from "../components/time-graph-component";
import { TimeGraphUnitController } from "../time-graph-unit-controller";
import { TimeGraphStateController } from "../time-graph-state-controller";

export abstract class TimeGraphLayer {
    private canvas: HTMLCanvasElement;
    protected stateController: TimeGraphStateController;
    protected unitController: TimeGraphUnitController;
    protected children: TimeGraphComponent[];
    protected stage: PIXI.Container;
    protected layer: PIXI.Container;

    constructor(protected id: string) {
        this.children = [];
        this.layer = new PIXI.Container;
    }

    protected addChild(child: TimeGraphComponent, parent?: TimeGraphParentComponent) {
        if (!this.canvas) {
            throw ("Layers must be added to a container before components can be added.");
        }
        child.render();
        if (parent) {
            parent.addChild(child);
        } else {
            this.layer.addChild(child.displayObject);
            this.children.push(child);
        }
    }

    /**
    This method is called by the container this layer is added to.
    */
    initializeLayer(canvas: HTMLCanvasElement, stage: PIXI.Container, stateController: TimeGraphStateController, unitController: TimeGraphUnitController) {
        this.canvas = canvas;
        this.stateController = stateController;
        this.unitController = unitController;
        this.stage = stage;
        stage.addChild(this.layer);
        this.afterAddToContainer();
    }

    protected onCanvasEvent(type: string, handler: (event: Event) => void) {
        this.canvas.addEventListener(type, handler);
    }

    protected removeChildren() {
        this.children.forEach(child => this.layer.removeChild(child.displayObject));
        this.children = [];
    }

    protected removeChild(child: TimeGraphComponent) {
        this.layer.removeChild(child.displayObject);
    }

    protected afterAddToContainer() { }
}