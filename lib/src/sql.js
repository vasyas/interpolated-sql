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
Object.defineProperty(exports, "__esModule", { value: true });
var missingConnectionSupplier = function () { throw new Error("Sql does not have connection provided. Use ctx.sql to create initial Sql."); };
var Sql = /** @class */ (function () {
    function Sql(parts, params, connectionSupplier) {
        if (connectionSupplier === void 0) { connectionSupplier = missingConnectionSupplier; }
        this.params = params;
        this.connectionSupplier = connectionSupplier;
        if (!Array.isArray(parts)) {
            parts = [parts];
        }
        this.parts = parts;
        this.params = params;
        this.connectionSupplier = connectionSupplier;
        this.handleArrayParams();
    }
    /** Replace array params (i.e. in(${[1, 2]})) with multiple params, b/c node-mysql2 doesn't support it */
    Sql.prototype.handleArrayParams = function () {
        this.parts = this.parts.slice();
        this.params = this.params.slice();
        for (var i = 0; i < this.params.length; i++) {
            var arrayParam = this.params[i];
            if (Array.isArray(arrayParam)) {
                (_a = this.params).splice.apply(_a, [i, 1].concat(arrayParam));
                if (arrayParam.length > 1) {
                    var placeHolders = new Array(arrayParam.length - 1);
                    placeHolders.fill(", ");
                    (_b = this.parts).splice.apply(_b, [i + 1, 0].concat(placeHolders));
                }
            }
        }
        var _a, _b;
    };
    Sql.prototype.append = function (right, connectionSupplier) {
        if (connectionSupplier === void 0) { connectionSupplier = this.connectionSupplier; }
        if (!right) {
            return this;
        }
        if (typeof right == "string") {
            return this.append(new Sql([right], []));
        }
        if (right instanceof Sql) {
            // combine two sqls
            var _a = right.parts, concat = _a[0], remaining = _a.slice(1);
            if (this.parts.length == 1) {
                return new Sql([this.parts[0] + " " + concat].concat(remaining), right.params, connectionSupplier);
            }
            var parts = this.parts.slice(0, this.parts.length - 1).concat([this.parts[this.parts.length - 1] + " " + concat], remaining);
            var params = this.params.concat(right.params);
            return new Sql(parts, params, connectionSupplier);
        }
        throw new Error("Can\"t append " + right);
    };
    Sql.prototype.wrap = function (left, right) {
        var l = left.append(this, this.connectionSupplier);
        return l.append(right);
    };
    Sql.prototype.count = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.aggregate({ count: "count(*)" })];
                    case 1: return [2 /*return*/, (_a.sent()).count];
                }
            });
        });
    };
    Sql.prototype.aggregate = function (aggregations) {
        return __awaiter(this, void 0, void 0, function () {
            var exprs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        exprs = Object.keys(aggregations)
                            .map(function (k) { return aggregations[k] + " as " + k; });
                        return [4 /*yield*/, this.wrap(sql("select " + exprs.join(",") + " from ("), sql(templateObject_1 || (templateObject_1 = __makeTemplateObject([") as t"], [") as t"])))).one({})];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Sql.prototype.one = function (def) {
        if (def === void 0) { def = undefined; }
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.all()];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, rows[0] || def];
                }
            });
        });
    };
    Sql.prototype.scalar = function () {
        return __awaiter(this, void 0, void 0, function () {
            var row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.one()];
                    case 1:
                        row = _a.sent();
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, row[Object.keys(row)[0]]];
                }
            });
        });
    };
    // convert undefined to nulls
    Sql.prototype.prepareQueryParams = function () {
        return this.params
            .map(function (p) { return typeof p == "undefined" ? null : p; });
    };
    Sql.prototype.prepareQuery = function () {
        return this.parts.join("?").trim();
    };
    Sql.prototype.all = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connection, _a, rows, fields;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.connectionSupplier()];
                    case 1:
                        connection = _b.sent();
                        if (trace) {
                            console.log(interp.apply(void 0, [this.parts].concat(this.params)));
                        }
                        return [4 /*yield*/, connection.execute(this.prepareQuery(), this.prepareQueryParams())];
                    case 2:
                        _a = _b.sent(), rows = _a[0], fields = _a[1];
                        this.convertTypesOnReading(rows, fields);
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    Sql.prototype.convertTypesOnReading = function (rows, fields) {
        var booleanFieldNames = [];
        if (!fields)
            return;
        fields.forEach(function (field) {
            var columnType = field.columnType, columnLength = field.columnLength, name = field.name;
            var bool = (columnType == 1 || columnType == 8) && columnLength == 1;
            if (bool)
                booleanFieldNames.push(name);
        });
        if (booleanFieldNames.length == 0)
            return;
        rows.forEach(function (row) {
            booleanFieldNames.forEach(function (fieldName) {
                row[fieldName] = row[fieldName] === null ? null : row[fieldName] == 1;
            });
        });
    };
    Sql.prototype.insert = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connection, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connectionSupplier()];
                    case 1:
                        connection = _a.sent();
                        return [4 /*yield*/, connection.query(this.prepareQuery(), this.prepareQueryParams())];
                    case 2:
                        r = (_a.sent())[0];
                        return [2 /*return*/, r.insertId];
                }
            });
        });
    };
    Sql.prototype.update = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connection, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (trace) {
                            console.log(interp.apply(void 0, [this.parts].concat(this.params)));
                        }
                        return [4 /*yield*/, this.connectionSupplier()];
                    case 1:
                        connection = _a.sent();
                        return [4 /*yield*/, connection.query(this.prepareQuery(), this.prepareQueryParams())];
                    case 2:
                        r = (_a.sent())[0];
                        return [2 /*return*/, r.changedRows];
                }
            });
        });
    };
    Sql.prototype.page = function (request, totalAggregations) {
        if (totalAggregations === void 0) { totalAggregations = { count: "count(*)" }; }
        return __awaiter(this, void 0, void 0, function () {
            var sort, order, size, page, totals, rowsQuery, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sort = request.sort, order = request.order, size = request.size, page = request.page;
                        return [4 /*yield*/, this.aggregate(totalAggregations)];
                    case 1:
                        totals = _a.sent();
                        rowsQuery = this.append(sort && sql("order by " + sort + " " + order)).append(size && sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["limit ", ""], ["limit ", ""])), size)).append(page && sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["offset ", ""], ["offset ", ""])), page * size));
                        return [4 /*yield*/, rowsQuery.all()];
                    case 2:
                        rows = _a.sent();
                        return [2 /*return*/, { rows: rows, totals: totals }];
                }
            });
        });
    };
    return Sql;
}());
exports.Sql = Sql;
function sql(parts) {
    var params = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        params[_i - 1] = arguments[_i];
    }
    return new Sql(parts, params);
}
exports.sql = sql;
function interp(parts) {
    var params = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        params[_i - 1] = arguments[_i];
    }
    function str(o) {
        if (typeof o == "object" && !(o instanceof Date)) {
            return JSON.stringify(o);
        }
        return "" + o;
    }
    return parts.reduce(function (accumulator, part, i) {
        return accumulator + params[i - 1] + str(part);
    }).trim();
}
var trace = false;
function enableTrace(enabled) {
    trace = enabled;
}
exports.enableTrace = enableTrace;
var templateObject_1, templateObject_2, templateObject_3;
