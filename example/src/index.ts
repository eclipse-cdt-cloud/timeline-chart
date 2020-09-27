import { TimeGraphAxis } from "timeline-chart/lib/layer/time-graph-axis";
import { TimeGraphChart } from "timeline-chart/lib/layer/time-graph-chart";
import { TimeGraphUnitController } from "timeline-chart/lib/time-graph-unit-controller";
import { TimeGraphRowController } from "timeline-chart/lib/time-graph-row-controller";
import { TimeGraphNavigator } from "timeline-chart/lib/layer/time-graph-navigator";
import { TimeGraphContainer } from "timeline-chart/lib/time-graph-container";
import { TimeGraphChartCursors } from "timeline-chart/lib/layer/time-graph-chart-cursors";
import { TimeGraphChartSelectionRange } from "timeline-chart/lib/layer/time-graph-chart-selection-range";
import { TimeGraphAxisCursors } from "timeline-chart/lib/layer/time-graph-axis-cursors";
// import { timeGraph } from "timeline-chart/lib/test-data";
import { TimelineChart } from "timeline-chart/lib/time-graph-model";
import { TimeGraphRowElement, TimeGraphRowElementStyle } from "timeline-chart/lib/components/time-graph-row-element";
import { TestDataProvider } from "./test-data-provider";
import { TimeGraphChartGrid } from "timeline-chart/lib/layer/time-graph-chart-grid";
import { TimeGraphVerticalScrollbar } from "timeline-chart/lib/layer/time-graph-vertical-scrollbar";
import { TimeGraphChartArrows } from "timeline-chart/lib/layer/time-graph-chart-arrows";

const styleConfig = {
    mainWidth: 1000,
    mainHeight: 300,
    naviBackgroundColor: 0xf7eaaf,
    chartBackgroundColor: 0xf9f6e8,
    cursorColor: 0xb77f09
}

const styleMap = new Map<string, TimeGraphRowElementStyle>();

const container = document.getElementById('main');
if (!container) {
    throw (`No container available.`);
}
container.innerHTML = '';
container.style.width = styleConfig.mainWidth + "px";

const testDataProvider = new TestDataProvider(styleConfig.mainWidth);
let timeGraph = testDataProvider.getData({});
const unitController = new TimeGraphUnitController(timeGraph.totalLength);
unitController.numberTranslator = (theNumber: number) => {
    const milli = Math.floor(theNumber / 1000000);
    const micro = Math.floor((theNumber % 1000000) / 1000);
    const nano = Math.floor((theNumber % 1000000) % 1000);
    return milli + ':' + micro + ':' + nano;
};

const rowHeight = 16;
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
}, unitController, axisCanvas);
axisHTMLContainer.appendChild(timeGraphAxisContainer.canvas);

const timeAxisLayer = new TimeGraphAxis('timeGraphAxis', { color: styleConfig.naviBackgroundColor });
timeGraphAxisContainer.addLayer(timeAxisLayer);

const chartHTMLContainer = document.createElement('div');
chartHTMLContainer.id = 'main_chart';
container.appendChild(chartHTMLContainer);

const chartCanvas = document.createElement('canvas');
chartCanvas.tabIndex = 1;

const timeGraphChartContainer = new TimeGraphContainer({
    id: timeGraph.id + '_chart',
    height: styleConfig.mainHeight,
    width: styleConfig.mainWidth,
    backgroundColor: styleConfig.chartBackgroundColor
}, unitController, chartCanvas);
chartHTMLContainer.appendChild(timeGraphChartContainer.canvas);

const timeGraphChartGridLayer = new TimeGraphChartGrid('timeGraphGrid', rowHeight);
timeGraphChartContainer.addLayer(timeGraphChartGridLayer);

const timeGraphChart = new TimeGraphChart('timeGraphChart', {
    dataProvider: (range: TimelineChart.TimeGraphRange, resolution: number) => {
        const length = range.end - range.start;
        const overlap = ((length * 20) - length) / 2;
        const start = range.start - overlap > 0 ? range.start - overlap : 0;
        const end = range.end + overlap < unitController.absoluteRange ? range.end + overlap : unitController.absoluteRange;
        const newRange: TimelineChart.TimeGraphRange = { start, end };
        const newResolution: number = resolution * 0.1;
        timeGraph = testDataProvider.getData({ range: newRange, resolution: newResolution });
        if (selectedElement) {
            for (const row of timeGraph.rows) {
                const selEl = row.states.find(el => !!selectedElement && el.id === selectedElement.id);
                if (selEl) {
                    selEl.selected = true;
                    break;
                }
            }
        }
        return {
            rows: timeGraph.rows,
            range: newRange,
            resolution: newResolution
        };
    },
    rowElementStyleProvider: (model: TimelineChart.TimeGraphRowElementModel) => {
        const styles: TimeGraphRowElementStyle[] = [
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
        let style: TimeGraphRowElementStyle | undefined = styles[0];
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
        return {
            backgroundColor: 0xe0ddcf,
            backgroundOpacity: row.selected ? 0.6 : 0,
            lineColor: row.data && row.data.hasStates ? 0xdddddd : 0xaa4444,
            lineThickness: row.data && row.data.hasStates ? 1 : 3
        }
    }
}, rowController);
timeGraphChartContainer.addLayer(timeGraphChart);

timeGraphChart.registerRowElementMouseInteractions({
    click: el => {
        console.log(el.model.label);
        if (el.model.data) {
            console.log(el.model.data.timeRange);
        }
    }
});
let selectedElement: TimeGraphRowElement | undefined;
timeGraphChart.onSelectedRowElementChanged((model) => {
    if (model) {
        const el = timeGraphChart.getElementById(model.id);
        if (el) {
            selectedElement = el;
        }
    } else {
        selectedElement = undefined;
    }
})

const timeGraphChartArrows = new TimeGraphChartArrows('timeGraphChartArrows', rowController);
timeGraphChartContainer.addLayer(timeGraphChartArrows);
timeGraphChartArrows.addArrows(timeGraph.arrows);

const timeAxisCursors = new TimeGraphAxisCursors('timeGraphAxisCursors', { color: styleConfig.cursorColor });
timeGraphAxisContainer.addLayer(timeAxisCursors);
const timeGraphSelectionRange = new TimeGraphChartSelectionRange('chart-selection-range', { color: styleConfig.cursorColor });
timeGraphChartContainer.addLayer(timeGraphSelectionRange);
const timeGraphChartCursors = new TimeGraphChartCursors('chart-cursors', timeGraphChart, rowController, { color: styleConfig.cursorColor });
timeGraphChartContainer.addLayer(timeGraphChartCursors);

const cursorReset = document.getElementById('cursor-reset');
if (cursorReset) {
    cursorReset.addEventListener('click', () => {
        timeGraphChartCursors.removeCursors();
    });
}

const naviEl = document.createElement('div');
naviEl.id = 'navi';
container.appendChild(naviEl);
const naviContainer = new TimeGraphContainer({
    width: styleConfig.mainWidth,
    height: 10,
    id: 'navi',
    backgroundColor: styleConfig.naviBackgroundColor
}, unitController);
const navi = new TimeGraphNavigator('timeGraphNavigator');
naviContainer.addLayer(navi);
naviEl.appendChild(naviContainer.canvas);

const vscrollElement = document.getElementById('main-vscroll');
if (vscrollElement) {
    const verticalScrollContainer = new TimeGraphContainer({
        width: 10,
        height: styleConfig.mainHeight,
        id: 'vscroll',
        backgroundColor: styleConfig.naviBackgroundColor
    }, unitController);
    const vscroll = new TimeGraphVerticalScrollbar('timeGraphVerticalScrollbar', rowController);
    verticalScrollContainer.addLayer(vscroll);
    vscrollElement.appendChild(verticalScrollContainer.canvas);
}