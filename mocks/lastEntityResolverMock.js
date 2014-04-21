var Q = require('q');

var LastEntityResolverMock = function (repository) {

    function get (taskId) {
        return repository
                .getAll()
                .then(function(entities) {
                    //TODO: let's use lodash here
                    var filtered = entities
                        .filter(function(entity){
                            return entity._ninya_sync_task_id === taskId;
                        })
                        .sort(function(a, b){
                            return a.reputation - b.reputation;
                        });

                    return filtered.length > 0 ? filtered[0] : undefined;
                });
    }

    this.get = get;
};

module.exports = LastEntityResolverMock;
