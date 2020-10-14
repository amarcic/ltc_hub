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
    const dating = datingSections;
    const idRegex = /\/period\/(\w+)/g;

    const datingString = dating.toString();
    const uriArray = datingString.match(idRegex);
    const idArray = uriArray && uriArray.map( string => string.slice(8) );
    return idArray;

    /*for later
    if(Array.isArray(dating)) {

        dating.forEach( datingString => {
                const chronontologyID = datingString.match(idRegex);
            }
        )
    } else {

    }*/
}

const getIdsFromDating = (sections) => {
    return extractChronOntologyIds(extractDatingSections(sections, matchSectionSelection));
}

const extractDating = (datingSections) => {
    const datingTexts = datingSections;
    const dateRegEx =
        /(?<about>[\wöäü?ÖÄÜ]+(?: \([\wöäü?ÖÄÜ]+\))?: )?(?:(?<fractionCentMilDigit>\d\. )?(?<fraction>Viertel|Drittel|Hälfte|Mitte|Ende\/spätes|Anfang\/frühes|Ende|Anfang|Jzehnt|Jahrzehnt)?, )?(?<yearCentMilDigit>(?:\d+\.? ?- ?)?(?:\d+\.?))(?<centuryMillenium> Jh\.?| Jhs\.?| Jahrhundert| Jt\.?)? (?<bcAd>[vn]\. Chr\.?)(?: \((?<detailMod>ca\.? |um |nach |vor | gegen |~)?(?<detailDigit>\d+)\))?/g;
    let datingArray = [];
    let extractedDating;
    datingTexts.forEach( dating => {
            /*
            const extractedDatings=dating.match(dateRegEx);
            if (Array.isArray(extractedDatings))
                datingArray = [...datingArray, ...extractedDatings];
            */
            while ( (extractedDating = dateRegEx.exec(dating)) !== null ) {
                datingArray.push(extractedDating);
            }
        }
    );
    return datingArray;
}

const getDating = (sections) => {
    return extractDating(extractDatingSections(sections, matchSectionSelection));
}

const getDatingHumReadable = (datingArray) => {
    return datingArray.map( dating => dating[0]);
}

const getDatingSpan = (datingArray) => {
    if (datingArray.length<1) return;

    let matches = datingArray
        //.filter( dating => Array.isArray(dating)&&dating.length > 0)
        .map( dating => dating[0] && dating.groups );
    let timespans = [];

    for (let match of matches) {
        //initialise timespan array
        let timespan = [0, 99];

        //Detailangabe in Klammern, evtl. mit 'circa' o.ä.
        if (match.detailDigit) {
            if ((match.detailMod === "um ") || (match.detailMod === "gegen ") || (match.detailMod === "circa ") || (match.detailMod === "ca. ") || (match.detailMod === "ca ") || (match.detailMod === "~")) {
                timespan[0] = parseInt(match.detailDigit.split(".")[0]) - 10; //TODO: how big should the fuzzy circa timespan be?
                timespan[1] = parseInt(match.detailDigit.split(".")[0]) + 10;
            } else {
                timespan[0] = parseInt(match.detailDigit.split(".")[0]);
                timespan[1] = parseInt(match.detailDigit.split(".")[0]);
            }
            //TODO: Should it return this timespan, regardless of if there is more information in the string before this? Probably the '-' is missing here for v. Chr.
            return timespan;
        } else {
            switch (match.fraction) {
                //Anfang, Mitte, Ende
                case "Anfang/frühes":
                case "Anfang":
                case "Frühes":
                case "frühes":
                    timespan[0] = 0;
                    timespan[1] = 33; //25?
                    break;
                case "Mitte":
                    timespan[0] = 33; //25?
                    timespan[1] = 66; //75?
                    break;
                case "Ende/spätes":
                case "Ende":
                case "Spätes":
                case "spätes":
                    timespan[0] = 66; //75?
                    timespan[1] = 99;
                    break;
                // 1.-10. Jahrzehnt
                case "Jahrzehnt":
                case "Jzehnt":
                case "Jz":
                    if (parseInt(match.fractionCentMilDigit.split(".")[0]) <= 10) {
                        //falls ein Jahrzehnt von 0-9 gehen soll:
                        timespan[0] =
                            (parseInt(match.fractionCentMilDigit.split(".")[0]) - 1) * 10;
                        timespan[1] =
                            parseInt(match.fractionCentMilDigit.split(".")[0]) * 10 - 1;
                        //falls ein Jahrzehnt von 1-10 gehen soll:
                        /*timespan[0] =
                            (parseInt(match.fractionCentMilDigit.split(".")[0])) * 10 -9;
                        timespan[1] =
                            parseInt(match.fractionCentMilDigit.split(".")[0]) * 10;*/
                    }
                    break;
                case "Hälfte":
                    //1. oder 2. Hälfte
                    switch (parseInt(match.fractionCentMilDigit.split(".")[0])) {
                        case 1:
                            timespan[0] = 0;
                            timespan[1] = 49;
                            break;
                        case 2:
                            timespan[0] = 50;
                            timespan[1] = 99;
                            break;
                        default:
                            break;
                    }
                    break;
                case "Drittel":
                    //1.-3. Drittel
                    switch (parseInt(match.fractionCentMilDigit.split(".")[0])) {
                        case 1:
                            timespan[0] = 0;
                            timespan[1] = 33;
                            break;
                        case 2:
                            timespan[0] = 33; //?
                            timespan[1] = 66;
                            break;
                        case 3:
                            timespan[0] = 66; //?
                            timespan[1] = 99;
                            break;
                        default:
                            break;
                    }
                    break;
                case "Viertel":
                    //1.-4. Viertel
                    switch (parseInt(match.fractionCentMilDigit.split(".")[0])) {
                        case 1:
                            timespan[0] = 0;
                            timespan[1] = 24;
                            break;
                        case 2:
                            timespan[0] = 25;
                            timespan[1] = 49;
                            break;
                        case 3:
                            timespan[0] = 50;
                            timespan[1] = 74;
                            break;
                        case 4:
                            timespan[0] = 75;
                            timespan[1] = 99;
                            break;
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }
        }

        // Jahrhundert oder Jahrtausend
        switch (match.centuryMillenium) {
            case "Jh.":
            case " Jh.":
            case "Jh":
                timespan[0] +=
                    (parseInt(match.yearCentMilDigit.split(".")[0]) - 1) * 100;
                timespan[1] +=
                    (parseInt(match.yearCentMilDigit.split(".")[0]) - 1) * 100;
                break;
            case "Jt.":
            case " Jt.":
            case "Jt":
                timespan[0] +=
                    (parseInt(match.yearCentMilDigit.split(".")[0]) - 1) * 1000;
                timespan[1] +=
                    (parseInt(match.yearCentMilDigit.split(".")[0]) - 1) * 1000;
                break;
            default:
                if (match.yearCentMilDigit) {
                    timespan[0] = parseInt(match.yearCentMilDigit.split(".")[0]);
                    timespan[1] = parseInt(match.yearCentMilDigit.split(".")[0]);
                }
                break;
        }

        // Vorzeichen
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
}

exports.extractDatingSections = extractDatingSections;
exports.extractChronOntologyIds = extractChronOntologyIds;
exports.matchSectionSelection = matchSectionSelection;
exports.extractDating = extractDating;
exports.getIdsFromDating = getIdsFromDating;
exports.getDating = getDating;
exports.getDatingHumReadable = getDatingHumReadable;
exports.getDatingSpan = getDatingSpan;