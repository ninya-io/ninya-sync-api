module.exports = {
    SyncService: require('./syncService.js'),
    interceptors: {
        lowerReputationComesLaterInterceptor: require('./lowerReputationComesLaterInterceptor')
    }
};
