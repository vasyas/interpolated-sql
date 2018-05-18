import { expect } from "chai"
import { Sql, enableTrace } from "../src/sql"

const mysql = require("mysql2/promise")

// create databse test

let connection

function exec(parts, ...params) {
    return new Sql(parts, params, () => connection)
}

enableTrace(true)

describe("DB type convert", () => {
    beforeEach(async () => {
        connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            database: "test",
        })

        await exec("drop table test").update()
        await exec("create table test (boolean tinyint(1), jsonField json)").update()
        await exec("insert into test set boolean = 0, jsonField = '{ \"key\": \"value\" }'").update()
    })

    afterEach(() => {
        connection.end()
    })

    it("tinyint to boolean on reading", async () => {
        const val = await exec`
            select boolean from test
        `.scalar()

        expect(val).eql(false)
    })

    it("boolean to tinyint on writing", async () => {
        await exec`
            update test set boolean=${ true }
        `.update()

        const val = await exec`
            select boolean from test
        `.scalar()

        expect(val).eql(true)
    })

    it("constants to boolean", async () => {
        const c1 = await exec`
            select if (1 > 0, TRUE, FALSE) from test
        `.scalar()

        expect(c1).eql(true)

        const c2 = await exec`
            select if (1 > 0, 1, 0) from test
        `.scalar()

        expect(c2).eql(true)
    })

    // large constants will be deduced to larger values
    it("int constants to boolean", async () => {
        const constant = await exec`
            select if (1 > 0, 1, 1000) from test
        `.scalar()

        expect(constant).eql(1)
    })

    it("read json object", async () => {
        const obj = await exec`
            select jsonField from test
        `.scalar()

        expect(typeof obj).eql("object")
    })

    it("supports set object", async () => {
        await exec`
            update test
            set ${{ jsonField: "{}" }}
        `.update()
    })

    // not sure how to support both set and json
    false && it("writes json object", async () => {
        await exec`
            update test
            set jsonField = ${{ key: "value" }}
        `.update()

        const obj = await exec`
            select jsonField from test
        `.scalar()

        expect(obj).to.deep.eql({ key: "value" })
    })

    false && it("supports set with nested json", async () => {
        await exec`
            update test
            set ${{ boolean: 1, jsonField: { key: "value" } }}
        `.update()

        const obj = await exec`
            select jsonField from test
        `.scalar()

        expect(obj).to.deep.eql({ key: "value" })
    })
})