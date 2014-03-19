var SyncInfoRepositoryMock = require('../mocks/syncInfoRepositoryMock.js');
var chai = require('chai');
var assert = chai.assert;

describe('syncInfoRepositoryMock', function () {

    var repository = new SyncInfoRepositoryMock();

    describe('add', function () {
        it('should add and get the entity', function (done) {
            repository.add({
                id: 1
            })
            .then(function (entity) {
                assert(entity.id === 1, 'returns correct entity');

                return repository.getById(1)
            })
            .then(function (entity){
                assert(entity.id === 1, 'has correct entity');
                done();
            });
        });
    });



});