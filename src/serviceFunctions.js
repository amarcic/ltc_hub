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
    dating = datingSections;
    idRegex = /\/period\/(\w+)/g;

    datingString = dating.toString();
    uriArray = datingString.match(idRegex);
    idArray = uriArray && uriArray.map( string => string.slice(8) );
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
/*
wholeString = object.content[0].value.toString();
                    let capture = wholeString.match(/\/period\/(\w+)/g);
                    let captureDate = wholeString
                                        .match(regexNew);
                    if (Array.isArray(captureDate))
                        dateArray = captureDate;
                    //dateArray = Array.isArray(captureDate)? captureDate : [];
                    if (Array.isArray(capture))
                        datingStrings.push(...capture);
*/

exports.dateParserArachne = dateParserArachne;
exports.extractDatingSections = extractDatingSections;
exports.extractChronOntologyIds = extractChronOntologyIds;
exports.matchSectionSelection = matchSectionSelection;