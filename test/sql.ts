import '../../server/logger';

import { expect } from 'chai';
import { Sql } from '../../server/db';

describe('Sql generation', () => {
    let testQuery, testParams;

    async function testSql(parts, ...params) {
        const sql = new Sql(parts, params, async () => {
            return {
                execute: async (q, p) => {
                    testQuery = q;
                    testParams = p;

                    return [ ];
                }
            };
        });

        await sql.all();
    }

    it('Convert array to multiple placeholders', async () => {
        await testSql`select pk from test where pk in (${[1, 2, 3]})`;
        expect(testQuery).eql('select pk from test where pk in (?, ?, ?)');
        expect(testParams).eql([1, 2, 3]);
    });
});
