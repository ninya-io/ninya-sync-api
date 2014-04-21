var Q = require('q');

var LowestReputationResolver = function (options) {

    var esClient = options.client;

    function get (taskId) {

        return esClient.search({
            index: options.index,
            type: options.type,
            body: {
                sort: [{ reputation: { order: "asc" }}],
                query: {
                    match: {
                        _ninya_sync_task_id: taskId
                    }
                }
            }
        }).then(function (resp) {
            var hits = resp.hits.hits;
            return hits.length > 0 ? hits[0]._source : undefined;
        }, function (err) {
            console.log(err);
        });
    }

    this.get = get;
};

module.exports = LowestReputationResolver;
