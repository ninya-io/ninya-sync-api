var Q = require('q');
var elasticsearch = require('elasticsearch');

var ElasticSearchRepository = function (options) {

    var esClient = elasticsearch.Client({
      hosts: [
        options.elasticsearchEndpoint
      ]
    });

    function getById (id) {

        return esClient.get({
            index: options.index,
            type: options.type,
            id: id
        })
        .then(function(data){
            return data._source;
        }, function (error) {
            // if we handle the error here, it causes the promise to still
            // resolve (with undefined) which is what we want. It seems odd though.
            // Not sure if that is Promise/A compliant.
            console.log(error);
        });
    }

    function getByIdAndTaskId (id, taskId) {
        return esClient.search({
            index: options.index,
            type: options.type,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match: {
                                    _id: id
                                }
                            },
                            {
                                match: {
                                    _ninya_sync_task_id: taskId
                                }
                            }
                        ]
                    }
                }
            }
        }).then(function (resp) {
            var hits = resp.hits.hits;
            return hits.length > 0 ? hits[0] : undefined;
        }, function (err) {
            console.log(err);
        });
    }

    function countByTaskId (taskId) {
        return esClient.count({
            index: options.index,
            type: options.type,
            body: {
                match: {
                    _ninya_sync_task_id: taskId
                }
            }
        })
        .then(function(data) {
            return data.count;
        }, function(error){
            console.log(error);
        });
    }


    function add (id, entity) {

        return esClient.index({
            index: options.index,
            type: options.type,
            id: id,
            body: entity
        })
        .then(function(data){
            return entity;
        })
    }

    function remove (id) {
        return esClient.delete({
            index: options.index,
            type: options.type,
            id: id
        });
    }

    this.getById = getById;
    this.getByIdAndTaskId = getByIdAndTaskId;
    this.countByTaskId = countByTaskId;
    this.add = add;
    this.remove = remove;
};

module.exports = ElasticSearchRepository;
