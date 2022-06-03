import * as PIXI from "pixi.js-legacy";
import { TimeGraphAnnotationComponent, TimeGraphAnnotationComponentOptions, TimeGraphAnnotationStyle } from "../components/time-graph-annotation";
import { TimeGraphComponent, TimeGraphRect, TimeGraphStyledRect } from "../components/time-graph-component";
import { TimeGraphRectangle } from "../components/time-graph-rectangle";
import { TimeGraphRow, TimeGraphRowStyle } from "../components/time-graph-row";
import { TimeGraphStateComponent, TimeGraphStateStyle } from "../components/time-graph-state";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphRowController } from "../time-graph-row-controller";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";
import { BIMath } from "../bigint-utils";
import { debounce, cloneDeep, DebouncedFunc, isEqual } from 'lodash';

export interface TimeGraphMouseInteractions {
    click?: (el: TimeGraphComponent<any>, ev: PIXI.InteractionEvent, clickCount: number) => void
    mouseover?: (el: TimeGraphComponent<any>, ev: PIXI.InteractionEvent) => void
    mouseout?: (el: TimeGraphComponent<any>, ev: PIXI.InteractionEvent) => void
    mousedown?: (el: TimeGraphComponent<any>, ev: PIXI.InteractionEvent) => void
    mouseup?: (el: TimeGraphComponent<any>, ev: PIXI.InteractionEvent) => void
}

export interface TimeGraphChartProviders {
    rowProvider: () => { rowIds: number[] }
    dataProvider: (range: TimelineChart.TimeGraphRange, resolution: number, rowIds?: number[]) => Promise<{ rows: TimelineChart.TimeGraphRowModel[], range: TimelineChart.TimeGraphRange, resolution: number }> | { rows: TimelineChart.TimeGraphRowModel[], range: TimelineChart.TimeGraphRange, resolution: number } | undefined
    stateStyleProvider?: (el: TimelineChart.TimeGraphState) => TimeGraphStateStyle | undefined
    rowAnnotationStyleProvider?: (el: TimelineChart.TimeGraphAnnotation) => TimeGraphAnnotationStyle | undefined
    rowStyleProvider?: (row?: TimelineChart.TimeGraphRowModel) => TimeGraphRowStyle | undefined
}

export const keyBoardNavs: Record<string, Array<string>> = {
    "zoomin": ['w', 'i'],
    "zoomout": ['s', 'k'],
    "panleft": ['a', 'j'],
    "panright": ['d', 'l']
}

export type TimeGraphRowStyleHook = (row: TimelineChart.TimeGraphRowModel) => TimeGraphRowStyle | undefined;

const VISIBLE_ROW_BUFFER = 3; // number of buffer rows above and below visible range

export class TimeGraphChart extends TimeGraphChartLayer {

    protected rowIds: number[]; // complete ordered list of rowIds
    protected rowComponents: Map<number, TimeGraphRow> = new Map(); // map of rowId to row component
    protected mouseInteractions: TimeGraphMouseInteractions;
    protected selectedStateModel: TimelineChart.TimeGraphState | undefined;
    protected selectedStateChangedHandler: ((el: TimelineChart.TimeGraphState | undefined) => void)[] = [];
    protected ongoingRequest: { viewRange: TimelineChart.TimeGraphRange, resolution: number, rowIds: number[] } | undefined;

    protected isNavigating: boolean;

    protected mousePanning: boolean = false;
    protected mouseZooming: boolean = false;
    protected mouseButtons: number = 0;
    protected mouseDownButton: number;
    protected mouseStartX: number;
    protected mouseEndX: number;
    protected mousePanningStart: bigint;
    protected mouseZoomingStart: bigint;
    protected zoomingSelection?: TimeGraphRectangle;

    private _stageMouseDownHandler: Function;
    private _stageMouseMoveHandler: Function;
    private _stageMouseUpHandler: Function;

    private _viewRangeChangedHandler: { (): void; (viewRange: TimelineChart.TimeGraphRange): void; (selectionRange: TimelineChart.TimeGraphRange): void; };
    private _mouseMoveHandler: { (event: MouseEvent): void; (event: Event): void; };
    private _mouseDownHandler: { (event: MouseEvent): void; (event: Event): void; };
    private _keyDownHandler: { (event: KeyboardEvent): void; (event: Event): void; };
    private _keyUpHandler: { (event: KeyboardEvent): void; (event: Event): void; };
    private _mouseWheelHandler: { (ev: WheelEvent): void; (event: Event): void; (event: Event): void; };
    private _contextMenuHandler: { (e: MouseEvent): void; (event: Event): void; };

    private _debouncedMaybeFetchNewData = debounce(() => this.maybeFetchNewData(), 400);

    // Keep track of the most recently clicked point.
    // If clicked again during _multiClickTime duration (milliseconds) record multi-click
    private _recentlyClickedGlobal: PIXI.Point | null = null;
    private _multiClickTime: number = 500;
    private _mouseClicks = 0;
    private _multiClickTimer: DebouncedFunc<() => void>;

    constructor(id: string,
        protected providers: TimeGraphChartProviders,
        protected rowController: TimeGraphRowController) {
        super(id, rowController);
        this.isNavigating = false;
    }

    adjustZoom(zoomPosition: number | undefined, hasZoomedIn: boolean) {
        if (this.unitController.viewRangeLength <= 0) {
            return;
        }
        if (zoomPosition === undefined) {
            const start = this.getPixel(this.unitController.selectionRange ? this.unitController.selectionRange.start - this.unitController.viewRange.start : BigInt(0));
            const end = this.getPixel(this.unitController.selectionRange ? this.unitController.selectionRange.end - this.unitController.viewRange.start : this.unitController.viewRangeLength);
            zoomPosition = (start + end) / 2;
        }
        const zoomTime = zoomPosition / this.stateController.zoomFactor;
        const zoomMagnitude = hasZoomedIn ? 0.8 : 1.25;
        const newViewRangeLength = BIMath.clamp(Number(this.unitController.viewRangeLength) * zoomMagnitude,
            BigInt(2), this.unitController.absoluteRange);
        const center = this.unitController.viewRange.start + BIMath.round(zoomTime);
        const start = BIMath.clamp(Number(center) - zoomTime * Number(newViewRangeLength) / Number(this.unitController.viewRangeLength),
            BigInt(0), this.unitController.absoluteRange - newViewRangeLength);
        const end = start + newViewRangeLength;
        if (start !== end) {
            this.unitController.viewRange = {
                start,
                end
            }
        }
    };

    protected afterAddToContainer() {
        this.stage.cursor = 'default';
        let mousePositionX = 1;
        const horizontalDelta = 3;
        let triggerKeyEvent = false;

        const moveHorizontally = (magnitude: number) => {
            if (magnitude === 0) {
                return;
            }
            // move by at least one nanosecond
            const absOffset = BIMath.max(1, Math.abs(magnitude / this.stateController.zoomFactor));
            const timeOffset = magnitude > 0 ? absOffset : -absOffset;
            const start = BIMath.clamp(this.unitController.viewRange.start + timeOffset,
                BigInt(0), this.unitController.absoluteRange - this.unitController.viewRangeLength);
            const end = start + this.unitController.viewRangeLength;
            this.unitController.viewRange = {
                start,
                end
            }
        }

        const panHorizontally = (magnitude: number) => {
            const timeOffset = BIMath.round(magnitude / this.stateController.zoomFactor);
            const start = BIMath.clamp(this.mousePanningStart - timeOffset,
                BigInt(0), this.unitController.absoluteRange - this.unitController.viewRangeLength);
            const end = start + this.unitController.viewRangeLength;
            this.unitController.viewRange = {
                start,
                end
            }
        }

        const moveVertically = (magnitude: number) => {
            if (this.rowController.totalHeight <= this.stateController.canvasDisplayHeight) {
                return;
            }
            let verticalOffset = Math.max(0, this.rowController.verticalOffset + magnitude);
            if (this.rowController.totalHeight - verticalOffset <= this.stateController.canvasDisplayHeight) {
                verticalOffset = this.rowController.totalHeight - this.stateController.canvasDisplayHeight;
            }
            this.rowController.verticalOffset = verticalOffset;
        }

        this._mouseMoveHandler = (event: MouseEvent) => {
            mousePositionX = event.offsetX;
        };

        this._keyDownHandler = (event: KeyboardEvent) => {
            const keyPressed = event.key;
            if (triggerKeyEvent) {
                if (keyPressed === 'Control' && this.mouseButtons === 0 && !event.shiftKey && !event.altKey) {
                    this.stage.cursor = 'grabbing';
                } else if (this.stage.cursor === 'grabbing' && !this.mousePanning &&
                    (keyPressed === 'Shift' || keyPressed === 'Alt')) {
                    this.stage.cursor = 'default';
                }
                if (keyBoardNavs['zoomin'].indexOf(keyPressed) >= 0) {
                    this.adjustZoom(mousePositionX, true);
                } else if (keyBoardNavs['zoomout'].indexOf(keyPressed) >= 0) {
                    this.adjustZoom(mousePositionX, false);
                } else if (keyBoardNavs['panleft'].indexOf(keyPressed) >= 0) {
                    moveHorizontally(-horizontalDelta);
                } else if (keyBoardNavs['panright'].indexOf(keyPressed) >= 0) {
                    moveHorizontally(horizontalDelta);
                } else if (keyPressed === 'ArrowUp') {
                    this.navigateUp();
                } else if (keyPressed === 'ArrowDown') {
                    this.navigateDown();
                }
                event.preventDefault();
            }
            if (keyPressed === 'Escape' && this.mouseZooming) {
                this.mouseZooming = false;
                this.stage.cursor = 'default';
                this.updateZoomingSelection();
            }
        };
        this._keyUpHandler = (event: KeyboardEvent) => {
            const keyPressed = event.key;
            if (triggerKeyEvent) {
                if (this.stage.cursor === 'grabbing' && !this.mousePanning && keyPressed === 'Control') {
                    this.stage.cursor = 'default';
                }
            }
        };

        this.stage.addListener('mouseover', (event: MouseEvent) => {
            triggerKeyEvent = true;
        });

        this.stage.addListener('mouseout', (event: MouseEvent) => {
            triggerKeyEvent = false;
            if (this.stage.cursor === 'grabbing' && !this.mousePanning) {
                this.stage.cursor = 'default';
            }
        });

        this._stageMouseDownHandler = (event: PIXI.InteractionEvent) => {
            this.mouseButtons = event.data.buttons;
            // if only middle button or only Ctrl+left button is pressed
            if ((event.data.button !== 1 || event.data.buttons !== 4) &&
                (event.data.button !== 0 || event.data.buttons !== 1 ||
                    !event.data.originalEvent.ctrlKey ||
                    event.data.originalEvent.shiftKey ||
                    event.data.originalEvent.altKey ||
                    this.stage.cursor !== 'grabbing')) {
                return;
            }
            this.mousePanning = true;
            this.mouseDownButton = event.data.button;
            this.mouseStartX = event.data.global.x;
            this.mousePanningStart = this.unitController.viewRange.start;
            this.stage.cursor = 'grabbing';
        };
        this.stage.on('mousedown', this._stageMouseDownHandler);

        this._stageMouseMoveHandler = (event: PIXI.InteractionEvent) => {
            this.mouseButtons = event.data.buttons;
            if (this.mousePanning) {
                if ((this.mouseDownButton == 1 && (this.mouseButtons & 4) === 0) ||
                    (this.mouseDownButton == 0 && (this.mouseButtons & 1) === 0)) {
                    // handle missed button mouseup event
                    this.mousePanning = false;
                    const orig = event.data.originalEvent;
                    if (!orig.ctrlKey || orig.shiftKey || orig.altKey) {
                        this.stage.cursor = 'default';
                    }
                    return;
                }
                const horizontalDelta = event.data.global.x - this.mouseStartX;
                panHorizontally(horizontalDelta);
            }
            if (this.mouseZooming) {
                this.mouseEndX = event.data.global.x;
                this.updateZoomingSelection();
            }
        };
        this.stage.on('mousemove', this._stageMouseMoveHandler);

        this._stageMouseUpHandler = (event: PIXI.InteractionEvent) => {
            this.mouseButtons = event.data.buttons;
            if (event.data.button === this.mouseDownButton && this.mousePanning) {
                this.mousePanning = false;
                const orig = event.data.originalEvent;
                if (!orig.ctrlKey || orig.shiftKey || orig.altKey) {
                    this.stage.cursor = 'default';
                }
            }
        };
        this.stage.on('mouseup', this._stageMouseUpHandler);
        this.stage.on('mouseupoutside', this._stageMouseUpHandler);

        this._mouseWheelHandler = (ev: WheelEvent) => {
            if (ev.ctrlKey) {
                const hasZoomedIn = ev.deltaY < 0;
                this.adjustZoom(ev.offsetX, hasZoomedIn);

            } else if (ev.shiftKey) {
                moveHorizontally(ev.deltaY);
            } else {
                if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
                    moveVertically(ev.deltaY);
                } else {
                    moveHorizontally(ev.deltaX);
                }
            }
            ev.preventDefault();
        };
        this._contextMenuHandler = (e: MouseEvent) => {
            e.preventDefault();
        };

        this._mouseDownHandler = (e: MouseEvent) => {
            this.mouseButtons = e.buttons;
            // if only right button is pressed
            if (e.button === 2 && e.buttons === 2 && this.stage.cursor === 'default') {
                this.mouseZooming = true;
                this.mouseDownButton = e.button;
                this.mouseStartX = e.offsetX;
                this.mouseEndX = e.offsetX;
                this.mouseZoomingStart = this.unitController.viewRange.start + BIMath.round(this.mouseStartX / this.stateController.zoomFactor);
                this.stage.cursor = 'col-resize';
                // this is the only way to detect mouseup outside of right button
                document.addEventListener('mouseup', mouseUpListener);
                this.updateZoomingSelection();
            }
        };
        const mouseUpListener = (e: MouseEvent) => {
            this.mouseButtons = e.buttons;
            if (e.button === this.mouseDownButton && this.mouseZooming) {
                this.mouseZooming = false;
                const start = this.mouseZoomingStart;
                const end = this.unitController.viewRange.start + BIMath.round(this.mouseEndX / this.stateController.zoomFactor);
                if (BIMath.abs(end - start) > 1 && this.unitController.viewRangeLength > 1) {
                    let newViewStart = BIMath.clamp(start, this.unitController.viewRange.start, end);
                    let newViewEnd = BIMath.clamp(end, start, this.unitController.viewRange.end);
                    this.unitController.viewRange = {
                        start: newViewStart,
                        end: newViewEnd
                    }
                }
                this.stage.cursor = 'default';
                document.removeEventListener('mouseup', mouseUpListener);
                this.updateZoomingSelection();
            }
        };
        this.onCanvasEvent('mousemove', this._mouseMoveHandler);
        this.onCanvasEvent('keydown', this._keyDownHandler);
        this.onCanvasEvent('keyup', this._keyUpHandler);
        this.onCanvasEvent('mousedown', this._mouseDownHandler);
        this.onCanvasEvent('mousewheel', this._mouseWheelHandler);
        this.onCanvasEvent('wheel', this._mouseWheelHandler);
        this.onCanvasEvent('contextmenu', this._contextMenuHandler);

        this.rowController.onVerticalOffsetChangedHandler(verticalOffset => {
            this.layer.position.y = -verticalOffset;
            this._debouncedMaybeFetchNewData();
        });

        this._viewRangeChangedHandler = () => {
            this.updateScaleAndPosition();
            if (this.mouseZooming) {
                this.updateZoomingSelection();
            }
        };
        this.unitController.onViewRangeChanged(this._viewRangeChangedHandler);
        this.unitController.onViewRangeChanged(this._debouncedMaybeFetchNewData);

        if (this.unitController.viewRangeLength && this.stateController.canvasDisplayWidth) {
            this.maybeFetchNewData();
        }
    }

    updateChart() {
        const update = true;
        if (this.unitController && this.stateController) {
            this.maybeFetchNewData(update);
        }
    }

    update() {
        this.updateScaleAndPosition();
        this._debouncedMaybeFetchNewData();
    }

    updateZoomingSelection() {
        if (this.zoomingSelection) {
            this.removeChild(this.zoomingSelection);
            delete this.zoomingSelection;
        }
        if (this.mouseZooming) {
            const mouseStartX = Number(this.mouseZoomingStart - this.unitController.viewRange.start) * this.stateController.zoomFactor;
            this.zoomingSelection = new TimeGraphRectangle({
                color: 0xbbbbbb,
                opacity: 0.2,
                position: {
                    x: mouseStartX,
                    y: 0
                },
                height: Math.max(this.stateController.canvasDisplayHeight, this.rowController.totalHeight),
                width: this.mouseEndX - mouseStartX
            });
            this.addChild(this.zoomingSelection);
        }
    }

    protected removeChildren(): void {
        this.rowComponents.clear();
        super.removeChildren();
    }

    destroy() {
        this.unitController.removeViewRangeChangedHandler(this._debouncedMaybeFetchNewData);
        if (this._viewRangeChangedHandler) {
            this.unitController.removeViewRangeChangedHandler(this._viewRangeChangedHandler);
        }
        if (this._mouseMoveHandler) {
            this.removeOnCanvasEvent('mousemove', this._mouseMoveHandler);
        }
        if (this._mouseDownHandler) {
            this.removeOnCanvasEvent('mousedown', this._mouseDownHandler);
        }
        if (this._keyDownHandler) {
            this.removeOnCanvasEvent('keydown', this._keyDownHandler);
        }
        if (this._keyUpHandler) {
            this.removeOnCanvasEvent('keyup', this._keyUpHandler);
        }
        if (this._mouseWheelHandler) {
            this.removeOnCanvasEvent('mousewheel', this._mouseWheelHandler);
            this.removeOnCanvasEvent('wheel', this._mouseWheelHandler);
        }
        if (this._contextMenuHandler) {
            this.removeOnCanvasEvent('contextmenu', this._contextMenuHandler);
        }
        if (this.stage) {
            this.stage.off('mousedown', this._stageMouseDownHandler);
            this.stage.off('mousemove', this._stageMouseMoveHandler);
            this.stage.off('mouseup', this._stageMouseUpHandler);
            this.stage.off('mouseupoutside', this._stageMouseUpHandler);
        }
        this.rowComponents.clear();
        super.destroy();
    }

    protected async maybeFetchNewData(update?: boolean) {
        this.rowIds = this.providers.rowProvider().rowIds;
        if (update) {
            // update position of existing rows and remove deleted rows
            this.rowComponents.forEach((rowComponent, rowId) => {
                const index = this.rowIds.indexOf(rowId);
                if (index == -1) {
                    this.rowComponents.delete(rowId);
                    this.removeChild(rowComponent);
                } else {
                    rowComponent.position.y = this.rowController.rowHeight * index;
                    rowComponent.providedModel = undefined;
                }
            });
            // update selected row
            if (this.rowController.selectedRow) {
                this.rowController.selectedRowIndex = this.rowIds.indexOf(this.rowController.selectedRow.id);
                if (this.rowController.selectedRowIndex === -1) {
                    this.rowController.selectedRow = undefined;
                }
            }
            // create placeholder rows
            this.rowIds.forEach(rowId => {
                if (!this.rowComponents.get(rowId)) {
                    this.addRow(rowId);
                }
            });
        }
        const visibleRowIds = this.getVisibleRowIds(VISIBLE_ROW_BUFFER);
        const viewRange = this.unitController.viewRange;
        const resolution = Number(this.unitController.viewRangeLength) / this.stateController.canvasDisplayWidth;
        // Compute the visible rowIds to fetch. Fetch all visible rows if update flag is set,
        // otherwise fetch visible rows with no component, no model or obsolete model.
        const rowIds = visibleRowIds.filter(rowId => {
            const rowComponent = this.rowComponents.get(rowId);
            return update ||
                !rowComponent ||
                !rowComponent.providedModel ||
                viewRange.start < rowComponent.providedModel.range.start ||
                viewRange.end > rowComponent.providedModel.range.end ||
                resolution != rowComponent.providedModel.resolution;
        });
        if (rowIds.length > 0) {
            const request = { viewRange, resolution, rowIds };
            if (isEqual(request, this.ongoingRequest)) {
                // request ignored because equal to ongoing request
                return;
            }
            try {
                this.ongoingRequest = request;
                const rowData = await this.providers.dataProvider(viewRange, resolution, rowIds);
                if (!isEqual(request, this.ongoingRequest)) {
                    // response discarded because not equal to ongoing request
                    return;
                }
                if (rowData) {
                    this.addOrUpdateRows(rowData);
                    if (this.isNavigating) {
                        this.selectStateInNavigation();
                    }
                    if (this.mouseZooming) {
                        delete this.zoomingSelection;
                        this.updateZoomingSelection();
                    }
                }
            } finally {
                if (isEqual(request, this.ongoingRequest)) {
                    this.ongoingRequest = undefined;
                }
                this.isNavigating = false;
            }
        }
    }

    protected updateScaleAndPosition() {
        this.rowComponents.forEach((rowComponent) => {
            const row = rowComponent.model;
            if (rowComponent) {
                const opts: TimeGraphRect = {
                    height: this.rowController.rowHeight,
                    position: {
                        x: 0,
                        y: rowComponent.position.y
                    },
                    width: this.stateController.canvasDisplayWidth
                }
                rowComponent.update(opts);
            }
            let lastX: number | undefined;
            let lastTime: bigint | undefined;
            let lastBlank = false;
            row?.states.forEach((state: TimelineChart.TimeGraphState, elementIndex: number) => {
                const el = rowComponent.getStateById(state.id);
                const start = state.range.start;
                const xStart = this.getPixel(start - this.unitController.viewRange.start);
                if (el) {
                    const end = state.range.end;
                    const xEnd = this.getPixel(end - this.unitController.viewRange.start);
                    const opts: TimeGraphStyledRect = {
                        height: el.height,
                        position: {
                            x: xStart,
                            y: el.position.y
                        },
                        width: Math.max(1, xEnd - xStart),
                        displayWidth: this.getPixel(BIMath.min(this.unitController.viewRange.end, end)) - this.getPixel(BIMath.max(this.unitController.viewRange.start, start))
                    }
                    el.update(opts);
                }
                if (rowComponent && row.gapStyle) {
                    this.updateGap(state, rowComponent, row.gapStyle, xStart, lastX, lastTime, lastBlank);
                }
                lastX = Math.max(xStart + 1, this.getPixel(state.range.end - this.unitController.viewRange.start));
                lastTime = state.range.end;
                lastBlank = (state.data?.style === undefined);
            });
            row?.annotations.forEach((annotation: TimelineChart.TimeGraphAnnotation, elementIndex: number) => {
                const el = rowComponent.getAnnotationById(annotation.id);
                if (el) {
                    // only handle ticks for now
                    const start = annotation.range.start;
                    const opts: TimeGraphAnnotationComponentOptions = {
                        position: {
                            x: this.getPixel(start - this.unitController.viewRange.start),
                            y: el.displayObject.y
                        }
                    }
                    el.update(opts);
                }
            });
        });
    }

    protected handleSelectedStateChange() {
        this.selectedStateChangedHandler.forEach(handler => handler(this.selectedStateModel));
    }

    protected addOrUpdateRows(rowData: { rows: TimelineChart.TimeGraphRowModel[], range: TimelineChart.TimeGraphRange, resolution: number }) {
        if (!this.stateController) {
            throw ('Add this TimeGraphChart to a container before adding rows.');
        }
        const providedModel = { range: rowData.range, resolution: rowData.resolution };
        rowData.rows.forEach(row => {
            const rowComponent = this.rowComponents.get(row.id);
            if (rowComponent) {
                this.removeChild(rowComponent);
            }
            this.addRow(row.id, row, providedModel);
        })
    }

    protected addRow(rowId: number, row?: TimelineChart.TimeGraphRowModel, providedModel?: { range: TimelineChart.TimeGraphRange, resolution: number }) {
        const id = 'row_' + rowId;
        const rowIndex = this.rowIds.indexOf(rowId);
        const rowStyle = this.providers.rowStyleProvider ? this.providers.rowStyleProvider(row) : undefined;
        const rowComponent = new TimeGraphRow(id, {
            position: {
                x: 0,
                y: (this.rowController.rowHeight * rowIndex)
            },
            width: this.stateController.canvasDisplayWidth,
            height: this.rowController.rowHeight
        }, rowIndex, row, rowStyle);
        rowComponent.displayObject.interactive = true;
        rowComponent.displayObject.on('click', ((e: PIXI.InteractionEvent) => {
            this.selectRow(row);
        }).bind(this));
        this.addChild(rowComponent);
        this.rowComponents.set(rowId, rowComponent);
        if (this.rowController.selectedRowIndex == rowIndex) {
            this.selectRow(row);
        }
        if (row && providedModel) {
            this.updateRow(rowComponent, row, providedModel);
        }
    }

    protected updateRow(rowComponent: TimeGraphRow, row: TimelineChart.TimeGraphRowModel, providedModel: { range: TimelineChart.TimeGraphRange, resolution: number }) {
        let lastX: number | undefined;
        let lastTime: bigint | undefined;
        let lastBlank = false;
        row.states.forEach((stateModel: TimelineChart.TimeGraphState) => {
            const x = this.getPixel(stateModel.range.start - this.unitController.viewRange.start);
            if (stateModel.data?.style) {
                const el = this.createNewState(stateModel, rowComponent);
                if (el) {
                    this.addElementInteractions(el);
                    rowComponent.addState(el);
                }
            }
            if (row.gapStyle) {
                this.updateGap(stateModel, rowComponent, row.gapStyle, x, lastX, lastTime, lastBlank);
            }
            lastX = Math.max(x + 1, this.getPixel(stateModel.range.end - this.unitController.viewRange.start));
            lastTime = stateModel.range.end;
            lastBlank = (stateModel.data?.style === undefined);
        });
        if (this.rowController.selectedRow && this.unitController.selectionRange && this.rowController.selectedRow.id === row.id) {
            const state = row.states.find(state => {
                return this.unitController.selectionRange && state.range.start <= this.unitController.selectionRange.start && state.range.end > this.unitController.selectionRange.start;
            });
            this.selectState(state);
        }
        row.annotations.forEach((annotation: TimelineChart.TimeGraphAnnotation) => {
            const el = this.createNewAnnotation(annotation, rowComponent);
            if (el) {
                this.addElementInteractions(el);
                rowComponent.addAnnotation(el);
            }
        });
        rowComponent.providedModel = providedModel;
    }

    protected updateGap(state: TimelineChart.TimeGraphState, rowComponent: TimeGraphRow, gapStyle: any, x: number, lastX?: number, lastTime?: bigint, lastBlank?: boolean) {
        /* add gap if there is visible space between states or if there is a time gap between two blank states */
        if (lastX && lastTime && (x > lastX || (lastBlank && !state.data?.style && state.range.start > lastTime))) {
            const gap = state.data?.gap;
            if (gap) {
                const width = Math.max(1, x - lastX);
                const opts: TimeGraphStyledRect = {
                    height: gap.height,
                    position: {
                        x: lastX,
                        y: gap.position.y
                    },
                    width: width,
                    displayWidth: width
                }
                gap.update(opts);
            } else {
                const stateModel = {
                    id: rowComponent.id + '-gap',
                    range: {
                        start: lastTime,
                        end: state.range.start
                    },
                    data: {
                        style: gapStyle
                    }
                };
                const gap = this.createNewState(stateModel, rowComponent);
                if (gap) {
                    rowComponent.addChild(gap);
                    if (state.data) {
                        state.data['gap'] = gap;
                    }
                    this.addElementInteractions(gap);
                }
            }
        } else {
            if (state.data && state.data?.gap) {
                rowComponent.removeChild(state.data?.gap);
                state.data.gap = undefined;
            }
        }
    }

    protected createNewAnnotation(annotation: TimelineChart.TimeGraphAnnotation, rowComponent: TimeGraphRow) {
        const start = this.getPixel(annotation.range.start - this.unitController.viewRange.start);
        let el: TimeGraphAnnotationComponent | undefined;
        const elementStyle = this.providers.rowAnnotationStyleProvider ? this.providers.rowAnnotationStyleProvider(annotation) : undefined;
        el = new TimeGraphAnnotationComponent(annotation.id, annotation, { position: { x: start, y: rowComponent.position.y + (rowComponent.height * 0.5) } }, elementStyle, rowComponent);
        return el;
    }

    protected createNewState(stateModel: TimelineChart.TimeGraphState, rowComponent: TimeGraphRow): TimeGraphStateComponent | undefined {
        const xStart = this.getPixel(stateModel.range.start - this.unitController.viewRange.start);
        const xEnd = this.getPixel(stateModel.range.end - this.unitController.viewRange.start);
        let el: TimeGraphStateComponent | undefined;
        const displayStart = this.getPixel(BIMath.max(stateModel.range.start, this.unitController.viewRange.start));
        const displayEnd = this.getPixel(BIMath.min(stateModel.range.end, this.unitController.viewRange.end));
        const displayWidth = displayEnd - displayStart;
        const elementStyle = this.providers.stateStyleProvider ? this.providers.stateStyleProvider(stateModel) : undefined;
        el = new TimeGraphStateComponent(stateModel.id, stateModel, xStart, xEnd, rowComponent, elementStyle, displayWidth);
        return el;
    }

    protected addElementInteractions(el: TimeGraphComponent<any>) {
        el.displayObject.interactive = true;

        var self = this;
        this._multiClickTimer = debounce(function(){
            self._mouseClicks = 0;
            self._recentlyClickedGlobal = null;
        }, this._multiClickTime);

        el.displayObject.on('click', ((e: PIXI.InteractionEvent) => {
            if (el instanceof TimeGraphStateComponent && !this.mousePanning && !this.mouseZooming) {
                this.selectState(el.model);
            }

            // Mouse clicks count keeps increasing without limit as long as we keep clicking on the same coordinate.
            if (this._recentlyClickedGlobal && (this._recentlyClickedGlobal.equals(e.data.global))){
                this._mouseClicks++;
            } else {
                // Only clear the timer and reset the click count if the global position is NOT 
                // the same one as click 1.
                this._multiClickTimer.cancel();
                this._mouseClicks = 1;

                // Store the global position on first click
                this._recentlyClickedGlobal = cloneDeep(e.data.global);
            }

            // We can use a debouncer to reset the count when no click occurs for a certain period.
            this._multiClickTimer();

            // Click callback includes count parameter to record subsequent clicks on the same point
            if (this.mouseInteractions && this.mouseInteractions.click) {
                this.mouseInteractions.click(el, e, this._mouseClicks);
            }
        }).bind(this));
        el.displayObject.on('mouseover', ((e: PIXI.InteractionEvent) => {
            if (this.mouseInteractions && this.mouseInteractions.mouseover) {
                this.mouseInteractions.mouseover(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseout', ((e: PIXI.InteractionEvent) => {
            if (this.mouseInteractions && this.mouseInteractions.mouseout) {
                this.mouseInteractions.mouseout(el, e);
            }
        }).bind(this));
        el.displayObject.on('mousedown', ((e: PIXI.InteractionEvent) => {
            if (this.mouseInteractions && this.mouseInteractions.mousedown) {
                this.mouseInteractions.mousedown(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseup', ((e: PIXI.InteractionEvent) => {
            if (this.mouseInteractions && this.mouseInteractions.mouseup) {
                this.mouseInteractions.mouseup(el, e);
            }
        }).bind(this));
    }

    protected updateStateStyle(model: TimelineChart.TimeGraphState) {
        const style = this.providers.stateStyleProvider && this.providers.stateStyleProvider(model);
        const component = this.getStateById(model.id);
        component && style && (component.style = style);
    }

    protected updateRowStyle(model: TimelineChart.TimeGraphRowModel) {
        const style = this.providers.rowStyleProvider && this.providers.rowStyleProvider(model);
        const component = this.rowComponents.get(model.id);
        component && style && (component.style = style);
    }

    registerMouseInteractions(interactions: TimeGraphMouseInteractions) {
        this.mouseInteractions = interactions;
    }

    onSelectedStateChanged(handler: (el: TimelineChart.TimeGraphState | undefined) => void) {
        this.selectedStateChangedHandler.push(handler);
    }

    getRowModel(index: number): TimelineChart.TimeGraphRowModel | undefined {
        if (index >= this.rowIds.length) {
            return undefined;
        }
        return this.rowComponents.get(this.rowIds[index])?.model;
    }

    getStateById(id: string): TimeGraphStateComponent | undefined {
        let state = undefined;
        for (const rowComponent of this.rowComponents.values()) {
            state = rowComponent.getStateById(id);
            if (state) {
                break;
            }
        }
        return state;
    }

    selectRow(row: TimelineChart.TimeGraphRowModel | undefined) {
        if (this.rowController.selectedRow) {
            delete this.rowController.selectedRow.selected;
            this.updateRowStyle(this.rowController.selectedRow);
        }
        this.rowController.selectedRow = row;
        if (row) {
            this.rowController.selectedRowIndex = this.rowIds.indexOf(row.id);
            row.selected = true;
            this.updateRowStyle(row);
        }
    }

    getSelectedState(): TimelineChart.TimeGraphState | undefined {
        return this.selectedStateModel;
    }

    selectState(model: TimelineChart.TimeGraphState | undefined) {
        if (this.selectedStateModel === model) {
            return;
        }
        if (this.selectedStateModel) {
            delete this.selectedStateModel.selected;
            this.updateStateStyle(this.selectedStateModel);
        }
        if (model) {
            const state = this.getStateById(model.id);
            if (state) {
                const row = state.row;
                if (row) {
                    state.model.selected = true;
                    this.updateStateStyle(state.model);
                    this.selectRow(row.model);
                }
            }
        }
        this.selectedStateModel = model;
        this.handleSelectedStateChange();
    }

    setNavigationFlag(flag: boolean) {
        this.isNavigating = flag;
    }

    selectAndReveal(rowIndex: number) {
        if (rowIndex >= 0 && rowIndex < this.rowIds.length) {
            this.rowController.selectedRowIndex = rowIndex;
            this.navigate(rowIndex);
        }
    }

    protected selectStateInNavigation() {
        const row = this.rowController.selectedRow;
        if (row && this.unitController.selectionRange) {
            const cursorPosition = this.unitController.selectionRange.end;
            const state = row.states.find((stateModel: TimelineChart.TimeGraphState) => stateModel.range.start === cursorPosition || stateModel.range.end === cursorPosition);
            this.selectState(state);
        }
        this.setNavigationFlag(false);
    }

    protected navigateDown() {
        if (this.rowIds.length > 0) {
            this.rowController.selectedRowIndex = Math.min(this.rowController.selectedRowIndex + 1, this.rowIds.length - 1);
            this.navigate(this.rowController.selectedRowIndex);
        }
    }

    protected navigateUp() {
        if (this.rowIds.length > 0) {
            this.rowController.selectedRowIndex = Math.max(this.rowController.selectedRowIndex - 1, 0);
            this.navigate(this.rowController.selectedRowIndex);
        }
    }

    protected navigate(rowIndex: number) {
        this.ensureVisible(rowIndex);
        const selectedRowId = this.rowIds[rowIndex];
        const selectedRowComponent = this.rowComponents.get(selectedRowId);
        if (!selectedRowComponent) {
            this.selectRow(undefined);
            this.selectState(undefined);
            return;
        }
        const selectedRow = selectedRowComponent.model;
        this.selectRow(selectedRow);
        const state = selectedRow?.states.find(state => {
            return this.unitController.selectionRange && state.range.start <= this.unitController.selectionRange.start && state.range.end > this.unitController.selectionRange.start;
        });
        this.selectState(state);
    }

    private getVisibleRowIds(buffer: number): number[] {
        const visibleRowIds: number[] = [];
        const rowHeight = this.rowController.rowHeight;
        // return all rows that intersect the visible height range with a number of buffer rows
        const minY = this.rowController.verticalOffset - buffer * rowHeight;
        const maxY = this.rowController.verticalOffset + this.stateController.canvasDisplayHeight + buffer * rowHeight;
        this.rowIds.forEach((rowId, index) => {
            const y = rowHeight * index;
            if (y + rowHeight >= minY && y <= maxY) {
                visibleRowIds.push(rowId);
            }
        });
        return visibleRowIds;
    }

    protected ensureVisible(rowIndex: number) {
        if (rowIndex === -1) {
            return;
        }
        if (rowIndex * this.rowController.rowHeight < this.rowController.verticalOffset) {
            this.rowController.verticalOffset = rowIndex * this.rowController.rowHeight;
        } else if ((rowIndex + 1) * this.rowController.rowHeight > this.rowController.verticalOffset + this.stateController.canvasDisplayHeight) {
            this.rowController.verticalOffset = (rowIndex + 1) * this.rowController.rowHeight - this.stateController.canvasDisplayHeight
        }
    }
}
