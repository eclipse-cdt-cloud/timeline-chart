
import { TimeGraphPerformanceTest } from "../unitTest/time-graph-performance-test";
import { WithLabelTestData } from "../unitTest/data/withLabels/settings";

describe('TImeGraphChart performance test with labels', () => {
    let timeGraph: TimeGraphPerformanceTest;

    beforeEach(() => {
        // Initiating the test
        timeGraph = new TimeGraphPerformanceTest(
            WithLabelTestData.data,
            WithLabelTestData.viewRange);

    });

	it ('onScaleFactorChanged test', () => {
        // Making sure that the set up is good
        expect(timeGraph.getAbsoluteStart()).toEqual(WithLabelTestData.traceStart);
        expect(timeGraph.getTotalLength()).toEqual(WithLabelTestData.totalLength);

        // Set the zoom range so that we don't have to call adjustZoom()
        const start = performance.now();
        timeGraph.scaleChart(1.2);
        const end = performance.now();
        const time = end - start;
        console.log("onScaleFactorChanged - with labels running time", time, "ms");
        expect(time).toBeGreaterThan(0);
    })

    it ('addOrUpdateRow() test', () => {
        const timeGraphChart = timeGraph.getTimeGraphChart();
        const data = timeGraph.getData();

        const start = performance.now();
        // We don't need to fetch any new data at all, the function should wipe out all existing rows
        // and rerender them.
        // @ts-ignore
        timeGraphChart.addOrUpdateRows(data);
        const end = performance.now();
        const time = end - start;
        console.log("addOrUpdateRow() - with labels running time", time, "ms");
        expect(time).toBeGreaterThan(0);
    })
})
