import { TimeGraphComponent, TimeGraphInteractionHandler, TimeGraphElementPosition } from "../components/time-graph-component";
import { TimeGraphStateController } from "../time-graph-state-controller";
import { TimeGraphRectangle } from "../components/time-graph-rectangle";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";
import { TimeGraphRowController } from "../time-graph-row-controller";

export class TimeGraphVerticalScrollbar extends TimeGraphChartLayer {

    protected navigatorHandle: TimeGraphVerticalScrollbarHandle;
    protected navigatorBackground: TimeGraphVerticalScrollbarBackground;
    protected selectionRange?: TimeGraphRectangle;

    protected factor: number;

    constructor(id: string, protected rowController: TimeGraphRowController) {
        super(id, rowController);
    }

    protected afterAddToContainer() {
        this.updateFactor();
        this.navigatorHandle = new TimeGraphVerticalScrollbarHandle(this.rowController, this.stateController, this.factor);
        this.navigatorBackground = new TimeGraphVerticalScrollbarBackground(this.rowController, this.stateController, this.factor);
        this.addChild(this.navigatorBackground);
        this.addChild(this.navigatorHandle);
        this.rowController.onVerticalOffsetChangedHandler(() => this.update());
        this.rowController.onTotalHeightChangedHandler(() => {
            this.updateFactor();
            this.navigatorHandle.updateFactor(this.factor);
            this.navigatorBackground.updateFactor(this.factor);
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
        this.navigatorBackground.clear();
        this.navigatorBackground.render();
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
        const moveStart: TimeGraphInteractionHandler = event => {
            this.mouseStartY = event.data.global.y;
            this.oldVerticalOffset = this.rowController.verticalOffset;
            this.mouseIsDown = true;
            this.stateController.snapped = false;
        };
        const moveEnd = () => {
            this.mouseIsDown = false;
        }
        this.addEvent('mouseover', (event) => {
            if (this.stateController.snapped) {
                moveStart(event);
            }
        }, this._displayObject);
        this.addEvent('mousedown', moveStart, this._displayObject);
        this.addEvent('mousemove', event => {
            if (this.mouseIsDown) {
                const delta = (event.data.global.y - this.mouseStartY) / this.factor;
                const verticalOffset = this.oldVerticalOffset + delta;
                this.rowController.verticalOffset = Math.max(0, Math.min(this.rowController.totalHeight - this.stateController.canvasDisplayHeight, verticalOffset));
            }
        }, this._displayObject);
        this.addEvent('mouseup', moveEnd, this._displayObject);
        this.addEvent('mouseupoutside', moveEnd, this._displayObject);
        document.addEventListener('snap-y-end', moveEnd);
    }

    updateFactor(factor: number) {
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

export class TimeGraphVerticalScrollbarBackground extends TimeGraphComponent<null> {

    protected snapEvent: CustomEvent;
    protected snapEventString: string;

    constructor(protected rowController: TimeGraphRowController, protected stateController: TimeGraphStateController, protected factor: number) {
        super("vscroll_background");
        this.addEvent("mousedown", event => {
            let yPosition = event.data.getLocalPosition(this._displayObject).y;
            let vOffset = (yPosition/this.stateController.canvasDisplayHeight) * this.rowController.totalHeight;
            // We have vertical offset at point of click, but need to make it the center of scrollbar.
            let scrollBarHeight = (this.rowController.totalHeight * this.factor);
            vOffset = vOffset - (scrollBarHeight / 2);
            // Clamp it
            let vOffsetClamped = Math.max(0, Math.min(this.rowController.totalHeight - this.stateController.canvasDisplayHeight, vOffset));
            this.rowController.verticalOffset = vOffsetClamped;
            // Set snapped state
            this.toggleSnappedState(true);
        }, this._displayObject);
        // Emit custom event to let vertical handler know when 'mousedown' is released.
        this.snapEvent = new CustomEvent(this.snapEventString = 'snap-y-end');
        const endSnap = () => {
            this.toggleSnappedState(false);
            document.dispatchEvent(this.snapEvent);
        }
        this.addEvent('mouseup', endSnap, this._displayObject);
        this.addEvent('mouseupoutside', endSnap, this._displayObject);
    }

    updateFactor(factor: number) {
        this.factor = factor;
    }

    protected toggleSnappedState = (bool: boolean) => {
        this.stateController.snapped = bool;
    }

    render(): void {
        this.rect({
            height: this.stateController.canvasDisplayHeight,
            position: { x: 0, y: 0 },
            width: 10,
            opacity: 0
        });
    }
}