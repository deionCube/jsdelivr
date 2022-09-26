// ==UserScript==
// @name         网盘有效性检查
// @namespace    https://github.com/Leon406/netdiskChecker
// @version      1.3.3
// @icon         https://pan.baidu.com/ppres/static/images/favicon.ico
// @author       Leon406
// @description  自动识别并检查网盘的链接状态,同时生成超链接,自动输入密码并确认
// @note         支持百度云、蓝奏云、腾讯微云、阿里云盘、天翼云盘、123网盘、夸克网盘、迅雷网盘、奶牛网盘、文叔叔、115网盘
// @note         22-09-26 1.3.3 优化密码识别，密码有效性检测
// @match        *://**/*
// @connect      lanzoub.com
// @connect      baidu.com
// @connect      weiyun.com
// @connect      aliyundrive.com
// @connect      cloud.189.cn
// @connect      123pan.com
// @connect      quark.cn
// @connect      xunlei.com
// @connect      cowtransfer.com
// @connect      wenshushu.cn
// @connect      115.com
// @require      https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-y/jquery/1.12.4/jquery.min.js
// @require      https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-y//findAndReplaceDOMText/0.4.6/findAndReplaceDOMText.min.js
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_openInTab
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @license      GPL-3.0 License
// @homepageURL  https://github.com/Leon406/jsdelivr/tree/master/js/tampermonkey
// @noframes
// ==/UserScript==
(function () {
    'use strict';

    var manifest = {
        "name": "ljjc",
        "debugId": "IZ7N32Jv2URf",
        "logger_level": 3,
        "checkTimes": 8,
        "checkInterval": 5,
        "options_page": "https://github.com/Leon406/jsdelivr/blob/master/js/tampermonkey/%E7%BD%91%E7%9B%98%E9%93%BE%E6%8E%A5%E6%B5%8B%E8%AF%95.md"
    };
    var passMap = {};

    function getQuery(param) {
        return new URLSearchParams(location.search).get(param);
    }
    var container = (function () {
        var obj = {
            defines: {},
            modules: {}
        };

        obj.define = function (name, requires, callback) {
            name = obj.processName(name);
            obj.defines[name] = {
                requires: requires,
                callback: callback
            };
        };

        obj.require = function (name, cache) {
            if (typeof cache == "undefined") {
                cache = true;
            }

            name = obj.processName(name);
            if (cache && obj.modules.hasOwnProperty(name)) {
                return obj.modules[name];
            } else if (obj.defines.hasOwnProperty(name)) {
                var requires = obj.defines[name].requires;
                var callback = obj.defines[name].callback;
                var module = obj.use(requires, callback);
                cache && obj.register(name, module);
                return module;
            }
        };

        obj.use = function (requires, callback) {
            var module = {
                exports: undefined
            };
            var params = obj.buildParams(requires, module);
            var result = callback.apply(this, params);
            if (typeof result != "undefined") {
                return result;
            } else {
                return module.exports;
            }
        };

        obj.register = function (name, module) {
            name = obj.processName(name);
            obj.modules[name] = module;
        };

        obj.buildParams = function (requires, module) {
            var params = [];
            requires.forEach(function (name) {
                params.push(obj.require(name));
            });
            params.push(obj.require);
            params.push(module.exports);
            params.push(module);
            return params;
        };

        obj.processName = function (name) {
            return name.toLowerCase();
        };

        return {
            define: obj.define,
            use: obj.use,
            register: obj.register,
            modules: obj.modules
        };
    })();

    /**
     *  配置网盘参数 网盘名
     *  reg 匹配正则
     *  replaceReg dom替换正则
     *  prefix shareId前缀
     *  checkFun 有效性检测函数
     **/
    container.define("constant", ["logger", "http"], function (logger, http) {
        return {
            baidu: {
                reg: /(?:https?:\/\/)?(e?yun|pan)\.baidu\.com\/s\/([\w\-]{4,25})/gi,
                replaceReg: /(?:https?:\/\/)?(?:e?yun|pan)\.baidu\.com\/s\/([\w\-]{4,25})\b/gi,
                prefix: "https://pan.baidu.com/s/",
                checkFun: (shareId, callback) => {
                    let url = shareId.includes("http") ? shareId : "https://pan.baidu.com/s/" + shareId;
                    logger.info("baiddu checkFun", url, shareId);
                    http.ajax({
                        type: "get",
                        url: url,
                        success: (response) => {
                            let state = 1;
                            if (response.includes("输入提取")) {
                                state = 2;
                            } else if (response.includes("不存在")) {
                                state = -1;
                            }
                            callback && callback({
                                state: state
                            });
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            },
            baidu2: {
                reg: /(?:https?:\/\/)?(e?yun|pan)\.baidu\.com\/share\/init\?surl=([\w\-]{4,25})/gi,
                replaceReg: /(?:https?:\/\/)?(?:e?yun|pan)\.baidu\.com\/share\/init\?surl=([\w\-]{4,25})\b/gi,
                prefix: "https://pan.baidu.com/share/init?surl=",
                checkFun: (shareId, callback) => {
                    let url = shareId.includes("http") ? shareId : "https://pan.baidu.com/share/init?surl=" + shareId;
                    logger.info("baiddu checkFun", url, shareId);
                    http.ajax({
                        type: "get",
                        url: url,
                        success: (response) => {
                            let state = 1;
                            if (response.includes("输入提取")) {
                                state = 2;
                            } else if (response.includes("不存在")) {
                                state = -1;
                            }
                            callback && callback({
                                state: state
                            });
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            },
            weiyun: {
                reg: /(?:https?:\/\/)?share\.weiyun\.com\/([\w\-]{5,22})/gi,
                replaceReg: /(?:https?:\/\/)?share\.weiyun\.com\/([\w\-]{5,22})\b/gi,
                prefix: "https://share.weiyun.com/",
                checkFun: (shareId, callback) => {
                    let url = shareId.includes("http") ? shareId : "https://share.weiyun.com/" + shareId;
                    http.ajax({
                        type: "get",
                        url: url,
                        success: (response) => {
                            let state = 0;
                            logger.info(shareId, "weiyun", response);
                            if (response.includes("已删除") || response.includes("违反相关法规") || response.includes("已过期") || response.includes("已经删除")) {
                                state = -1;
                            } else if (response.includes('"need_pwd":null') && response.includes('"pwd":""')) {
                                state = 1;
                            } else if (response.includes('"need_pwd":1') || response.includes('"pwd":"')) {
                                state = 2;
                            }
                            callback && callback({
                                state: state
                            });
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            },
            lanzou: {
                reg: /(?:https?:\/\/)?(?:[\w\-]+\.)?lanzou.?\.com\/([\w\-]{5,22})/gi,
                replaceReg: /(?:https?:\/\/)?(?:[\w\-]+\.)?lanzou.?\.com\/([\w\-]{5,22})\b/gi,
                aTagRepalce: [/(?:[\w\-]+\.)?lanzou.?/, "www.lanzoub"],
                prefix: "https://www.lanzoub.com/",
                checkFun: (shareId, callback) => {
                    let url = shareId.includes("http") ? shareId : "https://www.lanzoub.com/" + shareId;
                    http.ajax({
                        type: "get",
                        url: url,
                        success: (response) => {
                            let state = 1;
                            if (response.includes("输入密码")) {
                                state = 2;
                            } else if (response.includes("来晚啦") || response.includes("不存在")) {
                                state = -1;
                            }
                            callback && callback({
                                state: state
                            });
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            },
            aliyun: {
                reg: /(?:https?:\/\/)?www\.aliyundrive\.com\/s\/([\w\-]{5,22})/gi,
                replaceReg: /(?:https?:\/\/)?www\.aliyundrive\.com\/s\/([\w\-]{5,22})\b/gi,
                prefix: "https://www.aliyundrive.com/s/",
                checkFun: (shareId, callback) => {
                    logger.info("aliyun id ", shareId);
                    http.ajax({
                        type: "post",
                        url: "https://api.aliyundrive.com/adrive/v3/share_link/get_share_by_anonymous",
                        data: JSON.stringify({
                            share_id: shareId
                        }),
                        headers: {
                            "Content-Type": "application/json"
                        },
                        dataType: "json",
                        success: (response) => {
                            logger.debug("aliyun response ", response);
                            let state = 1;
                            if (response['code'] || response['file_count'] && response['file_count'] == 0) {
                                state = -1;
                            }

                            callback && callback({
                                state: state
                            });
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            },
            pan123: {
                reg: /(?:h?ttps?:\/\/)?(?:www\.)?pan123\.com\/s\/([\w\-]{8,14})/gi,
                replaceReg: /(?:h?ttps?:\/\/)?(?:www\.)?123pan\.com\/s\/([\w\-]{5,22})\b/gi,
                prefix: "https://www.123pan.com/s/",
                checkFun: (shareId, callback) => {
                    logger.info("Pan123 check id " + shareId);
                    http.ajax({
                        type: "get",
                        url: "https://www.123pan.com/api/share/info?shareKey=" + shareId,
                        success: (response) => {
                            logger.debug("Pan123 check response", response);
                            let rsp = typeof response == "string" ? JSON.parse(response) : response;
                            let state = 1;
                            if (response.includes("分享页面不存在") || rsp.code != 0) {
                                state = -1;
                            } else if (rsp.data.HasPwd) {
                                state = 2;
                            }

                            callback && callback({
                                state: state
                            });
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            },
            ty189: {
                reg: /(?:https?:\/\/)?cloud\.189\.cn\/(?:t\/|web\/share\?code=)([\w\-]{8,14})/gi,
                replaceReg: /(?:https?:\/\/)?cloud\.189\.cn\/(?:t\/|web\/share\?code=)([\w\-]{8,14})\b/gi,
                prefix: "https://cloud.189.cn/t/",
                aTagRepalce: [/\/web\/share\?code=/, "/t/"],
                checkFun: (shareId, callback) => {
                    http.ajax({
                        type: "post",
                        url: "https://api.cloud.189.cn/open/share/getShareInfoByCodeV2.action",
                        data: {
                            shareCode: shareId
                        },
                        success: (response) => {
                            logger.debug("Ty189 chec", shareId, response);
                            let state = 1;
                            if (response.includes("ShareInfoNotFound")
                                || response.includes("FileNotFound")
                                || response.includes("ShareExpiredError")
                                || response.includes("ShareAuditNotPass")
                               ) {
                                state = -1;
                            } else if (response.includes("needAccessCode")) {
                                state = 2;
                            }

                            callback && callback({
                                state: state
                            });
                        },
                        error: () =>
                        callback && callback({
                            state: 0
                        })

                    });
                }
            },
            quark: {
                reg: /(?:https?:\/\/)?pan.quark\.cn\/s\/([\w\-]{8,14})/gi,
                replaceReg: /(?:https?:\/\/)?pan.quark\.cn\/s\/([\w\-]{8,14})\b/gi,
                prefix: "https://pan.quark.cn/s/",
                checkFun: (shareId, callback) => {
                    logger.info("Quark check id " + shareId);
                    http.ajax({
                        type: "post",
                        data: JSON.stringify({
                            pwd_id: shareId,
                            passcode: ""
                        }),
                        url: "https://drive.quark.cn/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc",
                        success: (response) => {
                            logger.debug("Quark token response", response);
                            let rsp = typeof response == "string" ? JSON.parse(response) : response;
							let state = 0;
							if( rsp.message.includes("需要提取码")){
								state = 2;
							}else if (rsp.message.includes("ok")) {
								state = 1;
							}else {
								state = -1;
							}
	
							 callback && callback({
								state: state
							});
                           
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            },
            xunlei: {
                reg: /(?:https?:\/\/)?pan.xunlei\.com\/s\/([\w\-]{25,})/gi,
                replaceReg: /(?:https?:\/\/)?pan.xunlei\.com\/s\/([\w\-]{25,})\b/gi,
                prefix: "https://pan.xunlei.com/s/",
                checkFun: (shareId, callback) => {
                    logger.info("checkXunlei id", shareId);
                    http.ajax({
                        type: "post",
                        data: JSON.stringify({
                            client_id: "Xqp0kJBXWhwaTpB6",
                            device_id: "925b7631473a13716b791d7f28289cad",
                            action: "get:/drive/v1/share",
                            meta: {
                                package_name: "pan.xunlei.com",
                                client_version: "1.45.0",
                                captcha_sign: "1.fe2108ad808a74c9ac0243309242726c",
                                timestamp: "1645241033384"
                            }
                        }),
                        url: "https://xluser-ssl.xunlei.com/v1/shield/captcha/init",
                        success: (response) => {
                            logger.debug("xunlei token response", response);
                            let rsp = JSON.parse(response);
                            let token = rsp.captcha_token;
                            http.ajax({
                                type: "get",
                                url: "https://api-pan.xunlei.com/drive/v1/share?share_id=" + shareId.replace("https://pan.xunlei.com/s/", ""),
                                headers: {
                                    "x-captcha-token": token,
                                    "x-client-id": "Xqp0kJBXWhwaTpB6",
                                    "x-device-id": "925b7631473a13716b791d7f28289cad",
                                },
                                success: (response) => {
                                    logger.debug("checkXunlei detail response", response);
                                    let state = 1;
                                    if (response.includes("NOT_FOUND")
                                         || response.includes("SENSITIVE_RESOURCE")
                                         || response.includes("EXPIRED")) {
                                        state = -1;
                                    } else if (response.includes("PASS_CODE_EMPTY")) {
                                        state = 2;
                                    }

                                    callback && callback({
                                        state: state
                                    });
                                },
                                error: function () {
                                    callback && callback({
                                        state: 0
                                    });
                                }

                            })
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            },
            nainiu: {
                reg: /(?:https?:\/\/)?(?:[\w\-]+\.)?cowtransfer\.com\/s\/([\w\-]{25,})/gi,
                replaceReg: /(?:https?:\/\/)?(?:[\w\-]+\.)?cowtransfer\.com\/s\/([\w\-]{5,22})\b/gi,
                prefix: "https://cowtransfer.com/s/",
                checkFun: (shareId, callback) => {
                    logger.info("nainiu check id", shareId);
                    http.ajax({
                        type: "get",
                        url: "https://cowtransfer.com/core/api/transfer/share?uniqueUrl=" + shareId,
                        success: (response) => {
                            logger.debug("nainiu check response", response);
                            let rsp = typeof response == "string" ? JSON.parse(response) : response;
                            let state = 1;
							
                            if (rsp.code != "0000") {
                                state = -1;
                            } else if (rsp.data.needPassword&&rsp.data.needPassword) {
                                state = 2;
                            }

                            callback && callback({
                                state: state
                            });
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            },
            wenshushu: {
                reg: /(?:https?:\/\/)?t.wss.ink\/f\/([\w\-]{5,22})/gi,
                replaceReg: /(?:https?:\/\/)?wss1.cn\/f\/([\w\-]{5,22})\b/gi,
                prefix: "https://t.wss.ink/f/",
                checkFun: (shareId, callback) => {
                    logger.info("wenshushu id", shareId);
                    http.ajax({
                        type: "post",
                        url: "https://www.wenshushu.cn/ap/task/mgrtask",
                        data: JSON.stringify({
                            tid: shareId
                        }),
                        headers: {
                            "Content-Type": "application/json",
                            "x-token": "wss:7pmakczzw6i"
                        },
                        dataType: "json",
                        success: (response) => {
                            logger.debug("wenshushu response ", response);
                            let state = 1;
                            if (response.code != 0) {
                                state = -1;
                            }

                            callback && callback({
                                state: state
                            });
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            },
            pan115: {
                reg: /(?:h?ttps?:\/\/)?(?:www\.)?115\.com\/s\/([\w\-]{8,14})/gi,
                replaceReg: /(?:h?ttps?:\/\/)?(?:www\.)?115\.com\/s\/([\w\-]{5,22})\b/gi,
                prefix: "https://115.com/s/",
                checkFun: (shareId, callback) => {
                    logger.info("Pan115 check id " + shareId);
                    shareId = shareId.replace("https://115.com/s/", "");
                    http.ajax({
                        type: "get",
                        url: "https://webapi.115.com/share/snap?share_code=" + shareId + "&receive_code=",
                        success: (response) => {
                            logger.debug("115Pan check response", response);
                            let rsp = typeof response == "string" ? JSON.parse(response) : response;
                            let state = 0;
                            if (rsp.state) {
                                state = 1;
                            } else if (rsp.error.includes("访问码")) {
                                state = 2;
                            } else if (rsp.error.includes("链接")) {
                                state = -1;
                            }

                            callback && callback({
                                state: state
                            });
                        },
                        error: function () {
                            callback && callback({
                                state: 0
                            });
                        }
                    });
                }
            }
        };
    });

    container.define("auto_fill", [], function () {

        var obj = {
            run() {
                this.autoFillPassword();
                return false;
            },
            opt: {
                baidu: {
                    reg: /((?:https?:\/\/)?(?:yun|pan)\.baidu\.com\/(?:s\/\w*(((-)?\w*)*)?|share\/\S{4,}))/,
                    host: /(pan|yun)\.baidu\.com/,
                    input: ['#accessCode'],
                    button: ['#submitBtn'],
                    name: '百度网盘'
                },
                aliyun: {
                    reg: /((?:https?:\/\/)?(?:(?:www\.)?aliyundrive\.com\/s|alywp\.net)\/[A-Za-z0-9]+)/,
                    host: /www\.aliyundrive\.com|alywp\.net/,
                    input: ['.ant-input[placeholder="请输入提取码"]'],
                    button: ['.button--fep7l', 'button[type="submit"]'],
                    name: '阿里云盘'
                },
                weiyun: {
                    reg: /((?:https?:\/\/)?share\.weiyun\.com\/[A-Za-z0-9]+)/,
                    host: /share\.weiyun\.com/,
                    input: ['.mod-card-s input[type=password]'],
                    button: ['.mod-card-s .btn-main'],
                    name: '微云'
                },
                lanzou: {
                    reg: /((?:https?:\/\/)?(?:[A-Za-z0-9\-.]+)?lanzou[a-z]\.com\/[A-Za-z0-9_\-]+)/,
                    host: /(?:[A-Za-z0-9.]+)?lanzou[a-z]\.com/,
                    input: ['#pwd'],
                    button: ['.passwddiv-btn', '#sub'],
                    name: '蓝奏云'
                },
                tianyi: {
                    reg: /((?:https?:\/\/)?cloud\.189\.cn\/(?:t\/|web\/share\?code=)?[A-Za-z0-9]+)/,
                    host: /cloud\.189\.cn/,
                    input: ['.access-code-item #code_txt'],
                    button: ['.access-code-item .visit'],

                },
                caiyun: {
                    reg: /((?:https?:\/\/)?caiyun\.139\.com\/m\/i\?[A-Za-z0-9]+)/,
                    host: /caiyun\.139\.com/,
                    input: ['.token-form input[type=text]'],
                    button: ['.token-form .btn-token'],
                    name: '和彩云',
                },
                xunlei: {
                    reg: /((?:https?:\/\/)?pan\.xunlei\.com\/s\/[\w-]{10,})/,
                    host: /pan\.xunlei\.com/,
                    input: ['.pass-input-wrap .td-input__inner'],
                    button: ['.pass-input-wrap .td-button'],
                    name: '迅雷云盘'
                },
                '123pan': {
                    reg: /((?:https?:\/\/)?www\.123pan\.com\/s\/[\w-]{6,})/,
                    host: /www\.123pan\.com/,
                    input: ['.ca-fot input'],
                    button: ['.ca-fot button'],
                    name: '123云盘'

                },
                '115pan': {
                    reg: /((?:https?:\/\/)?115\.com\/s\/[\w-]{6,})/,
                    host: /115\.com/,
                    input: ['.form-decode input'],
                    button: ['.form-decode .button'],
                    name: '115'
                },
                quark: {
                    reg: /((?:https?:\/\/)?pan\.quark\.cn\/s\/[\w-]{6,})/,
                    host: /pan\.quark\.cn/,
                    input: ['.ant-input[placeholder="请输入提取码，不区分大小写"]'],
                    button: ['button[type="button"]'],
                    name: 'quark'
                },
            },
            //根据域名检测网盘类型
            panDetect() {
                let hostname = location.hostname;
                for (let name in this.opt) {
                    let val = this.opt[name];
                    if (val.host.test(hostname)) {
                        return name;
                    }
                }
                return '';
            },
            isHidden(el) {
                try {
                    return el.offsetParent === null;
                } catch (e) {
                    return false;
                }
            },

            sleep(time) {
                return new Promise((resolve) => setTimeout(resolve, time));
            },
            //自动填写密码
            autoFillPassword() {
                let query = getQuery('pwd');
                let hash = location.hash.slice(1).replace("/list/share","");
                let pwd = query || hash;
                let panType = this.panDetect();
                let val = this.opt[panType];
                pwd && this.doFillAction(val.input, val.button, pwd);

            },
            doFillAction(inputSelector, buttonSelector, pwd) {
                let maxTime = 10;
                let ins = setInterval(async() => {
                    maxTime--;
                    let input = document.querySelector(inputSelector[0]) || document.querySelector(inputSelector[1]);
                    let button = document.querySelector(buttonSelector[0]) || document.querySelector(buttonSelector[1]);

                    if (input && !this.isHidden(input)) {
                        clearInterval(ins);
                        let lastValue = input.value;
                        input.value = pwd;
                        //Vue & React 触发 input 事件
                        let event = new Event('input', {
                            bubbles: true
                        });
                        let tracker = input._valueTracker;
                        if (tracker) {
                            tracker.setValue(lastValue);
                        }
                        input.dispatchEvent(event);

                        await this.sleep(1000); //1秒后点击按钮
                        button.click();

                    } else {
                        maxTime === 0 && clearInterval(ins);
                    }
                }, 800);
            }
        };

        return obj;
    });

    container.define("gm", [], function () {
        var obj = {};

        obj.ready = function (callback) {
            if (typeof GM_getValue != "undefined") {
                callback && callback();
            } else {
                setTimeout(function () {
                    obj.ready(callback);
                }, 100);
            }
        };

        return obj;
    });

    /** common **/
    container.define("gmDao", [], function () {
        var obj = {
            items: {}
        };

        obj.get = function (name) {
            return GM_getValue(name);
        };

        obj.getBatch = function (names) {
            var items = {};
            names.forEach(function (name) {
                items[name] = obj.get(name);
            });
            return items;
        };

        obj.getAll = function () {
            return obj.getBatch(GM_listValues());
        };

        obj.set = function (name, item) {
            GM_setValue(name, item);
        };

        obj.setBatch = function (items) {
            for (var name in items) {
                obj.set(name, items[name]);
            }
        };

        obj.setAll = function (items) {
            var names = GM_listValues();
            names.forEach(function (name) {
                if (!items.hasOwnProperty(name)) {
                    obj.remove(name);
                }
            });
            obj.setBatch(items);
        };

        obj.remove = function (name) {
            GM_deleteValue(name);
        };

        obj.removeBatch = function (names) {
            names.forEach(function (name) {
                obj.remove(name);
            });
        };

        obj.removeAll = function () {
            obj.removeBatch(GM_listValues());
        };

        return obj;
    });

    container.define("ScopeDao", [], function () {
        return function (dao, scope) {
            var obj = {
                items: {}
            };

            obj.get = function (name) {
                return obj.items[name];
            };

            obj.getBatch = function (names) {
                var items = {};
                names.forEach(function (name) {
                    if (obj.items.hasOwnProperty(name)) {
                        items[name] = obj.items[name];
                    }
                });
                return items;
            };

            obj.getAll = function () {
                return obj.items;
            };

            obj.set = function (name, item) {
                obj.items[name] = item;

                obj.sync();
            };

            obj.setBatch = function (items) {
                obj.items = Object.assign(obj.items, items);

                obj.sync();
            };

            obj.setAll = function (items) {
                obj.items = Object.assign({}, items);

                obj.sync();
            };

            obj.remove = function (name) {
                delete obj.items[name];

                obj.sync();
            };

            obj.removeBatch = function (names) {
                names.forEach(function (name) {
                    delete obj.items[name];
                });

                obj.sync();
            };

            obj.removeAll = function () {
                obj.items = {};

                obj.getDao().remove(obj.getScope());
            };

            obj.init = function () {
                var items = obj.getDao().get(obj.getScope());
                if (items instanceof Object) {
                    obj.items = items;
                }
            };

            obj.sync = function () {
                obj.getDao().set(obj.getScope(), obj.items);
            };

            obj.getDao = function () {
                return dao;
            };

            obj.getScope = function () {
                return scope;
            };

            return obj.init(),
            obj;
        };
    });

    container.define("env", [], function () {
        var obj = {
            modes: {
                ADDON: "addon",
                SCRIPT: "script"
            }
        };

        obj.getName = function () {
            return manifest["name"];
        };

        obj.getMode = function () {
            if (GM_info.mode) {
                return GM_info.mode;
            } else {
                return obj.modes.SCRIPT;
            }
        };

        obj.getAid = function () {
            if (GM_info.scriptHandler) {
                return GM_info.scriptHandler.toLowerCase();
            } else {
                return "unknown";
            }
        };

        obj.getVersion = function () {
            return GM_info.script.version;
        };

        obj.getEdition = function () {
            return GM_info.version;
        };

        obj.getInfo = function () {
            return {
                mode: obj.getMode(),
                aid: obj.getAid(),
                version: obj.getVersion(),
                edition: obj.getEdition()
            };
        };

        obj.randString = function (length) {
            var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
            var text = "";
            for (var i = 0; i < length; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        };

        return obj;
    });

    //网络请求库 GM_xmlhttpRequest
    container.define("http", ["logger"], function (logger) {
        var obj = {};

        obj.ajax = function (option) {
            var details = {
                method: option.type,
                url: option.url,
                responseType: option.dataType,
                onload: function (result) {
                    option.success && option.success(result.response);
                },
                onerror: function (result) {
                    option.error && option.error(result.error);
                }
            };

            // 提交数据
            if (option.data instanceof Object) {
                if (option.data instanceof FormData) {
                    details.data = option.data;
                } else {
                    var formData = new FormData();
                    for (var i in option.data) {
                        formData.append(i, option.data[i]);
                    }
                    details.data = formData;
                }
            } else {
                details.data = option.data;
                details.dataType = "json";
            }

            // 自定义头
            if (option.headers) {
                details.headers = option.headers;
            }

            // 超时
            if (option.timeout) {
                details.timeout = option.timeout;
            }

            logger.debug("xmlhttpRequest", details)
            GM_xmlhttpRequest(details);
        };

        return obj;
    });
    //日志库
    container.define("logger", ["env"], function (env) {
        var obj = {
            constant: {
                DEBUG: 0,
                INFO: 1,
                WARN: 2,
                ERROR: 3,
                NONE: 4
            }
        };

        obj.debug = (message, m2, m3, m4, m5) => obj.log(obj.constant.DEBUG, message, m2, m3, m4, m5);
        obj.info = (message, m2, m3, m4, m5) => obj.log(obj.constant.INFO, message, m2, m3, m4, m5);
        obj.warn = (message, m2, m3, m4, m5) => obj.log(obj.constant.WARN, message, m2, m3, m4, m5);
        obj.error = (message, m2, m3, m4, m5) => obj.log(obj.constant.ERROR, message, m2, m3, m4, m5);
        obj.d = (message, m2, m3, m4, m5) => obj.log(obj.constant.NONE, message, m2, m3, m4, m5);
        obj.log = (level, message, m2, m3, m4, m5) => {
            if (level < manifest["logger_level"]) {
                return false;
            }

            console.group("[" + env.getName() + "]" + env.getMode());
            if (m5) {
                console.log(message, m2, m3, m4, m5);
            } else if (m4) {
                console.log(message, m2, m3, m4);
            } else if (m3) {
                console.log(message, m2, m3);
            } else if (m2) {
                console.log(message, m2);
            } else {
                console.log(message);
            }

        };
        console.groupEnd();
        return obj;
    });

    container.define("meta", ["env", "$"], function (env, $) {
        var obj = {};

        obj.existMeta = function (name) {
            name = obj.processName(name);
            if ($("meta[name='" + name + "']").length) {
                return true;
            } else {
                return false;
            }
        };

        obj.appendMeta = function (name, content) {
            name = obj.processName(name);
            content || (content = "on");
            $('<meta name="' + name + '" content="on">').appendTo($("head"));
        };

        obj.processName = function (name) {
            return env.getName() + "::" + name;
        };

        return obj;
    });

    container.define("appRunner", ["logger", "meta", "$"], function (logger, meta, $, require) {
        var obj = {};

        obj.run = function (appList) {
            var metaName = "status";
            if (meta.existMeta(metaName)) {
                logger.info("setup already");
            } else {
                // 添加meta
                meta.appendMeta(metaName);
                // 运行应用
                $(function () {
                    obj.runAppList(appList);
                });
            }
        };

        obj.runAppList = function (appList) {
            var url = location.href;
            var rrr = document.body.innerText.match(/\/([\w-]{4,})(?:.*)?(\s*([\(（])?(?:(提取|访问|訪問|密)[码碼]|Code:)\s*[:：﹕ ]?\s*|[\?&]pwd=|#)([a-zA-Z\d]{4,8})/g);
			for (var s in rrr) {
				let r = /([\w-]+).*?([a-z\d]{4,8})/ig.exec(rrr[s]);
                passMap[r[1]] = r[2];
            }
            for (var i in appList) {
                var app = appList[i];

                var match = obj.matchApp(url, app);
                if (match == false) {
                    continue;
                }

                if (require(app.name).run() == true) {
                    break;
                }
            }
        };

        obj.matchApp = function (url, app) {
            var match = false;
            app.matchs && app.matchs.forEach(function (item) {
                if (item == "*" || url.match(item)) {
                    match = true;
                }
            });
            return match;
        };

        return obj;
    });

    /** custom **/
    container.define("factory", ["gmDao", "ScopeDao"], function (gmDao, ScopeDao) {
        var obj = {
            daos: {}
        };

        obj.getStorageDao = () => obj.getDao("storage", () => ScopeDao(gmDao, "$storage"));
        obj.getCheckDao = () => obj.getDao("check", () => ScopeDao(gmDao, "$check"));

        obj.getDao = function (key, createFunc) {
            if (!obj.daos.hasOwnProperty(key)) {
                obj.daos[key] = createFunc();
            }
            return obj.daos[key];
        };

        return obj;
    });
    //网盘状态icon资源
    container.define("resource", [], function () {
        var obj = {};
        obj.getErrorIcon = () => "data:image/png;base64,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";
        obj.getSuccessIcon = () => "data:image/png;base64,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";
        obj.getLockIcon = () => "data:image/png;base64,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";
        obj.getOtherIcon = () => "data:image/png;base64,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";
        obj.getStyleText = () => ".one-pan-tip { cursor: pointer;}" +
        ".one-pan-tip::before {background-position: center;background-size: 100% 100%;background-repeat: no-repeat;box-sizing: border-box;width: 1em;height: 1em;margin: 0 1px .15em 1px;vertical-align: middle;display: inline-block;}" +
        ".one-pan-tip-success::before {content: '';background-image: url(" + obj.getSuccessIcon() + ")}" +
        ".one-pan-tip-error {text-decoration: line-through;}" +
        ".one-pan-tip-error::before {content: '';background-image: url(" + obj.getErrorIcon() + ")}" +
        ".one-pan-tip-other::before {content: '';background-image: url(" + obj.getOtherIcon() + ")}" +
        ".one-pan-tip-lock::before{content: '';background-image: url(" + obj.getLockIcon() + ")}";
        return obj;
    });

    //检测网盘链接
    container.define("api", ["logger", "constant"], function (logger, constant) {
        var obj = {};
        obj.checkLinkLocal = function (shareSource, shareId, callback) {
            logger.info("checkLinkLocal", shareSource, shareId);
            var rule = constant[shareSource];
            if (rule) {
                rule["checkFun"](shareId, callback)
            } else {
                callback({
                    state: 0
                });
            }
        };
        return obj;
    });

    container.define("checkManage", ["logger", "factory", "api"], function (logger, factory, api) {
        var obj = {
            active: false,
            timer: null,
            queues: []
        };

        obj.activeQueue = function () {
            if (!obj.active) {
                obj.active = true;
                obj.consumeQueue();
            }
        };

        obj.consumeQueue = function () {
            if (obj.queues.length) {
                obj.timer && clearTimeout(obj.timer);

                var items = [];
                while (obj.queues.length && items.length < 5) {
                    items.push(obj.queues.shift());
                }
                obj.checkLinkBatch(items, obj.consumeQueue);
            } else {
                obj.active = false;
                obj.timer = setTimeout(obj.consumeQueue, 1000);
            }
        };

        obj.checkLinkAsync = function (shareSource, shareId, bearTime, callback) {
            obj.queues.push({
                share_source: shareSource,
                share_id: shareId,
                bear_time: bearTime,
                callback: callback
            });
            obj.activeQueue();
        };

        obj.checkLinkBatch = function (items, callback) {
            obj.syncLinkBatch(items, function () {
                callback();
                items.forEach(function (item) {
                    try {
                        obj.checkLink(item.share_source, item.share_id, item.bear_time, item.callback);
                    } catch (err) {
                        logger.error(err);
                    }
                });
            });
        };

        obj.checkLink = function (shareSource, shareId, bearTime, callback) {
            let item = obj.getItem(shareSource, shareId);
            bearTime || (bearTime = 86400 * 1000);
            //失效链接,不再进行请求,有效及带密码链接1天内更新
            if (item && item.check_time && (item.check_state < 0 || (new Date()).getTime() - item.check_time < bearTime)) {
                if (item.check_state < 0) {
                    logger.info("=====checkLink state from db=====  ", "无效链接,不再进行网络请求");
                } else {
                    logger.info("=====checkLink state from db===== 剩余缓存时效(min) ", Math.round((bearTime - new Date().getTime() + item.check_time) / 1000 / 60));
                }
                callback && callback({
                    state: item.check_state
                });
            } else {
                logger.info("=====checkLink state from net=====")
                api.checkLinkLocal(shareSource, shareId, function (item) {
                    if (item instanceof Object && item.state != 0) {
                        obj.setItem(shareSource, shareId, item.state);
                    }
                    callback && callback(item);
                });
            }
        };

        obj.syncLinkBatch = function (items, callback) {
            var linkList = [];
            items.forEach(function (item) {
                linkList.push(obj.buildShareKey(item.share_source, item.share_id));
            });
            callback && callback();
        };

        obj.getItem = function (shareSource, shareId) {
            let key = obj.buildShareKey(shareSource, shareId);
            var conf = GM_getValue("$check");
            return conf && conf.hasOwnProperty(key) && conf[key];
        };

        obj.setItem = function (shareSource, shareId, checkState) {
            obj.getDao().set(obj.buildShareKey(shareSource, shareId), obj.buildItem(shareId, shareSource, checkState));
        };

        obj.buildItem = function (shareId, shareSource, checkState) {
            return {
                share_id: shareId,
                share_source: shareSource,
                check_state: checkState,
                check_time: (new Date()).getTime()
            };
        };

        obj.buildShareKey = function (shareSource, shareId) {
            return shareSource + "#" + shareId;
        };
        obj.getDao = function () {
            return factory.getCheckDao();
        };
        return obj;
    });

    container.define("core", ["resource", "$"], function (resource, $) {
        var obj = {};
        obj.appendStyle = function () {
            var styleText = resource.getStyleText();
            $("<style></style>").text(styleText).appendTo($("head"));
        };

        obj.ready = function (callback) {
            obj.appendStyle();
            callback && callback();
        };

        return obj;
    });

    /** app **/
    container.define("app_check_url", ["constant", "checkManage", "findAndReplaceDOMText", "$", "logger"], function (constant, checkManage, findAndReplaceDOMText, $, logger) {
        var obj = {
            index: 0
        };

        obj.run = function () {
            obj.runMatch();
            return false;
        };

        obj.runMatch = function () {

            //创建span
            for (var rule in constant) {
                obj.replaceTextAsLink(constant[rule]["replaceReg"], rule, function (match) {
                    return match[1];
                });
            }

            // 补超链接ATTR
            $("a:not([one-link-mark])").each(function () {
                var $this = $(this);
                $this.attr("one-link-mark", "yes");

                var match,
                oneId,
                oneSource;
                var href = $this.attr("href");
                if (href) {
                    //匹配域名
                    for (var rule in constant) {
                        if ((match = constant[rule]["reg"].exec(href))) {
                            oneId = href;
                            oneSource = rule;
                            break;
                        }
                    }
                }
                if (match && $this.find(".one-pan-tip").length == 0) {
                    var node = obj.createOneSpanNode(oneId, oneSource);
                    $this.wrapInner(node);
                }
            });

            // 检查链接状态
            $(".one-pan-tip:not([one-tip-mark])").each(function () {
                let $this = $(this);
                $this.attr("one-tip-mark", "yes");
                let shareSource = $this.attr("one-source");
                let shareId = $this.attr("one-id");
                let pwd = $this.attr("one-pwd");

                let parentNode = this.parentNode;
                let shareUrl = obj.buildShareUrl(shareId, shareSource, pwd);
				
                  if(shareId.includes(manifest["debugId"])) {
                        logger.error(shareUrl+" shareUrl");
                }
                if (parentNode.nodeName != "A") {
                    // 转超链接
                    $this.wrap('<a href="' + shareUrl + '" target="_blank"></a>');
                } else if (constant[shareSource]["aTagRepalce"]) {
                    let replacePair = constant[shareSource]["aTagRepalce"];
                    // 失效域名替换
                    parentNode.href = shareUrl.replace(replacePair[0], replacePair[1])
                } else {
                    parentNode.href = shareUrl;
                }

                checkManage.checkLinkAsync(shareSource, shareId, 0, (response) => {
                    if (response.state == 2) {
                        $this.addClass("one-pan-tip-lock");
                    } else if (response.state == 1) {
                        $this.addClass("one-pan-tip-success");
                    } else if (response.state == -1) {
                        $this.addClass("one-pan-tip-error");
                    } else {
                        $this.addClass("one-pan-tip-other");
                    }
                });

            });

            let checkTimes = manifest["checkTimes"];
            if (checkTimes == 0 || obj.index < checkTimes) {
                obj.index++;
                setTimeout(obj.runMatch, 1000 * manifest["checkInterval"]);
            }
        };

        obj.replaceTextAsLink = function (shareMatch, shareSource, getShareId) {
            findAndReplaceDOMText(document.body, {
                find: shareMatch,
                replace: function (portion, match) {
                    let parentNode = portion.node.parentNode;
                    if (parentNode.nodeName == "SPAN" && $(parentNode).hasClass("one-pan-tip")) {
                        return portion.text;
                    } else {
                        let shareId = getShareId(match);
                        let node = obj.createOneSpanNode(shareId, shareSource);
                        node.textContent = obj.buildShowText(shareId, shareSource);
                        return node;
                    }
                },
                forceContext: function (el) {
                    return true;
                }
            });
        };

        obj.createOneSpanNode = function (shareId, shareSource) {
            shareId = shareId.includes("http") ? shareId.replace(/^.*?([\w-]+$)/i, "$1") : shareId
                var node = document.createElementNS(document.lookupNamespaceURI(null) || "http://www.w3.org/1999/xhtml", "span");
            node.setAttribute("class", "one-pan-tip");
            node.setAttribute("one-id", shareId);
            node.setAttribute("one-pwd", passMap[shareId]);
            node.setAttribute("one-source", shareSource);
            return node;
        };

        obj.buildShareUrl = function (shareId, shareSource, pwd) {
            shareId = shareId.includes("http") ? shareId.replace(/^.*?([\w-]+$)/i, "$1") : shareId
                let code = pwd || passMap[shareId];
            if (code == "undefined"||code == "Code" || typeof(code) =="undefined") {
                if(shareId.includes(manifest["debugId"])) {
                    logger.error(shareId+" search");
                }

                var reg = new RegExp( shareId+"(?:\\s*(?:[\\(（])?(?:(?:提取|访问|訪問|密)[码碼]| Code:)\\s*[:：﹕ ]?\\s*|[\\?&]pwd=|#)([a-zA-Z\\d]{4,8})", "g");
                var mm =reg.exec(document.body.innerText)
                if(mm) {
                     passMap[shareId] = mm[1];
                     code = mm[1];
                     if(shareId.includes(manifest["debugId"])) {
                     logger.error(code+" search");
                }
                }
            }
	

            let appendCode = shareSource == "ty189" ? "#" : "?pwd=";
            logger.info("buildCode", code, appendCode);
			if(code=="undefined"){
				code =""
			}else  {
				code = code ? (appendCode + code) : "";
			}
            let shareUrl = constant[shareSource]["prefix"] + shareId + code;
            // 修复https://pan.baidu.com/share/init?surl=xxxxxxx

            if(shareUrl.includes("/share/init?surl=")){
                shareUrl = shareUrl.replace("/share/init?surl=","/s/1")
            }
            return shareUrl;
        };
        obj.buildShowText = function (shareId, shareSource) {
            return constant[shareSource]["prefix"] + shareId;
        };

        return obj;
    });

    container.define("app", ["appRunner"], function (appRunner) {
        var obj = {};

        obj.run = function () {
            appRunner.run([{
                        name: "app_check_url",
                        matchs: ["*"]
                    }, {
                        name: "auto_fill",
                        matchs: [
                            /(pan|yun)\.baidu\.com/,
                            /www\.aliyundrive\.com|alywp\.net/,
                            /share\.weiyun\.com/,
                            /(?:[A-Za-z0-9.]+)?lanzou[a-z]\.com/,
                            /cloud\.189\.cn/,
                            /caiyun\.139\.com/,
                            /pan\.xunlei\.com/,
                            /pan\.quark\.cn/,
                            /www\.123pan\.com/,
                            /115\.com/,
                        ]
                    }
                ]);
        };

        return obj;
    });

    // lib
    container.define("$", [], () => window.$);
    //dom替换
    container.define("findAndReplaceDOMText", [], () => typeof findAndReplaceDOMText != "undefined" ? findAndReplaceDOMText : window.findAndReplaceDOMText);
    //入口
    container.use(["gm", "core", "app"], (gm, core, app) => gm.ready(() => core.ready(app.run)));
})();
