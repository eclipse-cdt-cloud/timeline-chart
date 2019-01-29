import { TimeGraphComponent, TimeGraphElementPosition, TimeGraphRect, TimeGraphParentComponent } from "./time-graph-component";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphRowElement } from "./time-graph-row-element";

export interface TimeGraphRowStyle {
    backgroundColor?: number
    backgroundOpacity?: number
    lineThickness?: number
    lineColor?: number
    lineOpacity?: number
}

export class TimeGraphRow extends TimeGraphComponent implements TimeGraphParentComponent{

    protected rowElements: TimeGraphRowElement[] = [];

    constructor(
        id: string,
        protected _options: TimeGraphRect,
        protected _rowIndex: number,
        public readonly model: TimelineChart.TimeGraphRowModel,
        protected style: TimeGraphRowStyle = {lineOpacity:0.5, lineThickness: 1, backgroundOpacity: 0}) {
        super(id);
    }

    get rowIndex(): number {
        return this._rowIndex;
    }

    render() {
        this.rect({
            color: this.style.backgroundColor,
            opacity: this.style.backgroundOpacity,
            height: this._options.height,
            width: this._options.width,
            position: this._options.position
        });
        this.hline({
            color: this.style.lineColor || 0xeeeeee,
            opacity: this.style.lineOpacity || 0.5,
            thickness: this.style.lineThickness || 1,
            width: this._options.width,
            position: {
                x: this._options.position.x,
                y: this._options.position.y + (this._options.height/2)
            }
        });
    }

    

    get position(): TimeGraphElementPosition {
        return this._options.position;
    }

    get height(): number {
        return this._options.height;
    }

    // Gets called by TimeGraphLayer. Don't call it unless you know what you are doing.
    addChild(rowElement: TimeGraphRowElement){
        this.rowElements.push(rowElement);
        this._displayObject.addChild(rowElement.displayObject);
    }
}