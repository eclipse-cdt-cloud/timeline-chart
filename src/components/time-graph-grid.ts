import { TimeGraphComponent } from "./time-graph-component";
import { TimeGraphUnitController } from "../time-graph-unit-controller";
import { TimeGraphStateController } from "../time-graph-state-controller";

export class TimeGraphGrid extends TimeGraphComponent {

    constructor(
        protected unitController: TimeGraphUnitController,
        protected stateController: TimeGraphStateController,
        protected rowHeight: number) {
        super('');
    }

    render(): void {
        const stepLength = 10000;
        const steps = Math.trunc(this.unitController.absoluteRange / stepLength);
        for (let i = 0; i < steps; i++) {
            const xpos = (stepLength * i - this.unitController.viewRange.start) * this.stateController.zoomFactor;
            if (xpos >= 0 && xpos < this.stateController.canvasDisplayWidth) {
                const position = {
                    x: xpos,
                    y: 0
                };
                this.vline({
                    position,
                    height: this.stateController.canvasDisplayHeight,
                    color: 0xdddddd
                });
            }
        }

        const rowNumber = Math.trunc(this.stateController.canvasDisplayHeight /this.rowHeight) + 2;
        for(let i = 0; i < rowNumber; i++){
            this.hline({
                color: 0xdddddd,
                position: {
                    x: 0,
                    y: (i * this.rowHeight) - (this.rowHeight/2)
                },
                width: this.stateController.canvasDisplayWidth
            });
        }
    }

}