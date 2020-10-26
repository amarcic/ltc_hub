// configuration file for how to parse the terms related to dating spans in getDatingSpan
// if an array is given, the value index 0 is the beginning and the value with index 1 the end of the time span
// some examples for alternative values are given

module.exports = datingSpanConfig = {
    "initialize": [0, 99],
    "fuzzy": [-10, 10], //[-20, 20],
    "early": [0, 40], //[1, 33],
    "mid": [41, 60], //[34, 66],
    "late": [61, 99], //[67, 100],
    "half": {
        1: [0, 49], //[1, 50],
        2: [50, 99] //[51, 100]
    },
    "third": {
        1: [0, 33],
        2: [34, 66],
        3: [67, 99]
    },
    "quarter": {
        1: [0, 24],
        2: [25, 49],
        3:[50, 74],
        4:[75, 99]
    },
    "decade": {
        1: [0, 9], //[1, 10],
        10: [90, 99], //[91, 100],
        "begin": (x) => (parseInt(x.split(".")[0]) - 1) * 10, //(x) => (parseInt(x.split(".")[0])) * 10 - 9,
        "end": (x) => parseInt(x.split(".")[0]) * 10 - 1 //(x) => parseInt(x.split(".")[0]) * 10
    },
    "century": (x) => (parseInt(x.split(".")[0]) - 1) * 100, //(x) => (parseInt(x.split(".")[0]) - 1) * 100 + 1
    "millennium": (x) => (parseInt(x.split(".")[0]) - 1) * 1000, //(x) => (parseInt(x.split(".")[0]) - 1) * 1000 + 1
}
