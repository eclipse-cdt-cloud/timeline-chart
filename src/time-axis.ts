import { TimeGraphContextOptions, TimeGraphContainer } from "./time-graph";

export class TimeAxis {

    protected application: PIXI.Application;

    constructor(config: TimeGraphContextOptions) {
            const canvas: HTMLCanvasElement = document.createElement('canvas');
            canvas.width = config.width;
            canvas.height = config.height;
            canvas.id = config.id;
            canvas.className = 'time-graph-canvas';
            this.application = new PIXI.Application({
                width: config.width,
                height: config.height,
                view: canvas,
                backgroundColor: config.backgroundColor || 0x000000
            });
            
    }

    getViewElement(): HTMLCanvasElement {
        return this.application.view;
    }

    getStage(): TimeGraphContainer {
        return this.application.stage;
    }


}