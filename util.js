'use strict';

const url = require('url');

const config = require('./config.json');

// const avail_target = ['default', 'header', 'url']

// Get Real Target

function getRealTarget(req) {
    var target = config.target.split(':')
    try {
        switch (target[0]) {
            case 'default':
                return url.parse(`http://${req.url}`);
            case 'header':
                return url.parse(`http://${req.headers[target[1].toLowerCase()]}`);
            case 'url':
                target.pop();
                return url.parse(`http://${target.join(":")}`);
            default:
                return false;
        }
    } catch (e) {
        console.error(`parse realaddr failure\n${e}`);
        return false;
    }
}

function isFeatureEnabled(feature) {
    return config.enabled_feature.indexOf(feature) > -1;
}

module.exports = { getRealTarget, isFeatureEnabled };