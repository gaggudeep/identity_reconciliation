import {ConnectOptions, connect} from "mongoose";

const connString = process.env.MONGO_URI || ""
const opts: ConnectOptions = {
  maxPoolSize: 4,
}

let db;
try {
  db = await connect(connString, opts)
} catch (err) {
  console.error("mongodb client unable to connect ", err)
}

export default db