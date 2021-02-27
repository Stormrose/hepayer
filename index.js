"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fs = __importStar(require("fs"));
var axios_1 = __importDefault(require("axios"));
var dhive_1 = require("@hiveio/dhive");
var dsteem_1 = require("dsteem");
var voca_1 = __importDefault(require("voca"));
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var config, tokensymbol, mintokens, maxtokens, minpayout, excludemembers, daccount, dasset, dassettype, distributionamt, activekey, hefindtemplate, axoptions, hefindstr, tokenholdersraw, tokenholdersnorm, tokenholdersdist, tokenholdersdistresult, accumulatedtokenbalance, accumulatedpayoutamt, tb, _i, _a, i, amt, _b, _c, i, amt, _d, _e, i, hclient, hasfails, _f, _g, i, e_1, _h, _j, i, e_2, _k, _l, i, e_3;
    return __generator(this, function (_m) {
        switch (_m.label) {
            case 0:
                if (process.argv.length < 4) {
                    console.log('Commandline: ./run configfilename amttodistribute [activekey]');
                    console.log('e.g. ./run token_MPATH.json 17.021');
                    console.log('Without activekey: print distribution schedule.');
                    console.log('With    activekey: execute the distribution schedule.');
                    process.exit();
                }
                config = {};
                try {
                    config = config = JSON.parse(fs.readFileSync(process.argv[2]).toString());
                }
                catch (e) {
                    console.error(e);
                    process.exit(-1);
                }
                tokensymbol = config.membershiptokensymbol.toUpperCase();
                mintokens = parseFloat(config.minholdingtokens);
                maxtokens = parseFloat(config.maxeffectivetokens);
                minpayout = parseFloat(config.minpayout);
                excludemembers = config.excludemembers ? config.excludemembers : [];
                daccount = config.distributionaccount.toLowerCase();
                dasset = config.distributionasset.toUpperCase();
                dassettype = config.distributionassettype.toUpperCase();
                distributionamt = parseFloat(process.argv[3]);
                excludemembers.push(daccount);
                if (!tokensymbol || tokensymbol.length < 1
                    || !daccount || daccount.length < 1
                    || !dasset || dasset.length < 1
                    || !['HIVE', 'STEEM', 'HIVE-ENGINE', 'STEEM-ENGINE'].includes(dassettype)) {
                    console.error('CONFIG ERROR: Missing field in config.');
                    process.exit(-1);
                }
                if (mintokens > maxtokens) {
                    console.error('CONFIG ERROR: minholdingtokens cannot be lower than maxeffectivetokens: ' + mintokens + ' > ' + maxtokens);
                    process.exit(-1);
                }
                try {
                    activekey = process.argv[4] ? isHive(dassettype) ? dhive_1.PrivateKey.fromString(process.argv[4]) : dsteem_1.PrivateKey.fromString(process.argv[4]) : undefined;
                }
                catch (e) {
                    console.error('ERROR:', e.message);
                    console.error('COMMAND LINE ERROR: Check that the private active key is correct.');
                    process.exit(-1);
                }
                hefindtemplate = '{ "jsonrpc": "2.0", "method": "find", "params": { "contract": "tokens", "table": "balances", "query": {"symbol": "%s"}}, "id": 1}';
                axoptions = { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
                hefindstr = voca_1["default"].sprintf(hefindtemplate, tokensymbol);
                tokenholdersraw = {};
                tokenholdersnorm = {};
                tokenholdersdist = {};
                tokenholdersdistresult = {};
                accumulatedtokenbalance = 0;
                accumulatedpayoutamt = 0;
                _m.label = 1;
            case 1:
                _m.trys.push([1, 25, , 26]);
                return [4, axios_1["default"].post(config.sidechainendpoint, hefindstr, axoptions)];
            case 2:
                tb = _m.sent();
                return [4, sleep(50)];
            case 3:
                _m.sent();
                for (_i = 0, _a = tb.data.result; _i < _a.length; _i++) {
                    i = _a[_i];
                    if (!excludemembers.includes(i.account)
                        && (parseFloat(i.balance) >= 0.001 || parseFloat(i.stake) >= 0.001)) {
                        amt = parseFloat(i.balance) + parseFloat(i.stake);
                        if (amt >= mintokens) {
                            tokenholdersraw[i.account] = amt;
                            accumulatedtokenbalance += Math.min(maxtokens, amt);
                        }
                    }
                }
                for (_b = 0, _c = Object.keys(tokenholdersraw); _b < _c.length; _b++) {
                    i = _c[_b];
                    tokenholdersnorm[i] = Math.min(maxtokens, tokenholdersraw[i]) / accumulatedtokenbalance;
                    amt = distributionamt * tokenholdersnorm[i];
                    if (amt >= minpayout) {
                        tokenholdersdist[i] = amt;
                        accumulatedpayoutamt += amt;
                    }
                }
                if (!!activekey) return [3, 4];
                console.log('Account,                      Holding,       Share,      Dist(' + dasset + ')');
                for (_d = 0, _e = Object.keys(tokenholdersdist); _d < _e.length; _d++) {
                    i = _e[_d];
                    console.log(voca_1["default"].sprintf('@%-25s %10.3f, %10.9f, %10.3f', i + ',', tokenholdersraw[i], tokenholdersnorm[i], tokenholdersdist[i]));
                }
                console.log(voca_1["default"].sprintf('%-25s  %10s, %10s , %10.3f', 'TOTAL' + ',', ' ', ' ', accumulatedpayoutamt));
                return [3, 24];
            case 4:
                hclient = isHive(dassettype) ? new dhive_1.Client(config.blockchainapinode) : new dsteem_1.Client(config.blockchainapinode);
                hasfails = false;
                console.log(dasset + ' distribution to ' + tokensymbol + ' holders.');
                console.log('Account,                      Holding,       Share,       Dist, Result');
                if (!(dassettype === 'HIVE' || dassettype === 'STEEM')) return [3, 13];
                _f = 0, _g = Object.keys(tokenholdersdist);
                _m.label = 5;
            case 5:
                if (!(_f < _g.length)) return [3, 12];
                i = _g[_f];
                _m.label = 6;
            case 6:
                _m.trys.push([6, 8, , 9]);
                return [4, hclient.broadcast.transfer({
                        amount: tokenholdersdist[i].toFixed(3) + ' ' + dassettype,
                        from: daccount,
                        memo: 'Distribution for ' + tokensymbol,
                        to: i
                    }, activekey)];
            case 7:
                _m.sent();
                tokenholdersdistresult[i] = true;
                console.log(voca_1["default"].sprintf('@%-25s %10.3f, %10.9f, %10.3f, %4s', i + ',', tokenholdersraw[i], tokenholdersnorm[i], tokenholdersdist[i], 'DONE'));
                return [3, 9];
            case 8:
                e_1 = _m.sent();
                console.log('@' + i, e_1.message);
                tokenholdersdistresult[i] = false;
                hasfails = true;
                return [3, 9];
            case 9: return [4, sleep(4.25 * 1000)];
            case 10:
                _m.sent();
                _m.label = 11;
            case 11:
                _f++;
                return [3, 5];
            case 12: return [3, 23];
            case 13:
                if (!(dassettype === 'HIVE-ENGINE' || dassettype === 'STEEM-ENGINE')) return [3, 22];
                _h = 0, _j = Object.keys(tokenholdersdist);
                _m.label = 14;
            case 14:
                if (!(_h < _j.length)) return [3, 21];
                i = _j[_h];
                _m.label = 15;
            case 15:
                _m.trys.push([15, 17, , 18]);
                return [4, hclient.broadcast.json({
                        id: (dassettype === 'HIVE-ENGINE' ? 'ssc-mainnet-hive' : 'ssc-mainnet1'),
                        required_auths: [daccount],
                        required_posting_auths: [],
                        json: JSON.stringify({
                            contractName: 'tokens',
                            contractAction: 'transfer',
                            contractPayload: {
                                symbol: dasset,
                                to: i,
                                quantity: tokenholdersdist[i].toFixed(3),
                                memo: 'Distribution for ' + tokensymbol
                            }
                        })
                    }, activekey)];
            case 16:
                _m.sent();
                tokenholdersdistresult[i] = true;
                console.log(voca_1["default"].sprintf('@%-25s %10.3f, %10.9f, %10.3f, %4s', i + ',', tokenholdersraw[i], tokenholdersnorm[i], tokenholdersdist[i], 'DONE'));
                return [3, 18];
            case 17:
                e_2 = _m.sent();
                console.log('@' + i, e_2.message);
                tokenholdersdistresult[i] = false;
                hasfails = true;
                return [3, 18];
            case 18: return [4, sleep(4.25 * 1000)];
            case 19:
                _m.sent();
                _m.label = 20;
            case 20:
                _h++;
                return [3, 14];
            case 21: return [3, 23];
            case 22:
                console.error('CONFIG ERROR: Invalid distributionassettype: ' + dassettype);
                process.exit(-1);
                _m.label = 23;
            case 23:
                if (hasfails) {
                    console.log('\n\n\Fails');
                    for (_k = 0, _l = Object.keys(tokenholdersdistresult); _k < _l.length; _k++) {
                        i = _l[_k];
                        if (!tokenholdersdistresult[i]) {
                            console.log(voca_1["default"].sprintf('@%-25s %10.3f, %10.9f, %10.3f, %4s', i + ',', tokenholdersraw[i], tokenholdersnorm[i], tokenholdersdist[i], 'FAIL'));
                        }
                    }
                }
                else {
                    console.log('All successful.');
                }
                _m.label = 24;
            case 24: return [3, 26];
            case 25:
                e_3 = _m.sent();
                console.log('ERROR');
                console.log(e_3);
                return [3, 26];
            case 26: return [2];
        }
    });
}); })();
function isHive(dassettype) {
    return dassettype === 'HIVE' || dassettype === 'HIVE-ENGINE';
}
function sleep(milliseconds) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve();
                    }, milliseconds);
                })];
        });
    });
}
//# sourceMappingURL=index.js.map