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

const regexMaterial = /Material: [^<]*/g;
const regexCategory = /Kategorie: [^<]*/g;

exports.extractMetadataSections = extractMetadataSections;
exports.depictedMetaExtraction = depictedMetaExtraction;
exports.regexMaterial = regexMaterial;
exports.regexCategory = regexCategory;
