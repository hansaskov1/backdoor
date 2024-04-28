import { db } from "./sqlite";
import * as schema from "./schema";


const data = [
    {
        username: "admin",
        password: await Bun.password.hash("admin"),
        apartment: "2TH"
    },
    {
        username: "user",
        password: await Bun.password.hash("user"),
        apartment: "4ST"
    },
    {
        username: "simone",
        password: await Bun.password.hash("simone"),
        apartment: "4ST"
    },
    {
        username: "hans",
        password: await Bun.password.hash("hans"),
        apartment: "4ST"
    }
]


db.insert(schema.users).values(data).run()
const users = db.select().from(schema.users).all()
console.log(users)

