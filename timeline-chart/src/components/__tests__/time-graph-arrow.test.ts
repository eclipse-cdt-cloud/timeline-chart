import { TimeGraphArrowComponent } from '../time-graph-arrow';

describe('TimeGraphArrow', () => {
    const range = {
        start: BigInt(0),
        end: BigInt(10)
    }
    const arrow = {
        sourceId: 0,
        destinationId: 1,
        range
    }
    const element = {
        start: { x: 0, y: 1 },
        end: { x: 2, y: 3 }
    }
    const component = new TimeGraphArrowComponent('Test', arrow, element);

    it ('Renders', () => {
        expect(component).toBeTruthy();
    })

    it ('Matches snapshot', () => {
        expect(component).toMatchSnapshot();
    })
})
