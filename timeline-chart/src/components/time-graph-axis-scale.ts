import * as PIXI from "pixi.js-legacy"

import { TimeGraphComponent, TimeGraphInteractionHandler, TimeGraphStyledRect, TimeGraphComponentOptions } from "./time-graph-component";
import { TimeGraphUnitController } from "../time-graph-unit-controller";
import { TimeGraphStateController } from "../time-graph-state-controller";
import * as _ from "lodash";
import { TimelineChart } from "../time-graph-model";

export interface TimeGraphAxisStyle extends TimeGraphStyledRect {
    lineColor?: number
}

export class TimeGraphAxisScale extends TimeGraphComponent {

    protected mouseStartY: number;
    protected mouseStartX: number;
    protected oldViewRange: TimelineChart.TimeGraphRange;
    protected mouseIsDown: boolean = false;
    protected labels: PIXI.Text[];

    constructor(id: string,
        protected _options: TimeGraphAxisStyle,
        protected unitController: TimeGraphUnitController,
        protected stateController: TimeGraphStateController) {
        super(id);
        this.addEvents();
        this.labels = [];
    }

    protected addEvents() {
        const mouseMove = _.throttle(event => {
            if (this.mouseIsDown) {
                /**
                    Zoom around MousePosition on drag up/down
                    left here as an additional option
                    to be added later
                */
                // const delta = event.data.global.y - this.mouseStartY;
                // const zoomStep = (delta / 100);
                // this.zoomAroundMousePointerOnDrag(zoomStep);

                const delta = event.data.global.x - this.mouseStartX;
                const zoomStep = (delta / 100);
                this.zoomAroundLeftViewBorder(zoomStep);
            }
        }, 40);
        this.addEvent('mousedown', event => {
            this.mouseStartY = event.data.global.y;
            this.mouseStartX = event.data.global.x;
            this.oldViewRange = this.unitController.viewRange;
            this.mouseIsDown = true;
        }, this._displayObject);
        this.addEvent('mousemove', mouseMove, this._displayObject);
        const moveEnd: TimeGraphInteractionHandler = event => {
            this.mouseIsDown = false;
        }
        this.addEvent('mouseup', moveEnd, this._displayObject);
        this.addEvent('mouseupoutside', moveEnd, this._displayObject);
    }

    protected getStepLength(): number {
        const canvasDisplayWidth = this.stateController.canvasDisplayWidth;
        const minCanvasStepWidth = 80;
        const viewRangeLength = this.unitController.viewRangeLength;
        const maxSteps = canvasDisplayWidth / minCanvasStepWidth;
        const realStepLength = viewRangeLength / maxSteps;
        const log = Math.log10(realStepLength);
        let logRounded = Math.round(log);
        const normalizedStepLength = Math.pow(10, logRounded);
        const residual = realStepLength / normalizedStepLength;
        const steps = this.unitController.scaleSteps || [1, 1.5, 2, 2.5, 5, 10];
        const normStepLength = steps.find(s => s > residual);
        const stepLength = normalizedStepLength * (normStepLength || 1);
        return stepLength;
    }

    protected renderVerticalLines(drawLabels: boolean, lineColor: number, lineStyle: (label: string | undefined) => { lineHeight: number }) {
        if (this.unitController.viewRangeLength > 0) {
            const stepLength = this.getStepLength();
            const canvasDisplayWidth = this.stateController.canvasDisplayWidth;
            const zoomFactor = this.stateController.zoomFactor;
            const viewRangeStart = this.unitController.viewRange.start;
            const iLo: number = Math.floor(viewRangeStart / stepLength);
            const iHi: number = Math.ceil((canvasDisplayWidth / zoomFactor + viewRangeStart) / stepLength);
            for (let i = iLo; i < iHi; i++) {
                const absolutePosition = stepLength * i;
                const xpos = (absolutePosition - viewRangeStart) * zoomFactor;
                if (xpos >= 0 && xpos < canvasDisplayWidth) {
                    const position = {
                        x: xpos,
                        y: this._options.position.y
                    };
                    let label;
                    if (drawLabels && this.unitController.numberTranslator) {
                        label = this.unitController.numberTranslator(absolutePosition);
                        if (label) {
                            const text = new PIXI.Text(label, {
                                fontSize: 10,
                                fill: lineColor
                            });
                            text.x = position.x + 5;
                            text.y = position.y + lineStyle(label).lineHeight;
                            this.labels.push(text);
                            this._displayObject.addChild(text);
                        }
                    }
                    this.vline({
                        position,
                        height: lineStyle(label).lineHeight,
                        color: lineColor
                    });
                }
            }
        }
    }

    update(opts?: TimeGraphComponentOptions) {
        this.labels.forEach(label => label.destroy());
        this.labels = [];
        super.update(opts);
    }

    render() {
        this.rect({
            color: this._options.color || 0xededdd,
            height: this._options.height,
            width: this._options.width,
            position: this._options.position
        });
        this.renderVerticalLines(true, this._options.lineColor || 0x000000, (l) => ({ lineHeight: l === '' || l === undefined ? 5 : 10 }));
    }

    zoomAroundLeftViewBorder(zoomStep: number) {
        const oldViewRangeLength = this.oldViewRange.end - this.oldViewRange.start;
        const newViewRangeLength = oldViewRangeLength / (1 + (zoomStep));
        let start = this.oldViewRange.start;
        let end = start + newViewRangeLength;
        if (end > this.unitController.absoluteRange) {
            end = this.unitController.absoluteRange;
        }
        if (Math.trunc(start) !== Math.trunc(end)) {
            this.unitController.viewRange = {
                start,
                end
            }
        }
    }

    zoomAroundMousePointerOnDrag(zoomStep: number) {
        const oldViewRangeLength = this.oldViewRange.end - this.oldViewRange.start;
        const newViewRangeLength = oldViewRangeLength / (1 + (zoomStep));
        const normZoomFactor = newViewRangeLength / oldViewRangeLength;
        const shiftedMouseX = normZoomFactor * this.mouseStartX;
        const xOffset = this.mouseStartX - shiftedMouseX;
        const viewRangeOffset = xOffset / (this.stateController.canvasDisplayWidth / oldViewRangeLength);
        let start = this.oldViewRange.start + viewRangeOffset;
        if (start < 0) {
            start = 0;
        }
        let end = start + newViewRangeLength;
        if (end > this.unitController.absoluteRange) {
            end = this.unitController.absoluteRange;
        }
        this.unitController.viewRange = {
            start,
            end
        }
    }
}