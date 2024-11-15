import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();


const connectDB = async() =>{
    try{
        const conn = await mongoose.connect(process.env.MONGODB_URI)

        console.log(`MongoDB is successfully connected: ${conn.connection.host}`)
    }
    catch(error){
        console.log(error)
    }
}
export default connectDB;