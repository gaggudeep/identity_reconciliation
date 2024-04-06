import './config/env.js'
import express from 'express'
import morgan from 'morgan'
import { contact } from './controller/contact_ctrl.js'
import { sequelize } from './config/sequlelize.js'

const port = process.env.PORT || 8844
const app = express()

app.use(morgan('tiny'))
app.use(express.json())
app.use('/identify', contact)

try {
  await sequelize.authenticate()
  console.log('db connection established successfully')
} catch (err) {
  console.error('unable to connect to the db: ', err)
  process.exit(1)
}
try {
  await sequelize.sync()
} catch (err) {
  console.error('unable to sync models to the db: ', err)
  process.exit(1)
}

app.listen(port, () => {
  console.log(`app running on port ${port}`)
})

export default app