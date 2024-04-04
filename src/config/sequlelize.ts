import { Options, Sequelize, Dialect } from "sequelize";


const opts: Options = {
  host: process.env.DB_ADDR,
  dialect: process.env.DB_DIALECT as Dialect,
}
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  opts
)

try {
  await sequelize.authenticate()
  console.log('db connection established successfully')
} catch (err) {
  console.error('unable to connect to the db: ', err)
  process.exit(1)
}

export default sequelize