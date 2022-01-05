[![Gitpod - Code Now](https://img.shields.io/badge/Gitpod-code%20now-blue.svg?longCache=true)](https://gitpod.io#https://github.com/theia-ide/timeline-chart)
[![Build Status](https://github.com/theia-ide/timeline-chart/workflows/CI-CD/badge.svg?branch=master)](https://github.com/theia-ide/timeline-chart/actions?query=branch%3Amaster)
# Time Graph
A time graph / gantt chart library for large data (e.g. traces)

To build, from the root type `yarn`

To test an application type `yarn start` then open localhost:8080 on your web browser

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/theia-ide/timeline-chart)

# Documentation
For detailed description of the timeline chart library and it's components see [here](https://github.com/theia-ide/timeline-chart/blob/master/doc/documentation.md).

# Screenshots

![timeline-chart](https://raw.githubusercontent.com/theia-ide/timeline-chart/master/doc/images/screenshot1-0.0.1.png)
![timeline-chart](https://raw.githubusercontent.com/theia-ide/timeline-chart/master/doc/images/screenshot2-0.0.1.png)

# Applications
The following list of applications are currently making use of the timeline-chart library;
* [Theia Trace Extension](https://github.com/theia-ide/theia-trace-extension)
* [Example Timeline Application](https://github.com/theia-ide/theia-timeline-extension)

# Tests

Tests can be executed from the root of the project with:

```
yarn test
```

Or from `./timeline-chart`, where the tests outputs are formatted in a more readable way:

```
cd timeline-chart
yarn test --verbose --watch
```

## Test coverage

The following command prints a coverage report to the terminal. As of now it covers all typescript files of the project, including those that are not supposed to have tests.

```shell
yarn test --coverage --collectCoverageFrom='src/**/*.ts'
```
