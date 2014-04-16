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

    function add (id, entity) {

        return esClient.index({
            index: options.index,
            type: options.type,
            id: id,
            body: entity
        })
        .then(function(data){
            return data._source;
        })
    }

    this.getById = getById;
    this.add = add;
};

module.exports = ElasticSearchRepository;
