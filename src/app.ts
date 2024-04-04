import './config/env.js'

import express from 'express'
import morgan from 'morgan'
import { contact } from './controller/contact_ctrl.js'

const port = process.env.PORT || 8844
const app = express()

app.use(morgan('tiny'))
app.use(express.json())
app.use('/identify', contact)

app.listen(port, () => {
  console.log(`app running on port ${port}`)
})

export default app