import { TimeGraph, TimeGraphModel } from "./time-graph";
// import { TimeAxis } from "./time-axis";

// const timeGraphSimple: TimeGraphModel = {
//     id: 'test1',
//     name: 'graph-test1',
//     range: {
//         start: 0,
//         end: 1000
//     },
//     rows: [
//         {
//             states: [
//                 {
//                     label: 'state1',
//                     range: {
//                         start: 0,
//                         end: 100
//                     }
//                 },
//                 {
//                     label: 'state2',
//                     range: {
//                         start: 300,
//                         end: 400
//                     }
//                 },
//                 {
//                     label: 'state3',
//                     range: {
//                         start: 600,
//                         end: 700
//                     }
//                 },
//                 {
//                     label: 'state4',
//                     range: {
//                         start: 900,
//                         end: 1000
//                     }
//                 }
//             ]
//         }
//     ]
// }
const timeGraph: TimeGraphModel = {
    id: 'test1',
    name: 'graph-test1',
    range: {
        start: 0,
        end: 6000
    },
    rows: [
        {
            states: [
                {
                    label: 'state1',
                    range: {
                        start: 0,
                        end: 50
                    }
                },
                {
                    label: 'state2',
                    range: {
                        start: 150,
                        end: 155
                    }
                },
                {
                    label: 'state3',
                    range: {
                        start: 265,
                        end: 455
                    }
                },
                {
                    label: 'state4',
                    range: {
                        start: 565,
                        end: 655
                    }
                },
                {
                    label: 'state5',
                    range: {
                        start: 765,
                        end: 1455
                    }
                },
                {
                    label: 'state6',
                    range: {
                        start: 2265,
                        end: 2455
                    }
                },
                {
                    label: 'state7',
                    range: {
                        start: 3265,
                        end: 3455
                    }
                },
                {
                    label: 'state8',
                    range: {
                        start: 4265,
                        end: 4455
                    }
                }
            ]
        },
        {
            states: [
                {
                    label: 'state2.1',
                    range: {
                        start: 145,
                        end: 255
                    }
                },
                {
                    label: 'state2.2',
                    range: {
                        start: 265,
                        end: 275
                    }
                },
                {
                    label: 'state2.3',
                    range: {
                        start: 365,
                        end: 555
                    }
                }
            ]
        }
    ]
}



// const tg = new TimeGraph('main');

// const timeAxis = new TimeAxis({
//     id: 'timeAxis',
//     height: 30,
//     width: 6000
// });
// tg.setTimeAxis(timeAxis)

// r1 = new TimeGraphRow(row-config)
// r2 = new TimeGraphRow(row-config)

// tg.addRows([r1, r2])
// tg.removeRows([r2])

// s1 = new TimeGraphState(state-config)
// s2 = new TimeGraphState(state-config)

// r = tg.findRow(row-id)
// r.addStates([s1])
// r1.addStates([s2])

const chart = new TimeGraph('main', timeGraph);
chart.render();


export type TestFieldId = 'test0' | 'test1' | 'test2' | 'test3' | 'test4' | 'test5' | 'test6' | 'test7' | 'test8' | 'test9';
export function tgTest(id: TestFieldId, val:string){
    const f = document.getElementById(id);
    if(f){
        f.innerHTML = val;
    }
}