/** Database setup for BizTime. */
require("dotenv").config();
const { Client } = require("pg")

let db;

if (process.env.NODE_ENV === "test") {
  db = new Client({
  connectionString: process.env.DATABASE_URL_TEST
})

} else {
  db = new Client({
    connectionString: process.env.DATABASE_URL
  })
}

db.connect();
module.exports = db;