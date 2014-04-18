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

    function getByIdAndSyncId (id, syncId) {
        // {
        //   "query": {
        //     "bool": {
        //       "must": [
        //         {
        //           "term": {
        //             "account_id": "1419834"
        //           }
        //         },
        //         {
        //           "term": {
        //             "last_modified_date": "1390137591"
        //           }
        //         }
        //       ]
        //     }
        //   }
        // }

        return esClient.search({
            index: options.index,
            type: options.type,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    _id: id
                                }
                            },
                            {
                                term: {
                                    _ninya_sync_id: syncId
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
    this.getByIdAndSyncId = getByIdAndSyncId;
    this.add = add;
};

module.exports = ElasticSearchRepository;
