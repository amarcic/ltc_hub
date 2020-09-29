const dateParserArachne = (datingArray) => {
    const dates = datingArray;
    let dateObj = {
        begin: {start: "", end: ""},
        end: {start: "", end: ""}
    };
    //put magic here
    let newDates = dates.map( date => date);

    //later dateObj will be returned
    return newDates;
}

exports.dateParserArachne = dateParserArachne;