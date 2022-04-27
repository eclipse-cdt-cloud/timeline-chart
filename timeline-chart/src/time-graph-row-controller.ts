import { TimelineChart } from "./time-graph-model";

export class TimeGraphRowController {
    private _selectedRow: TimelineChart.TimeGraphRowModel | undefined = undefined;
    private _selectedRowIndex: number = -1;
    private _verticalOffset: number;
    protected selectedRowChangedHandlers: ((row: TimelineChart.TimeGraphRowModel) => void)[] = [];
    protected verticalOffsetChangedHandlers: ((verticalOffset: number) => void)[] = [];
    protected totalHeightChangedHandlers: ((totalHeight: number) => void)[] = [];

    constructor(public rowHeight: number, private _totalHeight: number) {
        this._verticalOffset = 0;
    }

    protected handleVerticalOffsetChanged() {
        this.verticalOffsetChangedHandlers.forEach(h => h(this._verticalOffset));
    }

    protected handleSelectedRowChanged() {
        const selectedRow = this._selectedRow;
        if (selectedRow) {
            this.selectedRowChangedHandlers.forEach(h => h(selectedRow));
        }
    }

    protected handleTotalHeightChanged(){
        this.totalHeightChangedHandlers.forEach(h=>h(this._totalHeight));
    }

    onSelectedRowChangedHandler(handler: (row: TimelineChart.TimeGraphRowModel) => void) {
        this.selectedRowChangedHandlers.push(handler);
    }

    onVerticalOffsetChangedHandler(handler: (verticalOffset: number) => void) {
        this.verticalOffsetChangedHandlers.push(handler);
    }

    onTotalHeightChangedHandler(handler: (totalHeight: number) =>  void) {
        this.totalHeightChangedHandlers.push(handler);
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

    get selectedRow(): TimelineChart.TimeGraphRowModel | undefined {
        return this._selectedRow;
    }

    set selectedRow(value: TimelineChart.TimeGraphRowModel | undefined) {
        this._selectedRow = value;
        this.handleSelectedRowChanged();
    }

    get selectedRowIndex(): number {
        return this._selectedRowIndex;
    }

    set selectedRowIndex(index: number) {
        this._selectedRowIndex = index;
        this.handleSelectedRowChanged();
    }
}