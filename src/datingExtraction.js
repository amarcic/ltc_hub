const dateParserArachne = (datingArray) => {
    const dates = datingArray;
    let datingObj = {
        begin: {start: "", end: ""},
        end: {start: "", end: ""}
    };
    //put magic here
    let newDates = dates.map( date => date);

    //later datingObj will be returned
    return newDates;
}

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
    const humanReadableDating = datingArray.map( dating => dating[0]);
    return humanReadableDating;
}

exports.dateParserArachne = dateParserArachne;
exports.extractDatingSections = extractDatingSections;
exports.extractChronOntologyIds = extractChronOntologyIds;
exports.matchSectionSelection = matchSectionSelection;
exports.extractDating = extractDating;
exports.getIdsFromDating = getIdsFromDating;
exports.getDating = getDating;
exports.getDatingHumReadable = getDatingHumReadable;