import * as PIXI from "pixi.js-legacy";

import { TimeGraphChartLayer } from "./time-graph-chart-layer";
import { TimeGraphRowController } from "../time-graph-row-controller";
import { TimeGraphChart } from "./time-graph-chart";
import { TimelineChart } from "../time-graph-model";
import { BIMath } from "../bigint-utils";
import { RenderEvents } from "../time-graph-render-controller";

export class TimeGraphChartRichCursor extends TimeGraphChartLayer {
    private graphics: PIXI.Graphics;
    private tooltipContainer: PIXI.Container;
    private _mouseMoveHandler: (event: Event) => void;
    private _pointerLeaveHandler: (event: Event) => void;
    private lastMouseX: number = -1;
    private isMouseInCanvas: boolean = false;
    private tooltipPool: { bg: PIXI.Graphics, text: PIXI.Text }[] = [];
    private tooltipPoolIndex: number = 0;
    private placedTooltips: { x: number, y: number, w: number, h: number }[] = [];

    constructor(id: string, protected chartLayer: TimeGraphChart, protected rowController: TimeGraphRowController,
        private style?: { lineColor?: number, dotColor?: number }) {
        super(id, rowController);
        this.isScalable = false;
    }

    // Draw in screen coordinates — don't shift/scale with viewport
    protected shiftStage = () => {};

    protected afterAddToContainer() {
        this.graphics = new PIXI.Graphics();
        this.graphics.eventMode = 'none';
        this.tooltipContainer = new PIXI.Container();
        this.tooltipContainer.eventMode = 'none';
        this.layer.addChild(this.graphics);
        this.layer.addChild(this.tooltipContainer);

        this._mouseMoveHandler = (event: Event) => {
            const e = event as MouseEvent;
            if (e.buttons !== 0) {
                this.graphics.clear();
                this.removeTooltips();
                this.isMouseInCanvas = false;
                return;
            }
            this.lastMouseX = e.offsetX;
            this.isMouseInCanvas = true;
            this.drawCursor(e.offsetX);
        };

        this.onCanvasEvent('pointermove', this._mouseMoveHandler);
        this._pointerLeaveHandler = () => {
            this.graphics.clear();
            this.removeTooltips();
            this.isMouseInCanvas = false;
        };
        this.onCanvasEvent('pointerleave', this._pointerLeaveHandler);
    }

    private drawCursor(mouseX: number) {
        const lineColor = this.style?.lineColor ?? 0x888888;
        const dotColor = this.style?.dotColor ?? 0xffffff;
        const height = this.stateController.canvasDisplayHeight;
        const rowHeight = this.rowController.rowHeight;

        this.graphics.clear();
        this.removeTooltips();
        RenderEvents.startRender();

        // Vertical line
        this.graphics.lineStyle(1, lineColor, 0.7);
        this.graphics.moveTo(mouseX, 0);
        this.graphics.lineTo(mouseX, height);

        // Get states at cursor timestamp
        const timestamp = this.unitController.viewRange.start + BIMath.round(mouseX / this.stateController.zoomFactor);
        const hits = this.chartLayer.getStatesAtTimestamp(timestamp);

        // Draw a dot and tooltip on each row that has a state
        this.graphics.lineStyle(0);
        hits.forEach(hit => {
            const rowComponent = this.chartLayer.getRowComponent(hit.row.id);
            if (!rowComponent) return;

            const y = rowComponent.position.y - this.rowController.verticalOffset;
            if (y + rowHeight < 0 || y > height) return;

            const centerY = y + rowHeight / 2;
            this.graphics.beginFill(dotColor, 1);
            this.graphics.drawCircle(mouseX, centerY, 4);
            this.graphics.endFill();

            // Draw tooltip box
            const label = hit.state.label || hit.row.name;
            if (label) {
                this.drawTooltip(mouseX, centerY, label);
            }
        });

        // Draw XY value indicators on rows with xySeries
        const rowComponents = this.chartLayer.getRowComponents();
        rowComponents.forEach((rowComponent) => {
            const model: TimelineChart.TimeGraphRowModel | undefined = rowComponent.model;
            if (!model?.xySeries?.length) return;

            const y = rowComponent.position.y - this.rowController.verticalOffset;
            if (y + rowHeight < 0 || y > height) return;

            const padding = 2;
            const drawHeight = rowHeight - padding * 2;

            model.xySeries.forEach((series: TimelineChart.TimeGraphXYSeries) => {
                const value = this.interpolateXY(series.points, timestamp);
                if (value === undefined) return;

                const dotY = y + padding + drawHeight * (1 - value);
                const color = series.color ?? 0x0000ff;

                this.graphics.beginFill(color, 1);
                this.graphics.drawCircle(mouseX, dotY, 4);
                this.graphics.endFill();
                this.graphics.lineStyle(1, 0xffffff, 0.8);
                this.graphics.drawCircle(mouseX, dotY, 4);
                this.graphics.lineStyle(0);

                const label = `${series.label ?? 'XY'}: ${value.toFixed(2)}`;
                this.drawTooltip(mouseX, dotY, label);
            });
        });
    }

    /** Linearly interpolate the XY series value at the given timestamp */
    private interpolateXY(points: TimelineChart.TimeGraphXYPoint[], timestamp: bigint): number | undefined {
        if (points.length === 0) return undefined;
        if (timestamp <= points[0].time) return points[0].value;
        if (timestamp >= points[points.length - 1].time) return points[points.length - 1].value;

        // Binary search for the bracketing interval
        let lo = 0, hi = points.length - 1;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (points[mid].time <= timestamp) lo = mid;
            else hi = mid;
        }
        const p0 = points[lo], p1 = points[hi];
        const dt = Number(p1.time - p0.time);
        if (dt === 0) return p0.value;
        const t = Number(timestamp - p0.time) / dt;
        return p0.value + t * (p1.value - p0.value);
    }

    private removeTooltips() {
        for (let i = 0; i < this.tooltipPool.length; i++) {
            this.tooltipPool[i].bg.visible = false;
            this.tooltipPool[i].text.visible = false;
        }
        this.tooltipPoolIndex = 0;
        this.placedTooltips.length = 0;
    }

    private getTooltipPair(): { bg: PIXI.Graphics, text: PIXI.Text } {
        if (this.tooltipPoolIndex < this.tooltipPool.length) {
            return this.tooltipPool[this.tooltipPoolIndex++];
        }
        const bg = new PIXI.Graphics();
        const text = new PIXI.Text('', { fontSize: 11, fill: 0xffffff, fontFamily: 'Verdana' });
        this.tooltipContainer.addChild(bg);
        this.tooltipContainer.addChild(text);
        const pair = { bg, text };
        this.tooltipPool.push(pair);
        this.tooltipPoolIndex++;
        return pair;
    }

    private drawTooltip(x: number, y: number, label: string) {
        const padding = 4;
        const offsetX = 8;
        const canvasWidth = this.stateController.canvasDisplayWidth;
        const canvasHeight = this.stateController.canvasDisplayHeight;

        const { bg, text: textObj } = this.getTooltipPair();
        textObj.text = label;
        textObj.visible = true;

        const boxWidth = textObj.width + padding * 2;
        const boxHeight = textObj.height + padding * 2;

        // Position tooltip to the right of cursor, flip if near edge
        let boxX = x + offsetX;
        if (boxX + boxWidth > canvasWidth) {
            boxX = x - offsetX - boxWidth;
        }
        let boxY = y - boxHeight / 2;
        if (boxY < 0) {
            boxY = 0;
        } else if (boxY + boxHeight > canvasHeight) {
            boxY = canvasHeight - boxHeight;
        }

        // Nudge down to avoid overlapping previously placed tooltips
        for (const placed of this.placedTooltips) {
            if (boxX < placed.x + placed.w && boxX + boxWidth > placed.x &&
                boxY < placed.y + placed.h && boxY + boxHeight > placed.y) {
                boxY = placed.y + placed.h + 1;
            }
        }
        if (boxY + boxHeight > canvasHeight) {
            boxY = canvasHeight - boxHeight;
        }

        this.placedTooltips.push({ x: boxX, y: boxY, w: boxWidth, h: boxHeight });

        bg.clear();
        bg.beginFill(0x333333, 0.9);
        bg.drawRoundedRect(boxX, boxY, boxWidth, boxHeight, 3);
        bg.endFill();
        bg.visible = true;

        textObj.x = boxX + padding;
        textObj.y = boxY + padding;
    }

    update() {
        if (this.isMouseInCanvas && this.lastMouseX >= 0) {
            this.graphics.clear();
            this.removeTooltips();
            this.drawCursor(this.lastMouseX);
        }
    }

    destroy() {
        if (this._mouseMoveHandler) {
            this.removeOnCanvasEvent('pointermove', this._mouseMoveHandler);
        }
        if (this._pointerLeaveHandler) {
            this.removeOnCanvasEvent('pointerleave', this._pointerLeaveHandler);
        }
        super.destroy();
    }
}
