const express = require("express")
const router = express.Router();
const db = require("../db")

/**Returns list of companies, like {companies: [{code, name}, ...]} */
router.get("/", async function (req, res, next) {
  try {  const results = await db.query(
    `SELECT * FROM companies`
  )
  return res.json(results.rows);
    
  }catch(e){
    return next(e)
  }

})
/** Return obj of company: {company: {code, name, description}}
If the company given cannot be found, this should return a 404 status response. */
router.get("/:code", async function (req, res, next) {
  const { code } = req.params;
  try {
  const results = await db.query(
    `SELECT * FROM companies WHERE code=$1 `,[code] 
    )
    //404 handler
    if (results.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: `company code ${code} is not in the list`,
          status: 404
        }
      })
    }
    const invoiceres = await db.query(
      `SELECT id FROM invoices WHERE COMP_CODE=$1`,[code]
    )
    const company = results.rows[0];
    company.invoices= invoiceres.rows.map(r =>r.id)
    return res.json({company})
  } catch (e) {
    return next(e)
  }
})

/**Adds a company. Needs to be given JSON like: {code, name, description} Returns obj of new company:  {company: {code, name, description}} */
router.post('/', async function (req, res, next) {
  try {
    const {code, name, description} = req.body
    const results = await db.query(
      `INSERT INTO companies (code, name, description)
      VALUES ($1,$2,$3) RETURNING *`,[code,name,description]
    )
    return res.status(201).json({added:results.rows[0]})
    
  } catch(e) {
    return next(e)
  }
})

/**Edit existing company. Should return 404 if company cannot be found.
Needs to be given JSON like: {name, description} Returns update company object: {company: {code, name, description}} */
router.put('/:code', async function (req, res, next) {
  try {
    const { code } = req.params
    const {name, description} = req.body
    //check 
    const check = await db.query(
      `SELECT * FROM companies WHERE code =$1`,[code]
    )
    if (check.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: `company for ${code} not found`,
          status: 404
        }
      });
    }
    const results = await db.query(
      `UPDATE companies SET name =$1, description =$2 WHERE code = $3 RETURNING *`,[name,description,code]
    )
    return res.json({
      Update:results.rows[0]
    })
  } catch (e) {
    return next(e)
  }
})

/**Deletes company. Should return 404 if company cannot be found.
Returns {status: "deleted"} */
router.delete('/:code', async function (req, res, next) {
  const {code}=req.params
const result = await db.query(
  `DELETE FROM companies WHERE code = $1 RETURNING code`,
  [code]
);

if (result.rows.length === 0) {
  return res.status(404).json({ error: "Company not found" });
}

return res.json({ status: "deleted" });
})


module.exports = router;