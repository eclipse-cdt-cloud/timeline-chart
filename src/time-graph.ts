import { TimeGraphRow, TimeGraphRowView } from "./time-graph-row-view";

export interface TimeGraphRange {
    startTime: number
    endTime: number
}

export interface TimeGraphEntry {
    id: string
    name: string
    range: TimeGraphRange
    rows: TimeGraphRow[]
}

export class TimeGraph {

    protected container?: HTMLElement;

    protected timeGraphEntries: Map<string, TimeGraphEntry> = new Map();

    constructor(id: string) {
        this.container = document.getElementById(id) || undefined;
        if (!this.container) {
            throw (`No container with id ${id} available.`);
        }
    }

    protected getNewContext(id: string): CanvasRenderingContext2D | undefined {
        if (this.container) {
            const canvas: HTMLCanvasElement = document.createElement('canvas');
            canvas.width = 6000;
            canvas.height = 200;
            canvas.id = id;
            canvas.className = 'time-graph-canvas';
            this.container.appendChild(canvas);
            return canvas.getContext('2d') || undefined;
        }
    }

    protected render() {
        this.timeGraphEntries.forEach(timeGraphEntry => {
            const timeGraphRowsContext = this.getNewContext('timeGraphRows_' + timeGraphEntry.id);
            timeGraphEntry.rows.forEach((row: TimeGraphRow, idx: number) => {
                const timeGraphRow = new TimeGraphRowView(idx, row, timeGraphEntry.range);
                if (timeGraphRowsContext) {
                    timeGraphRow.setContext(timeGraphRowsContext);
                    timeGraphRow.render();
                }
            });
        })
    }

    setEntry(timeGraphEntry: TimeGraphEntry) {
        this.timeGraphEntries.set(timeGraphEntry.id, timeGraphEntry);
        this.render();
    }
}