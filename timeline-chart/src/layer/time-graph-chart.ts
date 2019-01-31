import { TimeGraphRowElement, TimeGraphRowElementStyle } from "../components/time-graph-row-element";
import { TimeGraphRow, TimeGraphRowStyle } from "../components/time-graph-row";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphComponent, TimeGraphRect, TimeGraphStyledRect } from "../components/time-graph-component";
import { TimeGraphChartLayer } from "./time-graph-chart-layer";
import { TimeGraphRowController } from "../time-graph-row-controller";

export interface TimeGraphRowElementMouseInteractions {
    click?: (el: TimeGraphRowElement, ev: PIXI.interaction.InteractionEvent) => void
    mouseover?: (el: TimeGraphRowElement, ev: PIXI.interaction.InteractionEvent) => void
    mouseout?: (el: TimeGraphRowElement, ev: PIXI.interaction.InteractionEvent) => void
    mousedown?: (el: TimeGraphRowElement, ev: PIXI.interaction.InteractionEvent) => void
    mouseup?: (el: TimeGraphRowElement, ev: PIXI.interaction.InteractionEvent) => void
}

export interface TimeGraphChartProviders {
    dataProvider: (range: TimelineChart.TimeGraphRange, resolution: number) => Promise<{ rows: TimelineChart.TimeGraphRowModel[], range: TimelineChart.TimeGraphRange, resolution: number }> | { rows: TimelineChart.TimeGraphRowModel[], range: TimelineChart.TimeGraphRange, resolution: number } | undefined
    rowElementStyleProvider?: (el: TimelineChart.TimeGraphRowElementModel) => TimeGraphRowElementStyle | undefined
    rowStyleProvider?: (row: TimelineChart.TimeGraphRowModel) => TimeGraphRowStyle | undefined
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

    protected shiftKeyDown: boolean;

    constructor(id: string,
        protected providers: TimeGraphChartProviders,
        protected rowController: TimeGraphRowController) {
        super(id, rowController);
        this.providedRange = { start: 0, end: 0 };
        this.providedResolution = 1;
    }

    protected afterAddToContainer() {
        this.shiftKeyDown = false
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            this.shiftKeyDown = event.shiftKey;
        });
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            this.shiftKeyDown = event.shiftKey;
        });
        const mw = (ev: WheelEvent) => {
            if (this.shiftKeyDown) {
                const shiftStep = ev.deltaY;
                let verticalOffset = this.rowController.verticalOffset + shiftStep;
                if (verticalOffset < 0) {
                    verticalOffset = 0;
                }
                if (this.rowController.totalHeight - verticalOffset <= this.stateController.canvasDisplayHeight) {
                    verticalOffset = this.rowController.totalHeight - this.stateController.canvasDisplayHeight;
                }
                this.rowController.verticalOffset = verticalOffset;
            } else {
                let newViewRangeLength = this.unitController.viewRangeLength;
                let xOffset = 0;
                let moveX = false;
                if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) {
                    xOffset = -(ev.deltaX / this.stateController.zoomFactor);
                    moveX = true;
                } else {
                    const zoomPosition = (ev.offsetX / this.stateController.zoomFactor);
                    const deltaLength = (ev.deltaY / this.stateController.zoomFactor);
                    newViewRangeLength += deltaLength;
                    xOffset = ((zoomPosition / this.unitController.viewRangeLength) * deltaLength);
                }
                let start = this.unitController.viewRange.start - xOffset;
                if (start < 0) {
                    start = 0;
                }
                let end = start + newViewRangeLength;
                if (end > this.unitController.absoluteRange) {
                    end = this.unitController.absoluteRange;
                    if (moveX) {
                        start = end - newViewRangeLength;
                    }
                }
                this.unitController.viewRange = {
                    start,
                    end
                }
            }
            ev.preventDefault();
        }
        this.onCanvasEvent('mousewheel', mw);
        this.onCanvasEvent('wheel', mw);

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

    update() {
        this.updateScaleAndPosition();
    }

    protected async maybeFetchNewData() {
        const resolution = this.unitController.viewRangeLength / this.stateController.canvasDisplayWidth;
        const viewRange = this.unitController.viewRange;
        if (viewRange && (
            viewRange.start < this.providedRange.start ||
            viewRange.end > this.providedRange.end ||
            resolution < this.providedResolution
        )) {
            this.fetching = true;
            const rowData = await this.providers.dataProvider(viewRange, resolution);
            if (rowData) {
                this.providedResolution = rowData.resolution;
                this.providedRange = rowData.range;
                this.setRowModel(rowData.rows);
                this.removeChildren();
                this.addRows(this.rows, this.rowController.rowHeight);
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
                        width: this.getPixels(row.range.end - row.range.start)
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
                            width: this.getPixels(end - start)
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
        const length = row.range.end - row.range.start;
        const rowStyle = this.providers.rowStyleProvider ? this.providers.rowStyleProvider(row) : undefined;
        const rowComponent = new TimeGraphRow(rowId, {
            position: {
                x: this.getPixels(row.range.start),
                y: (height * rowIndex)
            },
            width: this.getPixels(length),
            height
        }, rowIndex, row, rowStyle);
        rowComponent.displayObject.interactive = true;
        rowComponent.displayObject.on('click', ((e: PIXI.interaction.InteractionEvent) => {
            this.selectRow(row);
        }).bind(this));
        this.addChild(rowComponent);
        this.rowComponents.set(row, rowComponent);
        row.states.forEach((rowElementModel: TimelineChart.TimeGraphRowElementModel, elementIndex: number) => {
            const start = this.getPixels(rowElementModel.range.start);
            const end = this.getPixels(rowElementModel.range.end);
            const range: TimelineChart.TimeGraphRange = {
                start,
                end
            };
            const elementStyle = this.providers.rowElementStyleProvider ? this.providers.rowElementStyleProvider(rowElementModel) : undefined;
            const el = new TimeGraphRowElement(rowElementModel.id, rowElementModel, range, rowComponent, elementStyle);
            this.rowElementComponents.set(rowElementModel, el);
            el.model.selected && (this.selectedElementModel = el.model);
            this.addElementInteractions(el);
            this.addChild(el);
        });
    }

    protected addElementInteractions(el: TimeGraphRowElement) {
        el.displayObject.interactive = true;
        el.displayObject.on('click', ((e: PIXI.interaction.InteractionEvent) => {
            this.selectRowElement(el.model);
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.click) {
                this.rowElementMouseInteractions.click(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseover', ((e: PIXI.interaction.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mouseover) {
                this.rowElementMouseInteractions.mouseover(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseout', ((e: PIXI.interaction.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mouseout) {
                this.rowElementMouseInteractions.mouseout(el, e);
            }
        }).bind(this));
        el.displayObject.on('mousedown', ((e: PIXI.interaction.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mousedown) {
                this.rowElementMouseInteractions.mousedown(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseup', ((e: PIXI.interaction.InteractionEvent) => {
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
        const style = this.providers.rowElementStyleProvider && this.providers.rowElementStyleProvider(this.selectedElementModel);
        const component = this.rowElementComponents.get(model);
        component && style && (component.style = style);
    }

    registerRowElementMouseInteractions(interactions: TimeGraphRowElementMouseInteractions) {
        this.rowElementMouseInteractions = interactions;
    }

    onSelectedRowElementChanged(handler: (el: TimelineChart.TimeGraphRowElementModel) => void) {
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
        }
        this.rowController.selectedRow = row;
        row.selected = true;
    }

    getSelectedRowElement(): TimelineChart.TimeGraphRowElementModel {
        return this.selectedElementModel;
    }

    selectRowElement(model: TimelineChart.TimeGraphRowElementModel) {
        if (this.selectedElementModel) {
            delete this.selectedElementModel.selected;
            this.updateElementStyle(this.selectedElementModel);
        }
        this.selectedElementModel = model;
        model.selected = true;
        this.updateElementStyle(this.selectedElementModel);
        const el = this.getElementById(model.id);
        if (el) {
            this.selectRow(el.row.model);
        }
        this.handleSelectedRowElementChange();
    }
}