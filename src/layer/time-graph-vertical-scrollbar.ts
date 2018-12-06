import { TimeGraphComponent, TimeGraphInteractionHandler, TimeGraphElementPosition } from "../components/time-graph-component";
import { TimeGraphStateController } from "../time-graph-state-controller";
import { TimeGraphRectangle } from "../components/time-graph-rectangle";
import { TimeGraphLayer } from "./time-graph-layer";

export class TimeGraphVerticalScrollbar extends TimeGraphLayer {

    protected navigatorHandle: TimeGraphVerticalScrollbarHandle;
    protected selectionRange?: TimeGraphRectangle;

    protected factor: number;

    protected verticalPositionChangedHandler: ((ypos: number) => void)[];

    constructor(id: string, protected totalHeight: number) {
        super(id);
        this.verticalPositionChangedHandler = [];
    }

    protected afterAddToContainer() {
        this.factor = this.totalHeight / this.stateController.canvasDisplayHeight;
        this.navigatorHandle = new TimeGraphVerticalScrollbarHandle(this.stateController, this.factor);
        this.addChild(this.navigatorHandle);
        this.stateController.onPositionChanged(() => this.update());
    }

    protected handleVerticalPositionChange(ypos: number) {
        this.verticalPositionChangedHandler.forEach(handler => handler(ypos));
    }

    onVerticalPositionChanged(handler: (ypos: number) => void) {
        this.verticalPositionChangedHandler.push(handler);
    }

    setVerticalPosition(verticalPosition: number){
        this.stateController.positionOffset.y = verticalPosition / this.factor;
        this.update();
    }

    update() {
        this.navigatorHandle.clear();
        this.navigatorHandle.render();
        this.handleVerticalPositionChange(this.stateController.positionOffset.y * this.factor);
    }
}

export class TimeGraphVerticalScrollbarHandle extends TimeGraphComponent {

    protected mouseIsDown: boolean;
    protected mouseStartY: number;
    protected oldVerticalOffset: number;

    protected height: number;
    protected position: TimeGraphElementPosition;

    constructor(protected stateController: TimeGraphStateController, protected factor: number) {
        super('vscroll_handle');
        this.addEvent('mousedown', event => {
            this.mouseStartY = event.data.global.y;
            this.oldVerticalOffset = this.stateController.positionOffset.y
            this.mouseIsDown = true;
        }, this._displayObject);
        this.addEvent('mousemove', event => {
            if (this.mouseIsDown) {
                const delta = event.data.global.y - this.mouseStartY;
                let ypos = this.oldVerticalOffset + delta;
                if (ypos >= 0 && (ypos + this.height) <= this.stateController.canvasDisplayHeight) {
                    this.stateController.positionOffset = { x: 0, y: ypos };
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
        this.position = { x: 0, y: this.stateController.positionOffset.y };
        this.height = this.stateController.canvasDisplayHeight / this.factor;
        this.rect({
            height: this.height,
            position: this.position,
            width: 10,
            color: 0x777769
        })
    }
}