process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInvoice;

beforeEach(async () => {
  await db.query(`DELETE FROM invoices`);
  await db.query(`DELETE FROM companies`);

  await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.')`);

  const result = await db.query(`
    INSERT INTO invoices (comp_code, amt, paid, paid_date)
    VALUES ('apple', 100, false, null)
    RETURNING *`);
  
  testInvoice = result.rows[0];
});
afterEach(async function () {
  await db.query(`DELETE FROM invoices`)
  await db.query(`DELETE FROM companies`)
  
})

describe("GET /invoices", function () {
  test("Gets a list of invoices", async function () {
    const res = await request(app).get("/invoices");

    expect(res.statusCode).toBe(200);
    expect(res.body.invoices.length).toBeGreaterThanOrEqual(1);
    expect(res.body.invoices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          comp_code: "apple"
        })
      ])
    );
  });
});


describe("GET /invoices/:id", function () {
  test("Gets a single invoice with company info", async function () {
    const res = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice.id,
        amt: 100,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
        company: {
          code: "apple",
          name: "Apple Computer",
          description: "Maker of OSX."
        }
      }
    });
  });

  test("Responds with 404 for invalid invoice ID", async function () {
    const res = await request(app).get(`/invoices/9`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invoices", function () {
  test("Creates a new invoice", async function () {
    const res = await request(app)
      .post("/invoices")
      .send({
        comp_code: "apple",
        amt: 300
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: expect.objectContaining({
        id: expect.any(Number),
        comp_code: "apple",
        amt: 300,
        paid: false,
        add_date: expect.any(String),
        paid_date: null
      })
    });
  });
});


describe("PUT /invoices/:id", () => {
  test("Updates an invoice (paid → unpaid)", async () => {
    const res = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({ amt: 500, paid: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.invoice).toEqual({
      id: testInvoice.id,
      comp_code: testInvoice.comp_code,
      amt: 500,
      paid: false,
      add_date: expect.any(String),
      paid_date: null,
    });
  });

  test("Responds with 404 for invalid invoice", async () => {
    const res = await request(app)
      .put(`/invoices/999999`)
      .send({ amt: 300, paid: true });

    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /invoices/:id", () => {
  test("Deletes a single invoice", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 for invalid invoice", async () => {
    const res = await request(app).delete("/invoices/999999");
    expect(res.statusCode).toBe(404);
  });
});

afterAll(async () => {
  await db.end();
})