import { TimeGraphAxisCursor } from '../time-graph-axis-cursor';

describe ('TimeGraphAxisCursor', () => {
    const options = {
        position: { x: 0, y: 1},
        color: 111
    }
    const component = new TimeGraphAxisCursor(options);

    afterAll(() => {
        component.destroy();
    });

    it ('Renders', () => {
        expect(component).toBeTruthy();
    })

    it ('Matches snapshot', () => {
        expect(component).toMatchSnapshot();
    })
})
