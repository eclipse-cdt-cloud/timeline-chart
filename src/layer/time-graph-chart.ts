import { TimeGraphRowElement, TimeGraphRowElementStyle } from "../components/time-graph-row-element";
import { TimeGraphRow } from "../components/time-graph-row";
import { TimeGraphRowModel, TimeGraphRowElementModel } from "../time-graph-model";
import { TimeGraphLayer } from "./time-graph-layer";
import { TimeGraphComponent } from "../components/time-graph-component";

export interface TimeGraphRowElementMouseInteractions {
    click?: (el: TimeGraphRowElement, ev: PIXI.interaction.InteractionEvent) => void
    mouseover?: (el: TimeGraphRowElement, ev: PIXI.interaction.InteractionEvent) => void
    mouseout?: (el: TimeGraphRowElement, ev: PIXI.interaction.InteractionEvent) => void
    mousedown?: (el: TimeGraphRowElement, ev: PIXI.interaction.InteractionEvent) => void
    mouseup?: (el: TimeGraphRowElement, ev: PIXI.interaction.InteractionEvent) => void
}

export class TimeGraphChart extends TimeGraphLayer {

    protected rows: TimeGraphRowModel[];
    protected rowHeight: number;
    protected rowElementStyleHook: (el: TimeGraphRowElementModel) => TimeGraphRowElementStyle | undefined;
    protected rowElementMouseInteractions: TimeGraphRowElementMouseInteractions;
    protected selectedElement: TimeGraphRowElement;
    protected selectedElementChangedHandler: ((el:TimeGraphRowElement)=>void)[];
    protected selectedRow: TimeGraphRow;
    protected selectedRowChangedHandler: ((el:TimeGraphRow)=>void)[];

    protected init() {
        this.unitController.onViewRangeChanged(() => {
            this.update();
        });
        this.selectedElementChangedHandler = [];
        this.selectedRowChangedHandler = [];
    }

    registerRowElementStyleHook(styleHook: (el: TimeGraphRowElementModel) => TimeGraphRowElementStyle | undefined) {
        this.rowElementStyleHook = styleHook;
    }

    registerRowElementMouseInteractions(interactions: TimeGraphRowElementMouseInteractions) {
        this.rowElementMouseInteractions = interactions;
    }

    onSelectedRowElementChanged(handler:(el:TimeGraphRowElement)=>void){
        this.selectedElementChangedHandler.push(handler);
    }

    onSelectedRowChanged(handler:(row:TimeGraphRow)=>void){
        this.selectedRowChangedHandler.push(handler);
    }

    getRowModels(): TimeGraphRowModel[] {
        return this.rows;
    }

    protected handleSelectedRowElementChange(){
        this.selectedElementChangedHandler.forEach(handler => handler(this.selectedElement));
    }

    protected handleSelectedRowChange(){
        this.selectedRowChangedHandler.forEach(handler => handler(this.selectedRow));
    }

    protected addRow(row: TimeGraphRowModel, height: number, rowIndex: number) {
        const rowId = 'row' +  rowIndex;
        const range = row.range.end - row.range.start;
        const relativeStartPosition = row.range.start - this.unitController.viewRange.start;
        const rowComponent = new TimeGraphRow(rowId, {
            position: {
                x: relativeStartPosition * this.stateController.zoomFactor,
                y: (height * this.rows.length) + (height / 2)
            },
            width: range * this.stateController.zoomFactor
        }, rowIndex);
        this.addChild(rowComponent);
        this.rows.push(row);

        row.states.forEach((rowElement: TimeGraphRowElementModel, elementIndex: number) => {
            const relativeElementStartPosition = rowElement.range.start - this.unitController.viewRange.start;
            const relativeElementEndPosition = rowElement.range.end - this.unitController.viewRange.start;
            const start = (relativeElementStartPosition * this.stateController.zoomFactor) + this.stateController.positionOffset.x;
            const end = (relativeElementEndPosition * this.stateController.zoomFactor) + this.stateController.positionOffset.x;
            if (start < this.canvas.width && end > 0) {
                const newRowElement: TimeGraphRowElementModel = {
                    label: rowElement.label,
                    range: {
                        start,
                        end
                    },
                    data: rowElement.data
                }
                const style = this.rowElementStyleHook ? this.rowElementStyleHook(newRowElement) : undefined;
                const el = new TimeGraphRowElement('el_' +  rowIndex + '_' + elementIndex, newRowElement, rowComponent, style);
                this.addElementInteractions(el);
                this.addChild(el);
            }
        });
    }

    getElementByIndices(rowIdx: number, elIdx: number):TimeGraphRowElement | undefined {
        const element: TimeGraphComponent | undefined = this.children.find((child)=>{
            const id = 'el_' + rowIdx + '_' + elIdx;
            return child.id === id;
        });
        return element as TimeGraphRowElement;
    }

    selectRowElement(el: TimeGraphRowElement){
        this.selectedElement = el;
        this.selectRow(el.row);
        this.handleSelectedRowElementChange();
    }

    protected selectRow(row: TimeGraphRow){
        this.selectedRow = row;
        this.handleSelectedRowChange();
    }

    protected addElementInteractions(el: TimeGraphRowElement) {
        el.displayObject.interactive = true;
        el.displayObject.on('click', ((e: PIXI.interaction.InteractionEvent) => {
            this.selectRowElement(el);
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.click) {
                this.rowElementMouseInteractions.click(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseover', ((e: PIXI.interaction.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mouseover) {
                this.rowElementMouseInteractions.mouseover(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseout', ((e: PIXI.interaction.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mouseout) {
                this.rowElementMouseInteractions.mouseout(el, e);
            }
        }).bind(this));
        el.displayObject.on('mousedown', ((e: PIXI.interaction.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mousedown) {
                this.rowElementMouseInteractions.mousedown(el, e);
            }
        }).bind(this));
        el.displayObject.on('mouseup', ((e: PIXI.interaction.InteractionEvent) => {
            if (this.rowElementMouseInteractions && this.rowElementMouseInteractions.mouseup) {
                this.rowElementMouseInteractions.mouseup(el, e);
            }
        }).bind(this));
    }

    addRows(rows: TimeGraphRowModel[], height: number) {
        if (!this.stateController) {
            throw ('Add this TimeGraphChart to a container before adding rows.');
        }
        this.rowHeight = height;
        this.rows = [];
        rows.forEach((row:TimeGraphRowModel, index: number) => {
            this.addRow(row, height, index);
        })
    }

    protected update() {
        if (this.rows && this.rowHeight) {
            this.removeChildren();
            this.addRows(this.rows, this.rowHeight);
        }
    }

}