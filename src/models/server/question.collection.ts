import { IndexType } from "node-appwrite";
import { db, questionCollection } from "../name";
import { databases } from "./config";
import { Permission } from "appwrite";

export default async function createQuestionCollection() {
    await databases.createCollection(db, questionCollection, questionCollection, [
        Permission.read("any"),
        Permission.read("users"),
        Permission.create("users"),
        Permission.update("users"),
        Permission.delete("users"),
        Permission.write("users"),
    ]);
    console.log("question collection is created");
// attributes and indexes
    await Promise.all([
        databases.createStringAttribute(db, questionCollection , "title" , 100 , true),
        databases.createStringAttribute(db, questionCollection , "content" , 10000 , true),
        databases.createStringAttribute(db, questionCollection , "authorId" , 100 , true),
        databases.createStringAttribute(db, questionCollection , "tags" , 100 , true , undefined , true),
        databases.createStringAttribute(db, questionCollection , "attachmentId" , 100 , true)
    ]);
    console.log("question attriby=ute created");
}
