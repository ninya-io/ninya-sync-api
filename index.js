module.exports = {
    SyncService: require('./syncService.js'),
    repositories: {
        ElasticSearchRepository: require('./elasticSearchRepository.js')
    },
    factories: {
        ElasticSearchConnectionFactory: require('./factories/elasticSearchConnectionFactory.js')
    },
    resolvers: {
        LowestReputationResolver: require('./resolvers/lowestReputationResolver.js')
    }
};
