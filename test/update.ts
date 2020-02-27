import {expect} from "chai"
import {Sql, enableTrace} from "../src/sql"

const mysql = require("mysql2/promise")

// create databse test

let connection: any

function exec(parts: TemplateStringsArray | string, ...params: any[]) {
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
    await exec("create table test (boolean tinyint(1), jsonField json, s varchar(256))").update()
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

  it("do not update undefined fields", async () => {
    await exec`
            update test set ${{s: "bla"}}
        `.update()

    await exec`
            update test set ${{s: undefined, boolean: 1}}
        `.update()

    const r = await exec`
            select s from test
        `.scalar()

    expect(r).eql("bla")
  })
})
