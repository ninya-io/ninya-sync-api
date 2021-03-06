var extend = require('util')._extend;

var SyncInfo = function (options) {

    // we don't want anyone outside to be able to mess with the internal
    // state. Therefore we copy over the properties to an internal object
    var _options = extend({ count: 0, data: null }, options);

    Object.defineProperties(this, {
        target: {
            get : function(){
                return _options.target;
            },
            enumerable: true
        },
        taskId: {
            get : function(){
                return _options.taskId;
            },
            enumerable: true
        },
        empty: {
            get : function(){
                return _options.count === 0;
            },
            enumerable: true
        },
        count: {
            get : function(){
                return _options.count;
            },
            set: function(count){
                _options.count = count;
            },
            enumerable: true
        },
        data: {
            get : function(){
                return _options.data;
            },
            set: function(data){
                _options.data = data;
            },
            enumerable: true
        }
    });
};

module.exports = SyncInfo;
