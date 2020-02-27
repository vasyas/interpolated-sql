Make SQL queries using JavaScript tagged literals for parameters.

## Example

```
const id = 5
const user = await sql`select * from user where id = ${id}`
```

Best used with MySQL, where you can do
```
const id = await sql`
    insert into user
    set ${{ email: "my@domain.com", role: Role.ADMIN }}
`.insert()
```

## Getting started

Get package
```
yarn install interpolated-sql
```

Create your own exec function, that will bind sql creation and connection handling 

```
import {Sql} from "interpolated-sql"
import mysql from "mysql2/promise"

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "test",
})

function exec(parts, ...params) {
  return new Sql(parts, params, () => connection)
}

async function getUsers() {
    return await exec`select * from users`.all()
}
```

## API

see src/sql.ts

