module.exports = {
    SyncService: require('./syncService.js'),
    interceptors: {
        lowerReputationComesLaterInterceptor: require('./lowerReputationComesLaterInterceptor.js')
    },
    repositories: {
        ElasticSearchRepository: require('./elasticSearchRepository.js')
    }
};
