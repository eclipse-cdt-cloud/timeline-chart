import * as PIXI from "pixi.js-legacy"

import { TimeGraphRowElement, TimeGraphRowElementStyle } from "../components/time-graph-row-element";
import { TimeGraphRow, TimeGraphRowStyle } from "../components/time-graph-row";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphComponent, TimeGraphRect, TimeGraphStyledRect } from "../components/time-graph-component";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";
import { TimeGraphRowController } from "../time-graph-row-controller";

export interface TimeGraphRowElementMouseInteractions {
    click?: (el: TimeGraphRowElement, ev: PIXI.InteractionEvent) => void
    mouseover?: (el: TimeGraphRowElement, ev: PIXI.InteractionEvent) => void
    mouseout?: (el: TimeGraphRowElement, ev: PIXI.InteractionEvent) => void
    mousedown?: (el: TimeGraphRowElement, ev: PIXI.InteractionEvent) => void
    mouseup?: (el: TimeGraphRowElement, ev: PIXI.InteractionEvent) => void
}

export interface TimeGraphChartProviders {
    dataProvider: (range: TimelineChart.TimeGraphRange, resolution: number) => Promise<{ rows: TimelineChart.TimeGraphRowModel[], range: TimelineChart.TimeGraphRange, resolution: number }> | { rows: TimelineChart.TimeGraphRowModel[], range: TimelineChart.TimeGraphRange, resolution: number } | undefined
    rowElementStyleProvider?: (el: TimelineChart.TimeGraphRowElementModel) => TimeGraphRowElementStyle | undefined
    rowStyleProvider?: (row: TimelineChart.TimeGraphRowModel) => TimeGraphRowStyle | undefined
}

export const keyBoardNavs: Record<string, Array<string>> = {
    "zoomin": ['w', 'i'],
    "zoomout": ['s', 'k'],
    "panleft": ['a', 'j'],
    "panright": ['d', 'l']
}

export type TimeGraphRowStyleHook = (row: TimelineChart.TimeGraphRowModel) => TimeGraphRowStyle | undefined;

export class TimeGraphChart extends TimeGraphChartLayer {

    protected rows: TimelineChart.TimeGraphRowModel[];
    protected rowComponents: Map<TimelineChart.TimeGraphRowModel, TimeGraphRow>;
    protected rowElementComponents: Map<TimelineChart.TimeGraphRowElementModel, TimeGraphRowElement>
    protected rowElementMouseInteractions: TimeGraphRowElementMouseInteractions;
    protected selectedElementModel: TimelineChart.TimeGraphRowElementModel;
    protected selectedElementChangedHandler: ((el: TimelineChart.TimeGraphRowElementModel) => void)[] = [];

    protected providedRange: TimelineChart.TimeGraphRange;
    protected providedResolution: number;

    protected fetching: boolean;

    protected isNavigating: boolean;

    constructor(id: string,
        protected providers: TimeGraphChartProviders,
        protected rowController: TimeGraphRowController) {
        super(id, rowController);
        this.providedRange = { start: 0, end: 0 };
        this.providedResolution = 1;
        this.isNavigating = false;
    }

    protected afterAddToContainer() {
        let mousePositionX = 1;
        let mousePositionY = 1;
        const horizontalDelta = 3;
        let triggerKeyEvent = false;

        const moveHorizontally = (magnitude: number) => {
            const xOffset = -(magnitude / this.stateController.zoomFactor);
            let start = Math.max(0, this.unitController.viewRange.start - xOffset);
            let end = start + this.unitController.viewRangeLength;
            if (end > this.unitController.absoluteRange) {
                end = this.unitController.absoluteRange;
                start = end - this.unitController.viewRangeLength;
            }
            this.unitController.viewRange = {
                start,
                end
            }
        }

        const moveVertically = (magnitude: number) => {
            let verticalOffset = Math.max(0, this.rowController.verticalOffset + magnitude);
            if (this.rowController.totalHeight - verticalOffset <= this.stateController.canvasDisplayHeight) {
                verticalOffset = this.rowController.totalHeight - this.stateController.canvasDisplayHeight;
            }
            this.rowController.verticalOffset = verticalOffset;
        }

        const adjustZoom = (zoomPosition: number, deltaLength: number) => {
            const newViewRangeLength = this.unitController.viewRangeLength + deltaLength;
            const xOffset = ((zoomPosition / this.unitController.viewRangeLength) * deltaLength);
            const start = Math.max(0, this.unitController.viewRange.start - xOffset);
            const end = Math.min(start + newViewRangeLength, this.unitController.absoluteRange);
            this.unitController.viewRange = {
                start,
                end
            }
        };

        const mouseMoveHandler = (event: MouseEvent) => {
            mousePositionX = event.offsetX;
            mousePositionY = event.offsetY;
        };

        const keyDownHandler = (event: KeyboardEvent) => {
            let keyPressed = event.key;

            if (triggerKeyEvent) {
                if (keyBoardNavs['zoomin'].indexOf(keyPressed) >= 0) {
                    const zoomPosition = (mousePositionX / this.stateController.zoomFactor);
                    const deltaLength = -(mousePositionY / this.stateController.zoomFactor);
                    adjustZoom(zoomPosition, deltaLength);

                } else if (keyBoardNavs['zoomout'].indexOf(keyPressed) >= 0) {
                    const zoomPosition = (mousePositionX / this.stateController.zoomFactor);
                    const deltaLength = (mousePositionY / this.stateController.zoomFactor);
                    adjustZoom(zoomPosition, deltaLength);

                } else if (keyBoardNavs['panleft'].indexOf(keyPressed) >= 0) {
                    moveHorizontally(-horizontalDelta);

                } else if (keyBoardNavs['panright'].indexOf(keyPressed) >= 0) {
                    moveHorizontally(horizontalDelta);
                }
                event.preventDefault();
            }
        };

        this.stage.addListener('mouseover', (event: MouseEvent) => {
            triggerKeyEvent = true;
        });

        this.stage.addListener('mouseout', (event: MouseEvent) => {
            triggerKeyEvent = false;
        });

        const mouseWheelHandler = (ev: WheelEvent) => {
            if (ev.ctrlKey) {
                const zoomPosition = (ev.offsetX / this.stateController.zoomFactor);
                const deltaLength = (ev.deltaY / this.stateController.zoomFactor);
                adjustZoom(zoomPosition, deltaLength);

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

        this.onCanvasEvent('mousemove', mouseMoveHandler);
        this.onCanvasEvent('keydown', keyDownHandler);
        this.onCanvasEvent('mousewheel', mouseWheelHandler);
        this.onCanvasEvent('wheel', mouseWheelHandler);

        this.rowController.onVerticalOffsetChangedHandler(verticalOffset => {
            this.layer.position.y = -verticalOffset;
        });

        this.unitController.onViewRangeChanged(() => {
            this.updateScaleAndPosition();
            if (!this.fetching && this.unitController.viewRangeLength !== 0) {
                this.maybeFetchNewData();
            }
        });
        if (this.unitController.viewRangeLength) {
            this.maybeFetchNewData();
        }
    }

    updateChart() {
        const update = true;
        this.maybeFetchNewData(update);
    }

    update() {
        this.updateScaleAndPosition();
    }

    protected async maybeFetchNewData(update?: boolean) {
        const resolution = this.unitController.viewRangeLength / this.stateController.canvasDisplayWidth;
        const viewRange = this.unitController.viewRange;
        if (viewRange && (
            viewRange.start < this.providedRange.start ||
            viewRange.end > this.providedRange.end ||
            resolution < this.providedResolution ||
            update
        )) {
            this.fetching = true;
            const rowData = await this.providers.dataProvider(viewRange, resolution);
            if (rowData) {
                this.providedResolution = rowData.resolution;
                this.providedRange = rowData.range;
                this.setRowModel(rowData.rows);
                this.removeChildren();
                this.addRows(this.rows, this.rowController.rowHeight);
                if (this.isNavigating) {
                    this.selectStateInNavigation();
                }
            }
            this.fetching = false;
        }
    }

    protected updateScaleAndPosition() {
        if (this.rows) {
            this.rows.forEach((row: TimelineChart.TimeGraphRowModel) => {
                const comp = this.rowComponents.get(row);
                if (comp) {
                    const opts: TimeGraphRect = {
                        height: this.rowController.rowHeight,
                        position: {
                            x: this.getPixels(row.range.start - this.unitController.viewRange.start),
                            y: comp.position.y
                        },
                        width: this.getPixels(row.range.end) - this.getPixels(row.range.start)
                    }
                    comp.update(opts);
                }
                row.states.forEach((rowElementModel: TimelineChart.TimeGraphRowElementModel, elementIndex: number) => {
                    const el = this.rowElementComponents.get(rowElementModel);
                    if (el) {
                        const start = rowElementModel.range.start;
                        const end = rowElementModel.range.end;
                        const opts: TimeGraphStyledRect = {
                            height: el.height,
                            position: {
                                x: this.getPixels(start - this.unitController.viewRange.start),
                                y: el.position.y
                            },
                            // min width of a state should never be less than 1 (for visibility)
                            width: Math.max(1, this.getPixels(end) - this.getPixels(start)),
                            displayWidth: this.getPixels(Math.min(this.unitController.viewRange.end, end)) - this.getPixels(Math.max(this.unitController.viewRange.start, start))
                        }
                        el.update(opts);
                    }
                });
            });
        }
    }

    protected handleSelectedRowElementChange() {
        this.selectedElementChangedHandler.forEach(handler => handler(this.selectedElementModel));
    }

    protected addRow(row: TimelineChart.TimeGraphRowModel, height: number, rowIndex: number) {
        const rowId = 'row_' + rowIndex;
        const rowStyle = this.providers.rowStyleProvider ? this.providers.rowStyleProvider(row) : undefined;
        const rowComponent = new TimeGraphRow(rowId, {
            position: {
                x: this.getPixels(row.range.start),
                y: (height * rowIndex)
            },
            width: this.getPixels(row.range.end) - this.getPixels(row.range.start),
            height
        }, rowIndex, row, rowStyle);
        rowComponent.displayObject.interactive = true;
        rowComponent.displayObject.on('click', ((e: PIXI.InteractionEvent) => {
            this.selectRow(row);
        }).bind(this));
        this.addChild(rowComponent);
        this.rowComponents.set(row, rowComponent);
        if (this.rowController.selectedRow && this.rowController.selectedRow.id === row.id) {
            this.selectRow(row);
        }
        row.states.forEach((rowElementModel: TimelineChart.TimeGraphRowElementModel) => {
            const el = this.createNewRowElement(rowElementModel, rowComponent);
            if (el) {
                this.addElementInteractions(el);
                this.addChild(el);
                if (this.selectedElementModel && this.rowController.selectedRow
                    && this.rowController.selectedRow.id === row.id
                    && this.selectedElementModel.range.start === el.model.range.start
                    && this.selectedElementModel.range.end === el.model.range.end) {
                    this.selectRowElement(el.model);
                }
            }
        });
    }

    protected createNewRowElement(rowElementModel: TimelineChart.TimeGraphRowElementModel, rowComponent: TimeGraphRow): TimeGraphRowElement | undefined {
        const start = this.getPixels(rowElementModel.range.start - this.unitController.viewRange.start);
        const end = this.getPixels(rowElementModel.range.end - this.unitController.viewRange.start);
        let el: TimeGraphRowElement | undefined;
        const range: TimelineChart.TimeGraphRange = {
            start,
            end
        };
        const displayStart = this.getPixels(Math.max(rowElementModel.range.start, this.unitController.viewRange.start));
        const displayEnd = this.getPixels(Math.min(rowElementModel.range.end, this.unitController.viewRange.end));
        const displayWidth = displayEnd - displayStart;
        const elementStyle = this.providers.rowElementStyleProvider ? this.providers.rowElementStyleProvider(rowElementModel) : undefined;
        el = new TimeGraphRowElement(rowElementModel.id, rowElementModel, range, rowComponent, elementStyle, displayWidth);
        this.rowElementComponents.set(rowElementModel, el);
        return el;
    }

    protected addElementInteractions(el: TimeGraphRowElement) {
        el.displayObject.interactive = true;
        el.displayObject.on('click', ((e: PIXI.InteractionEvent) => {
            this.selectRowElement(el.model);
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.click) {
                this.rowElementMouseInteractions.click(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseover', ((e: PIXI.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mouseover) {
                this.rowElementMouseInteractions.mouseover(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseout', ((e: PIXI.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mouseout) {
                this.rowElementMouseInteractions.mouseout(el, e);
            }
        }).bind(this));
        el.displayObject.on('mousedown', ((e: PIXI.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mousedown) {
                this.rowElementMouseInteractions.mousedown(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseup', ((e: PIXI.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mouseup) {
                this.rowElementMouseInteractions.mouseup(el, e);
            }
        }).bind(this));
    }

    protected addRows(rows: TimelineChart.TimeGraphRowModel[], height: number) {
        if (!this.stateController) {
            throw ('Add this TimeGraphChart to a container before adding rows.');
        }
        this.rowComponents = new Map();
        this.rowElementComponents = new Map();
        this.rowController.rowHeight = height;
        rows.forEach((row: TimelineChart.TimeGraphRowModel, index: number) => {
            this.addRow(row, height, index);
        });
    }

    protected setRowModel(rows: TimelineChart.TimeGraphRowModel[]) {
        this.rows = rows;
    }

    protected updateElementStyle(model: TimelineChart.TimeGraphRowElementModel) {
        const style = this.providers.rowElementStyleProvider && this.providers.rowElementStyleProvider(model);
        const component = this.rowElementComponents.get(model);
        component && style && (component.style = style);
    }

    protected updateRowStyle(model: TimelineChart.TimeGraphRowModel) {
        const style = this.providers.rowStyleProvider && this.providers.rowStyleProvider(model);
        const component = this.rowComponents.get(model);
        component && style && (component.style = style);
    }

    registerRowElementMouseInteractions(interactions: TimeGraphRowElementMouseInteractions) {
        this.rowElementMouseInteractions = interactions;
    }

    onSelectedRowElementChanged(handler: (el: TimelineChart.TimeGraphRowElementModel | undefined) => void) {
        this.selectedElementChangedHandler.push(handler);
    }

    getRowModels(): TimelineChart.TimeGraphRowModel[] {
        return this.rows;
    }

    getElementById(id: string): TimeGraphRowElement | undefined {
        const element: TimeGraphComponent | undefined = this.children.find((child) => {
            return child.id === id;
        });
        return element as TimeGraphRowElement;
    }

    selectRow(row: TimelineChart.TimeGraphRowModel) {
        if (this.rowController.selectedRow) {
            delete this.rowController.selectedRow.selected;
            this.updateRowStyle(this.rowController.selectedRow);
        }
        this.rowController.selectedRow = row;
        row.selected = true;
        this.updateRowStyle(row);
    }

    getSelectedRowElement(): TimelineChart.TimeGraphRowElementModel {
        return this.selectedElementModel;
    }

    selectRowElement(model: TimelineChart.TimeGraphRowElementModel | undefined) {
        if (this.selectedElementModel) {
            delete this.selectedElementModel.selected;
            this.updateElementStyle(this.selectedElementModel);
        }
        if (model) {
            const el = this.getElementById(model.id);
            if (el) {
                const row = el.row;
                if (row) {
                    this.selectedElementModel = el.model;
                    el.model.selected = true;
                    this.updateElementStyle(this.selectedElementModel);
                    this.selectRow(row.model);
                }
            }
        }
        this.handleSelectedRowElementChange();
    }

    setNavigationFlag(flag: boolean) {
        this.isNavigating = flag;
    }

    protected selectStateInNavigation() {
        const row = this.rowController.selectedRow;
        if (row && this.unitController.selectionRange) {
            const cursorPosition = this.unitController.selectionRange.end;
            const rowElement = row.states.find((rowElementModel: TimelineChart.TimeGraphRowElementModel) => rowElementModel.range.start === cursorPosition || rowElementModel.range.end === cursorPosition);
            this.selectRowElement(rowElement);
        }
        this.setNavigationFlag(false);
    }
}
