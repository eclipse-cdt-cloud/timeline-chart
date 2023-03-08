
import { TimeGraphPerformanceTest } from "../unitTest/time-graph-performance-test";
import { NoLabelTestData } from "../unitTest/data/noLabels/settings";

describe('TImeGraphChart performance test without labels', () => {
    let timeGraph: TimeGraphPerformanceTest;

    beforeEach(() => {
        // Initiating the test
        timeGraph = new TimeGraphPerformanceTest(
            NoLabelTestData.data,
            NoLabelTestData.viewRange);
    });

    it ('onScaleFactorChanged test', () => {
        const start = performance.now();
        // Set the view range so that the on view range handlers are triggered
        timeGraph.scaleChart(1.2); // Zoom in
        const end = performance.now();
        const time = end - start;
        console.log("onScaleFactorChanged - without labels running time", time, "ms");
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
        console.log("addOrUpdateRow() - without labels running time", time, "ms");
        expect(time).toBeGreaterThan(0);
    })
})
