import { setup, TestData } from '../../testData'
import * as db from '../../../server/db'
import { expect } from 'chai'

const data: TestData = {
    partner: {
        chargeBox: {}
    }
}

describe('DB type convert', () => {
    beforeEach(setup(data))

    it('tinyint to boolean on reading', async () => {
        const confirmStart = await db.exec`
            select confirmStart from charge_box
        `.scalar()

        expect(confirmStart).eql(false)
    })

    it('boolean to tinyint on writing', async () => {
        await db.exec`
            update charge_box set confirmStart=${ true }
        `.update()

        const confirmStart = await db.exec`
            select confirmStart from charge_box
        `.scalar()

        expect(confirmStart).eql(true)
    })

    it('constants to boolean', async () => {
        const c1 = await db.exec`
            select if (charge_box_pk > 0, TRUE, FALSE) from charge_box
        `.scalar()

        expect(c1).eql(true)

        const c2 = await db.exec`
            select if (charge_box_pk > 0, 1, 0) from charge_box
        `.scalar()

        expect(c2).eql(true)
    })

    // large constants will be deduced to larger values
    it('int constants to boolean', async () => {
        const constant = await db.exec`
            select if (charge_box_pk > 1, 1, 1000) from charge_box
        `.scalar()

        expect(constant).eql(1)
    })
})