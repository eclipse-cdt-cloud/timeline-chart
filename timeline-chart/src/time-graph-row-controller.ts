import { TimeGraphRowModel } from "./time-graph-model";

export class TimeGraphRowController {
    private _selectedRow: TimeGraphRowModel;
    private _verticalOffset: number;
    protected selectedRowChangedHandler: ((row: TimeGraphRowModel) => void)[] = [];
    protected verticalOffsetChangedHandler: ((verticalOffset: number) => void)[] = [];

    constructor(public rowHeight: number, public totalHeight: number) {
        this._verticalOffset = 0;
    }

    protected handleVerticalOffsetChanged(){
        this.verticalOffsetChangedHandler.forEach(h=>h(this._verticalOffset));
    }

    protected handleSelectedRowChanged(){
        this.selectedRowChangedHandler.forEach(h=>h(this._selectedRow));
    }

    onSelectedRowChangedHandler(handler: (row: TimeGraphRowModel) => void) {
        this.selectedRowChangedHandler.push(handler);
    }

    onVerticalOffsetChangedHandler(handler: (verticalOffset: number) => void) {
        this.verticalOffsetChangedHandler.push(handler);
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