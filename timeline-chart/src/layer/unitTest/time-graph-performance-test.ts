import { TimeGraphStateStyle } from "../../components/time-graph-state";
import { TimeGraphContainer } from "../../time-graph-container";
import { TimelineChart } from "../../time-graph-model";
import { TimeGraphRowController } from "../../time-graph-row-controller";
import { TimeGraphUnitController } from "../../time-graph-unit-controller";
import { TimeGraphAxis } from "../time-graph-axis";
import { TimeGraphAxisCursors } from "../time-graph-axis-cursors";
import { TimeGraphChart } from "../time-graph-chart";
import { TimeGraphChartCursors } from "../time-graph-chart-cursors";
import { TimeGraphChartGrid } from "../time-graph-chart-grid";
import { TimeGraphChartSelectionRange } from "../time-graph-chart-selection-range";
import { TestDataProvider, TimeGraphPerformanceTestDataStubJsonImp } from "./test-data-provider";

const styleConfig = {
    mainWidth: 1418,
    mainHeight: 820,
    naviBackgroundColor: 0xf7eaaf,
    chartBackgroundColor: 0xf9f6e8,
    cursorColor: 0xb77f09
}

export class TimeGraphPerformanceTest {
    private testDataProvider: TestDataProvider;
    private timeGraphChart: TimeGraphChart;
    private unitController: TimeGraphUnitController;
    private timeGraphChartContainer: TimeGraphContainer;

    constructor(data: any[], viewRange: TimelineChart.TimeGraphRange) {
        // Set up HTML container
        document.body.innerHTML = `
        <div id="main"><div/>
        `;

        const styleMap = new Map<string, TimeGraphStateStyle>();
        const rowHeight = 20;

        const container = document.getElementById('main');
        if (!container) {
        throw (`No container available.`);
        }
        container.innerHTML = '';
        container.style.width = styleConfig.mainWidth + "px";

        // Create the data stub
        const dataStub = new TimeGraphPerformanceTestDataStubJsonImp(data);
        this.testDataProvider = new TestDataProvider(styleConfig.mainWidth, dataStub);
        let timeGraph = this.testDataProvider.fetchTimeGraphData({});

        // Create the unit controller
        this.unitController = new TimeGraphUnitController(timeGraph.totalLength, viewRange);
        this.unitController.numberTranslator = (theNumber: bigint) => {
        const originalStart = this.testDataProvider.absoluteStart;
        theNumber += originalStart;
        const zeroPad = (num: bigint) => String(num).padStart(3, '0');
        const seconds = theNumber / BigInt(1000000000);
        const millis = zeroPad((theNumber / BigInt(1000000)) % BigInt(1000));
        const micros = zeroPad((theNumber / BigInt(1000)) % BigInt(1000));
        const nanos = zeroPad(theNumber % BigInt(1000));
        return seconds + '.' + millis + ' ' + micros + ' ' + nanos;
        };
        this.unitController.worldRenderFactor = 0.25;

        // Create providers
        const providers = {
            rowProvider: () => {
                return {
                    rowIds : this.testDataProvider.getRowIds()
                };
            },
            dataProvider: (range: TimelineChart.TimeGraphRange, resolution: number) => {
                const newRange: TimelineChart.TimeGraphRange = range;
                const newResolution: number = resolution * 0.1;
                timeGraph = this.testDataProvider.fetchTimeGraphData({ range: newRange, resolution: newResolution });
                return {
                    rows: timeGraph.rows,
                    range: newRange,
                    resolution: newResolution
                };
            },
            stateStyleProvider: (model: TimelineChart.TimeGraphState) => {
                const styles: TimeGraphStateStyle[] = [
                    {
                        color: 0x11ad1b,
                        height: rowHeight * 0.8
                    }, {
                        color: 0xbc2f00,
                        height: rowHeight * 0.7
                    }, {
                        color: 0xccbf5d,
                        height: rowHeight * 0.6
                    }
                ];
                let style: TimeGraphStateStyle | undefined = styles[0];
                if (model.data && model.data.value) {
                    const val = model.data.value;
                    style = styleMap.get(val);
                    if (!style) {
                        style = styles[(styleMap.size % styles.length)];
                        styleMap.set(val, style);
                    }
                }
                return {
                    color: style.color,
                    height: style.height,
                    borderWidth: model.selected ? 1 : 0,
                    minWidthForLabels: 100
                };
            },
            rowStyleProvider: (row: TimelineChart.TimeGraphRowModel) => {
                if (row) {
                    return {
                        backgroundColor: 0xe0ddcf,
                        backgroundOpacity: row.selected ? 0.6 : 0,
                        lineColor: row.data && row.data.hasStates ? 0xdddddd : 0xaa4444,
                        lineThickness: row.data && row.data.hasStates ? 1 : 3
                    }
                }

                return {};
            },
            rowAnnotationStyleProvider: (annotation: TimelineChart.TimeGraphAnnotation) => {
                return {
                    color: annotation.data?.color,
                    size: 7 * (annotation.data && annotation.data.height ? annotation.data.height : 1.0),
                    symbol: annotation.data?.symbol,
                    verticalAlign: annotation.data?.verticalAlign,
                    opacity: annotation.data?.opacity
                }
            }
        }

        const totalHeight = timeGraph.rows.length * rowHeight;
        const rowController = new TimeGraphRowController(rowHeight, totalHeight);

        const axisHTMLContainer = document.createElement('div');
        axisHTMLContainer.id = 'main_axis';
        container.appendChild(axisHTMLContainer);

        const axisCanvas = document.createElement('canvas');
        const timeGraphAxisContainer = new TimeGraphContainer({
        height: 30,
        width: styleConfig.mainWidth,
        id: timeGraph.id + '_axis',
        backgroundColor: 0xffffff
        }, this.unitController, axisCanvas);
        axisHTMLContainer.appendChild(timeGraphAxisContainer.canvas);

        const timeAxisCursors = new TimeGraphAxisCursors('timeGraphAxisCursors', { color: styleConfig.cursorColor });
        const timeAxisLayer = new TimeGraphAxis('timeGraphAxis', { color: styleConfig.naviBackgroundColor, verticalAlign: 'bottom'});
        timeGraphAxisContainer.addLayers([timeAxisLayer, timeAxisCursors]);

        const chartHTMLContainer = document.createElement('div');
        chartHTMLContainer.id = 'main_chart2';
        container.appendChild(chartHTMLContainer);

        const chartCanvas = document.createElement('canvas');
        chartCanvas.tabIndex = 1;

        this.timeGraphChartContainer = new TimeGraphContainer({
                id: timeGraph.id + '_chart',
                height: styleConfig.mainHeight,
                width: styleConfig.mainWidth,
                backgroundColor: styleConfig.chartBackgroundColor
            },
            this.unitController,
            chartCanvas
        );
        chartHTMLContainer.appendChild(this.timeGraphChartContainer.canvas);

        const timeGraphChartGridLayer = new TimeGraphChartGrid('timeGraphGrid', rowHeight);
        this.timeGraphChart = new TimeGraphChart('timeGraphChart', providers, rowController);
        const timeGraphSelectionRange = new TimeGraphChartSelectionRange('chart-selection-range', { color: styleConfig.cursorColor });
        const timeGraphChartCursors = new TimeGraphChartCursors('chart-cursors', this.timeGraphChart, rowController, { color: styleConfig.cursorColor });

        this.timeGraphChartContainer.addLayers([timeGraphChartGridLayer,
            this.timeGraphChart,
            timeGraphSelectionRange,
            timeGraphChartCursors
        ]);
    }

    setViewRange(start: bigint, end: bigint) {
        this.unitController.viewRange = {
            start,
            end
        };
    }

    scaleChart(scaleFactor: number) {
        // @ts-ignore
        this.timeGraphChartContainer.stateController.scaleFactor = scaleFactor;
    }

    getTimeGraphChart(): TimeGraphChart {
        return this.timeGraphChart;
    }

    getTotalLength(): bigint {
        return this.testDataProvider.totalLength;
    }

    getAbsoluteStart(): bigint {
        return this.testDataProvider.absoluteStart;
    }

    toNextDataSet(): any {
        // Change the data fetched
        this.testDataProvider.toNextDataSet();
    }

    getData(): any {
        // Call the stub to fetch the test data
        return this.testDataProvider.fetchTimeGraphData({});
    }
}
