import { TimeGraphLayer } from './time-graph-layer';
import { BIMath } from '../bigint-utils';
import { TimeGraphStateController } from '../time-graph-state-controller';
import { TimeGraphUnitController } from '../time-graph-unit-controller';

export abstract class TimeGraphViewportLayer extends TimeGraphLayer {

    constructor(id: string) {
        super(id);
    }

    /**
     * Conveniently finds the pixel relative to the worldRangeStart.  Also clamps
     * so components don't render past the world range.
     * 
     * @param {bigint} time the time to get the world pixel for
     * @param {boolean} clamp if you want to clamp.  Default = false.
     * @return pixel relative to world range
     */
    protected getWorldPixel = (time: bigint, clamp?: boolean): number => {
        if (!this.unitController) {
            throw 'No unit controller to calculate world pixel.';
        }
        const { start, end } = this.unitController.worldRange;

        time = clamp ? BIMath.clamp(time, start, end) : time;
        let diff = time - start;
        return this.getPixel(diff);
    };

    initializeLayer(canvas: HTMLCanvasElement, stage: PIXI.Container, stateController: TimeGraphStateController, unitController: TimeGraphUnitController) {
        super.initializeLayer(canvas, stage, stateController, unitController);
        this.stateController.onPositionChanged(this.shiftStage);
    }

    protected shiftStage = () => {
        if (this.layer.position === undefined || this.layer.position === null) {
            return;
        }
        this.layer.position.x = this.stateController.positionOffset.x;
    }

}
