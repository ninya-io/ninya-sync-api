var GenericRepositoryMock = require('../mocks/genericRepositoryMock.js');
var chai = require('chai');
var assert = chai.assert;

describe('genericRepositoryMock', function () {

    var repository = new GenericRepositoryMock();

    describe('add', function () {
        it('should add and get the entity', function (done) {
            repository.add(1, {
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
