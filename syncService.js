var Q = require('q');
var extend = require('util')._extend;
var SyncInfo = require('./syncInfo.js');
var uuid = require('node-uuid');

var SyncService = function (options) {

    var _syncInfoRepository = options.syncInfoRepository,
        _entityRepository   = options.entityRepository,
        _lastEntityResolver = options.lastEntityResolver,
        _currentSync        = null;

    var NO_SYNC_IN_PROGRESS = 'no sync in progress';

    function getSyncInfo (syncOptions) {
        return _syncInfoRepository
            .getById(syncOptions.target)
            .then(function(syncInfo){
                if(syncInfo){

                    // if the sync exists, we want to enrich it with meta data
                    return Q.all([
                            getLastEntity(syncInfo),
                            count(syncInfo)
                        ])
                        .then(function(data){
                            syncInfo.data = data[0];
                            syncInfo.count = data[1];
                            return syncInfo;
                        });
                }
            })
            .then(function (syncInfo) {
                return syncInfo || _syncInfoRepository.add(syncOptions.target, new SyncInfo({
                    target: syncOptions.target,
                    // we use a UNIX timestamp as id. Strictly speaking it's not unique across
                    // space and time but it's unique enough for us to work with. The use
                    // of uuids did not work out so well with elasticsearch because it has
                    // dashes and then one needs to deactivate the anaylizer via a mapping.
                    // That's a bit of an unconvienice especially for testing. We can work around
                    // that if we limit ourself to numbers which we do by using a UNIX timestamp.
                    taskId: Date.now()
                }));
            })
            .then(function (syncInfo) {
                // this comes as JSON, we need to wrap it with the model class to be usable
                return new SyncInfo(syncInfo);
            });
    }

    function sync (syncOptions) {

        if (!syncOptions) {
            throw new Error('syncOptions parameter is mandatory');
        }

        return getSyncInfo(syncOptions)
                .then(function(syncInfo){
                    _currentSync = syncInfo;
                    return _currentSync;
                })
    }

    function hasEntity (id) {
        validateSyncInProgress();

        // this HAS to be scoped to the syncID because otherwise: where is the point?
        // This would return true very often but also for very old entities.
        // We need to know whether it exists *within the current sync* or not!

        return _entityRepository
                    .getByIdAndTaskId(id, _currentSync.taskId)
                    .then(function(entity){
                        return entity !== undefined;
                    });
    }

    function getLastEntity (syncInfo) {
        return _lastEntityResolver.get(getTaskId(syncInfo));
    }


    function count (syncInfo) {
        return _entityRepository.countByTaskId(getTaskId(syncInfo));
    }

    function getTaskId (syncInfo) {
        validateSyncInProgress(syncInfo);
        return (syncInfo || _currentSync).taskId;
    }

    function validateSyncInProgress (syncInfo) {
        if (!syncInfo && !_currentSync) {
            throw new Error(NO_SYNC_IN_PROGRESS);
        }
    }

    function updateEntity (id, entity) {
        validateSyncInProgress();

        entity._ninya_sync_task_id = _currentSync.taskId;
        entity._ninya_sync_last_sync = Date.now();
        return _entityRepository.add(id, entity)
                .then(function(entity){
                    console.log('SyncService: Updated Entity');
                    return entity;
                });
    }

    function remove (deleteOptions) {
        var target = (deleteOptions || _currentSync).target;
        return _syncInfoRepository
                    .remove(target)
                    .then(function(){
                        _currentSync = null;
                        return undefined;
                    });
    }

    return {
        sync: sync,
        updateEntity: updateEntity,
        getLastEntity: getLastEntity,
        remove: remove,
        hasEntity: hasEntity,
        count: count
    }
};

module.exports = SyncService;
