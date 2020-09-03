const { gql } = require('apollo-server');

const typeDefs = gql`
    type Entity {
        identifier: ID!
        name: String
        description: String
        """
        isA field is currently using the same hard coded id for all queries
        """
        isA: Subject
        isPartOf: Entity
        related(types: [RelatedType]): [Entity]
        spatial(relations: [SpatialRelations]): [Place]
        temporal(language: Languages): [Period]
        """
        retrieve period data for Arachne objects from ChronOntology when no ID is given in the data set
        """
        temporalArachne: Period
        periodName: [String]
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
        temporal: [Period]
        locatedIn: Place
        containedSites: [Place]
        locatedInPlaces: [Place]
        types: [String]
        provenance: [String]
        discoveryContext: [Place]
        linkedObjects(types: [RelatedType]): [Entity]
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
        types: [String]
        senses(typeOfSense: TypeSense): [Period]
        coreArea: [Place]
        follows: [Period]
        followedBy: [Period]
        partOf: [Period]
        parts: [Period]
    }
    enum SpatialRelations {
        Fundort
        Aufbewahrungsort
        """
        often a relation between entity and place is not specified; add type "unspecified" to include those places
        """
        unspecified
    }
    enum RelatedType {
        Einzelobjekte
        MehrteiligeDenkmaeler
        Bauwerke
        Bauwerksteile
        Bilder
        Buecher
        Buchseiten
        Einzelmotive
        Gruppierungen
        Inschriften
        Literatur
        Orte
        Reproduktionen
        Personen
        Rezeptionen
        Sammlungen
        Szenen
        Topographien
        Typen
        dreiDModelle
    }
    enum TypeSense {
        political   
        cultural
        material_culture
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
        """
        filter needs exact facet_bestandsname value from Arachne; might be replaced by enum
        """
        entitiesByString(searchString: String, filters: [String]): [Entity]
        entitiesMultiFilter( searchString: String, coordinates: [String], projects: [String], period: String, entityTypes: [RelatedType] ): [Entity]
        locatedEntities(id: ID!): [Entity]!
        entitiesByLocations(ids: [ID]!): [[Entity]]!
        entitiesByPeriod(periodString: String): [Entity]
        entitiesByCoordinates(coordinates: [String]): [Entity]
        place(id: ID!): Place
        places(ids: [ID]!): [Place]!
        archaeologicalSites(searchString: String, coordinates: [String]): [Place]!
        sitesByRegion( searchString: String, id: ID! ): [Place]
    }
`;

module.exports = typeDefs;