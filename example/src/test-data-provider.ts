import { timeGraphEntries } from "./test-entries";
import { timeGraphStates } from "./test-states";
import { timeGraphArrows } from "./test-arrows";
import { TimelineChart } from "timeline-chart/lib/time-graph-model";

export namespace TestData {
    /**
     * Basic entry interface
     */
    export interface Entry {
        /**
         * Unique Id for the entry
         */
        id: number;

        /**
         * Parent entry Id, or -1 if the entry does not have a parent
         */
        parentId: number;

        /**
         * Array of string that represant the content of each column
         */
        name: string[];
    }

    /**
     * Entry in a time graph
     */
    export interface TimeGraphEntry extends Entry {
        /**
         * Start time of the entry
         */
        startTime: number;

        /**
         * End time of the entry
         */
        endTime: number;

        /**
         * Indicate if the entry will have row data
         */
        hasRowModel: boolean;
    }

    /**
     * Time Graph model that will be returned by the server
     */
    export interface TimeGraphModel {
        rows: TimeGraphRow[];
    }

    /**
     * Time graph row described by an array of states for a specific entry
     */
    export interface TimeGraphRow {
        /**
         * Entry Id associated to the state array
         */
        entryId: number;

        /**
         * Array of states
         */
        states: TimeGraphState[];
    }

    /**
     * Time graph state
     */
    export interface TimeGraphState {
        /**
         * Start time of the state
         */
        startTime: number;

        duration: number;

        /**
         * Label to apply to the state
         */
        label: string | null;

        /**
         * Values associated to the state
         */
        value: number;

    }

    /**
     * Arrow for time graph
     */
    export interface TimeGraphArrow {
        /**
         * Source entry Id for the arrow
         */
        sourceId: number;

        /**
         * Destination entry Id for the arrow
         */
        destinationId: number;

        /**
         * Start time of the arrow
         */
        startTime: number;

        /**
         * Duration of the arrow
         */
        duration: number;

        /**
         * Value associated to the arrow
         */
        value: number;

        /**
         * Optional information on the style to format this arrow
         */
        style: string;
    }


}

export class TestDataProvider {
    protected absoluteStart: number;
    protected totalLength: number;
    protected timeGraphEntries: object[];
    protected timeGraphRows: object[];
    protected canvasDisplayWidth: number;

    constructor(canvasDisplayWidth: number) {
        this.timeGraphEntries = timeGraphEntries.model.entries;
        this.timeGraphRows = timeGraphStates.model.rows;
        this.totalLength = 0;

        this.canvasDisplayWidth = canvasDisplayWidth;

        this.timeGraphEntries.forEach((entry: TestData.TimeGraphEntry, rowIndex: number) => {
            const row = timeGraphStates.model.rows.find(row => row.entryID === entry.id);
            if (!this.absoluteStart) {
                this.absoluteStart = entry.startTime;
            } else if (entry.startTime < this.absoluteStart) {
                this.absoluteStart = entry.startTime;
            }
            if (row) {
                row.states.forEach((state: TestData.TimeGraphState, stateIndex: number) => {
                    if (state.value > 0) {
                        const end = state.startTime + state.duration - entry.startTime;
                        this.totalLength = end > this.totalLength ? end : this.totalLength;
                    }
                });
            }
        })
    }

    getData(opts: { range?: TimelineChart.TimeGraphRange, resolution?: number }): TimelineChart.TimeGraphModel {
        const rows: TimelineChart.TimeGraphRowModel[] = [];
        const range = opts.range || { start: 0, end: this.totalLength };
        const resolution = opts.resolution || this.totalLength / this.canvasDisplayWidth;
        timeGraphEntries.model.entries.forEach((entry: any, rowIndex: number) => {
            const states: TimelineChart.TimeGraphRowElementModel[] = [];
            const row = timeGraphStates.model.rows.find(row => row.entryID === entry.id);
            let hasStates = false;
            if (row) {
                hasStates = !!row.states.length;
                row.states.forEach((state: any, stateIndex: number) => {
                    if (state.value > 0 && state.duration * (1 / resolution) > 1) {
                        const start = state.startTime - entry.startTime;
                        const end = state.startTime + state.duration - entry.startTime;
                        if (end > range.start && start < range.end) {
                            states.push({
                                id: 'el_' + rowIndex + '_' + stateIndex,
                                label: state.label,
                                range: { start, end },
                                data: { value: state.value, timeRange: { startTime: state.startTime, endTime: (state.startTime + state.duration) } }
                            });
                        }
                    }
                });
            }
            rows.push({
                id: entry.id,
                name: entry.name[0],
                range: {
                    start: 0,
                    end: entry.endTime - entry.startTime
                },
                states,
                data: {
                    type: entry.type,
                    hasStates
                }
            });
        })
        let arrows: TimelineChart.TimeGraphArrow[] = [];
        timeGraphArrows.forEach(arrow => {
            arrows.push({
                sourceId: arrow.sourceId,
                destinationId: arrow.destinationId,
                range: {
                    start: arrow.range.start - this.absoluteStart,
                    end: arrow.range.end - this.absoluteStart
                }
            });
        })

        return {
            id: "",
            arrows,
            rows,
            totalLength: this.totalLength
        }
    }
}