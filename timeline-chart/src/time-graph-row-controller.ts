import { TimelineChart } from "./time-graph-model";

export class TimeGraphRowController {
    private _selectedRow: TimelineChart.TimeGraphRowModel;
    private _verticalOffset: number;
    protected selectedRowChangedHandlers: ((row: TimelineChart.TimeGraphRowModel) => void)[] = [];
    protected verticalOffsetChangedHandlers: ((verticalOffset: number) => void)[] = [];
    protected totalHeightChangedHandlers: ((totalHeight: number) => void)[] = [];

    constructor(public rowHeight: number, private _totalHeight: number) {
        this._verticalOffset = 0;
    }

    protected handleVerticalOffsetChanged(){
        this.verticalOffsetChangedHandlers.forEach(h=>h(this._verticalOffset));
    }

    protected handleSelectedRowChanged(){
        this.selectedRowChangedHandlers.forEach(h=>h(this._selectedRow));
    }

    protected handleTotalHeightChanged(){
        this.totalHeightChangedHandlers.forEach(h=>h(this._totalHeight));
    }

    onSelectedRowChangedHandler(handler: (row: TimelineChart.TimeGraphRowModel) => void) {
        this.selectedRowChangedHandlers.push(handler);
    }

    removeSelectedRowChangedHandler(handler: (row: TimelineChart.TimeGraphRowModel) => void) {
        const index = this.selectedRowChangedHandlers.indexOf(handler);
        if (index > -1) {
            this.selectedRowChangedHandlers.splice(index, 1);
        }
    }

    onVerticalOffsetChangedHandler(handler: (verticalOffset: number) => void) {
        this.verticalOffsetChangedHandlers.push(handler);
    }

    removeVerticalOffsetChangedHandler(handler: (verticalOffset: number) => void) {
        const index = this.verticalOffsetChangedHandlers.indexOf(handler);
        if (index > -1) {
            this.verticalOffsetChangedHandlers.splice(index, 1);
        }
    }

    onTotalHeightChangedHandler(handler: (totalHeight: number) =>  void) {
        this.totalHeightChangedHandlers.push(handler);
    }

    removeTotalHeightChangedHandler(handler: (totalHeight: number) =>  void) {
        const index = this.totalHeightChangedHandlers.indexOf(handler);
        if (index > -1) {
            this.totalHeightChangedHandlers.splice(index, 1);
        }
    }

    get totalHeight(): number {
        return this._totalHeight;
    }

    set totalHeight(height: number) {
        this._totalHeight = height;
        this.handleTotalHeightChanged();
    }

    get verticalOffset(): number {
        return this._verticalOffset;
    }
    set verticalOffset(value: number) {
        this._verticalOffset = value;
        this.handleVerticalOffsetChanged();
    }

    get selectedRow(): TimelineChart.TimeGraphRowModel {
        return this._selectedRow;
    }
    set selectedRow(value: TimelineChart.TimeGraphRowModel) {
        this._selectedRow = value;
        this.handleSelectedRowChanged();
    }
}