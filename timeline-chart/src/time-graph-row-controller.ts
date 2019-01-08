import { TimeGraphRowModel } from "./time-graph-model";

export class TimeGraphRowController {
    private _selectedRow: TimeGraphRowModel;
    private _verticalOffset: number;
    protected selectedRowChangedHandlers: ((row: TimeGraphRowModel) => void)[] = [];
    protected verticalOffsetChangedHandlers: ((verticalOffset: number) => void)[] = [];

    constructor(public rowHeight: number, public totalHeight: number) {
        this._verticalOffset = 0;
    }

    protected handleVerticalOffsetChanged(){
        this.verticalOffsetChangedHandlers.forEach(h=>h(this._verticalOffset));
    }

    protected handleSelectedRowChanged(){
        this.selectedRowChangedHandlers.forEach(h=>h(this._selectedRow));
    }

    onSelectedRowChangedHandler(handler: (row: TimeGraphRowModel) => void) {
        this.selectedRowChangedHandlers.push(handler);
    }

    onVerticalOffsetChangedHandler(handler: (verticalOffset: number) => void) {
        this.verticalOffsetChangedHandlers.push(handler);
    }

    get verticalOffset(): number {
        return this._verticalOffset;
    }
    set verticalOffset(value: number) {
        this._verticalOffset = value;
        this.handleVerticalOffsetChanged();
    }

    get selectedRow(): TimeGraphRowModel {
        return this._selectedRow;
    }
    set selectedRow(value: TimeGraphRowModel) {
        this._selectedRow = value;
        this.handleSelectedRowChanged();
    }
}