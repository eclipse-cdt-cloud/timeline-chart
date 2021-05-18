import { TimeGraphComponent, TimeGraphInteractionHandler, TimeGraphElementPosition } from "../components/time-graph-component";
import { TimeGraphStateController } from "../time-graph-state-controller";
import { TimeGraphRectangle } from "../components/time-graph-rectangle";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";
import { TimeGraphRowController } from "../time-graph-row-controller";

export class TimeGraphVerticalScrollbar extends TimeGraphChartLayer {

    protected navigatorHandle: TimeGraphVerticalScrollbarHandle;
    protected selectionRange?: TimeGraphRectangle;

    protected factor: number;

    constructor(id: string, protected rowController: TimeGraphRowController) {
        super(id, rowController);
    }

    protected afterAddToContainer() {
        this.updateFactor();
        this.navigatorHandle = new TimeGraphVerticalScrollbarHandle(this.rowController, this.stateController, this.factor);
        this.addChild(this.navigatorHandle);
        this.rowController.onVerticalOffsetChangedHandler(() => this.update());
        this.rowController.onTotalHeightChangedHandler(() => {
            this.updateFactor();
            this.navigatorHandle.updateFactor(this.factor);
            this.update()
        });
    }

    protected updateFactor() {
        if (this.rowController.totalHeight) {
            this.factor = this.stateController.canvasDisplayHeight / this.rowController.totalHeight;
        } else {
            this.factor = 0;
        }
    }

    update() {
        this.navigatorHandle.clear();
        this.navigatorHandle.render();
    }
}

export class TimeGraphVerticalScrollbarHandle extends TimeGraphComponent<null> {

    protected mouseIsDown: boolean;
    protected mouseStartY: number;
    protected oldVerticalOffset: number;

    protected height: number;
    protected position: TimeGraphElementPosition;

    constructor(protected rowController: TimeGraphRowController, protected stateController: TimeGraphStateController, protected factor: number) {
        super('vscroll_handle');
        this.addEvent('mousedown', event => {
            this.mouseStartY = event.data.global.y;
            this.oldVerticalOffset = this.rowController.verticalOffset
            this.mouseIsDown = true;
        }, this._displayObject);
        this.addEvent('mousemove', event => {
            if (this.mouseIsDown) {
                const delta = event.data.global.y - this.mouseStartY;
                let ypos = this.oldVerticalOffset + delta;
                if (ypos >= 0 && (ypos + this.height) <= this.stateController.canvasDisplayHeight) {
                    this.rowController.verticalOffset = ypos / this.factor;
                }
            }
        }, this._displayObject);
        const moveEnd: TimeGraphInteractionHandler = event => {
            this.mouseIsDown = false;
        }
        this.addEvent('mouseup', moveEnd, this._displayObject);
        this.addEvent('mouseupoutside', moveEnd, this._displayObject);
    }

    updateFactor(factor: number){
        this.factor = factor;
    }

    render(): void {
        this.position = { x: 0, y: this.rowController.verticalOffset * this.factor };
        this.height = this.stateController.canvasDisplayHeight * this.factor;
        this.rect({
            height: this.height,
            position: this.position,
            width: 10,
            color: 0x777769
        })
    }
}