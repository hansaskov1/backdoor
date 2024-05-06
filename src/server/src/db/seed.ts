import { db } from "./sqlite";
import * as schema from "./schema";
import { Role } from "./schema";


const userData = [
    {
        username: "admin",
        password: await Bun.password.hash("admin"),
        apartment: "2TH",
        role: Role.ADMIN
    },
    {
        username: "user",
        password: await Bun.password.hash("user"),
        apartment: "None",
        role: Role.SERVICE_PERSONNEL
    },
    {
        username: "simone",
        password: await Bun.password.hash("simone"),
        apartment: "4ST",
        role: Role.RESIDENT
    },
    {
        username: "hans",
        password: await Bun.password.hash("hans"),
        apartment: "4ST",
        role: Role.RESIDENT
    },
    {
        username: "seb",
        password: await Bun.password.hash("seb"),
        apartment: "3.35",
        role: Role.RESIDENT
    }
]

const lockData = [
    {
        name: "Main door"
    },
    {
        name: "Back door"
    },
    {
        name: "Service door"
    },
    {
        name: "Garage door"
    }
]

for (const data of userData) {
    // check for potential duplicates
    try {
        db.insert(schema.users).values(data).run();
        console.log(`User ${data.username} inserted successfully.`);
    } catch (error) {
        // Handle error if insert fails due to duplicate entry
        console.error(`Error inserting user ${data.username}: ${(error as Error).message}`);
    }
}



for (const locks of lockData) {
    // check for potential duplicates
    try {
        db.insert(schema.locks).values(locks).run();
        console.log(`Lock ${locks.name} inserted successfully.`);
    } catch (error) {
        // Handle error if insert fails due to duplicate entry
        console.error(`Error inserting lock ${locks.name}: ${(error as Error).message}`);
    }
}



//query to delete all users and locks
//db.delete(schema.users).all();   
// db.delete(schema.locks).all(); 
const users = db.select().from(schema.users).all()
const locks = db.select().from(schema.locks).all()
console.log(users)
console.log(locks)

