import { TimeGraph, TimeGraphEntry } from "./time-graph";

const timeGraphEntry: TimeGraphEntry = {
    id: 'testEntry',
    name: 'EntryTest',
    range: {
        startTime: 200,
        endTime: 6000
    },
    rows: [
        {
            states: [
                {
                    label: 'state1',
                    range: {
                        startTime: 450,
                        endTime: 550
                    }
                },
                {
                    label: 'state2',
                    range: {
                        startTime: 650,
                        endTime: 1550
                    }
                },
                {
                    label: 'state3',
                    range: {
                        startTime: 2650,
                        endTime: 4550
                    }
                }
            ]
        },
        {
            states: [
                {
                    label: 'state2.1',
                    range: {
                        startTime: 1450,
                        endTime: 2550
                    }
                },
                {
                    label: 'state2.2',
                    range: {
                        startTime: 2650,
                        endTime: 2750
                    }
                },
                {
                    label: 'state2.3',
                    range: {
                        startTime: 4650,
                        endTime: 5550
                    }
                }
            ]
        }
    ]
}

const chart = new TimeGraph('main');
chart.setEntry(timeGraphEntry);