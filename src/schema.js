const { gql } = require('apollo-server');

const typeDefs = gql`
    type Entity {
        identifier: ID!
        internalId: ID
        name: String
        description: String
        """
        isA field is currently using the same hard coded id for all queries
        """
        isA: Subject
        isPartOf: Entity
        related(types: [RelatedType]): [Entity]
        spatial(relations: [SpatialRelations]): [Place]
        temporal(language: Languages): [[Period]]
        periodNames: [String]
        type: String
        onDating: [String]
        dating: [[String]]
        datingSpan: [[String]]
        datingSets: [Dating]
        catalogPaths: [String]
        categoryOfDepicted: [String]
        materialOfDepicted: [String]
    }
    type Subject {
        identifier: ID!
        title: String
    }
    type Dating {
        datingText: String
        datingItems: [String]
        datingSpan: [String]
        periodIds: [String]
    }
    type Place {
        identifier: ID!
        name: String
        titles: Titles
        coordinates: String
        polygon: [[[[String]]]]
        temporal: [Period]
        locatedIn: Place
        containedSites: [Place]
        locatedInPlaces: [Place]
        types: [String]
        provenance: [String]
        discoveryContext: [Place]
        linkedObjects(types: [RelatedType]): [Entity]
    }
    type TitleOld {
        language: Languages
        label: String 
    }
    type Titles {
        preferred: String
        arabic: String
        french: String
        german: String
    }
    type Period {
        identifier: ID!
        title: String
        begin: String
        end: String
        datingText: String
        types: [String]
        senses(typeOfSense: TypeSense): [Period]
        coreArea: [Place]
        follows: [Period]
        followedBy: [Period]
        partOf: [Period]
        parts: [Period]
        periodContext: [Period]
        isPartOfIds: [String]
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
        entitiesByString(searchString: String, catalogIds: [Int]): [Entity]
        entitiesMultiFilter( searchString: String, coordinates: [String], periods: [String], catalogIds: [Int], entityTypes: [RelatedType], focusAfrica: Boolean ): [Entity]
        entitiesByLocation(id: ID!): [Entity]!
        entitiesByLocations(ids: [ID]!): [[Entity]]!
        entitiesByPeriod(periodString: String): [Entity]
        entitiesByCoordinates(coordinates: [String]): [Entity]
        entitiesFromCatalog(catalogId: Int!, entryId: Int): [Entity]
        entitiesFromCatalogRecursive(catalogId: Int, catalogEntryId: Int): [Entity]
        place(id: ID!): Place
        places(ids: [ID]!): [Place]!
        archaeologicalSites(searchString: String, coordinates: [String]): [Place]!
        sitesByRegion( searchString: String, id: ID! ): [Place]
        periodById(id: [ID]!): Period
    }
`;

module.exports = typeDefs;