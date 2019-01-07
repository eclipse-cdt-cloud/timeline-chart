import { TimeGraphComponent, TimeGraphElementPosition } from "./time-graph-component";

export interface TimeGraphArrowCoordinates {
    start: TimeGraphElementPosition
    end: TimeGraphElementPosition
}

export class TimeGraphArrowComponent extends TimeGraphComponent {

    constructor(id: string, protected coords: TimeGraphArrowCoordinates) {
        super(id);
    }

    render(): void {
        const { start, end } = this.coords;
        this._displayObject.lineStyle(1, 0x000000);
        this._displayObject.moveTo(start.x, start.y);
        this._displayObject.lineTo(end.x, end.y);
    }
}

export class TimeGraphArrowHead extends TimeGraphComponent {

    constructor(id: string, protected coords: TimeGraphArrowCoordinates) {
        super(id);
    }

    render(): void {
        const { end, start } = this.coords;
        this._displayObject.beginFill(0x000000);
        this._displayObject.drawPolygon([
            end.x, end.y,
            end.x - 10, end.y - 4,
            end.x - 10, end.y + 4,
            end.x, end.y
        ]);
        this._displayObject.endFill();
        this._displayObject.position.x = end.x;
        this._displayObject.position.y = end.y;
        this._displayObject.pivot = new PIXI.Point(end.x, end.y);

        this._displayObject.rotation = Math.atan2(end.y - start.y, end.x - start.x);
    }
}