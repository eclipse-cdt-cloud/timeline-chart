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

        /**
         * Array of markers
         */
        annotations: TimeGraphAnnotation[];
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
      * Time graph state
      */
    export interface TimeGraphAnnotation {
        /**
         * Start time of the state
         */
        startTime: number;

        duration: number;

        /**
         * Label to apply to the state
         */
        label: string | null;
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
    protected absoluteStart: bigint;
    protected totalLength: bigint;
    protected timeGraphEntries: object[];
    protected timeGraphRows: object[];
    protected canvasDisplayWidth: number;

    constructor(canvasDisplayWidth: number) {
        this.timeGraphEntries = timeGraphEntries.model.entries;
        this.timeGraphRows = timeGraphStates.model.rows;
        this.totalLength = BigInt(0);

        this.canvasDisplayWidth = canvasDisplayWidth;

        this.timeGraphEntries.forEach((entry: TestData.TimeGraphEntry, rowIndex: number) => {
            const row = timeGraphStates.model.rows.find(row => row.entryID === entry.id);
            if (!this.absoluteStart) {
                this.absoluteStart = BigInt(entry.startTime);
            } else if (BigInt(entry.startTime) < this.absoluteStart) {
                this.absoluteStart = BigInt(entry.startTime);
            }
            if (row) {
                row.states.forEach((state: TestData.TimeGraphState, stateIndex: number) => {
                    if (state.value > 0) {
                        const end = BigInt(state.startTime + state.duration - entry.startTime);
                        this.totalLength = end > this.totalLength ? end : this.totalLength;
                    }
                });
            }
        })
    }

    getRowIds(): number[] {
        const rowIds: number[] = [];
        timeGraphEntries.model.entries.forEach(entry => {
            rowIds.push(entry.id);
        });
        // Add XY plot row IDs
        rowIds.push(-100, -101);
        return rowIds;
    }

    getData(opts: { range?: TimelineChart.TimeGraphRange, resolution?: number }): TimelineChart.TimeGraphModel {
        const rows: TimelineChart.TimeGraphRowModel[] = [];
        const range = opts.range || { start: BigInt(0), end: this.totalLength };
        const resolution = opts.resolution || Number(this.totalLength) / this.canvasDisplayWidth;
        const commonRow = timeGraphStates.model.rows.find(row => row.entryId === -1);
        const _rangeEvents = commonRow?.annotations;
        const rangeEvents: TimelineChart.TimeGraphAnnotation[] = [];
        const startTime = BigInt(1332170682440133097);
        _rangeEvents?.forEach((annotation: any, annotationIndex: number) => {
            const start = BigInt(annotation.range.start) - startTime;
            if (range.start < start && range.end > start) {
                rangeEvents.push({
                    id: annotation.id,
                    category: annotation.category,
                    range: {
                        start: BigInt(annotation.range.start) - this.absoluteStart,
                        end: BigInt(annotation.range.end) - this.absoluteStart
                    },
                    label: annotation.label,
                    data: annotation.data
                });
            }
        });

        timeGraphEntries.model.entries.forEach((entry: any, rowIndex: number): void => {
            const states: TimelineChart.TimeGraphState[] = [];
            const annotations: TimelineChart.TimeGraphAnnotation[] = [];
            const row = timeGraphStates.model.rows.find(row => row.entryID === entry.id);
            let hasStates = false;
            let prevPossibleState = BigInt(0);
            let nextPossibleState = this.totalLength;
            if (row) {
                hasStates = !!row.states.length;
                row.states.forEach((state: any, stateIndex: number) => {
                    if (state.value > 0 && state.duration * (1 / resolution) > 1) {
                        const start = BigInt(state.startTime - entry.startTime);
                        const end = BigInt(state.startTime + state.duration - entry.startTime);
                        if (end > range.start && start < range.end) {
                            states.push({
                                id: 'el_' + rowIndex + '_' + stateIndex,
                                label: state.label,
                                range: { start, end },
                                data: { value: state.value, style: {}}
                            });
                        }
                    }
                    if (stateIndex === 0) {
                        prevPossibleState = BigInt(state.startTime - entry.startTime);
                    }
                    if (stateIndex === row.states.length - 1) {
                        nextPossibleState = BigInt(state.startTime + state.duration - entry.startTime);
                    }
                });

                const _annotations = row.annotations;
                if (!!_annotations) {
                    _annotations.forEach((annotation: any, annotationIndex: number) => {
                        const start = BigInt(annotation.range.start - entry.startTime);
                        if (range.start < start && range.end > start) {
                            annotations.push({
                                id: annotation.id,
                                category: annotation.category,
                                range: {
                                    start: BigInt(annotation.range.start) - this.absoluteStart,
                                    end: BigInt(annotation.range.end) - this.absoluteStart
                                },
                                label: annotation.label,
                                data: annotation.data
                            });
                        }
                    });
                }

            }
            rows.push({
                id: entry.id,
                name: entry.name[0],
                range: {
                    start: BigInt(0),
                    end: BigInt(entry.endTime - entry.startTime)
                },
                states,
                annotations,
                data: {
                    type: entry.type,
                    hasStates
                },
                prevPossibleState,
                nextPossibleState
            });
        });
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
        });

        // Generate XY plot rows with fixed-time EKG-style data
        const xyRows: TimelineChart.TimeGraphRowModel[] = [
            this.createXYRow(-100, 'Heart Rate (EKG)', range, (t) => this.ekgWaveform(t)),
            this.createXYRow(-101, 'Respiration (EKG)', range, (t) => this.ekgWaveform(t * 0.4 + 0.1))
        ];
        rows.push(...xyRows);

        return {
            id: "",
            arrows,
            rows,
            rangeEvents,
            totalLength: this.totalLength
        };
    }

    private createXYRow(id: number, name: string, range: TimelineChart.TimeGraphRange, fn: (t: number) => number): TimelineChart.TimeGraphRowModel {
        // Generate points with fixed time positions spanning the full trace.
        // Only emit points that fall within the requested range (with small buffer).
        const totalLen = Number(this.totalLength);
        const rangeStart = Number(range.start);
        const rangeEnd = Number(range.end);
        const rangeLen = rangeEnd - rangeStart;

        // Use enough points to get ~1 point per 2 pixels at current resolution
        const numPoints = Math.max(200, Math.min(2000, Math.round(rangeLen / (totalLen / 2000))));
        const step = rangeLen / (numPoints - 1);

        const points: TimelineChart.TimeGraphXYPoint[] = [];
        for (let i = 0; i < numPoints; i++) {
            const timeNum = rangeStart + i * step;
            const t = timeNum / totalLen; // normalized position in full trace
            const time = BigInt(Math.round(timeNum));
            points.push({ time, value: Math.max(0, Math.min(1, fn(t))) });
        }
        return {
            id,
            name,
            range: { start: range.start, end: range.end },
            states: [],
            annotations: [],
            xySeries: [{ id: `xy_${id}`, label: name, color: id === -100 ? 0x22cc44 : 0x44aaff, points }],
            prevPossibleState: range.start,
            nextPossibleState: range.end
        };
    }

    /** EKG-style waveform: flat baseline with periodic sharp QRS-like spikes */
    private ekgWaveform(t: number): number {
        // Repeat every cycle; ~20 beats across the full trace
        const cycles = 20;
        const phase = (t * cycles) % 1;

        // P wave (small bump)
        if (phase > 0.1 && phase < 0.2) {
            const p = (phase - 0.1) / 0.1;
            return 0.5 + 0.08 * Math.sin(p * Math.PI);
        }
        // QRS complex (sharp spike)
        if (phase > 0.25 && phase < 0.45) {
            const q = (phase - 0.25) / 0.2;
            if (q < 0.2) return 0.5 - 0.1 * (q / 0.2); // Q dip
            if (q < 0.5) return 0.5 - 0.1 + 0.9 * ((q - 0.2) / 0.3); // R spike up
            if (q < 0.7) return 0.5 + 0.8 - 1.0 * ((q - 0.5) / 0.2); // R spike down
            return 0.5 - 0.2 + 0.2 * ((q - 0.7) / 0.3); // S recovery
        }
        // T wave (broad bump)
        if (phase > 0.55 && phase < 0.75) {
            const tw = (phase - 0.55) / 0.2;
            return 0.5 + 0.12 * Math.sin(tw * Math.PI);
        }
        // Baseline
        return 0.5;
    }
}
