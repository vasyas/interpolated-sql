"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var sql_1 = require("../src/sql");
var mysql = require("mysql2/promise");
// create databse test
var connection;
function exec(parts) {
    var params = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        params[_i - 1] = arguments[_i];
    }
    return new sql_1.Sql(parts, params, function () { return connection; });
}
sql_1.enableTrace(true);
describe("Update", function () {
    beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mysql.createConnection({
                        host: "localhost",
                        user: "root",
                        database: "test",
                    })];
                case 1:
                    connection = _a.sent();
                    return [4 /*yield*/, exec("drop table test").update()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, exec("create table test (boolean tinyint(1), jsonField json, s varchar(256))").update()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, exec("insert into test set boolean = 0").update()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () {
        connection.end();
    });
    it("return number of updated rows", function () { return __awaiter(_this, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exec(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n            update test set boolean = 1\n        "], ["\n            update test set boolean = 1\n        "]))).update()];
                case 1:
                    rows = _a.sent();
                    chai_1.expect(rows).eql(1);
                    return [4 /*yield*/, exec(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n            update test set boolean = 1\n        "], ["\n            update test set boolean = 1\n        "]))).update()];
                case 2:
                    rows = _a.sent();
                    chai_1.expect(rows).eql(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it("do not update undefined fields", function () { return __awaiter(_this, void 0, void 0, function () {
        var r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exec(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n            update test set ", "\n        "], ["\n            update test set ", "\n        "])), { s: "bla" }).update()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, exec(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n            update test set ", "\n        "], ["\n            update test set ", "\n        "])), { s: undefined, boolean: 1 }).update()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, exec(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n            select s from test\n        "], ["\n            select s from test\n        "]))).scalar()];
                case 3:
                    r = _a.sent();
                    chai_1.expect(r).eql("bla");
                    return [2 /*return*/];
            }
        });
    }); });
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
