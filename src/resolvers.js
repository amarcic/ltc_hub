module.exports = {
    Query: {
        entity: (_, { id }, {dataSources}) =>
            dataSources.entityAPI.getEntityById({ entityId: id })
    }
}