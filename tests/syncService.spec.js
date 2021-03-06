var GenericRepositoryMock = require('../mocks/genericRepositoryMock.js');
var LastEntityResolverMock = require('../mocks/lastEntityResolverMock.js');
var ElasticSearchRepository = require('../elasticSearchRepository.js');

var SyncService = require('../syncService.js');
var chai = require('chai');
var assert = chai.assert;

describe('syncService', function () {

    var someDoc      = { id: 'some-doc' },
        someDoc1     = { id: 'some-doc-1' },
        someDoc2     = { id: 'some-doc-2' };

    var syncService,
        syncInfoRepository,
        entityRepository;

    beforeEach(function () {

        syncInfoRepository = new GenericRepositoryMock();
        entityRepository = new GenericRepositoryMock();
        var lastEntityResolver = new LastEntityResolverMock(entityRepository);

        syncService = new SyncService({
            syncInfoRepository: syncInfoRepository,
            entityRepository: entityRepository,
            lastEntityResolver: lastEntityResolver
        });
    });

    describe('sync', function () {
        it('should return an empty sync object', function (done) {
            syncService.sync({
                target: 'test'
            })
            .then(function (syncInfo) {
                assert.isObject(syncInfo, 'returns syncInfo object');
                assert.isTrue(syncInfo.empty, 'is empty syncInfo object');
                done();
            });
        });
    });

    describe('sync#secondCall', function () {
        it('should return an used sync object', function (done) {
            var taskId1;
            syncService.sync({
                target: 'test'
            })
            .then(function (syncInfo) {
                taskId1 = syncInfo.taskId;
                assert.isTrue(syncInfo.empty, 'is empty syncInfo object');
                return syncService
                    .updateEntity(someDoc.id,someDoc)
                    .then(function(){
                        return syncService.sync({ target: 'test' });
                    });
            })
            .then(function (syncInfo) {
                assert.isDefined(taskId1);
                assert.isTrue(taskId1 === syncInfo.taskId);
                assert.isFalse(syncInfo.empty, 'is not empty');
                assert(syncInfo.count === 1, 'has synced one object');
                assert(syncInfo.data.id === someDoc.id, 'carries last object');
                done();
            });
        });
    });

    describe('sync#secondCallWithDifferentTarget', function () {
        it('should return an empty sync object', function (done) {
            syncService.sync({
                target: 'test'
            })
            .then(function (syncInfo) {
                assert.isTrue(syncInfo.empty, 'is empty syncInfo object');
                return syncService
                    .updateEntity(someDoc.id, someDoc)
                    .then(function(){
                        return syncService.sync({ target: 'test2' });
                    });
            })
            .then(function (syncInfo) {
                assert.isTrue(syncInfo.empty, 'is empty');
                done();
            });
        });
    });

    describe('update', function () {
        it('should save the user with lower reputation as last user', function (done) {

            syncService.sync({
                target: 'test'
            })
            // by twisting the order here we simulate `syncService.update` calls in a non
            // sequential order which might happen because of the async nature of the sync
            .then(function (syncInfo) {
                return syncService.updateEntity(someDoc2.id, { id: someDoc2.id, reputation: 3000 });
            })
            .then(function (syncInfo) {
                return syncService.updateEntity(someDoc1.id, { id: someDoc1.id, reputation: 3500 });
            })
            .then(function(){
                return syncService.sync({ target: 'test' });
            })
            .then(function (syncInfo) {
                assert.isFalse(syncInfo.empty, 'is not empty');
                assert(syncInfo.data.id === someDoc2.id, 'carries last object');
                assert(syncInfo.count === 2, 'has synced one object');
                done();
            });
        });
    });

    describe('update#withoutRunningSync', function () {
        it('should throw an exception', function () {

            assert.throw(function(){
                syncService.updateEntity(someDoc1.id, { id: someDoc1.id, reputation: 3500 });
            }, 'no sync in progress');
        });
    });

    describe('hasEntity#withoutRunningSync', function () {
        it('should throw an exception', function () {

            assert.throw(function(){
                syncService.hasEntity(someDoc1.id, { id: someDoc1.id });
            }, 'no sync in progress');
        });
    });

    describe('hasEntity', function () {
        it('should return false and true accordingly', function (done) {

            syncService.sync({
                target: 'test'
            })
            .then(function (syncInfo) {

                return syncService.hasEntity(someDoc.id);
            })
            .then(function (hasEntity) {

                assert.isFalse(hasEntity);

                return syncService
                    .updateEntity(someDoc.id, someDoc)
                    .then(function(){
                        return syncService.hasEntity(someDoc.id);
                    });
            })
            .then(function (hasEntity){
                assert.isTrue(hasEntity);
                done();
            })
        });
    });

    describe('update#addFailsDirectly', function () {
        it('should go into fail handler', function (done) {

            var repository = new GenericRepositoryMock();
            repository.raiseErrorOnNextAdd = true;

            var syncService = new SyncService({
                syncInfoRepository: repository
            });

            syncService.sync({
                target: 'test'
            })
            .then(function (syncInfo) {
            }, function(){
                assert(true);
                done();
            });
        });
    });

    describe('delete', function () {
        it('should delete sync', function (done) {
            syncService.sync({
                target: 'test'
            })
            .then(function (syncInfo) {
                assert.isTrue(syncInfo.empty, 'is empty syncInfo object');
                return syncService
                    .updateEntity(someDoc.id, someDoc)
                    .then(function(){
                        return syncService.sync({ target: 'test' });
                    });
            })
            .then(function (syncInfo) {
                assert.isFalse(syncInfo.empty, 'is not empty');
                assert(syncInfo.count === 1, 'has synced one object');
                assert(syncInfo.data.id === someDoc.id, 'carries last object');

                return syncService.remove({
                    target: 'test'
                })
                .then(function() {
                    return syncService.sync({
                        target: 'test'
                    });
                });
            })
            .then(function(syncInfo) {
                assert.isTrue(syncInfo.empty, 'is empty syncInfo object');
                done();
            });
        });
    });

    // Let's keep this one here for easier integration testing

    // describe('integrationTest', function () {
    //     it('should work', function(done){
    //         var syncService = new SyncService({
    //             syncInfoRepository: new ElasticSearchRepository({
    //                 elasticsearchEndpoint: 'REPLACE_WITH_REAL_ENDPOINT',
    //                 index: 'sync',
    //                 type: 'info'
    //             }),
    //             entityRepository: new ElasticSearchRepository({
    //                 elasticsearchEndpoint: 'REPLACE_WITH_REAL_ENDPOINT',
    //                 index: 'testing',
    //                 type: 'user'
    //             }),
    //             entityUpdateInterceptor: lowerReputationComesLaterInterceptor
    //         });
    //
    //         syncService
    //             .sync({
    //                 target: 'foo'
    //             })
    //             .then(function(){
    //                 return syncService.updateEntity({ id: 'some-doc-6', reputation: 2600 });
    //             })
    //             .then(function(){
    //                 assert(true);
    //                 done();
    //             }, function(e){
    //                 console.log(e);
    //             });
    //     });
    // });
});
