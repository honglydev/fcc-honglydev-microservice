require('dotenv').config();

console.log(process.env.DB_URI)

const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const dns = require('dns');
const urlparser = require('url');
const { MongoClient } = require('mongodb');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

let db;
// Basic Configuration
try {
    const client = new MongoClient(process.env.DB_URI);
    db = client.db("urlshortener")
} catch (err) {
    console.log(err)
}
const urls = db.collection("urls")

const port = process.env.PORT || 5000;

// Model
const schema = new mongoose.Schema(
    {
        original: { type: String, required: true },
        short: { type: Number, required: true }
    }
);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get("/api/shorturl/:input", async (req, res) => {
    const input = parseInt(req.params.input);
    
    await urls.findOne({ short_url: input }, function (err, data) {
        if (err || data === null) return res.json({"error":"No short URL found for the given input"})
        return res.redirect(data.url);
    });
    
})

app.post("/api/shorturl", async (req, res) => {
    const url = req.body.url;
    dns.lookup(urlparser.parse(url).hostname, 
    async (err, address) => {
        if(!address){
            res.json({"error": "Invalid URL"})
        }
        else{
            const urlCount = await urls.countDocuments({})
            const urlDoc = {
                url, 
                short_url: urlCount
            }
            const result = await urls.insertOne(urlDoc)
            console.log(result);
            res.json({original_url : url, short_url : urlCount})
        }
    });

});

app.use((req, res, next) => {
    res.status(404).send('Not Found');
    next()
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});