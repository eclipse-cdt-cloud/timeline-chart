import { TimeGraphUnitController } from "../time-graph-unit-controller";
import { TimeGraphComponent, TimeGraphStyledRect, TimeGraphInteractionHandler } from "../components/time-graph-component";
import { TimeGraphStateController } from "../time-graph-state-controller";
import { TimeGraphRectangle } from "../components/time-graph-rectangle";
import { TimeGraphLayer } from "./time-graph-layer";

export class TimeGraphNavigator extends TimeGraphLayer {

    protected navigatorHandle: TimeGraphNavigatorHandle;
    protected selectionRange?: TimeGraphRectangle;

    afterAddToContainer() {
        this.unitController.onViewRangeChanged(() => this.update());
        this.navigatorHandle = new TimeGraphNavigatorHandle(this.unitController, this.stateController);
        this.addChild(this.navigatorHandle);
        this.unitController.onSelectionRangeChange(() => this.update());
    }

    update() {
        this.navigatorHandle.clear();
        this.navigatorHandle.render();

        if (this.unitController.selectionRange) {
            const selectionOpts: TimeGraphStyledRect = {
                color: 0xb7b799,
                height: this.stateController.canvasDisplayHeight,
                opacity: 0.5,
                position: {
                    x: this.unitController.selectionRange.start * this.stateController.absoluteResolution,
                    y: 0
                },
                width: (this.unitController.selectionRange.end - this.unitController.selectionRange.start) * this.stateController.absoluteResolution
            };
            if (!this.selectionRange) {
                this.selectionRange = new TimeGraphRectangle(selectionOpts);
                this.addChild(this.selectionRange);
            } else {
                this.selectionRange.update(selectionOpts);
            }
        } else {
            if (this.selectionRange) {
                this.selectionRange.clear();
            }
        }
    }
}

export class TimeGraphNavigatorHandle extends TimeGraphComponent {

    protected mouseIsDown: boolean;
    protected mouseStartX: number;
    protected oldViewStart: number;

    constructor(protected unitController: TimeGraphUnitController, protected stateController: TimeGraphStateController) {
        super('navigator_handle');
        this.addEvent('mousedown', event => {
            this.mouseStartX = event.data.global.x;
            this.oldViewStart = this.unitController.viewRange.start;
            this.mouseIsDown = true;
        }, this._displayObject);
        this.addEvent('mousemove', event => {
            if (this.mouseIsDown) {
                const delta = event.data.global.x - this.mouseStartX;
                var start = Math.max(this.oldViewStart + (delta / this.stateController.absoluteResolution), 0);
                start = Math.min(start, this.unitController.absoluteRange - this.unitController.viewRangeLength);
                const end = Math.min(start + this.unitController.viewRangeLength, this.unitController.absoluteRange)
                this.unitController.viewRange = {
                    start,
                    end
                }
            }
        }, this._displayObject);
        const moveEnd: TimeGraphInteractionHandler = event => {
            this.mouseIsDown = false;
        }
        this.addEvent('mouseup', moveEnd, this._displayObject);
        this.addEvent('mouseupoutside', moveEnd, this._displayObject);
    }

    render(): void {
        const MIN_NAVIGATOR_WIDTH = 20;
        const xPos = this.unitController.viewRange.start * this.stateController.absoluteResolution;
        const effectiveAbsoluteRange = this.unitController.absoluteRange * this.stateController.absoluteResolution;
        // Avoid the navigator rendered outside of the range at high zoom levels when its width is capped to MIN_NAVIGATOR_WIDTH
        const position = { x: Math.min(effectiveAbsoluteRange - MIN_NAVIGATOR_WIDTH, xPos), y: 0 };
        const width = Math.max(MIN_NAVIGATOR_WIDTH, this.unitController.viewRangeLength * this.stateController.absoluteResolution);
        this.rect({
            height: 20,
            position,
            width,
            color: 0x777769
        })
    }
}