# Time Graph

[![Gitpod - Code Now][gitpod-icon-small]][gitpod-link]
[![Build Status][build-status-icon]][build-status-link]

A time graph / gantt chart library for large data (e.g. traces)

## Prerequisites

First, you need Node.js and yarn:

It's suggested to install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to manage node on your machine. Once that's done, install the required version:

```bash
   nvm install 18
   # optional: make it the default version
   nvm alias default
   # or set it every time like so
   nvm use 18
```

Then install `yarn`:

```bash
npm i -g yarn  # the default version should be ok
```

# Build

To build, from the root type `yarn`

To test an application type `yarn start` then open localhost:8080 on your web browser

[![Open in Gitpod][gitpod-icon-large]][gitpod-link]

**👋 Want to help?** Read our [contributor guide][contributing].

## Documentation

For detailed description of the timeline chart library and it's components see [here][documentation].

## Screenshots

![timeline-chart][screenshot-1]
![timeline-chart][screenshot-2]

## Applications

The following list of applications are currently making use of the timeline-chart library;

* [Theia Trace Extension][trace-extension]
* [Example Timeline Application][sample-app]

## Tests

Tests can be executed from the root of the project with:

```shell
yarn test
```

Or from `./timeline-chart`, where the tests outputs are formatted in a more readable way:

```shell
cd timeline-chart
yarn test --verbose --watch
```

### Performance tests

Developers can use unit tests to measure the performance improvement of their changes. The following section is a quick guide on how to set up unit tests.

#### Set up

The `TimeGraphPerformanceTest` is a class that conveniently creates a timeline chart for performance tests. To construct a chart for testing, trace data and its corresponding view range is required. The class provides some methods that return important test data, such as the total length of a trace for assertions. The code is taken from the timeline chart example.

You can view an example [here](./timeline-chart/src/layer/__tests__/time-graph-chart-long-removal-test.ts). In this example, test data are 'packaged' into a single object for better readability.

#### Useful tips

1. The `getTimeGraphChart()` method returns the constructed timeline chart. From here, developers can call any methods that they want to test on the returned chart. If the methods are protected or private, using the `@ts-ignore` annotation will bypass typescript checks.
2. It is important to re-construct the timeline chart before each test to make sure the results are consistent.
3. The tests themselves only print out the results and don't compare them to an actual value, because the threshold depends on the environment it runs. Therefore, make sure to output the performance measurement to the output console, so that it can be viewed once the tests finished running.

## Test coverage

The following command prints a coverage report to the terminal. As of now it covers all typescript files of the project, including those that are not supposed to have tests.

```shell
yarn test --coverage --collectCoverageFrom='src/**/*.ts'
```

[build-status-icon]: https://github.com/eclipse-cdt-cloud/timeline-chart/workflows/CI-CD/badge.svg?branch=master
[build-status-link]: https://github.com/eclipse-cdt-cloud/timeline-chart/actions?query=branch%3Amaster
[contributing]: CONTRIBUTING.md
[documentation]: https://github.com/eclipse-cdt-cloud/timeline-chart/blob/master/doc/documentation.md
[gitpod-icon-large]: https://gitpod.io/button/open-in-gitpod.svg
[gitpod-icon-small]: https://img.shields.io/badge/Gitpod-code%20now-blue.svg?longCache=true
[gitpod-link]: https://gitpod.io#https://github.com/eclipse-cdt-cloud/timeline-chart
[sample-app]: https://github.com/theia-ide/theia-timeline-extension
[screenshot-1]: https://raw.githubusercontent.com/eclipse-cdt-cloud/timeline-chart/master/doc/images/screenshot1-0.0.1.png
[screenshot-2]: https://raw.githubusercontent.com/eclipse-cdt-cloud/timeline-chart/master/doc/images/screenshot2-0.0.1.png
[trace-extension]: https://github.com/eclipse-cdt-cloud/theia-trace-extension
