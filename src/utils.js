//add service functions in this file
const extractMetadataSections = (arachneSections, metadataType) => {
    if(!arachneSections) return;
    const imageSectionLabel = "Informationen zum Bild";
    let metadataSections = [];

    arachneSections.forEach( section =>
        section.label===imageSectionLabel
            && section.content.forEach( content =>
                content.label===metadataType
                    && metadataSections.push(content.content[0].value)
            )
    )

    return metadataSections.flat();
}

const depictedMetaExtraction = (sectionMetadataOther, regexPattern) => {

    const depictedMeta = sectionMetadataOther.map( section => section.match(regexPattern))
                                .flat()
                                .map( txt => txt && txt.slice(10) ); //todo: make more dynamic, split after colon
    return depictedMeta;
}

const getTitles = (titleList, preferredName, fromService) => {
    let titles = {
        preferred: "not found",
        arabic: "not found",
        english: "not found",
        french: "not found",
        german: "not found",
    };
    if (preferredName) titles["preferred"] = preferredName.title;

    if (titleList) {
        switch (fromService) {
            //titles in Gazetteer do not always have a reference to the associated language
            case "gazetteer":
                titleList.map(title => {
                    if (!title.language) return;
                    switch (title.language) {
                        case "ara":
                            titles["arabic"] = title.title;
                        case "eng":
                            titles["english"] = title.title;
                        case "deu":
                            titles["german"] = title.title;
                        case "fra":
                            titles["french"] = title.title;

                    }
                })
        }
    }

    return titles;
}

const regexMaterial = /Material: [^<]*/g;
const regexCategory = /Kategorie: [^<]*/g;

exports.extractMetadataSections = extractMetadataSections;
exports.depictedMetaExtraction = depictedMetaExtraction;
exports.getTitles = getTitles;
exports.regexMaterial = regexMaterial;
exports.regexCategory = regexCategory;
