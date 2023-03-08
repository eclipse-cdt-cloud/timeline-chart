import { TimelineChart } from "../../time-graph-model";
import { TestData } from "./utils";

export class TimeGraphPerformanceTestDataStubJsonImp implements TestData.TimeGraphPerformanceTestDataStub {
    data: TestData.TimeGraphPerformanceTestDataModel[];
    index: number; // Increment once a request is done
    currentModel: TestData.TimeGraphPerformanceTestDataModel;

    constructor(data: TestData.TimeGraphPerformanceTestDataModel[]) {
        this.data = data;
        this.index = 0;
        this.currentModel = this.data[this.index];
    }

    toNextStub(): void {
        if (this.index + 1 < this.data.length) {
            this.index++;
            this.currentModel = this.data[this.index];
        }
    }

    getEntries(): TestData.TimeGraphEntry[] {
        return this.currentModel.timeGraphEntries.model.entries;
    }

    getRows(): TestData.TimeGraphRow[] {
        return this.currentModel.timeGraphStates.model.rows;
    }

    getIds(): number[] {
        return this.currentModel.timeGraphRowIds.ids;
    } 
}

export class TestDataProvider {
    public absoluteStart: bigint;
    public totalLength: bigint;
    protected timeGraphEntries: TestData.TimeGraphEntry[];
    protected timeGraphRows: TestData.TimeGraphRow[];
    protected canvasDisplayWidth: number;
    private dataStub: TestData.TimeGraphPerformanceTestDataStub;

    constructor(canvasDisplayWidth: number, dataStub: TestData.TimeGraphPerformanceTestDataStub) {
        this.canvasDisplayWidth = canvasDisplayWidth;
        this.dataStub = dataStub;

        this.timeGraphEntries = dataStub.getEntries();
        this.timeGraphRows = dataStub.getRows();
        this.totalLength = BigInt(0);

        this.timeGraphEntries.forEach((entry: TestData.TimeGraphEntry, rowIndex: number) => {
            // @ts-ignore
            const row = dataStub.getRows().find(row => row.entryId === entry.id);
            if (!this.absoluteStart) {
                this.absoluteStart = BigInt(entry.start);
            } else if (BigInt(entry.start) < this.absoluteStart) {
                this.absoluteStart = BigInt(entry.start);
            }

            // Calculate the total length
            if (row) {
                // @ts-ignore
                row.states.forEach((state: TestDataNew.TimeGraphState, stateIndex: number) => {
                    const end = BigInt(state.end - entry.start);
                    this.totalLength = end > this.totalLength ? end : this.totalLength;
                });
            }
        })
    }

    getRowIds(): number[] {
        const rowIds: number[] = [];
        this.dataStub.getEntries().forEach(entry => {
            rowIds.push(entry.id);
        });
        return rowIds;
    }

    fetchTimeGraphData(opts: { range?: TimelineChart.TimeGraphRange, resolution?: number }): TimelineChart.TimeGraphModel {
        const rows: TimelineChart.TimeGraphRowModel[] = [];
        const rangeEvents: TimelineChart.TimeGraphAnnotation[] = [];

        const chartStart = this.absoluteStart;
        const rowIds = this.dataStub.getIds();
        const orderedRows = this.timeGraphRowsOrdering(rowIds);

        this.dataStub.getEntries().forEach((entry: any, rowIndex: number): void => {
            let gapStyle;
            if (!entry.style) {
                gapStyle = this.getDefaultForGapStyle();
            } else {
                gapStyle = entry.style;
            }

            const states: TimelineChart.TimeGraphState[] = [];
            const annotations: TimelineChart.TimeGraphAnnotation[] = [];
            const row = orderedRows.find(row => row.entryId === entry.id);
            let prevPossibleState = entry.start;
            let nextPossibleState = entry.end;
            if (row) {
                row.states.forEach((state: any, stateIndex: number) => {
                    const end = BigInt(state.end) - chartStart;
                    states.push({
                        id: row.entryId + '-' + stateIndex,
                        label: state.label,
                        range: {
                            start: BigInt(state.start) - chartStart,
                            end
                        },
                        data: {
                            style: state.style
                        }
                    });
                    if (stateIndex === 0) {
                        prevPossibleState = BigInt(state.start) - chartStart;
                    }
                    if (stateIndex === row.states.length - 1) {
                        nextPossibleState = BigInt(state.end) - chartStart;
                    }
                });

                if (states.length > 0) {
                    rows.push({
                        id: entry.id,
                        name: entry.labels[0],
                        range: {
                            start: BigInt(entry.start) - chartStart,
                            end: BigInt(entry.end) - chartStart
                        },
                        states,
                        annotations,
                        data: {
                            type: entry.type
                        },
                        prevPossibleState,
                        nextPossibleState,
                        gapStyle
                    });
                }
            }
        });

        // No tests with arrows for now
        let arrows: TimelineChart.TimeGraphArrow[] = [];

        return {
            id: "",
            arrows,
            rows,
            rangeEvents,
            totalLength: this.totalLength
        };
    }

    private timeGraphRowsOrdering(orderedIds: number[]): TestData.TimeGraphRow[] {
        const newTimeGraphRows: TestData.TimeGraphRow[] = [];

        orderedIds.forEach(id => {
            
            // @ts-ignore
            const timeGraphRow = this.dataStub.getRows().find(row => row.entryId === id);
            
            if (timeGraphRow) {
                const newRow = timeGraphRow as TestData.TimeGraphRow;
                newTimeGraphRows.push(newRow);
            } else {
                const emptyRow: TestData.TimeGraphRow = { states: [{ start: 0, end: 0, label: '' }], entryId: id, annotations: [] };
                newTimeGraphRows.push(emptyRow);
            }
        });

        return newTimeGraphRows;
    }

    private getDefaultForGapStyle() {
        // Default color and height for the GAP state
        return {
            parentKey: '',
            values: {
                'background-color': '#CACACA',
                height: 1.0
            }
        };
    }

    toNextDataSet(): void {
        this.dataStub.toNextStub();
    }
}
