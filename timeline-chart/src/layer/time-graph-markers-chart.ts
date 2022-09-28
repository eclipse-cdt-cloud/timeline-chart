import { TimeGraphComponent } from "../components/time-graph-component";
import { TimeGraphMarkerState } from "../components/time-graph-marker";
import { TimeGraphRow } from "../components/time-graph-row";
import { TimelineChart } from "../time-graph-model";
import { TimeGraphRowController } from "../time-graph-row-controller";
import { TimeGraphChart, TimeGraphChartProviders } from "./time-graph-chart";

/**
 * Extension of the time-graph-chart, modified to hold logic for the markers layer.
 * @param id string
 * @param providers TimeGraphChartProviders
 * @param rowController TimeGraphRowController
 */
export class TimeGraphMarkersChart extends TimeGraphChart {

    private _selectedMarker?: TimelineChart.TimeGraphMarkerState;
    private _selectedRow?: TimeGraphRow;

    constructor(id: string, protected providers: TimeGraphChartProviders, protected rowController: TimeGraphRowController) {
        super(id, providers, rowController);
        
        this.registerMouseInteractions({
            click: el => this.setSelectedMarker(el)
        });
    }

    protected createNewState = (markerModel: TimelineChart.TimeGraphMarkerState, rowComponent: TimeGraphRow): TimeGraphMarkerState | undefined => {
        const { xStart, xEnd, displayWidth, elementStyle } = this.getNewStateParams(markerModel);
        return new TimeGraphMarkerState(markerModel.id, markerModel, xStart, xEnd, rowComponent, elementStyle, displayWidth);
    }

    setSelectedMarker = (el: TimeGraphComponent<any>) => {
        if (el instanceof TimeGraphMarkerState) {
            if (el.model.range.start !== undefined && el.model.range.end !== undefined) {
                this.selectedMarker = el.model;
                this.selectedRow = el.row;
            }
        }
    }

    onKeydown = (event: KeyboardEvent) => {
        switch (event.key) {
            case ".":
                this.nav('next')
                break;
            case ",":
                this.nav('prev');
                break;
            default:
                break;
        }
    }
    
    afterAddToContainer = () => {
        super.afterAddToContainer();
        this.onCanvasEvent('keydown', this.onKeydown);
    }

    private nav = (direction: 'prev' | 'next') => {
        if (this.selectedRow && this.selectedMarker) {
            let [rowNumber, stateNumber] = this.selectedMarker.id.split("-");
            if (direction === 'next') {
                stateNumber = (parseInt(stateNumber) + 1).toString();
            } else if (direction === 'prev') {
                stateNumber = (parseInt(stateNumber) - 1).toString();
            }
            const newId = rowNumber + '-' + stateNumber.toString();
            const newSelectedState = this.selectedRow.states.get(newId);
            if (newSelectedState) {
                this.setSelectedMarker(newSelectedState);
            }
        }
    }

    set selectedMarker(model: TimelineChart.TimeGraphMarkerState | undefined) {
        this._selectedMarker = model;
        if (this._selectedMarker) {
            this.unitController.selectionRange = this._selectedMarker.range;
        }
    }

    get selectedMarker(): TimelineChart.TimeGraphMarkerState | undefined {
        return this._selectedMarker;
    }

    set selectedRow(row: TimeGraphRow | undefined) {
        this._selectedRow = row;
    }

    get selectedRow(): TimeGraphRow | undefined {
        return this._selectedRow;
    }
}