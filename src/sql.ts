export interface Count {
    count: number
}

export interface Page<R, T extends Count = Count> {
    rows: R[]
    totals: T
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

    async first(def = undefined): Promise<any> {
        return this.one(def)
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

    // 1. convert top-level undefined to nulls
    // 2. drop undefined from query params
    private prepareQueryParams() {
        return this.params
            .map(p => p === undefined ? null : p)
            .map(filterOutUndefinedProps)

    }
    private prepareQuery() {
        return this.parts.join("?").trim()
    }

    async all(): Promise<any[]> {
        const connection = await this.connectionSupplier()

        if (trace) {
            console.log(interp(this.parts, ...this.params))
        }

        const [ rows, fields ] = await connection.execute(this.prepareQuery(), this.prepareQueryParams())

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

        const [ r ] = await connection.query(this.prepareQuery(), this.prepareQueryParams())

        return r.insertId
    }

    async update(): Promise<number> {
        if (trace) {
            console.log(interp(this.parts, ...this.params))
        }

        const connection = await this.connectionSupplier()

        const [ r ] = await connection.query(this.prepareQuery(), this.prepareQueryParams())

        return r.changedRows
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

    async prevNextIds(id: number): Promise<Array<{ id: number, rowNum: number }>> {
        const rowNums = this.wrap(sql`
            select id, rowNum
            from (
                select @rowNum := @rowNum + 1 as rowNum, id
                from 
                    (select @rowNum := 0) as i,
                    (`,
            sql`) as t ) as rowNums`
        )

        const { rowNum } = await rowNums
            .append(`where id = ${ id }`)
            .one()

        let rows

        if (rowNum == 1) {
            return [
                { id: null },
                ...await rowNums
                    .append(`limit 2`)
                    .append(`offset ${ rowNum - 1 }`)
                    .all(),
                { id: null },
            ]
        } else {
            rows = await rowNums
                .append(`limit 3`)
                .append(`offset ${ rowNum - 2 }`)
                .all()
        }

        if (rows.length < 3) { // end of rows
            rows.push({ id: null })
        }

        return rows
    }
}

export function sql(parts, ...params) {
    return new Sql(parts, params)
}

function interp(parts, ...params) {
    function str(o) {
        if (typeof o == "object" && !(o instanceof Date)) {
            return JSON.stringify(o)
        }

        return "" + o
    }

    return parts.reduce((accumulator, part, i) => {
        return accumulator + params[i - 1] + str(part)
    }).trim()
}

let trace = false

export function enableTrace(enabled) {
    trace = enabled
}

function filterOutUndefinedProps(o) {
    if (!o) return o

    for (const key in o) {
        if (o.hasOwnProperty(key) && o[key] === undefined) {
            delete o[key]
        }
    }

    return o
}