import {expect} from "chai"
import {Sql} from "../src/sql"

describe("Sql generation", () => {
  let testQuery: string
  let testParams: any[]

  async function testSql(parts: TemplateStringsArray, ...params: any[]) {
    const sql = new Sql(parts, params, async () => {
      return {
        execute: async (q: string, p: any[]) => {
          testQuery = q
          testParams = p

          return []
        },
      }
    })

    await sql.all()
  }

  it("Convert array to multiple placeholders", async () => {
    await testSql`select pk from test where pk in (${[1, 2, 3]})`
    expect(testQuery).eql("select pk from test where pk in (?, ?, ?)")
    expect(testParams).eql([1, 2, 3])
  })
})
