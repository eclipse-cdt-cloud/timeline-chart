# General Scope
* The library is entirely client side, relying on the browser API.
* Time is measured using number, so any kind of x measure unit can be used. 
* A function translating numbers into human readable form for labels and hovers can be provided by the library user.
* API for interaction with elements that will allow to register key and mouse listeners.
* The components are styleable. Those parts that are implemented in HTML allow CSS for styling. The timeline view\u2019s contents (gantt chart) provide an API for styling

# Components
## Time Controller
* A central time controller that manages time-related properties, like the total time rang, viewed range, time cursor positions.
* It provides API for setting, reading and syncing the individual properties

## Time Cursor
* Time Cursor T1 and optionally T2 are displayed as a vertical line spanning all rows. Range between T1 and T2 will be highlighted. Styling is be configurable through CSS.
* Time range selection (or range selection) has full read/write/listen API.
* Rendering is configurable through CSS and separated from the actual data.
Setting cursor T1 is doable by clicking anywhere in the main area. A mouse click while holding shift will set T2.
View Port positions (use to scroll and zoom) has full read/write/listen API.

## Time Axis
A reusable time axis component, that can be used independently of the other components. It syncs with a time controller and allows the user to change the controllers values (zooming, scrolling, setting cursors)
* The time axis is separated and usable alone, such that other widgets can render below and sync with the same time axis.
* It is styleable through CSS.
* A time axis controller is used to sync any number of widgets, so that scrolling in any of the timeline charts or the time axis will scroll all others accordingly.
* Clicking and dragging on the time axis will increase/decrease the zoom
* The view is connected to a time controller instance and sync its viewport, zoom level cursors bi-directionally

## Timeline View
* Shows data as a gantt chart on multiple rows. 
* Optional labels can be shown in each state of each row.
* Optional marker symbols can be drawn over the states.
* An optional scrollbar on the bottom will allow to scroll on the x-axis.
* An optional scrollbar on the right will allow to scroll on the y-axis.
* Since implemented using [Pixi.js](https://www.pixijs.com/) (WebGL/Canvas) it will provide an API for styling.
* General possibilities to add additional graphical layers (e.g. markers or icons) is foreseen.
* The library provides with a pull hook, to lazily fetch data from any source.
* Selection of elements (single units) is accessible with a full read/write/listen API.
* Keystroke handling for navigation and time selection is supported. For a selected row, it possible to use left/right arrow to go from one time element start to end and vice versa. Using shift + left and right will do a time selection and the cursors T1 and T2 are drawn accordingly.
* WASD Keystrokes are avaliable for zooming and navigation.
* The view is connected to a time controller instance and sync its viewport, zoom level cursors bi-directionally

## Data Model
* Library user can configure a data model provider which gets asked for data lazily depending on the viewport.
* Data is prefetched for x and y dimensions to make scrolling smoother.
* Data can be fetched for a given resolution, so the provider can optimize the amount of data provided.
* The data model provider allows to provide an array of rows, containing an array of elements. An element has a start time and a length. Arbitrary additional data can be provided, which is then used for styling and registered handlers. E.g. the hover provider would look up certain fields to display hover.
*The data model provider allows to provide an array of arrows, pointing from a point to another point. Here a point is a coordinate in the timeline graph consisting of a time and row number. Arrows can have arbitrary additional properties used for styling and registered handlers

