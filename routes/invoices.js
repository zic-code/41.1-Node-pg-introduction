const express = require("express")
const router = express.Router();
const db = require("../db")

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query("SELECT * FROM invoices");
    return res.json({ invoices: results.rows }); 
  } catch (e) {
    return next(e);
  }
});
router.get("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date,
              c.code AS company_code, c.name, c.description
       FROM invoices AS i
       LEFT JOIN companies AS c ON i.comp_code = c.code
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Invoice id ${id} not found` });
    }

    const row = result.rows[0];

    return res.json({
      invoice: {
        id: row.id,
        amt: row.amt,
        paid: row.paid,
        add_date: row.add_date,
        paid_date: row.paid_date,
        company: {
          code: row.company_code,
          name: row.name,
          description: row.description
        }
      }
    });

  } catch (e) {
    return next(e);
  }
});

/**POST /invoices : Adds an invoice. Needs to be passed in JSON body of: {comp_code, amt}
Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.post('/', async function (req, res, next) {
  try {
    const {comp_code,amt} = req.body
    const results = await db.query(
      `INSERT INTO invoices (comp_code,amt)
      VALUES ($1,$2) RETURNING *`,[comp_code,amt]
    )
    return res.status(201).json({invoice:results.rows[0]})
    
  } catch(e) {
    return next(e)
  }
})


/** Updates an invoice. 
 * If invoice cannot be found, returns a 404.
 * Needs to be passed in a JSON body of {amt, paid}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.put("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const { amt, paid } = req.body;

    const currResult = await db.query(
      `SELECT paid, paid_date FROM invoices WHERE id = $1`,
      [id]
    );

    if (currResult.rows.length === 0) {
      return res.status(404).json({ error: `Invoice ${id} not found` });
    }

    const currPaid = currResult.rows[0].paid;
    let paidDate = null;

    if (!currPaid && paid === true) {
      paidDate = new Date();
    } else if (currPaid && paid === false) {
      paidDate = null; // 
    } else {
      paidDate = currResult.rows[0].paid_date; 
    }

    const result = await db.query(
      `UPDATE invoices 
      SET amt=$1, paid=$2, paid_date=$3 
      WHERE id=$4 
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );

    return res.json({ invoice: result.rows[0] });

  } catch (e) {
    console.error(e)
    return next(e);
  }
});

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