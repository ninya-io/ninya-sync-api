var Q = require('q');

var GenericRepository = function () {

    var entities = {};

    this.raiseErrorOnNextAdd = false;

    function getById (id) {
        return Q.fcall(function(){
            return entities[id];
        });
    }

    function getAll () {
        var values = [];
        Object.keys(entities).forEach(function(key) {
            var val = entities[key];
            values.push(val);
        });

        return Q.fcall(function(){
            return values;
        });
    }

    function add (id, entity) {
        var deferred = Q.defer();
        entities[id] = entity;

        if (this.raiseErrorOnNextAdd){
            deferred.reject('we fucked it up');
        }
        else {
            deferred.resolve(entity);
        }

        return deferred.promise;
    }

    function remove (id) {
        var deferred = Q.defer();
        delete entities[id];
        deferred.resolve();
        return deferred.promise;
    }

    this.getById = getById;
    this.getAll = getAll;
    this.add = add;
    this.remove = remove;
};

module.exports = GenericRepository;
