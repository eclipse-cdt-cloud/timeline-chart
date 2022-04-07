# Time Graph

[![Gitpod - Code Now][gitpod-icon-small]][gitpod-link]
[![Build Status][build-status-icon]][build-status-link]

A time graph / gantt chart library for large data (e.g. traces)

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
