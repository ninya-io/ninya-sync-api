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