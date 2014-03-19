var Q = require('q');

var SyncInfoRepositoryMock = function () {

    var entities = {};

    function getById (id) {
        var deferred = Q.defer();
        deferred.resolve(entities[id]);
        return deferred.promise;
    }

    function add (entity) {
        var deferred = Q.defer();
        entities[entity.id] = entity;
        deferred.resolve(entity);
        return deferred.promise;
    }

    return {
        getById: getById,
        add: add
    }
};

module.exports = SyncInfoRepositoryMock;