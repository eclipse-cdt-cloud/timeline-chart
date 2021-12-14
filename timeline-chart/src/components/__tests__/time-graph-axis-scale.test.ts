import { TimeGraphAxisScale } from '../time-graph-axis-scale';
import { TimeGraphUnitController } from "../../time-graph-unit-controller";
import { TimeGraphStateController } from "../../time-graph-state-controller";

describe ('TimeGraphAxisScale', () => {
    const unitController = new TimeGraphUnitController(BigInt(0), { start: BigInt(0), end: BigInt(1) });
    const canvas = document.createElement("canvas");
    const stateController = new TimeGraphStateController(canvas, unitController);
    const style = {
        position: { x: 0, y: 0 },
        width: 100,
        height: 100,
        lineColor: 111
    }
    const component = new TimeGraphAxisScale('Test', style, unitController, stateController);

    it ('Renders', () => {
        expect(component).toBeTruthy();
    })

    it ('Updates options', () => {
        const spy = jest.spyOn(component, 'update');
        const updatedStyle = {
            position: { x: 10, y: 10 },
            width: 200,
            height: 200,
            lineColor: 222
        }

        component.update(updatedStyle);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    })
})
