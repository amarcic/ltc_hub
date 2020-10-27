const datingSpanConfig = require('./datingSpanConfig');

/*const dateParserArachne = (datingArray) => {
    const dates = datingArray;
    let datingObj = {
        begin: {start: "", end: ""},
        end: {start: "", end: ""}
    };
    //put magic here
    let newDates = dates.map( date => date);

    //later datingObj will be returned
    return newDates;
}*/

//gets the label of a section content object (iDAI.objects data) and returns true when it matches
const matchSectionSelection = (sectionLabel) => {
    return sectionLabel==="Informationen zum Objekt"
        ||sectionLabel==="Informationen zur Topographie"
}

//gets an array of sections from iDAI.objects data
//returns an array of datings from dating objects from selected sections
const extractDatingSections = (arachneSectionsArray, sectionSelectFunc) => {
    if (!arachneSectionsArray) return [];
    const sections = arachneSectionsArray;
    const sectionSelect = sectionSelectFunc;
    let datingSectionsArray = [];

    sections.forEach( section =>
        sectionSelect(section.label)
        &&section.content.forEach( contentObj => {
                if (contentObj.label === "Datierung") {
                    //value can be either a string or an array
                    datingSectionsArray.push(contentObj.content[0].value);
                }
            }
        )
    );
    //since elements of the array can be arrays, we will return a flattened version
    return datingSectionsArray.flat();
}

//expects an array of strings that include links to iDAI.chronontology
//returns an array of iDAI.chronontology ids (extracted from the links in the strings)
const extractChronOntologyIds = (datingSections) => {

    if (!datingSections||datingSections.length<1) return;

    const idRegex = /\/period\/(\w+)/g;

    const linksNested = datingSections
        .map( datingString => datingString.match(idRegex));
    const idsNested = linksNested
        .filter( links => Array.isArray(links))
        .map( links => links.map( link => link.slice(8)));

    //temporary fix for consuming functions: .flat() until consuming functions are refactored
    return idsNested;
}

const getIdsFromDating = (sections) => {
    return extractChronOntologyIds(extractDatingSections(sections, matchSectionSelection));
}

const extractDating = (datingSections) => {
    const datingTexts = datingSections;
    const dateRegEx =
        /(?<about>[\wöäü?ÖÄÜ]+(?: \([\wöäü?ÖÄÜ]+\))?: )?(?:(?:(?<fractionCentMilDigit>\d+\.|letzte.?|erste.?) )?(?<fraction>Viertel|Drittel|Hälfte|Mitte|Ende\/spätes|Anfang\/frühes|Ende|Anfang|Jzehnt|Jahrzehnt)?(?:,| des| d\.) )?(?<yearCentMilDigit>(?:\d+\.? ?- ?)?(?:\d+\.?))(?<centuryMillennium> Jh\.?| Jhs\.?| Jahrhundert| Jahrhunderts| Jt\.?)? (?<bcAd>[vn]\. Chr\.?)(?: \((?<detailMod>ca\.? |um |nach |vor | gegen |~)?(?<detailDigit>(?:\d+ ?- ?)?\d+)\))?/g;
    let datingNestedArray = [];
    let extractedDating;
    datingTexts.forEach( dating => {
            /*
            const extractedDatings=dating.match(dateRegEx);
            if (Array.isArray(extractedDatings))
                datingArray = [...datingArray, ...extractedDatings];
            */
            let datingEntryArray = [];
            while ( (extractedDating = dateRegEx.exec(dating)) !== null ) {
                datingEntryArray.push(extractedDating);
            }
            datingNestedArray.push(datingEntryArray);
        }
    );
    //datingNestedArray is an array of arrays, each including the dating strings from a single entry from the dating sections
    //datingNestedArray: one level depth, arrays of strings
    return datingNestedArray;
}

const getDating = (sections) => {
    return extractDating(extractDatingSections(sections, matchSectionSelection));
}

const getDatingHumReadable = (datingNestedArray) => {
    //datingNestedArray is an array of arrays, each including the dating strings from a single entry from the dating sections
    //datingNestedArray: one level depth, arrays of strings
    return datingNestedArray.map( entryArray => entryArray.map( dating => dating[0]));
}

const getDatingSpan = (datingNestedArray) => {
    //datingNestedArray is an array of arrays, each including the dating strings from a single entry from the dating sections
    //datingNestedArray: one level depth, arrays of strings
    if (datingNestedArray.length<1) return;
    const datingNestedArrayFiltered = datingNestedArray.filter( datingArray => datingArray.length>0);
    let datingSpanArray = [];

    datingSpanArray = datingNestedArrayFiltered.map( datingArray => {

        //since arrays with length < 1 have been filtered out above, it should be save to discard this check
        if (datingArray.length<1) return;

        let matches = datingArray
            .map(dating => dating[0] && dating.groups);
        let timespans = [];

        for (let match of matches) {
            //initialise timespan array
            let timespan = datingSpanConfig.initialize;

            //parse detailed dating in parentheses
            if (match.detailDigit) {
                //assign values depending on if match.detailDigit is one digit or two digits separated by '-'
                timespan[0] = parseInt(match.detailDigit.split('-')[0]);
                timespan[1] = match.detailDigit.split("-")[1] ? parseInt(match.detailDigit.split("-")[1]) : parseInt(match.detailDigit);
                if ((match.detailMod === "um ") || (match.detailMod === "gegen ") || (match.detailMod === "circa ") || (match.detailMod === "ca. ") || (match.detailMod === "ca ") || (match.detailMod === "~")) {
                    timespan[0] += datingSpanConfig.fuzzy[0];
                    timespan[1] += datingSpanConfig.fuzzy[1];
                }
                if ((match.bcAd === "v. Chr.") || (match.bcAd === "v. Chr.") || (match.bcAd === "v. Chr.")) {
                    timespan[0] *= -1;
                    timespan[1] *= -1;
                }
                //in case there is a match.detailDigit: only match.detailDigit, match.detailMod, and match.bcAd value are evaluated
                return timespan;
            } else {
                switch (match.fraction) {
                    //parse early, middle, late etc.
                    case "Anfang/frühes":
                    case "Anfang":
                    case "Frühes":
                    case "frühes":
                        timespan[0] = datingSpanConfig.early[0];
                        timespan[1] = datingSpanConfig.early[1];
                        break;
                    case "Mitte":
                        timespan[0] = datingSpanConfig.mid[0];
                        timespan[1] = datingSpanConfig.mid[1];
                        break;
                    case "Ende/spätes":
                    case "Ende":
                    case "Spätes":
                    case "spätes":
                        timespan[0] = datingSpanConfig.late[0];
                        timespan[1] = datingSpanConfig.late[1];
                        break;
                    //parse decade
                    case "Jahrzehnt":
                    case "Jzehnt":
                    case "Jz":
                        if (!match.fractionCentMilDigit) break;
                        switch (match.fractionCentMilDigit) {
                            case "1.":
                            case "erste":
                            case "ersten":
                            case "erstes":
                                timespan[0] = datingSpanConfig.decade["1"][0];
                                timespan[1] = datingSpanConfig.decade["1"][1];
                                break;
                            case "2.":
                            case "3.":
                            case "4.":
                            case "5.":
                            case "6.":
                            case "7.":
                            case "8.":
                            case "9.":
                                timespan[0] =
                                    datingSpanConfig.decade["begin"](match.fractionCentMilDigit);
                                timespan[1] =
                                    datingSpanConfig.decade["end"](match.fractionCentMilDigit);
                                break;
                            case "10.":
                            case "letzte":
                            case "letzten":
                            case "letztes":
                                timespan[0] = datingSpanConfig.decade["10"][0];
                                timespan[1] = datingSpanConfig.decade["10"][1];
                                break;
                            default:
                                break;
                        }
                        break;
                    //parse half
                    case "Hälfte":
                        if (!match.fractionCentMilDigit) break;
                        switch (match.fractionCentMilDigit) {
                            case "1.":
                            //case "1. ":
                            case "erste":
                            case "ersten":
                            case "erster":
                            case "erstes":
                                timespan[0] = datingSpanConfig.half["1"][0];
                                timespan[1] = datingSpanConfig.half["1"][1];
                                break;
                            case "2.":
                            //case "2. ":
                            case "letzten":
                            case "letzte":
                            case "letzter":
                            case "letztes":
                                //case "zweite":
                                //case "zweiten":
                                //case "zweiter":
                                //case "zweites":
                                timespan[0] = datingSpanConfig.half["2"][0];
                                timespan[1] = datingSpanConfig.half["2"][1];
                                break;
                            default:
                                break;
                        }
                        break;
                    //parse third
                    case "Drittel":
                        if (!match.fractionCentMilDigit) break;
                        switch (match.fractionCentMilDigit) {
                            case "1.":
                            //case "1. ":
                            case "erste":
                            case "ersten":
                            case "erster":
                            case "erstes":
                                timespan[0] = datingSpanConfig.third["1"][0];
                                timespan[1] = datingSpanConfig.third["1"][1];
                                break;
                            case "2.":
                                //case "2. ":
                                timespan[0] = datingSpanConfig.third["2"][0];
                                timespan[1] = datingSpanConfig.third["2"][1];
                                break;
                            case "3.":
                            //case "3. ":
                            case "letzte":
                            case "letzten":
                            case "letzter":
                            case "letztes":
                                timespan[0] = datingSpanConfig.third["3"][0];
                                timespan[1] = datingSpanConfig.third["3"][1];
                                break;
                            default:
                                break;
                        }
                        break;
                    //parse quarter
                    case "Viertel":
                        if (!match.fractionCentMilDigit) break;
                        switch (match.fractionCentMilDigit) {
                            case "1.":
                            case "erste":
                            case "erstes":
                            case "erster":
                            case "ersten":
                                timespan[0] = datingSpanConfig.quarter["1"][0];
                                timespan[1] = datingSpanConfig.quarter["1"][1];
                                break;
                            case "2.":
                                timespan[0] = datingSpanConfig.quarter["2"][0];
                                timespan[1] = datingSpanConfig.quarter["2"][1];
                                break;
                            case "3.":
                                timespan[0] = datingSpanConfig.quarter["3"][0];
                                timespan[1] = datingSpanConfig.quarter["3"][1];
                                break;
                            case "4.":
                            case "letzte":
                            case "letztes":
                            case "letzter":
                            case "letzten":
                                timespan[0] = datingSpanConfig.quarter["4"][0];
                                timespan[1] = datingSpanConfig.quarter["4"][1];
                                break;
                            default:
                                break;
                        }
                        break;
                    default:
                        break;
                }
            }

            //parse century or millennium
            switch (match.centuryMillennium) {
                case "Jh.":
                case " Jh.":
                case "Jh":
                    timespan[0] += datingSpanConfig.century(match.yearCentMilDigit);
                    timespan[1] += datingSpanConfig.century(match.yearCentMilDigit);
                    break;
                case "Jt.":
                case " Jt.":
                case "Jt":
                    timespan[0] += datingSpanConfig.millennium(match.yearCentMilDigit);
                    timespan[1] += datingSpanConfig.millennium(match.yearCentMilDigit);
                    break;
                default:
                    if (match.yearCentMilDigit) {
                        timespan[0] = parseInt(match.yearCentMilDigit.split(".")[0]);
                        timespan[1] = parseInt(match.yearCentMilDigit.split(".")[0]);
                    }
                    break;
            }

            //parse BC or AD
            switch (match.bcAd) {
                case "v. Chr.":
                case "v. Chr":
                case "v.Chr.":
                    timespan[0] *= -1;
                    timespan[1] *= -1;
                    break;
                case "n. Chr.":
                case "n. Chr":
                case "n.Chr.":
                    break;
                default:
                    break;
            }

            //TODO: where to put this information? as a third element of the returned array?
            /*if (match.about) {
              timespan.about = match.about.split(":")[0];
            }*/

            //flip begin and end of timespan if they are not in ascending order already
            if (timespan[0] > timespan[1]) {
                let temp = timespan[0];
                timespan[0] = timespan[1];
                timespan[1] = temp;
            }

            //if there is already something in timespans, i.e. there are two timespans in the string, begin and end each get their own begin and end
            if (timespans.length === 0) {
                timespans = timespan;
            } else {
                let temp = [timespans[0], timespans[1]];
                if (temp[1] >= timespan[0]) {
                    timespans[0] = timespan;
                    timespans[1] = temp;
                } else {
                    timespans[0] = temp;
                    timespans[1] = timespan;
                }
            }
        }

        //return timespans which can be nested
        /*return timespans;*/

        //flatten array and only return resulting maximum timespan
        let timespansFlat = [].concat(...timespans);
        let min = Math.min(...timespansFlat);
        let max = Math.max(...timespansFlat);
        return [min, max];
        //datingSpanArray.push([min, max]);
    });
    return datingSpanArray;
}

exports.extractDatingSections = extractDatingSections;
exports.extractChronOntologyIds = extractChronOntologyIds;
exports.matchSectionSelection = matchSectionSelection;
exports.extractDating = extractDating;
exports.getIdsFromDating = getIdsFromDating;
exports.getDating = getDating;
exports.getDatingHumReadable = getDatingHumReadable;
exports.getDatingSpan = getDatingSpan;