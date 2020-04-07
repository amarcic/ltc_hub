const { gql } = require('apollo-server');

const typeDefs = gql`
    type Entity {
        identifier: ID!
        name: String
        description: String
        """
        isA field is currently using the same hard coded ChronOntology id for all queries
        """
        isA: Subject
        isPartOf: Entity
        related: [Entity]
        spatial: Place
        """
        temporal field is currently using the same hard coded ChronOntology id for all queries
        """
        temporal(language: Languages): Period
        """
        retrieve period data for Arachne objects from ChronOntology when no ID is given in the data set
        """
        temporalArachne: Period
        periodName: String
        type: String
    }
    type Subject {
        identifier: ID!
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
        identifier: ID!
        title: String
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
        entitiesByString(searchString: String, filter: String): [Entity]
        locatedEntities(id: ID!): [Entity]!
        entitiesByLocations(ids: [ID]!): [[Entity]]!
        place(id: ID!): Place
        places: [Place]!
    }
`;

module.exports = typeDefs;