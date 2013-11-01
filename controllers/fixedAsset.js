/*
  #!/usr/local/bin/node
  -*- coding:utf-8 -*-
 
  Copyright 2013 yanghua Inc. All Rights Reserved.
 
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
 
     http://www.apache.org/licenses/LICENSE-2.0
 
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  ---
  Created with Sublime Text 2.
  User: yanghua
  Date: 11/10/13
  Time: 11:03 AM
  Desc: fixedAsset - the controller of fixedAsset
 */

//mode:
'use strict';

var FixedAsset = require("../proxy/fixedAsset");
var User       = require("../proxy/user");
var resUtil    = require("../libs/resUtil");
var config     = require("../config").initConfig();
var check      = require("validator").check;
var sanitize   = require("validator").sanitize;
var EventProxy = require("eventproxy");

/**
 * get fixed asset by faId
 * @param  {object}   req  request
 * @param  {object}   res  response
 * @param  {Function} next next handler
 * @return {null}
 */
exports.getFixedAssetDetailByfaID = function (req, res, next) {
    console.log("******controllers/fixedAsset/getFixedAssetDetailByfaId");
    var faId = req.params.faId || "";

    if (!check(faId).notEmpty()) {
        return res.send(resUtil.generateRes(null, config.statusCode.STATUS_INVAILD_PARAMS));
    }

    faId = sanitize(sanitize(faId).trim()).xss();

    FixedAsset.getFixedAssetDetailByfaID(faId, function (err, rows) {
        if (err) {
            res.send(resUtil.generateRes(null, err.statusCode));
        } else {
            res.send(resUtil.generateRes(rows, config.statusCode.SATUS_OK));
        }
    });
};

/**
 * get fixed asset by faId
 * @param  {object}   req  request
 * @param  {object}   res  response
 * @param  {Function} next next handler
 * @return {null}
 */
exports.getFixedAssetByfaID = function (req, res, next) {
    console.log("******controllers/fixedAsset/getFixedAssetByfaId");
    var faId = req.params.faId || "";

    if (!check(faId).notEmpty()) {
        return res.send(resUtil.generateRes(null, config.statusCode.STATUS_INVAILD_PARAMS));
    }

    faId = sanitize(sanitize(faId).trim()).xss();

    FixedAsset.getFixedAssetByfaID(faId, function (err, rows) {
        if (err) {
            res.send(resUtil.generateRes(null, err.statusCode));
        } else {
            res.send(resUtil.generateRes(rows, config.statusCode.SATUS_OK));
        }
    });
};

/**
 * inspect fixed asset
 * @param  {object}   req  request
 * @param  {object}   res  response
 * @param  {Function} next next handler
 * @return {null}
 */
exports.inspection = function (req, res, next) {
    console.log("******controllers/fixedAsset/inspection");
    var qrCode = req.body.qrCode || "";

    if (!check(qrCode).notEmpty()) {
        return res.send(resUtil.generateRes(null, config.statusCode.STATUS_INVAILD_PARAMS));
    }

    qrCode = sanitize(sanitize(qrCode).trim()).xss();

    var ep = EventProxy.create();

    var userDetail = null;
    var faDetail = null;

    FixedAsset.checkFixedAssetByfaID(qrCode, function (err, hasFA) {
        if (err) {
            return ep.emitLater("error", err);
        }

        if (hasFA) {
            console.log("emit  checkedFA");
            ep.emitLater("checkedFA");
        } else {
            return ep.emitLater("error", new DataNotFoundError());
        }
    });

    ep.once("checkedFA", function () {
        FixedAsset.getFixedAssetByfaID(qrCode, function (err, rows) {
            if (err) {
                return ep.emitLater("error", err);
            }

            console.log("emit  afterFAInfo");
            faDetail = rows;
            ep.emit("afterFAInfo", rows);
        });
    });

    ep.once("afterFAInfo", function (faInfo) {
        if (!faInfo) {
            return ep.emitLater("error", new ServerError());
        }

        faInfo.lastUserId = faInfo.lastUserId || "";
        if (faInfo.lastUserId.length === 0) {
            ep.emitLater("afterUserDetail", {});
        } else {
            User.getUserInfoById(faInfo.lastUserId, function (err, rows) {
                if (err) {
                    return ep.emitLater("error", err);
                }
                ep.emitLater("afterUserDetail", rows);
            });
        }
        
    });

    ep.once("afterUserDetail", function (userInfo) {
        var data = {};
        data["userDetail"] = userInfo;
        data["faDetail"] = faDetail;
        console.dir(resUtil.generateRes(data, config.statusCode.SATUS_OK));
        res.send(resUtil.generateRes(data, config.statusCode.SATUS_OK));
    });

    //error handler
    ep.fail(function (err) {
        console.log("enter fail handler");
        res.send(resUtil.generateRes(null, err.statusCode));
    });

};

/**
 * reject equipment
 * @param  {object}   req  the request object
 * @param  {object}   res  the response object
 * @param  {Function} next the next func
 * @return {null}        
 */
exports.rejection = function (req, res, next) {
    console.log("******controllers/fixedAsset/rejection");

    var faId   = req.body.faId || "";
    var reject = req.body.reject || 1;

    try {
        if (!check(faId).notEmpty()) {
            return res.send(resUtil.generateRes(null, config.statusCode.STATUS_INVAILD_PARAMS));
        }

        if (!check(reject).notEmpty) {
            return res.send(resUtil.generateRes(null, config.statusCode.STATUS_INVAILD_PARAMS));
        }

        //sanitize
        faId = sanitize(sanitize(faId).trim()).xss();
        if (!check(reject).isInt()) {
            reject = sanitize(reject).toInt();
        }

    } catch (e) {
        return res.send(resUtil.generateRes(null, config.statusCode.STATUS_INVAILD_PARAMS));
    }

    FixedAsset.rejectFixedAsset({
        equipmentId: faId,
        reject: reject
    }, function (err, rows) {
        if (err) {
            res.send(resUtil.generateRes(null, err.statusCode));
        } else {
            console.dir(rows);
            res.send(resUtil.generateRes(null, config.statusCode.SATUS_OK));
        }
    });
};


/**
 * fixed asset insertion
 * @param  {object}   req  the object of request
 * @param  {object}   res  the object of response
 * @param  {Function} next the next handler
 * @return {null}        
 */
exports.insertion = function (req, res, next) {
    console.log("******controllers/fixedAsset/insertion");

    var faType = req.body.faType || "";

    if (!check(faType).notEmpty()) {
        return res.send(resUtil.generateRes(null, config.statusCode.STATUS_INVAILD_PARAMS));
    }

    faType = sanitize(sanitize(faType).trim()).xss();
    var detailObj = req.body;

    FixedAsset.addNewFixedAssetDetail(detailObj, function (err, rows) {
        if (err) {
            return res.send(resUtil.generateRes(null, err.statusCode));
        }

        res.send(resUtil.generateRes(null, config.statusCode.SATUS_OK));
    });

};


/**
 * the modification of fixed asset
 * @param  {object}   req  the request object
 * @param  {object}   res  the response object
 * @param  {Function} next the next handler
 * @return {null}        
 */
exports.modification = function (req, res, next) {
    console.log("******controllers/fixedAsset/modification");

    var faId = req.params.faId || "";

    if (!check(faId).notEmpty()) {
        return res.send(resUtil.generateRes(null, config.statusCode.STATUS_INVAILD_PARAMS));
    }

    faId = sanitize(sanitize(faId).trim()).xss();

    var detailObj = req.body;

    FixedAsset.modifyFixedAssetDetail(detailObj, faId, function (err, rows) {
        if (err) {
            return res.send(resUtil.generateRes(null, err.statusCode));
        }

        res.send(resUtil.generateRes(null, config.statusCode.SATUS_OK));
    });
};

/**
 * get fixed asset list by userId
 * @param  {object}   req  request object
 * @param  {object}   res  response object
 * @param  {Function} next the next handler
 * @return {null}
 */
exports.getFixedAssetListByUserID = function (req, res, next) {
    console.log("******controllers/fixedAsset/getFixedAssetListByUserID");
    var userId = req.params.userId || "";

    if (!check(userId).notEmpty()) {
        return res.send(resUtil.generateRes(null, config.statusCode.STATUS_INVAILD_PARAMS));
    }

    userId = sanitize(sanitize(userId).trim()).xss();

    FixedAsset.getFixedAssetListByUserID(userId, function (err, rows) {
        if (err) {
            console.log(err);
            return res.send(resUtil.generateRes(null, err.statusCode));
        } 
            
        res.send(resUtil.generateRes(rows, config.statusCode.SATUS_OK));
    });
};


/**
 * the allocation of fixed asset
 * @param  {object}   req  the object of request
 * @param  {object}   res  the object of response
 * @param  {Function} next the next handler
 * @return {null}        
 */
exports.allocation = function (req, res, next) {
    console.log("******controllers/fixedAsset/allocation");

    var faId   = req.body.faId || "";
    var userId = req.body.userId || "";

    if (!check(faId).notEmpty() || !check(userId).notEmpty()) {
        return res.send(resUtil.generateRes(null, config.statusCode.STATUS_INVAILD_PARAMS));
    }

    faId   = sanitize(sanitize(faId).trim()).xss();
    userId = sanitize(sanitize(userId).trim()).xss();

    FixedAsset.allocateFixedAsset(faId, userId, function (err, rows) {
        if (err) {
            return res.send(resUtil.generateRes(null, err.statusCode));
        }

        res.send(resUtil.generateRes(rows, config.statusCode.SATUS_OK));
    });

};