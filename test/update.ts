import { expect } from "chai"
import { Sql, enableTrace } from "../src/sql"

const mysql = require("mysql2/promise")

// create databse test

let connection

function exec(parts, ...params) {
    return new Sql(parts, params, () => connection)
}

enableTrace(true)

describe("Update", () => {
    beforeEach(async () => {
        connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            database: "test",
        })

        await exec("drop table test").update()
        await exec("create table test (boolean tinyint(1), jsonField json)").update()
        await exec("insert into test set boolean = 0").update()
    })

    afterEach(() => {
        connection.end()
    })

    it("return number of updated rows", async () => {
        let rows = await exec`
            update test set boolean = 1
        `.update()

        expect(rows).eql(1)

        rows = await exec`
            update test set boolean = 1
        `.update()

        expect(rows).eql(0)
    })
})