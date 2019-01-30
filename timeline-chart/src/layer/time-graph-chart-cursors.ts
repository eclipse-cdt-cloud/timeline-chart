import { TimeGraphCursor } from "../components/time-graph-cursor";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";
import { TimeGraphRowController } from "../time-graph-row-controller";
import { TimeGraphChart } from "./time-graph-chart";

export class TimeGraphChartCursors extends TimeGraphChartLayer {
    protected mouseIsDown: boolean;
    protected shiftKeyDown: boolean;
    protected firstCursor: TimeGraphCursor;
    protected secondCursor: TimeGraphCursor;
    protected color: number = 0x0000ff;

    constructor(id: string, protected chartLayer: TimeGraphChart, protected rowController: TimeGraphRowController, style?: { color?: number }) {
        super(id, rowController);
        if (style && style.color) {
            this.color = style.color;
        }
    }

    protected afterAddToContainer() {
        this.mouseIsDown = false;
        this.shiftKeyDown = false
        this.stage.interactive = true;
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            this.shiftKeyDown = event.shiftKey;
            if (event.keyCode === 37) {
                this.navigateOrSelectLeft();
            } else if (event.keyCode === 39) {
                this.navigateOrSelectRight();
            }
        });
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            this.shiftKeyDown = event.shiftKey;
        });
        this.stage.on('mousedown', (event: PIXI.interaction.InteractionEvent) => {
            this.mouseIsDown = true;
            const mouseX = event.data.global.x;
            const xpos = this.unitController.viewRange.start + (mouseX / this.stateController.zoomFactor);
            if (this.shiftKeyDown) {
                const start = this.unitController.selectionRange ? this.unitController.selectionRange.start : 0;
                this.unitController.selectionRange = {
                    start,
                    end: xpos
                }
            } else {
                this.unitController.selectionRange = {
                    start: xpos,
                    end: xpos
                }
            }
        });
        this.stage.on('mousemove', (event: PIXI.interaction.InteractionEvent) => {
            if (this.mouseIsDown && this.unitController.selectionRange) {
                const mouseX = event.data.global.x;
                const xStartPos = this.unitController.selectionRange.start;
                const xEndPos = this.unitController.viewRange.start + (mouseX / this.stateController.zoomFactor);
                this.unitController.selectionRange = {
                    start: xStartPos,
                    end: xEndPos
                }
            }
        });
        this.stage.on('mouseup', (event: PIXI.interaction.InteractionEvent) => {
            this.mouseIsDown = false;
        });
        this.stage.on('mouseupoutside', (event: PIXI.interaction.InteractionEvent) => {
            this.mouseIsDown = false;
        });
        this.unitController.onViewRangeChanged(() => this.update());
        this.unitController.onSelectionRangeChange(() => this.update());
    }

    protected maybeCenterCursor() {
        const selection = this.unitController.selectionRange;
        const view = this.unitController.viewRange;
        if (selection && (selection.start < view.start || selection.start > view.end)) {
            this.centerCursor();
        }
    };

    protected navigateOrSelectLeft() {
        const row = this.rowController.selectedRow;
        const states = row.states;
        const nextIndex = states.findIndex((rowElementModel: TimelineChart.TimeGraphRowElementModel) => {
            const selStart = this.unitController.selectionRange ? (this.shiftKeyDown ? this.unitController.selectionRange.end : this.unitController.selectionRange.start) : 0;
            return rowElementModel.range.start >= selStart;
        });
        let newPos = 0;
        let elIndex = 0;
        if (nextIndex > 0) {
            elIndex = nextIndex - 1;
        } else if (nextIndex === -1) {
            elIndex = states.length - 1;
        }
        newPos = states[elIndex].range.start;
        if (this.unitController.selectionRange && this.shiftKeyDown) {
            this.unitController.selectionRange = { start: this.unitController.selectionRange.start, end: newPos };
        } else {
            this.unitController.selectionRange = { start: newPos, end: newPos };
        }
        this.maybeCenterCursor();
        this.chartLayer.selectRowElement(states[elIndex]);
    }

    protected navigateOrSelectRight() {
        const row = this.rowController.selectedRow;
        const states = row.states;
        const nextIndex = states.findIndex((rowElementModel: TimelineChart.TimeGraphRowElementModel) => {
            const cursorPosition = this.unitController.selectionRange ? (this.shiftKeyDown ? this.unitController.selectionRange.end : this.unitController.selectionRange.start) : 0;
            return rowElementModel.range.start > cursorPosition;
        });
        if (nextIndex < states.length) {
            const newPos = states[nextIndex].range.start;
            if (this.unitController.selectionRange && this.shiftKeyDown) {
                this.unitController.selectionRange = { start: this.unitController.selectionRange.start, end: newPos };
            } else {
                this.unitController.selectionRange = { start: newPos, end: newPos };
            }
        }
        this.maybeCenterCursor();
        this.chartLayer.selectRowElement(states[nextIndex]);
    }

    centerCursor() {
        if (this.unitController.selectionRange) {
            const cursorPosition = this.unitController.selectionRange.start;
            const halfViewRangeLength = this.unitController.viewRangeLength / 2;
            this.unitController.viewRange = {
                start: cursorPosition - halfViewRangeLength,
                end: cursorPosition + halfViewRangeLength
            }
        }
    }

    removeCursors() {
        this.unitController.selectionRange = undefined;
    }

    update() {
        if (this.unitController.selectionRange) {
            const firstCursorPosition = this.getPixels(this.unitController.selectionRange.start - this.unitController.viewRange.start);
            const secondCursorPosition = this.getPixels(this.unitController.selectionRange.end - this.unitController.viewRange.start);
            const firstCursorOptions = {
                color: this.color,
                height: this.stateController.canvasDisplayHeight,
                position: {
                    x: firstCursorPosition,
                    y: 0
                }
            };
            if (!this.firstCursor) {
                this.firstCursor = new TimeGraphCursor(firstCursorOptions);
                this.addChild(this.firstCursor);
            }else{
                this.firstCursor.update(firstCursorOptions);
            }
            if (secondCursorPosition !== firstCursorPosition) {
                const secondCursorOptions = {
                    color: this.color,
                    height: this.stateController.canvasDisplayHeight,
                    position: {
                        x: secondCursorPosition,
                        y: 0
                    }
                };
                if (!this.secondCursor) {
                    this.secondCursor = new TimeGraphCursor(secondCursorOptions);
                    this.addChild(this.secondCursor);
                }else{
                    this.secondCursor.update(secondCursorOptions);
                }
            } else if(!!this.secondCursor){
                this.removeChild(this.secondCursor);
                delete this.secondCursor;
            }
        } else {
            this.removeChildren();
            delete this.firstCursor;
            delete this.secondCursor;
        }
    }
}