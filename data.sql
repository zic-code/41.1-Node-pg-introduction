

DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);


CREATE TABLE industries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);


CREATE TABLE companies_industries (
  comp_code TEXT REFERENCES companies ON DELETE CASCADE,
  industry_code TEXT REFERENCES industries ON DELETE CASCADE,
  PRIMARY KEY (comp_code, industry_code)
);

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);
INSERT INTO industries (code, name)
VALUES 
  ('tech', 'Technology'),
  ('finance', 'Finance'),
  ('auto', 'Automotive');

-- Sample associations (many-to-many between companies and industries)
INSERT INTO companies_industries (comp_code, industry_code)
VALUES 
  ('apple', 'tech'),
  ('ibm', 'tech'),
  ('ibm', 'finance');