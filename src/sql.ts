export interface Page<T> {
    rows: T[]
    totals: {
        count: number
    }
}

export interface PageRequest {
    page?: number
    size?: number
    sort?: string
    order?: string
}

export type ConnectionSupplier = () => any

const missingConnectionSupplier: ConnectionSupplier = () => { throw new Error("Sql does not have connection provided. Use ctx.sql to create initial Sql.") }

export class Sql {
    parts: string[]

    constructor(parts, private params, private connectionSupplier: ConnectionSupplier = missingConnectionSupplier) {
        if (!Array.isArray(parts)) {
            parts = [ parts ]
        }

        this.parts = parts
        this.params = params
        this.connectionSupplier = connectionSupplier

        this.handleArrayParams()
    }

    /** Replace array params (i.e. in(${[1, 2]})) with multiple params, b/c node-mysql2 doesn't support it */
    private handleArrayParams() {
        this.parts = this.parts.slice()
        this.params = this.params.slice()

        for (let i = 0; i < this.params.length; i ++) {
            const arrayParam = this.params[i]

            if (Array.isArray(arrayParam)) {
                this.params.splice(i, 1, ...arrayParam)

                if (arrayParam.length > 1) {
                    const placeHolders = new Array(arrayParam.length - 1)
                    placeHolders.fill(", ")

                    this.parts.splice(i + 1, 0, ...placeHolders)
                }
            }
        }
    }

    append(right: string | Sql, connectionSupplier: ConnectionSupplier = this.connectionSupplier): Sql {
        if (!right) {
            return this
        }

        if (typeof right == "string") {
            return this.append(new Sql([ right ], []))
        }

        if (right instanceof Sql) {
            // combine two sqls
            const [ concat, ...remaining ] = right.parts

            if (this.parts.length == 1) {
                return new Sql([ this.parts[0] + " " + concat, ...remaining ], right.params, connectionSupplier)
            }

            const parts = [ ...this.parts.slice(0, this.parts.length - 1), this.parts[ this.parts.length - 1 ] + " " + concat, ...remaining ]
            const params = this.params.concat(right.params)

            return new Sql(parts, params, connectionSupplier)
        }

        throw new Error(`Can"t append ${right}`)
    }

    wrap(left: Sql, right: Sql): Sql {
        const l = left.append(this, this.connectionSupplier)

        return l.append(right)
    }

    async count(): Promise<number> {
        return (await this.aggregate({ count: "count(*)" })).count
    }

    async aggregate<T extends { [x: string]: string }>(aggregations: T): Promise<{ [x in keyof T]: number }> {
        const exprs = Object.keys(aggregations)
            .map(k => `${ aggregations[k] } as ${ k }`)

        return await this.wrap(
            sql(`select ${ exprs.join(",") } from (`),
            sql`) as t`
        ).one({ }) as any
    }

    async one(def = undefined): Promise<any> {
        const rows = await this.all()

        return rows[0] || def
    }

    async scalar(): Promise<any> {
        const row = await this.one()

        if (!row) return undefined

        return row[Object.keys(row)[0]]
    }

    // convert undefined to nulls
    private getQueryParams() {
        return this.params
            .map(p => typeof p == "undefined" ? null : p)

    }
    private getQuery() {
        return this.parts.join("?").trim()
    }

    async all(): Promise<any[]> {
        const connection = await this.connectionSupplier()

        // console.log(interp(this.parts, ...this.params))

        const [ rows, fields ] = await connection.execute(this.getQuery(), this.getQueryParams())

        this.convertTypesOnReading(rows, fields)

        return rows
    }

    private convertTypesOnReading(rows, fields) {
        const booleanFieldNames = []

        if (!fields) return

        fields.forEach(field => {
            const { columnType, columnLength, name } = field

            const bool = (columnType == 1 || columnType == 8) && columnLength == 1

            if (bool)
                booleanFieldNames.push(name)
        })

        if (booleanFieldNames.length == 0) return

        rows.forEach(row => {
            booleanFieldNames.forEach(fieldName => {
                row[ fieldName ] = row[ fieldName ] === null ? null : row[ fieldName ] == 1
            })
        })
    }

    async insert(): Promise<number> {
        const connection = await this.connectionSupplier()

        const [ r ] = await connection.query(this.getQuery(), this.getQueryParams())

        return r.insertId
    }

    async update() {
        // console.log(interp(this.parts, ...this.params))

        const connection = await this.connectionSupplier()

        await connection.query(this.getQuery(), this.getQueryParams())
    }

    async page(request: PageRequest, totalAggregations: { count: string, [x: string]: string } = { count: "count(*)" }): Promise<Page<any>> {
        const { sort, order, size, page } = request

        // TODO parallel?
        const totals = await this.aggregate(totalAggregations)

        const rowsQuery = this.append(
            sort && sql(`order by ${sort} ${order}`)
        ).append(size &&
            sql`limit ${size}`
        ).append(page &&
            sql`offset ${page * size}`
        )

        const rows = await rowsQuery.all()

        return { rows, totals }
    }
}

export function sql(parts, ...params) {
    return new Sql(parts, params)
}

function interp(parts, ...params) {
    return parts.reduce((accumulator, part, i) => {
        return accumulator + params[i - 1] + part
    })
}