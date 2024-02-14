# Timeline-chart Library

* The library is entirely client side, relying on the browser API.
* Time is measured using number, so any kind of x measure unit can be used. 
* A function translating numbers into human readable form for labels and hovers can be provided by the library user.
* API for interaction with elements that will allow to register key and mouse listeners.
* The components are styleable. Those parts that are implemented in HTML allow CSS for styling. The timeline view\u2019s contents (gantt chart) provide an API for styling

## Components

### Time Controller

* A central time controller that manages time-related properties, like the total time range, viewed range, time cursor positions.
* It provides API for setting, reading and syncing the individual properties

### Time Cursor

* Time Cursor T1 and optionally T2 are displayed as a vertical line spanning all rows. Range between T1 and T2 will be highlighted. Styling is configurable through CSS.
* Time range selection (or range selection) has full read/write/listen API.
* Rendering is configurable through CSS and separated from the actual data.
Setting cursor T1 is doable by clicking anywhere in the main area. A mouse click while holding shift will set T2.
View Port positions (use to scroll and zoom) has full read/write/listen API.

### Time Axis

A reusable time axis component, that can be used independently of the other components. It syncs with a time controller and allows the user to change the controllers values (zooming, scrolling, setting cursors)

* The time axis is separated and usable alone, such that other widgets can render below and sync with the same time axis.
* It is styleable through CSS.
* A time axis controller is used to sync any number of widgets, so that scrolling in any of the timeline charts or the time axis will scroll all others accordingly.
* Clicking and dragging on the time axis will increase/decrease the zoom
* The view is connected to a time controller instance and sync its viewport, zoom level cursors bi-directionally

### Timeline View

* Shows data as a gantt chart on multiple rows. 
* Optional labels can be shown in each state of each row.
* Optional marker symbols can be drawn over the states.
* An optional scrollbar on the bottom will allow to scroll on the x-axis.
* An optional scrollbar on the right will allow to scroll on the y-axis.
* Since implemented using [Pixi.js](https://www.pixijs.com/) (WebGL/Canvas) it will provide an API for styling.
* General possibilities to add additional graphical layers (e.g. markers or icons) is foreseen.
* The library provides with a pull hook, to lazily fetch data from any source.
* Selection of elements (single units) is accessible with a full read/write/listen API.
* Keystroke handling for navigation and time selection is supported. For a selected row, it's possible to use left/right arrow to go from one element's start time to end and vice versa, as well as skipping to the next/previous element on that row. Using shift + left mouse click will select a time range and the cursors T1 and T2 are drawn accordingly.
* WASD or IJKL keystrokes are available for zooming and navigation. The zooming is centered on the mouse cursor position.
* Horizontal zooming can be performed using Ctrl+mouse wheel. The zooming is centered on the mouse cursor position.
* Horizontal panning can be performed using the middle mouse button or Ctrl+left mouse button.
* Horizontal zooming selection can be performed using the right mouse button.
* Horizontal zooming can be cancelled by pressing the `esc` button while zooming using the right click + drag.
* The view is connected to a time controller instance and synchronizes its viewport, zoom level cursors bi-directionally.

### Data Model

* Library user can configure a data model provider which gets asked for data lazily depending on the viewport.
* Data is prefetched for x and y dimensions to make scrolling smoother.
* Data can be fetched for a given resolution, so the provider can optimize the amount of data provided.
* The data model provider allows to provide an array of rows, containing an array of elements. An element has a start time and a length. Arbitrary additional data can be provided, which is then used for styling and registered handlers. E.g., the hover provider would look up certain fields to display hover text.
* The data model provider allows to provide an array of arrows, pointing from a point to another point. Here a point is a coordinate in the timeline graph consisting of a time and row number. Arrows can have arbitrary additional properties used for styling and registered handlers.

## Performance improvements

### Scaling

Scaling of the timeline chart is done using the `scale factor` property of the state controller.

* Any components that inherit from the `TimeGraphViewportLayer` can enable scaling using the `isScalable` property.
* The `TimeGraphViewportLayer` applies the `scale factor` value to the `PIXI.Container.scale.x` property to scale the chart.
* The `scale factor` is reset every time new data arrive from the server and the chart re-renders itself. A value of 1 means no scaling is applied.

There are 2 ways to calculate this factor, which will be described below.

#### On zoom

The timeline chart clears all `row components` and re-render the states every time new data is fetched from the server. While waiting for the new data to arrive from the server, the timeline chart re-scales the states to make it look like the chart was zoomed in or out instantly the moment the view range changes. This section describes how the scaling is implemented to support view range changes triggered by zooming.

When the view range is changed:

* The `updateScaleFactor` function of the `state controller` of the timeline chart are triggered. It re-calculates the `scale factor` of the timeline chart.
* Once the `scale factor` is updated, it will trigger the `onScaleFactorChange` event, upon which any components that are registered to this event can trigger their own handler.
* In case of `view range` changes, the `scale factor` is calculated as `newScaleFactor = (oldViewRangeLength / newViewRangeLength) * oldScaleFactor`. The multiplication with the old scale factor is to support multiple zooming while waiting for data.

Because the timeline chart requires the `oldViewRangeLength` to calculate the scale factor, the parameters of the `onViewRangeChanged` function has been updated:

```text
Previously: (viewRange)
New implementation: (oldRange, newRange)
With viewRange=newRange
```

**Important**: The `onViewRangeChanged()` handlers need to be removed when we destroy the timeline chart so that subsequent view range change event will not cause the error `cannot read property of undefined` (because all PIXI objects are destroyed).

#### On resize

When the timeline chart is resized, the `scale factor` is also recalculated:

```text
scaleFactor = canvasDisplayWidth / unscaledCanvasWidth;
where
canvasDisplayWidth = the current width of the canvas
unscaledCanvasWidth = the width of the canvas when no scaling is applied
```

The `unscaledCanvasWidth` is updated whenever the chart is reset.

#### Label text

When the timeline chart is scaled, the label text will also be scaled. This squishes the text when the chart shrinks, and stretches the text when the chart expands. Thus, the timeline chart rescales the texts using the function `scaleLabel()` of the `TimeGraphStateComponent` to re-render the labels with an appropriate scaling factor so that the text size stays consistent.

#### Note

* Some components, such as the selection cursors, do not need to be scaled when the timeline chart is zoomed/resized, but rather re-rendered. In the case of cursors, if scaling is applied, the timeline chart will display a thick vertical line, which is not the expected behavior.
* The `updateZoomingSelection()` function of the `TimeGraphChart` needs to undo the scaling to get the correct position of the user pointer.
