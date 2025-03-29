//env config
process.env.NODE_ENV = "test";
/**npm packages */ 
const request = require("supertest");
/**app import */
const app = require("../app");
const db = require("../db");

let testres;

/**db reset */
beforeEach(async function () {
  await db.query(`DELETE FROM invoices`)
  await db.query(
    "DELETE FROM companies"
  )
  //DATA insert
  const result =await db.query(
    `INSERT INTO companies (code, name, description)
    VALUES('apple', 'Apple Computer', 'Maker of OSX.'),
          ('ibm', 'IBM', 'Big blue.') RETURNING *
    `
  );
  testres = result.rows[0]; //apple
  console.log(testres)
})

afterEach(async function () {
  await db.query(`DELETE FROM invoices`)
  await db.query(
    
    `DELETE FROM companies`
  )
})
describe('GET /companies', function () {
  test('Gets a list of companies', async function () {
    const res = await request(app).get('/companies')
    //statuscode
    expect(res.ok).toBe(true)
    expect(res.body).toEqual([
  {
    'code': 'apple',
    'name': 'Apple Computer',
    'description': 'Maker of OSX.'
  },
  {
    'code': 'ibm',
    'name': 'IBM',
    'description': 'Big blue.'
  }
]

    )
  })
})

describe('GET /companies/:code', function () {
  test('Get a single company', async function () {
    const res = await request(app).get(`/companies/${testres.code}`)
    expect(res.ok).toBe(true)
    expect(res.body.company.code).toEqual("apple")
    expect(res.body.company.name).toEqual("Apple Computer")
    expect(res.body.company.description).toEqual("Maker of OSX.")
      
  })
})

describe('POST /companies', function () {
  test('Create a new company', async function () {
    const res = await request(app).post("/companies").send({
      code:"tesla",
      name: "Tesla",
      description: "e-vehicle company."
    });
    

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
      code: "tesla",
      name: "Tesla",
      description: "e-vehicle company."
      }
    })
  })
})

describe("PUT /companies/:code", function () {
  test("Update an existing company", async function () {
    const res = await request(app)
      .put(`/companies/${testres.code}`)
      .send({
        name: "Updated Apple",
        description: "Updated description"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: "apple",
        name: "Updated Apple",
        description: "Updated description"
      }
    });
  });

  test("Responds with 404 for invalid company", async function () {
    const res = await request(app)
      .put("/companies/nonexistent")
      .send({
        name: "Doesn't matter",
        description: "Still doesn't matter"
      });

    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE / companies/:code", function () {
  test("Deltes a company", async function () {
    const res = await request(app).delete("/companies/apple");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });

  test("Respond with 404 for invalid company", async function () {
    const res = await request(app)
      .put("/companies/nonexistent")
      .send({
        name: "Doesn't matter",
        description: "Still doesn't matter"
      });

    expect(res.statusCode).toBe(404);
  })
})







afterAll(async function () {
  await db.end()
})