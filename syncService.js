var Q = require('q');
var extend = require('util')._extend;
var SyncInfo = require('./syncInfo.js');
var uuid = require('node-uuid');

var SyncService = function (options) {

    var _syncInfoRepository = options.syncInfoRepository,
        _entityRepository   = options.entityRepository,
        _currentSync        = null;

    var NO_SYNC_IN_PROGRESS = 'no sync in progress';

    function getSyncInfo (syncOptions) {
        return _syncInfoRepository
            .getById(syncOptions.target)
            .then(function (syncInfo) {
                return syncInfo || _syncInfoRepository.add(syncOptions.target, new SyncInfo({ target: syncOptions.target, id: uuid.v1() }));
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
        if (!_currentSync) {
            throw new Error(NO_SYNC_IN_PROGRESS);
        }

        // this HAS to be scoped to the syncID because otherwise: where is the point?
        // This would return true very often but also for very old entities.
        // We need to know whether it exists *within the current sync* or not!

        return _entityRepository
                    .getByIdAndSyncId(id, _currentSync.id)
                    .then(function(entity){
                        return entity !== undefined;
                    });
    }

    function updateEntity (id, entity) {
        if (!_currentSync){
            throw new Error(NO_SYNC_IN_PROGRESS);
        }

        entity._ninya_sync_id = _currentSync.id;
        entity._ninya_sync_last_sync = Date.now();

        return _entityRepository.add(id, entity)
                // we allways want to get a fresh object from the repository for more safety when using multiple
                // instances to sync in parallel
                .then(function(){
                    return getSyncInfo(_currentSync);
                })
                .then(function (syncInfo) {

                    syncInfo.increment();

                    // if we have a `entityUpdateInterceptor` we let that decide how to update the
                    // `data` property. If not, we update it with the new `entity`
                    var lastEntity = options.entityUpdateInterceptor
                                        ? options.entityUpdateInterceptor(syncInfo.data, entity)
                                        : entity;

                    // yeah, this looks weird I know. The reason for that double `extend` is that we don't
                    // want a public setter for `data` hence we can only set it through constructing a new
                    // `SyncInfo` (immutability ftw!). But this comes at it's own costs because we need to build
                    // a new options parameter out of the existing `syncInfo` + the new data property.
                    // We first need to construct a temporally mutable object (1st extend) and then mutate
                    // that through another `extend. The resulting `SyncInfo` will of course be immutable again.
                    syncInfo = new SyncInfo(extend(extend({ }, syncInfo), { data: lastEntity }));

                    _currentSync = syncInfo;
                    return _syncInfoRepository.add(_currentSync.target, _currentSync);
                });
    }

    function remove (deleteOptions) {
        return _syncInfoRepository.remove(deleteOptions.target);
    }

    return {
        sync: sync,
        updateEntity: updateEntity,
        remove: remove,
        hasEntity: hasEntity
    }
};

module.exports = SyncService;
