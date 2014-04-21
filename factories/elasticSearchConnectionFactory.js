var elasticsearch = require('elasticsearch');

var ElasticSearchConnectionFactory = function (options) {

    var esClient = elasticsearch.Client({
      hosts: [
        options.elasticsearchEndpoint
      ]
    });

    return {
        client: esClient,
        index: options.index,
        type: options.type
    };
};

module.exports = ElasticSearchConnectionFactory;
