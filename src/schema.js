const { gql } = require('apollo-server');

const typeDefs = gql`
    type Entity {
        identifier: ID!
        name: String
        description: String
        isA: Subject
        isPartOf: Entity
        spatial: Place
        temporal: Period
    }
    type Subject {
        URID: ID!
        title: String
    }
    type Place {
        identifier: ID!
        name: String
        coordinates: String

    }
    type Title{
        language: Languages
        label: String 
    }
    type Period {
        URID: ID!
        title(language: Languages): String
        begin: String
        end: String
    }
    enum Languages {
        de
        en
        it
        fr
        ar
    }
    type Query {
        entity(id: ID!): Entity 
        entities(ids: [ID]!): [Entity]!
        locatedEntities(locationId: ID!): [Entity]!
        place(id: ID!): Place
        places: [Place]!
    }
`;

module.exports = typeDefs;