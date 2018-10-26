import { TimeGraphRow, TimeGraphRowView } from "./time-graph-row-view";
import { TimeAxis } from "./time-axis";
import { TimeGraphStateController } from "./time-graph-state-controller";

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

export interface TimeGraphContext {
    id: string
    width: number
    height: number
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

    protected getNewContext(config: TimeGraphContext): CanvasRenderingContext2D | undefined {
        if (this.container) {
            const canvas: HTMLCanvasElement = document.createElement('canvas');
            canvas.width = config.width;
            canvas.height = config.height;
            canvas.id = config.id;
            canvas.className = 'time-graph-canvas';
            this.container.appendChild(canvas);
            return canvas.getContext('2d') || undefined;
        }
    }

    render() {
        // TODO does this belong to the example (index.ts)??
        this.timeGraphEntries.forEach(timeGraphEntry => {
            const timeGraphStateController = new TimeGraphStateController();
            const w = timeGraphEntry.range.endTime;
            const timeAxisContext = this.getNewContext({
                id: 'timeAxis_' + timeGraphEntry.id,
                height: 30,
                width: w
            });
            if (timeAxisContext) {
                const timeAxis = new TimeAxis('timeAxis_' + timeGraphEntry.id);
                timeGraphStateController.addComponent(timeAxis);
                // TODO components should be added automatically...maybe by injecting the controller in component and there we add it???
                // Or - better - the component instance gets created in the controller. And then...World domination! HA HA HAAA
                // the context should be created there, if a component should have its own context (Flag: ownContext: boolean)
                timeAxis.context = timeAxisContext;
                timeAxis.render();
            }
            const timeGraphRowsContext = this.getNewContext({
                id: 'timeGraphRows_' + timeGraphEntry.id,
                width: w,
                height: 200
            });
            timeGraphEntry.rows.forEach((row: TimeGraphRow, idx: number) => {
                const timeGraphRow = new TimeGraphRowView(timeGraphEntry.id + 'row' + idx, idx, row, timeGraphEntry.range);
                timeGraphStateController.addComponent(timeGraphRow); // TODO components should be added automatically...maybe by injecting the controller in component and there we add it???
                if (timeGraphRowsContext) {
                    timeGraphRow.context = timeGraphRowsContext;
                    timeGraphRow.render();
                }
            });
        })
    }

    setEntry(timeGraphEntry: TimeGraphEntry) {
        this.timeGraphEntries.set(timeGraphEntry.id, timeGraphEntry);
    }
}