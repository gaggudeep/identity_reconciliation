import { Options, Sequelize, Dialect } from "sequelize";


const opts: Options = {
  host: process.env.DB_ADDR,
  dialect: (process.env.DB_DIALECT ?? 'postgres') as Dialect,
}
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  opts
)
