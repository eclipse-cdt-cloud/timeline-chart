import { TimeGraphComponent, TimeGraphRect } from "./time-graph-component";
import { TimeGraphApplication } from "./time-graph";
import { TimeGraphController } from "./time-graph-controller";

export class TimeAxisScale extends TimeGraphComponent {

    protected mouseStartY: number;
    protected mouseStartX: number;
    protected graphWidthStart: number;

    protected mouseIsDown: boolean = false;

    constructor(id: string, ctx: TimeGraphApplication, timeGraphController: TimeGraphController) {
        super(id, ctx, timeGraphController);
        this.addEvent('mousedown', event => {
            this.mouseStartY = event.data.global.y;
            this.mouseStartX = event.data.global.x;
            this.graphWidthStart = this.controller.graphWidth;
            this.mouseIsDown = true;
        });

        this.addEvent('mousemove', event => {
            if (this.mouseIsDown) {

                const deltaY = event.data.global.y - this.mouseStartY;
                const zoomMulti = (deltaY / 100);
                this.zoom(zoomMulti);

                const deltaMouseX = event.data.global.x - this.mouseStartX;
                this.setXOffset(deltaMouseX);
            }
        });
        const mouseUp = (event: PIXI.interaction.InteractionEvent) => {
            this.mouseIsDown = false;
            this.setZoomAndPosition();
        }
        this.addEvent('mouseup', mouseUp);
        this.addEvent('mouseupoutside', mouseUp);
        this.app.view.addEventListener('mousewheel', (ev: WheelEvent) => {
            this.mouseStartX = ev.x;
            this.graphWidthStart = this.controller.graphWidth;
            this.zoom((ev.deltaY / 100) * (-1));
            this.setXOffset(ev.deltaX * (-1));
            this.setZoomAndPosition();
            return false;
        });
    }

    setZoomAndPosition() {
        this.controller.oldZoomFactor = this.controller.zoomFactor;
        this.controller.oldPositionOffset = this.controller.positionOffset;
    }

    setXOffset(deltaMouseX: number = 0) {
        const c = this.controller;
        const normZoomFactor = c.graphWidth / this.graphWidthStart;
        const graphMouseStartX = (c.oldPositionOffset.x * (-1)) + this.mouseStartX;
        const shiftedMouseX = normZoomFactor * graphMouseStartX;
        const xOffset = c.oldPositionOffset.x + graphMouseStartX - shiftedMouseX + deltaMouseX;

        const minOffset = c.canvasWidth - c.graphWidth;
        let finalXOffset: number;
        if (xOffset > 0) {
            finalXOffset = 0;
        } else if (xOffset < minOffset) {
            finalXOffset = minOffset;
        } else {
            finalXOffset = xOffset;
        }
        c.positionOffset = { x: finalXOffset, y: 0 };
    }

    zoom(zoomMulti: number) {
        const c = this.controller;
        const newZoomFactor = c.oldZoomFactor + zoomMulti;
        if (newZoomFactor > c.initialZoomFactor) {
            c.zoomFactor = newZoomFactor;
        }
    }

    render() {
        this.options = <TimeGraphRect>{
            color: 0xFF0000,
            h: 30,
            w: 6000,
            x: 0,
            y: 0
        };
        this.rect(this.options as TimeGraphRect);
    }

}