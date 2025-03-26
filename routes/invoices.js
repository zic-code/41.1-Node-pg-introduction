const express = require("express")
const router = express.Router();
const db = require("../db")

/**GET /invoices : Return info on invoices: like {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res, next) {
  try {  const results = await db.query(
    `SELECT * FROM invoices`
  )
  return res.json(results.rows);
    
  }catch(e){
    return next(e)
  }

})
/**GET /invoices/[id] : Returns obj on given invoice.
If invoice cannot be found, returns 404. Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}} */
router.get("/:id", async function (req, res, next) {
  try {
  const results = await db.query(
    `SELECT * FROM invoices WHERE id=$1 `,[req.params.id] 
    )
    //404 handler
    if (results.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: `invoice id ${req.params.id} is not in the list`,
          status: 404
        }
      })
    }
    return res.json(results.rows);
  } catch (e) {
    return next(e)
  }
})

/**POST /invoices : Adds an invoice. Needs to be passed in JSON body of: {comp_code, amt}
Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.post('/', async function (req, res, next) {
  try {
    const {comp_code,amt} = req.body
    const results = await db.query(
      `INSERT INTO invoices (comp_code,amt)
      VALUES ($1,$2) RETURNING *`,[comp_code,amt]
    )
    return res.status(201).json({added:results.rows[0]})
    
  } catch(e) {
    return next(e)
  }
})

/**PUT /invoices/[id] : Updates an invoice. If invoice cannot be found, returns a 404.
Needs to be passed in a JSON body of {amt} Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.put('/:id', async function (req, res, next) {
  try {
    const { id } = req.params
    const {amt} = req.body
    //check 
    const check = await db.query(
      `SELECT * FROM invoices WHERE id =$1`,[id]
    )
    if (check.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: `company for ${id} not found`,
          status: 404
        }
      });
    }
    const results = await db.query(
      `UPDATE invoices SET amt =$1 WHERE id = $2 RETURNING *`,[amt,id]
    )
    return res.json({
      Update:results.rows[0]
    })
  } catch (e) {
    return next(e)
  }
})

/**DELETE /invoices/[id] : Deletes an invoice.If invoice cannot be found, returns a 404. Returns: {status: "deleted"} Also, one route from the previous part should be updated: */
router.delete('/:id', async function (req, res, next) {
  const {id}=req.params
const result = await db.query(
  `DELETE FROM invoices WHERE id = $1 RETURNING *`,
  [id]
);

if (result.rows.length === 0) {
  return res.status(404).json({ error: "Company not found" });
}

return res.json({ status: "deleted" });
})


module.exports = router;