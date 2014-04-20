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
                return syncInfo || _syncInfoRepository.add(syncOptions.target, new SyncInfo({
                    target: syncOptions.target,
                    // we use a UNIX timestamp as id. Strictly speaking it's not unique across
                    // space and time but it's unique enough for us to work with. The use
                    // of uuids did not work out so well with elasticsearch because it has
                    // dashes and then one needs to deactivate the anaylizer via a mapping.
                    // That's a bit of an unconvienice especially for testing. We can work around
                    // that if we limit ourself to numbers which we do by using a UNIX timestamp.
                    id: Date.now()
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
                    .getByIdAndSyncId(id, _currentSync.id)
                    .then(function(entity){
                        return entity !== undefined;
                    });
    }

    function count () {
        validateSyncInProgress();

        return _entityRepository.countBySyncId(_currentSync.id);
    }

    function validateSyncInProgress () {
        if (!_currentSync) {
            throw new Error(NO_SYNC_IN_PROGRESS);
        }
    }

    function updateEntity (id, entity) {
        validateSyncInProgress();

        entity._ninya_sync_id = _currentSync.id;
        entity._ninya_sync_last_sync = Date.now();

        return _entityRepository.add(id, entity)
                // we allways want to get a fresh object from the repository for more safety when using multiple
                // instances to sync in parallel
                .then(function(){
                    return getSyncInfo(_currentSync);
                })
                .then(function (syncInfo) {

                    // FIX ME: This doesn't increment the count of entities. It increments
                    // the count of updates. The number of updates might be higher than the
                    // number of real synced entities (overwrites!). We can still keep it as it's
                    // still useful information. But we should rename it.
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
        var target = (deleteOptions || _currentSync).target;
        return _syncInfoRepository.remove(target);
    }

    return {
        sync: sync,
        updateEntity: updateEntity,
        remove: remove,
        hasEntity: hasEntity,
        count: count
    }
};

module.exports = SyncService;
