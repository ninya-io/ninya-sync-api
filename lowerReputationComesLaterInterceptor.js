var lowerReputationComesLaterInterceptor = function (last, current) {
    if (last === null){
        return current;
    }

    return current.reputation < last.reputation ? current: last;
};

module.exports = lowerReputationComesLaterInterceptor;