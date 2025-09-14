


import express from 'express'

import { type Request, type Response } from 'express';

 import ingestRoutes from './routes/ingest.routes.ts'


const app = express()

const PORT=8000;

 
app.use('/api/v1', ingestRoutes );


app.get("/", ( req:Request, res:Response)=>{

    res.status(200).json({
        message:"Welcome to Log backend"
    }) 
})



app.listen(PORT,()=>{

    console.log("Server is running on port : ", PORT);
})