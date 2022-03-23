import * as PIXI from "pixi.js-legacy"

import { TimeGraphComponent, TimeGraphInteractionHandler, TimeGraphStyledRect, TimeGraphComponentOptions } from "./time-graph-component";
import { TimeGraphUnitController } from "../time-graph-unit-controller";
import { TimeGraphStateController } from "../time-graph-state-controller";
import * as _ from "lodash";
import { TimelineChart } from "../time-graph-model";

export interface TimeGraphAxisStyle extends TimeGraphStyledRect {
    lineColor?: number
}
import { BIMath } from "../bigint-utils";

export class TimeGraphAxisScale extends TimeGraphComponent<null> {

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
                this.zoomAroundLeftViewBorder(event.data.global.x);
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

    protected getStepLength(labelWidth: number): number {
        const canvasDisplayWidth = this.stateController.canvasDisplayWidth;
        const minCanvasStepWidth = Math.max(labelWidth, 80);
        const viewRangeLength = this.unitController.viewRangeLength;
        const maxSteps = canvasDisplayWidth / minCanvasStepWidth;
        const realStepLength = Number(viewRangeLength) / maxSteps;
        const log = Math.log10(realStepLength);
        let logRounded = Math.round(log);
        const normalizedStepLength = Math.pow(10, logRounded);
        const residual = realStepLength / normalizedStepLength;
        const steps = this.unitController.scaleSteps || [1, 2, 5, 10];
        const normStepLength = steps.find(s => s > residual);
        const stepLength = Math.max(normalizedStepLength * (normStepLength || 1), 1);
        return stepLength;
    }

    protected renderVerticalLines(drawLabels: boolean, lineColor: number, lineStyle: (label: string | undefined) => { lineHeight: number }) {
        if (this.unitController.viewRangeLength > 0 && this.stateController.canvasDisplayWidth > 0) {
            let labelWidth = 0;
            if (this.unitController.numberTranslator) {
                const label = this.unitController.numberTranslator(this.unitController.viewRange.end);
                if (label) {
                    const style = new PIXI.TextStyle({ fontSize: 10 });
                    const textMetrics = PIXI.TextMetrics.measureText(label, style);
                    labelWidth = textMetrics.width;
                }
            }
            const stepLength = BigInt(this.getStepLength(labelWidth));
            const canvasDisplayWidth = this.stateController.canvasDisplayWidth;
            const zoomFactor = this.stateController.zoomFactor;
            const viewRangeStart = this.unitController.viewRange.start + this.unitController.offset;
            const viewRangeEnd = this.unitController.viewRange.end + this.unitController.offset;
            const startTime = (viewRangeStart / stepLength) * stepLength;
            for (let time = startTime; time <= viewRangeEnd; time += stepLength) {
                const xpos = Number(time - viewRangeStart) * zoomFactor;
                if (xpos >= 0 && xpos < canvasDisplayWidth) {
                    const position = {
                        x: xpos,
                        y: this._options.position.y
                    };
                    let label;
                    if (drawLabels && this.unitController.numberTranslator) {
                        label = this.unitController.numberTranslator(time - this.unitController.offset);
                        if (label) {
                            const text = new PIXI.Text(label, {
                                fontSize: 10,
                                fill: lineColor
                            });
                            text.x = position.x - (text.width / 2);
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
        this.renderVerticalLines(true, this._options.lineColor || 0x000000, (l) => ({ lineHeight: l === '' || l === undefined ? 5 : 10 }));
    }

    zoomAroundLeftViewBorder(mouseX: number) {
        if (mouseX <= 0) {
            return;
        }
        const start = this.oldViewRange.start;
        const end = BIMath.min(this.oldViewRange.start + BIMath.round(Number(this.oldViewRange.end - this.oldViewRange.start) * (this.mouseStartX / mouseX)),
            this.unitController.absoluteRange);
        if (BIMath.abs(end - start) > 1) {
            this.unitController.viewRange = {
                start,
                end
            }
        }
    }
}
