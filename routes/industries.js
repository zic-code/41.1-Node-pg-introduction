const express = require("express");
const router = new express.Router();
const db = require("../db");
const slugify = require("slugify");


// GET /industries : list industries with companies
router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(`
      SELECT i.code, i.name, ci.comp_code
      FROM industries AS i
      LEFT JOIN companies_industries AS ci ON i.code = ci.industry_code
      ORDER BY i.code
    `);

   
    const industryMap = {};

    for (let row of result.rows) {
      if (!industryMap[row.code]) {
        industryMap[row.code] = {
          code: row.code,
          name: row.name,
          companies: [],
        };
      }
      if (row.comp_code) {
        industryMap[row.code].companies.push(row.comp_code);
      }
    }

    return res.json({ industries: Object.values(industryMap) });

  } catch (e) {
    return next(e);
  }
});


// POST /industries : add a new industry
router.post("/", async function (req, res, next) {
  try {
    const { name } = req.body;
    const code = slugify(name, { lower: true });

    const result = await db.query(
      `INSERT INTO industries (code, name)
       VALUES ($1, $2)
       RETURNING code, name`,
      [code, name]
    );

    return res.status(201).json({ industry: result.rows[0] });

  } catch (e) {
    return next(e);
  }
});

// POST /industries/:code : associate an industry with a company
router.post("/:code", async function (req, res, next) {
  try {
    const industryCode = req.params.code;
    const { company_code } = req.body;


    const industryCheck = await db.query(
      `SELECT code FROM industries WHERE code = $1`,
      [industryCode]
    );
    const companyCheck = await db.query(
      `SELECT code FROM companies WHERE code = $1`,
      [company_code]
    );

    if (industryCheck.rows.length === 0 || companyCheck.rows.length === 0) {
      return res.status(404).json({ error: "Invalid industry or company code" });
    }

 
    await db.query(
      `INSERT INTO companies_industries (company_code, industry_code)
       VALUES ($1, $2)`,
      [comp_code, industryCode]
    );

    return res.status(201).json({ status: "added" });

  } catch (e) {
    return next(e);
  }
});


module.exports = router;