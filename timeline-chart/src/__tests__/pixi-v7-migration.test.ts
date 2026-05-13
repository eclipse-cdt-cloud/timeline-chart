import * as PIXI from 'pixi.js-legacy';
import { TimeGraphComponent } from '../components/time-graph-component';
import { TimeGraphContainer } from '../time-graph-container';
import { TimeGraphUnitController } from '../time-graph-unit-controller';
import { FontController } from '../time-graph-font-controller';

// Concrete implementation for testing abstract TimeGraphComponent
class TestComponent extends TimeGraphComponent<any> {
    render() {
        this.rect({
            position: { x: 0, y: 0 },
            width: 50,
            height: 20,
            color: 0xff0000,
            opacity: 1
        });
    }
}

describe('Pixi v7 Migration', () => {
    describe('TimeGraphComponent - FederatedPointerEvent', () => {
        let component: TestComponent;

        beforeEach(() => {
            component = new TestComponent('test-comp');
        });

        afterEach(() => {
            component.destroy();
        });

        it('creates a Graphics display object', () => {
            expect(component.displayObject).toBeInstanceOf(PIXI.Graphics);
        });

        it('renders rect without errors', () => {
            expect(() => component.render()).not.toThrow();
        });

        it('addEvent sets interactive on display object', () => {
            const handler = jest.fn();
            const target = new PIXI.Graphics();
            component.addEvent('click', handler, target);
            expect(target.interactive).toBe(true);
        });

        it('addEvent registers event handler via on()', () => {
            const handler = jest.fn();
            const target = new PIXI.Graphics();
            const onSpy = jest.spyOn(target, 'on');
            component.addEvent('mouseover', handler, target);
            expect(onSpy).toHaveBeenCalledWith('mouseover', expect.any(Function));
        });

        it('addEvent handler is callable', () => {
            const handler = jest.fn();
            const target = new PIXI.Graphics();
            component.addEvent('click', handler, target);
            // Simulate event emission
            target.emit('click', { type: 'click' });
            expect(handler).toHaveBeenCalled();
        });

        it('supports all interaction types', () => {
            const types: Array<'mouseover' | 'mouseout' | 'mousemove' | 'mousedown' | 'mouseup' | 'mouseupoutside' | 'rightdown' | 'click'> = [
                'mouseover', 'mouseout', 'mousemove', 'mousedown', 'mouseup', 'mouseupoutside', 'rightdown', 'click'
            ];
            types.forEach(type => {
                const handler = jest.fn();
                const target = new PIXI.Graphics();
                expect(() => component.addEvent(type, handler, target)).not.toThrow();
            });
        });

        it('clear() clears graphics without error', () => {
            component.render();
            expect(() => component.clear()).not.toThrow();
        });

        it('update() re-renders', () => {
            const renderSpy = jest.spyOn(component, 'render');
            component.update();
            expect(renderSpy).toHaveBeenCalled();
        });

        it('getPIXIOpacity returns correct values', () => {
            expect((component as any).getPIXIOpacity(undefined)).toBe(1);
            expect((component as any).getPIXIOpacity(0)).toBe(0.001);
            expect((component as any).getPIXIOpacity(0.5)).toBe(0.5);
            expect((component as any).getPIXIOpacity(1)).toBe(1);
        });
    });

    describe('TimeGraphContainer - v7 Application options', () => {
        it('creates container without transparent option error', () => {
            const unitController = new TimeGraphUnitController(BigInt(1000), { start: BigInt(0), end: BigInt(500) });
            expect(() => {
                const container = new TimeGraphContainer(
                    { id: 'test', width: 200, height: 100, transparent: true },
                    unitController
                );
                container.destroy();
            }).not.toThrow();
        });

        it('creates container with backgroundColor', () => {
            const unitController = new TimeGraphUnitController(BigInt(1000), { start: BigInt(0), end: BigInt(500) });
            expect(() => {
                const container = new TimeGraphContainer(
                    { id: 'test-bg', width: 200, height: 100, backgroundColor: 0x1a1a1a },
                    unitController
                );
                container.destroy();
            }).not.toThrow();
        });

        it('canvas property returns HTMLCanvasElement', () => {
            const unitController = new TimeGraphUnitController(BigInt(1000), { start: BigInt(0), end: BigInt(500) });
            const container = new TimeGraphContainer(
                { id: 'test-canvas', width: 200, height: 100 },
                unitController
            );
            expect(container.canvas).toBeInstanceOf(HTMLCanvasElement);
            container.destroy();
        });

        it('accepts external canvas', () => {
            const unitController = new TimeGraphUnitController(BigInt(1000), { start: BigInt(0), end: BigInt(500) });
            const extCanvas = document.createElement('canvas');
            const container = new TimeGraphContainer(
                { id: 'test-ext', width: 300, height: 150 },
                unitController,
                extCanvas
            );
            expect(container.canvas).toBe(extCanvas);
            container.destroy();
        });

        it('updateCanvas resizes without error', () => {
            const unitController = new TimeGraphUnitController(BigInt(1000), { start: BigInt(0), end: BigInt(500) });
            const container = new TimeGraphContainer(
                { id: 'test-resize', width: 200, height: 100 },
                unitController
            );
            expect(() => container.updateCanvas(400, 200)).not.toThrow();
            container.destroy();
        });
    });

    describe('FontController - v7 TextStyle', () => {
        it('creates without error', () => {
            expect(() => new FontController()).not.toThrow();
        });

        it('getDefaultFont returns a font name string', () => {
            const fc = new FontController();
            const { fontName } = fc.getDefaultFont();
            expect(typeof fontName).toBe('string');
            expect(fontName.length).toBeGreaterThan(0);
        });

        it('createFont creates bitmap font without error', () => {
            const fc = new FontController();
            expect(() => fc.createFont('White', 10)).not.toThrow();
            expect(() => fc.createFont('Black', 12)).not.toThrow();
        });

        it('getFont returns correct font for dark background', () => {
            const fc = new FontController();
            // Dark color (0x000000) should get white font
            const { fontName } = fc.getFont(0x000000, 8);
            expect(fontName).toContain('White');
        });

        it('getFont returns correct font for light background', () => {
            const fc = new FontController();
            // Light color (0xffffff) should get black font
            const { fontName } = fc.getFont(0xffffff, 8);
            expect(fontName).toContain('Black');
        });

        it('getFont caches font colors', () => {
            const fc = new FontController();
            const { fontName: name1 } = fc.getFont(0x123456, 8);
            const { fontName: name2 } = fc.getFont(0x123456, 8);
            expect(name1).toBe(name2);
        });

        it('getFont creates new size maps on demand', () => {
            const fc = new FontController();
            const { fontName } = fc.getFont(0xffffff, 14);
            expect(fontName.length).toBeGreaterThan(0);
        });

        it('respects minimum font size of 6', () => {
            const fc = new FontController();
            // Size 2 should be clamped to 6
            const { fontName } = fc.getFont(0xffffff, 2);
            expect(fontName.length).toBeGreaterThan(0);
        });

        it('accepts custom font family', () => {
            expect(() => new FontController('Arial')).not.toThrow();
        });
    });

    describe('DisplayObject event augmentation', () => {
        it('Container supports interactive property', () => {
            const c = new PIXI.Container();
            c.interactive = true;
            expect(c.interactive).toBe(true);
        });

        it('Container supports cursor property', () => {
            const c = new PIXI.Container();
            c.cursor = 'pointer';
            expect(c.cursor).toBe('pointer');
        });

        it('Container supports on/off', () => {
            const c = new PIXI.Container();
            const fn = jest.fn();
            expect(() => c.on('click', fn)).not.toThrow();
            expect(() => c.off('click', fn)).not.toThrow();
        });

        it('Graphics supports interactive property', () => {
            const g = new PIXI.Graphics();
            g.interactive = true;
            expect(g.interactive).toBe(true);
        });

        it('Graphics supports on/emit', () => {
            const g = new PIXI.Graphics();
            const fn = jest.fn();
            g.on('click', fn);
            g.emit('click');
            expect(fn).toHaveBeenCalled();
        });

        it('Graphics supports cursor property', () => {
            const g = new PIXI.Graphics();
            g.cursor = 'crosshair';
            expect(g.cursor).toBe('crosshair');
        });
    });
});
