import { TimeGraphRowElement, TimeGraphRowElementStyle } from "../components/time-graph-row-element";
import { TimeGraphRow, TimeGraphRowStyle } from "../components/time-graph-row";
import { TimeGraphRowModel, TimeGraphRowElementModel, TimeGraphRange } from "../time-graph-model";
import { TimeGraphComponent } from "../components/time-graph-component";
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
    dataProvider: (range: TimeGraphRange, resolution: number) => { rows: TimeGraphRowModel[], range: TimeGraphRange, resolution: number } | undefined
    rowElementStyleProvider?: (el: TimeGraphRowElementModel) => TimeGraphRowElementStyle | undefined
    rowStyleProvider?: (row: TimeGraphRowModel) => TimeGraphRowStyle | undefined
}

export type TimeGraphRowStyleHook = (row: TimeGraphRowModel) => TimeGraphRowStyle | undefined;

export class TimeGraphChart extends TimeGraphChartLayer {

    protected rows: TimeGraphRowModel[];
    protected rowElementMouseInteractions: TimeGraphRowElementMouseInteractions;
    protected selectedElementModel: TimeGraphRowElementModel;
    protected selectedElementChangedHandler: ((el: TimeGraphRowElementModel) => void)[] = [];

    protected providedRange: TimeGraphRange;
    protected providedResolution: number;

    protected fetching: boolean;

    constructor(id: string,
        protected providers: TimeGraphChartProviders,
        protected rowController: TimeGraphRowController,
        protected viewRange?: TimeGraphRange) {
        super(id, rowController);
        this.providedRange = { start: 0, end: 0 };
        this.providedResolution = 1;
    }

    protected afterAddToContainer() {
        this.onCanvasEvent('mousewheel', (ev: WheelEvent) => {
            const shiftStep = ev.deltaY;
            let verticalOffset = this.rowController.verticalOffset + shiftStep;
            if (verticalOffset < 0) {
                verticalOffset = 0;
            }
            if (this.rowController.totalHeight - verticalOffset <= this.stateController.canvasDisplayHeight) {
                verticalOffset = this.rowController.totalHeight - this.stateController.canvasDisplayHeight;
            }
            this.rowController.verticalOffset = verticalOffset;
            ev.preventDefault();
        });

        this.rowController.onVerticalOffsetChangedHandler(verticalOffset => {
            this.layer.position.y = -verticalOffset;
        });

        if (!this.viewRange) {
            this.viewRange = this.unitController.viewRange;
        }
        this.unitController.onViewRangeChanged(() => {
            this.updateScaleAndPosition();
            this.viewRange = this.unitController.viewRange;
            if (!this.fetching) {
                this.maybeFetchNewData();
            }
        });
        this.updateScaleAndPosition();
        this.maybeFetchNewData();
    }

    update() { }

    protected maybeFetchNewData() {
        const resolution = this.unitController.viewRangeLength / this.stateController.canvasDisplayWidth;
        if (this.viewRange && (
            this.viewRange.start < this.providedRange.start ||
            this.viewRange.end > this.providedRange.end ||
            resolution < this.providedResolution
        )) {
            this.fetching = true;
            const rowData = this.providers.dataProvider(this.viewRange, resolution);
            if (rowData) {
                this.providedResolution = rowData.resolution;
                this.providedRange = rowData.range;
                this.setRowModel(rowData.rows);
                this.addRows(this.rows, this.rowController.rowHeight);
            }
            this.fetching = false;
        }
    }

    protected updateScaleAndPosition() {
        this.layer.position.x = -(this.unitController.viewRange.start * this.stateController.zoomFactor);
        this.layer.scale.x = this.stateController.zoomFactor;
    }

    protected handleSelectedRowElementChange() {
        this.selectedElementChangedHandler.forEach(handler => handler(this.selectedElementModel));
    }

    protected addRow(row: TimeGraphRowModel, height: number, rowIndex: number) {
        const rowId = 'row_' + rowIndex;
        const length = row.range.end - row.range.start;
        const rowStyle = this.providers.rowStyleProvider ? this.providers.rowStyleProvider(row) : undefined;
        const rowComponent = new TimeGraphRow(rowId, {
            position: {
                x: row.range.start,
                y: (height * rowIndex)
            },
            width: length,
            height
        }, rowIndex, row, rowStyle);
        rowComponent.displayObject.interactive = true;
        rowComponent.displayObject.on('click', ((e: PIXI.interaction.InteractionEvent) => {
            this.selectRow(row);
        }).bind(this));
        this.addChild(rowComponent);
        row.states.forEach((rowElementModel: TimeGraphRowElementModel, elementIndex: number) => {
            const start = rowElementModel.range.start;
            const end = rowElementModel.range.end;
            const range: TimeGraphRange = {
                start,
                end
            };
            const elementStyle = this.providers.rowElementStyleProvider ? this.providers.rowElementStyleProvider(rowElementModel) : undefined;
            const el = new TimeGraphRowElement(rowElementModel.id, rowElementModel, range, rowComponent, elementStyle);
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

    protected addRows(rows: TimeGraphRowModel[], height: number) {
        if (!this.stateController) {
            throw ('Add this TimeGraphChart to a container before adding rows.');
        }
        this.rowController.rowHeight = height;
        rows.forEach((row: TimeGraphRowModel, index: number) => {
            this.addRow(row, height, index);
        });
    }

    protected setRowModel(rows: TimeGraphRowModel[]) {
        this.rows = rows;
    }

    registerRowElementMouseInteractions(interactions: TimeGraphRowElementMouseInteractions) {
        this.rowElementMouseInteractions = interactions;
    }

    onSelectedRowElementChanged(handler: (el: TimeGraphRowElementModel) => void) {
        this.selectedElementChangedHandler.push(handler);
    }

    getRowModels(): TimeGraphRowModel[] {
        return this.rows;
    }

    getElementById(id: string): TimeGraphRowElement | undefined {
        const element: TimeGraphComponent | undefined = this.children.find((child) => {
            return child.id === id;
        });
        return element as TimeGraphRowElement;
    }

    selectRow(row: TimeGraphRowModel) {
        if (this.rowController.selectedRow) {
            delete this.rowController.selectedRow.selected;
        }
        this.rowController.selectedRow = row;
        row.selected = true;
    }

    getSelectedRowElement(): TimeGraphRowElementModel {
        return this.selectedElementModel;
    }

    selectRowElement(model: TimeGraphRowElementModel) {
        if (this.selectedElementModel) {
            delete this.selectedElementModel.selected;
        }
        this.selectedElementModel = model;
        model.selected = true;
        const el = this.getElementById(model.id);
        if (el) {
            this.selectRow(el.row.model);
        }
        this.handleSelectedRowElementChange();
    }
}