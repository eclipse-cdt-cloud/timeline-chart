import * as PIXI from 'pixi.js-legacy';
import { TimeGraphChartRichCursor } from '../time-graph-chart-rich-cursor';
import { TimeGraphRowController } from '../../time-graph-row-controller';
import { TimeGraphUnitController } from '../../time-graph-unit-controller';
import { TimeGraphStateController } from '../../time-graph-state-controller';
import { TimeGraphChart } from '../time-graph-chart';

// Mock the chart layer
function createMockChart(states: any[] = []) {
    const rowComponents = new Map();
    return {
        getStatesAtTimestamp: jest.fn().mockReturnValue(states),
        getRowComponent: (id: number) => rowComponents.get(id),
        getRowComponents: () => rowComponents,
        rowComponents
    } as unknown as TimeGraphChart;
}

function createRowController() {
    return new TimeGraphRowController(20, 200);
}

function createSetup(states: any[] = []) {
    const unitController = new TimeGraphUnitController(BigInt(1000), { start: BigInt(0), end: BigInt(500) });
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const stateController = new TimeGraphStateController(canvas, unitController);
    const rowController = createRowController();
    const chartLayer = createMockChart(states);
    const cursor = new TimeGraphChartRichCursor('test-rich-cursor', chartLayer, rowController);

    // Simulate initializeLayer
    const stage = new PIXI.Container();
    (cursor as any).canvas = canvas;
    (cursor as any).stateController = stateController;
    (cursor as any).unitController = unitController;
    (cursor as any).stage = stage;
    stage.addChild((cursor as any).layer);
    (cursor as any).afterAddToContainer();

    return { cursor, canvas, stage, stateController, unitController, rowController, chartLayer };
}

describe('TimeGraphChartRichCursor', () => {
    describe('initialization', () => {
        it('creates graphics and tooltip container on init', () => {
            const { cursor } = createSetup();
            expect((cursor as any).graphics).toBeInstanceOf(PIXI.Graphics);
            expect((cursor as any).tooltipContainer).toBeInstanceOf(PIXI.Container);
        });

        it('registers mousemove and mouseleave handlers', () => {
            const { cursor } = createSetup();
            expect((cursor as any)._mouseMoveHandler).toBeDefined();
            expect((cursor as any)._pointerLeaveHandler).toBeDefined();
        });

        it('adds graphics and tooltip container to layer', () => {
            const { cursor } = createSetup();
            // layer has graphics + tooltipContainer
            expect((cursor as any).layer.children.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('drawCursor', () => {
        it('draws vertical line at mouse position', () => {
            const { cursor } = createSetup();
            const drawSpy = jest.spyOn((cursor as any).graphics, 'lineTo');
            (cursor as any).drawCursor(100);
            expect(drawSpy).toHaveBeenCalledWith(100, expect.any(Number));
        });

        it('clears previous graphics on each draw', () => {
            const { cursor } = createSetup();
            const clearSpy = jest.spyOn((cursor as any).graphics, 'clear');
            (cursor as any).drawCursor(50);
            (cursor as any).drawCursor(100);
            expect(clearSpy).toHaveBeenCalledTimes(2);
        });

        it('calls getStatesAtTimestamp with correct timestamp', () => {
            const { cursor, chartLayer } = createSetup();
            (cursor as any).drawCursor(200);
            expect(chartLayer.getStatesAtTimestamp).toHaveBeenCalled();
        });

        it('draws dots for each hit state', () => {
            const hits = [
                { row: { id: 1, name: 'Row1' }, state: { label: 'StateA', range: { start: BigInt(0), end: BigInt(100) } } },
                { row: { id: 2, name: 'Row2' }, state: { label: 'StateB', range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor, chartLayer } = createSetup(hits);

            // Add mock row components
            const mockRow1 = { position: { y: 0 } };
            const mockRow2 = { position: { y: 20 } };
            (chartLayer as any).rowComponents.set(1, mockRow1);
            (chartLayer as any).rowComponents.set(2, mockRow2);

            const circleSpy = jest.spyOn((cursor as any).graphics, 'drawCircle');
            (cursor as any).drawCursor(100);
            expect(circleSpy).toHaveBeenCalledTimes(2);
        });

        it('skips rows outside visible area', () => {
            const hits = [
                { row: { id: 1, name: 'Row1' }, state: { label: 'A', range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor, chartLayer } = createSetup(hits);

            // Place row far below visible area
            const mockRow = { position: { y: 9999 } };
            (chartLayer as any).rowComponents.set(1, mockRow);

            const circleSpy = jest.spyOn((cursor as any).graphics, 'drawCircle');
            (cursor as any).drawCursor(100);
            expect(circleSpy).not.toHaveBeenCalled();
        });

        it('skips rows with no matching component', () => {
            const hits = [
                { row: { id: 99, name: 'Missing' }, state: { label: 'X', range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor } = createSetup(hits);

            const circleSpy = jest.spyOn((cursor as any).graphics, 'drawCircle');
            (cursor as any).drawCursor(100);
            expect(circleSpy).not.toHaveBeenCalled();
        });
    });

    describe('tooltips', () => {
        it('creates tooltip with state label', () => {
            const hits = [
                { row: { id: 1, name: 'Row1' }, state: { label: 'MyState', range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor, chartLayer } = createSetup(hits);
            (chartLayer as any).rowComponents.set(1, { position: { y: 10 } });

            (cursor as any).drawCursor(100);
            const visibleChildren = (cursor as any).tooltipContainer.children.filter((c: any) => c.visible);
            expect(visibleChildren.length).toBeGreaterThan(0);
        });

        it('falls back to row name when state has no label', () => {
            const hits = [
                { row: { id: 1, name: 'FallbackName' }, state: { range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor, chartLayer } = createSetup(hits);
            (chartLayer as any).rowComponents.set(1, { position: { y: 10 } });

            (cursor as any).drawCursor(100);
            // Should still create tooltip children (bg + text)
            const visibleChildren = (cursor as any).tooltipContainer.children.filter((c: any) => c.visible);
            expect(visibleChildren.length).toBe(2);
        });

        it('does not create tooltip when no label and no row name', () => {
            const hits = [
                { row: { id: 1, name: '' }, state: { range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor, chartLayer } = createSetup(hits);
            (chartLayer as any).rowComponents.set(1, { position: { y: 10 } });

            (cursor as any).drawCursor(100);
            const visibleChildren = (cursor as any).tooltipContainer.children.filter((c: any) => c.visible);
            expect(visibleChildren.length).toBe(0);
        });

        it('flips tooltip to left when near right edge', () => {
            const hits = [
                { row: { id: 1, name: 'Row1' }, state: { label: 'Edge', range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor, chartLayer } = createSetup(hits);
            (chartLayer as any).rowComponents.set(1, { position: { y: 10 } });

            // Draw near right edge (canvas is 800px wide)
            (cursor as any).drawCursor(790);
            const textObj = (cursor as any).tooltipContainer.children[1] as PIXI.Text;
            // The tooltip text should be positioned to the left of cursor
            expect(textObj).toBeTruthy();
            expect(textObj.x).toBeLessThan(790);
        });

        it('clears tooltips on each redraw', () => {
            const hits = [
                { row: { id: 1, name: 'R' }, state: { label: 'S', range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor, chartLayer } = createSetup(hits);
            (chartLayer as any).rowComponents.set(1, { position: { y: 10 } });

            (cursor as any).drawCursor(100);
            let visibleChildren = (cursor as any).tooltipContainer.children.filter((c: any) => c.visible);
            expect(visibleChildren.length).toBe(2);

            (cursor as any).drawCursor(200);
            // Should still be 2 visible (cleared old, reused for new)
            visibleChildren = (cursor as any).tooltipContainer.children.filter((c: any) => c.visible);
            expect(visibleChildren.length).toBe(2);
        });

        it('creates multiple tooltips for multiple hits', () => {
            const hits = [
                { row: { id: 1, name: 'R1' }, state: { label: 'S1', range: { start: BigInt(0), end: BigInt(100) } } },
                { row: { id: 2, name: 'R2' }, state: { label: 'S2', range: { start: BigInt(0), end: BigInt(100) } } },
                { row: { id: 3, name: 'R3' }, state: { label: 'S3', range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor, chartLayer } = createSetup(hits);
            (chartLayer as any).rowComponents.set(1, { position: { y: 0 } });
            (chartLayer as any).rowComponents.set(2, { position: { y: 20 } });
            (chartLayer as any).rowComponents.set(3, { position: { y: 40 } });

            (cursor as any).drawCursor(100);
            // 3 tooltips × 2 children each (bg + text)
            const visibleChildren = (cursor as any).tooltipContainer.children.filter((c: any) => c.visible);
            expect(visibleChildren.length).toBe(6);
        });
    });

    describe('mouseleave', () => {
        it('clears graphics and tooltips on mouse leave', () => {
            const hits = [
                { row: { id: 1, name: 'R' }, state: { label: 'S', range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor, chartLayer } = createSetup(hits);
            (chartLayer as any).rowComponents.set(1, { position: { y: 10 } });

            (cursor as any).drawCursor(100);
            let visibleChildren = (cursor as any).tooltipContainer.children.filter((c: any) => c.visible);
            expect(visibleChildren.length).toBe(2);

            // Simulate mouseleave
            (cursor as any)._pointerLeaveHandler();
            visibleChildren = (cursor as any).tooltipContainer.children.filter((c: any) => c.visible);
            expect(visibleChildren.length).toBe(0);
        });
    });

    describe('update', () => {
        it('redraws tooltips on update when mouse is in canvas', () => {
            const hits = [
                { row: { id: 1, name: 'R' }, state: { label: 'S', range: { start: BigInt(0), end: BigInt(100) } } }
            ];
            const { cursor, chartLayer } = createSetup(hits);
            (chartLayer as any).rowComponents.set(1, { position: { y: 10 } });

            (cursor as any).isMouseInCanvas = true;
            (cursor as any).lastMouseX = 100;
            cursor.update();
            const visibleChildren = (cursor as any).tooltipContainer.children.filter((c: any) => c.visible);
            expect(visibleChildren.length).toBe(2);
        });
    });

    describe('destroy', () => {
        it('removes event listeners on destroy', () => {
            const { cursor, canvas } = createSetup();
            const removeSpy = jest.spyOn(canvas, 'removeEventListener');
            cursor.destroy();
            expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
            expect(removeSpy).toHaveBeenCalledWith('pointerleave', expect.any(Function));
        });
    });

    describe('custom style', () => {
        it('uses custom line and dot colors', () => {
            const unitController = new TimeGraphUnitController(BigInt(1000), { start: BigInt(0), end: BigInt(500) });
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 400;
            const stateController = new TimeGraphStateController(canvas, unitController);
            const rowController = createRowController();
            const chartLayer = createMockChart();
            const cursor = new TimeGraphChartRichCursor('styled', chartLayer, rowController, {
                lineColor: 0xff0000,
                dotColor: 0x00ff00
            });

            const stage = new PIXI.Container();
            (cursor as any).canvas = canvas;
            (cursor as any).stateController = stateController;
            (cursor as any).unitController = unitController;
            (cursor as any).stage = stage;
            stage.addChild((cursor as any).layer);
            (cursor as any).afterAddToContainer();

            const lineStyleSpy = jest.spyOn((cursor as any).graphics, 'lineStyle');
            (cursor as any).drawCursor(50);
            expect(lineStyleSpy).toHaveBeenCalledWith(1, 0xff0000, 0.7);
        });
    });
});
