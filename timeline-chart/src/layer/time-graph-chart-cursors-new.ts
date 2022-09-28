import * as keyboardKey from "keyboard-key";
import { TimeGraphCursor } from "../components/time-graph-cursor";
import { TimeGraphStateComponent } from "../components/time-graph-state";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphRowController } from "../time-graph-row-controller";
import { TimeGraphChart } from "./time-graph-chart";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";

export class TimeGraphChartCursorsNew extends TimeGraphChartLayer {
    protected mouseSelecting: boolean = false;
    protected mouseButtons: number = 0;
    protected shiftKeyDown: boolean;
    protected firstCursor?: TimeGraphCursor;
    protected secondCursor?: TimeGraphCursor;
    protected color: number = 0x0000ff;

    private _updateHandler: { (): void; (viewRange: TimelineChart.TimeGraphRange): void; (selectionRange: TimelineChart.TimeGraphRange): void; (viewRange: TimelineChart.TimeGraphRange): void; (selectionRange: TimelineChart.TimeGraphRange): void; };
    private _keyDownHandler: (event: KeyboardEvent) => void;
    private _keyUpHandler: (event: KeyboardEvent) => void;

    constructor(id: string, protected chartLayer: TimeGraphChart, protected rowController: TimeGraphRowController, style?: { color?: number }) {
        super(id, rowController);
        if (style && style.color) {
            this.color = style.color;
        }
    }

    protected afterAddToContainer() {
        this.mouseSelecting = false;
        this.shiftKeyDown = false
        this.stage.interactive = true;

        this._updateHandler = (): void => this.update();

        this._keyDownHandler = (event: KeyboardEvent) => {
            if (event.key === 'Shift' && this.mouseButtons === 0 && !event.ctrlKey && !event.altKey) {
                this.stage.cursor = 'crosshair';
            } else if (this.stage.cursor === 'crosshair' && !this.mouseSelecting &&
                (event.key === 'Control' || event.key === 'Alt')) {
                this.stage.cursor = 'default';
            }
            this.shiftKeyDown = event.shiftKey;
            // TODO: keyCode is deprecated. We should change these.
            if (event.keyCode === keyboardKey.ArrowLeft) {
                this.navigateOrSelectLeft();
            } else if (event.keyCode === keyboardKey.ArrowRight) {
                this.navigateOrSelectRight();
            } 
            switch(event.key) {
                case ",":
                    this.navigateAndSelectStateLeft();    
                    break;
                case ".":
                    this.navigateAndSelectStateRight();    
                    break;
                default:
                    return;
            }
        };

        this._keyUpHandler = (event: KeyboardEvent) => {
            this.shiftKeyDown = event.shiftKey;
            if (this.stage.cursor === 'crosshair' && !this.mouseSelecting && event.key === 'Shift' ) {
                this.stage.cursor = 'default';
            }
        };

        this.chartLayer.registerMouseInteractions({
                click: el => {
                    if (el instanceof TimeGraphStateComponent) {
                        if (el.model.range.start !== undefined && el.model.range.end !== undefined) {
                            this.unitController.selectionRange = {
                                start: el.model.range.start,
                                end: el.model.range.end
                            };
                        }
                    }
                }
            });

        this.onCanvasEvent('keydown', this._keyDownHandler);
        this.onCanvasEvent('keyup', this._keyUpHandler);

        this.stateController.onWorldRender(this._updateHandler);
        this.unitController.onSelectionRangeChange(this._updateHandler);
        this.update();
    }


    public maybeCenterCursor() {
        if (this.unitController.selectionRange) {
            const cursorPosition = this.unitController.selectionRange.end;
            if (cursorPosition < this.unitController.viewRange.start || cursorPosition > this.unitController.viewRange.end) {
                this.centerCursor();
            }
        }
    };

    protected navigateOrSelectLeft() {
        const row = this.rowController.selectedRow;
        if (row && this.unitController.selectionRange) {
            const cursorPosition = this.unitController.selectionRange.end;
            const prevState = row.states.slice().reverse().find((stateModel: TimelineChart.TimeGraphState) => cursorPosition > stateModel.range.end ||
                (cursorPosition > stateModel.range.start && cursorPosition <= stateModel.range.end));

            if (prevState) {
                const newPos = cursorPosition > prevState.range.end ? prevState.range.end : prevState.range.start;
                this.unitController.selectionRange = { start: this.shiftKeyDown ? this.unitController.selectionRange.start : newPos, end: newPos };
                this.chartLayer.selectState(prevState);
            } else {
                this.unitController.selectionRange = { start: this.shiftKeyDown ? this.unitController.selectionRange.start : row.prevPossibleState, end: row.prevPossibleState };
                this.chartLayer.setNavigationFlag(true);
            }
            this.maybeCenterCursor();
        }
    }

    protected navigateOrSelectRight() {
        const row = this.rowController.selectedRow;
        if (row && this.unitController.selectionRange) {
            const cursorPosition = this.unitController.selectionRange.end;
            const nextState = row.states.find((stateModel: TimelineChart.TimeGraphState) => cursorPosition < stateModel.range.start ||
                (cursorPosition >= stateModel.range.start && cursorPosition < stateModel.range.end));

            if (nextState) {
                const newPos = cursorPosition < nextState.range.start ? nextState.range.start : nextState.range.end;
                this.unitController.selectionRange = { start: this.shiftKeyDown ? this.unitController.selectionRange.start : newPos, end: newPos };
                this.chartLayer.selectState(nextState);
            } else {
                this.unitController.selectionRange = { start: this.shiftKeyDown ? this.unitController.selectionRange.start : row.nextPossibleState, end: row.nextPossibleState };
                this.chartLayer.setNavigationFlag(true);
            }
            this.maybeCenterCursor();
        }
    }

    centerCursor() {
        if (this.unitController.selectionRange) {
            const cursorPosition = this.unitController.selectionRange.end;
            const halfViewRangeLength = this.unitController.viewRangeLength / BigInt(2);
            let start = cursorPosition - halfViewRangeLength;
            let end = cursorPosition + halfViewRangeLength;

            if (start < 0) {
                end -= start;
                start = BigInt(0);
            } else if (end > this.unitController.absoluteRange) {
                start -= (end - this.unitController.absoluteRange);
                end = this.unitController.absoluteRange;
            }

            this.unitController.viewRange = {
                start,
                end
            }
        }
    }

    protected navigateAndSelectStateLeft() {
        const row = this.rowController.selectedRow;
        if (row && this.unitController.selectionRange) {
            const cursorPosition = this.unitController.selectionRange.start;
            const prevState = row.states.slice().reverse().find((stateModel: TimelineChart.TimeGraphState) => cursorPosition > stateModel.range.end ||
                (cursorPosition > stateModel.range.start && cursorPosition <= stateModel.range.end));

            if (prevState) {
                this.unitController.selectionRange = {
                    start: prevState.range.start,
                    end: prevState.range.end
                };
                this.chartLayer.selectState(prevState);
            } else {
                // FIXME it looses focus when outside world range and 
                // user needs to select the state to make it work again
                this.unitController.selectionRange = {
                    start: row.prevPossibleState,
                    end: row.prevPossibleState,
                };
                this.chartLayer.setNavigationFlag(true);
            }
        }
        this.maybeCenterCursor();
    }

    protected navigateAndSelectStateRight() {
        const row = this.rowController.selectedRow;
        if (row && this.unitController.selectionRange) {
            const cursorPosition = this.unitController.selectionRange.end;
            const nextState = row.states.find((stateModel: TimelineChart.TimeGraphState) => cursorPosition < stateModel.range.start ||
                (cursorPosition >= stateModel.range.start && cursorPosition < stateModel.range.end));

            if (nextState) {
                this.unitController.selectionRange = {
                    start: nextState.range.start,
                    end: nextState.range.end
                };
                this.chartLayer.selectState(nextState);
            } else {
                // FIXME it looses focus when outside world range and 
                // user needs to select the state to make it work again
                this.unitController.selectionRange = {
                    start: row.nextPossibleState,
                    end: row.nextPossibleState
                };
                this.chartLayer.setNavigationFlag(true);
            }
        }
        this.maybeCenterCursor();
    }

    removeCursors() {
        this.unitController.selectionRange = undefined;
    }

    update() {
        if (this.unitController.selectionRange) {
            const firstCursorPosition = this.getWorldPixel(this.unitController.selectionRange.start);
            const secondCursorPosition = this.getWorldPixel(this.unitController.selectionRange.end);
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
            } else {
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
                } else {
                    this.secondCursor.update(secondCursorOptions);
                }
            } else if (!!this.secondCursor) {
                this.removeChild(this.secondCursor);
                delete this.secondCursor;
            }
        } else {
            this.removeChildren();
            delete this.firstCursor;
            delete this.secondCursor;
        }
    }

    destroy() : void {
        if (this.unitController) {
            this.stateController.removeWorldRenderHandler(this._updateHandler);
            this.unitController.removeSelectionRangeChangedHandler(this._updateHandler);
        }
        if (this._keyDownHandler) {
            this.removeOnCanvasEvent('keydown', this._keyDownHandler);
        }
        if (this._keyUpHandler) {
            this.removeOnCanvasEvent('mousedown', this._keyUpHandler);
        }
        super.destroy();
    }
}