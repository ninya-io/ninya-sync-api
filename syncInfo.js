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
            enumerable: true
        },
        data: {
            get : function(){
                return _options.data;
            },
            enumerable: true
        }
    });

    this.increment = function () {
        _options.count++;
    };
};

module.exports = SyncInfo;
