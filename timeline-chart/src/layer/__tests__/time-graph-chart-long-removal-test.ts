
import { TimeGraphPerformanceTest } from "../unitTest/time-graph-performance-test";
import { LongRemovalTestData } from '../unitTest/data/longRemoval/settings';

describe('TImeGraphChart performance test with long states removal', () => {
    let timeGraph: TimeGraphPerformanceTest;

    beforeEach(() => {
        // Initiating the test
        timeGraph = new TimeGraphPerformanceTest(
            LongRemovalTestData.data,
            LongRemovalTestData.viewRange);

        timeGraph.toNextDataSet();
        timeGraph.setViewRange(LongRemovalTestData.zoomRange.start, LongRemovalTestData.zoomRange.end);            
    });

    it ('addOrUpdateRow() test with long removal time', () => {
        const data = timeGraph.getData();
        const timeGraphChart = timeGraph.getTimeGraphChart();

        const start = performance.now();
        // @ts-ignore
        timeGraphChart.addOrUpdateRows(data);
        const end = performance.now();
        const time = end - start;
        console.log("addOrUpdateRow() - with long removal time", time, "ms");
        expect(time).toBeGreaterThan(0);
    })
})
