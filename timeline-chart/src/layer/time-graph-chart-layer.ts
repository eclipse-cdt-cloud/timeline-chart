import { TimeGraphLayer } from "./time-graph-layer";
import { TimeGraphRowController } from "../time-graph-row-controller";

export abstract class TimeGraphChartLayer extends TimeGraphLayer {

    constructor(id: string, protected rowController: TimeGraphRowController){
        super(id);
    }
    
}