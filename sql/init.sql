CREATE DATABASE identity_reconciliation;

\c identity_reconciliation;

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  linked_id INTEGER,
  link_precedence VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  deleted_at TIMESTAMP DEFAULT NULL
);

CREATE UNIQUE INDEX "contacts_email_phone_number" ON "contacts" ("email", "phone_number")