import * as PIXI from "pixi.js-legacy"
import * as keyboardKey from "keyboard-key"

import { TimeGraphCursor } from "../components/time-graph-cursor";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";
import { TimeGraphRowController } from "../time-graph-row-controller";
import { TimeGraphChart } from "./time-graph-chart";
import { BIMath } from "../bigint-utils";

export class TimeGraphChartCursors extends TimeGraphChartLayer {
    protected mouseSelecting: boolean = false;
    protected mouseButtons: number = 0;
    protected shiftKeyDown: boolean;
    protected firstCursor?: TimeGraphCursor;
    protected secondCursor?: TimeGraphCursor;
    protected color: number = 0x0000ff;

    private _stageMouseDownHandler: Function;
    private _stageMouseMoveHandler: Function;
    private _stageMouseUpHandler: Function;
    
    private _updateHandler: { (): void; (viewRange: TimelineChart.TimeGraphRange): void; (selectionRange: TimelineChart.TimeGraphRange): void; (viewRange: TimelineChart.TimeGraphRange): void; (selectionRange: TimelineChart.TimeGraphRange): void; };
    private _mouseDownHandler: { (event: MouseEvent): void; (event: Event): void; };
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
        };

        this._keyUpHandler = (event: KeyboardEvent) => {
            this.shiftKeyDown = event.shiftKey;
            if (this.stage.cursor === 'crosshair' && !this.mouseSelecting && event.key === 'Shift' ) {
                this.stage.cursor = 'default';
            }
        };

        this.onCanvasEvent('keydown', this._keyDownHandler);
        this.onCanvasEvent('keyup', this._keyUpHandler);

        this._stageMouseDownHandler = (event: PIXI.InteractionEvent) => {
            this.mouseButtons = event.data.buttons;
            // if only left button is pressed with or without Shift key
            if (event.data.button !== 0 || event.data.buttons !== 1 ||
                event.data.originalEvent.ctrlKey || event.data.originalEvent.altKey) {
                return;
            }
            const extendSelection = event.data.originalEvent.shiftKey && this.stage.cursor === 'crosshair';
            this.mouseSelecting = true;
            this.stage.cursor = 'crosshair';
            const mouseX = event.data.global.x;
            const end = this.unitController.viewRange.start + BIMath.round(mouseX / this.stateController.zoomFactor);
            this.chartLayer.selectState(undefined);
            if (extendSelection) {
                const start = this.unitController.selectionRange ? this.unitController.selectionRange.start : BigInt(0);
                this.unitController.selectionRange = {
                    start,
                    end
                }
            } else {
                this.unitController.selectionRange = {
                    start: end,
                    end: end
                }
            }
        };
        this.stage.on('mousedown', this._stageMouseDownHandler);
        this._stageMouseMoveHandler = (event: PIXI.InteractionEvent) => {
            this.mouseButtons = event.data.buttons;
            if (this.mouseSelecting && this.unitController.selectionRange) {
                if ((this.mouseButtons & 1) === 0) {
                    // handle missed button mouseup event
                    this.mouseSelecting = false;
                    const orig = event.data.originalEvent;
                    if (!orig.shiftKey || orig.ctrlKey || orig.altKey) {
                        this.stage.cursor = 'default';
                    }
                    return;
                }
                const mouseX = event.data.global.x;
                const start = this.unitController.selectionRange.start;
                const end = BIMath.clamp(this.unitController.viewRange.start + BIMath.round(mouseX / this.stateController.zoomFactor),
                            BigInt(0), this.unitController.absoluteRange);
                this.unitController.selectionRange = {
                    start,
                    end
                }
            }
        }
        this.stage.on('mousemove', this._stageMouseMoveHandler);
    
        this._stageMouseUpHandler = (event: PIXI.InteractionEvent) => {
            this.mouseButtons = event.data.buttons;
            if (this.mouseSelecting && event.data.button === 0) {
                this.mouseSelecting = false;
                const orig = event.data.originalEvent;
                if (!orig.shiftKey || orig.ctrlKey || orig.altKey) {
                    this.stage.cursor = 'default';
                }
            }
        };
        this.stage.on('mouseup', this._stageMouseUpHandler);
        this.stage.on('mouseupoutside', this._stageMouseUpHandler);
        // right mouse button is not detected on stage
        this._mouseDownHandler = (e: MouseEvent) => {
            this.mouseButtons = e.buttons;
            // if right button is pressed
            if (e.button === 2) {
                // this is the only way to detect mouseup outside of right button
                const mouseUpListener = (e: MouseEvent) => {
                    this.mouseButtons = e.buttons;
                    if (e.button === 2) {
                        document.removeEventListener('mouseup', mouseUpListener);
                    }
                }
                document.addEventListener('mouseup', mouseUpListener);
            }
        };
        this.onCanvasEvent('mousedown', this._mouseDownHandler);
        this.unitController.onViewRangeChanged(this._updateHandler);
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

    removeCursors() {
        this.unitController.selectionRange = undefined;
    }

    update() {
        if (this.unitController.selectionRange) {
            const firstCursorPosition = this.getPixel(this.unitController.selectionRange.start - this.unitController.viewRange.start);
            const secondCursorPosition = this.getPixel(this.unitController.selectionRange.end - this.unitController.viewRange.start);
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
            this.unitController.removeViewRangeChangedHandler(this._updateHandler);
            this.unitController.removeSelectionRangeChangedHandler(this._updateHandler);
        }
        if (this._mouseDownHandler) {
            this.removeOnCanvasEvent('mousedown', this._mouseDownHandler);
        }
        if (this._keyDownHandler) {
            this.removeOnCanvasEvent('keydown', this._keyDownHandler);
        }
        if (this._keyUpHandler) {
            this.removeOnCanvasEvent('mousedown', this._keyUpHandler);
        }
        if (this.stage) {
            this.stage.off('mousedown', this._stageMouseDownHandler);
            this.stage.off('mousemove', this._stageMouseMoveHandler);
            this.stage.off('mouseup', this._stageMouseUpHandler);
            this.stage.off('mouseupoutside', this._stageMouseUpHandler);
        }
        super.destroy();
    }
}