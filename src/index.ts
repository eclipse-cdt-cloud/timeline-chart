import { TimeLineChart } from "./timeline-chart";
import { TimeAxis } from "./time-axis";
import { TimelineView } from "./timeline-view";

const chart = new TimeLineChart('main');
const timeAxis = new TimeAxis();
const timelineView1 = new TimelineView();
const timelineView2 = new TimelineView();
timeAxis.addTimelineView('tlv1', timelineView1);
timeAxis.addTimelineView('tlv2', timelineView2);
chart.addTimeAxis('ta1', timeAxis);
