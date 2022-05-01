//npx babel-node src/server.js
//npx nodemon --exec npx babel-node src/server.js

import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, '/build')));

app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect("mongodb://localhost:27017");
        const db = client.db('my-blog');
        await operations(db);

        await client.close();
    } catch (error) {
        res.status(500).send("Something went wrong!");
    }
}

app.post('/hello', (req, res) => {
    console.log(req.body);
    res.send(`Hello ${req.body.name}!`);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    const articleName = req.params.name;
    try {
        await withDB(async (db) => {
            const articleInfo = await db.collection("articles").findOne({name: articleName});
            await db.collection("articles").updateOne({name: articleName}, {
                '$set': {
                    upvotes: articleInfo.upvotes + 1
                }
            });
            const newArticle = await db.collection("articles").findOne({name: articleName});
            res.status(200).json(newArticle);
        }, res);

    } catch (error) {
        res.status(500).send("Something went wrong!");
    }
})

app.post('/api/articles/:name/comment', async (req, res) => {
    const articleName = req.params.name;
    const comment = req.body.comment;
    const username = req.body.username;
    await withDB(async (db) => {
        const articleInfo = await db.collection("articles").findOne({name: articleName});
        await db.collection("articles").updateOne({name: articleName}, {
            '$set': {
                comments: [...articleInfo.comments, {
                    username: username,
                    comment: comment
                }]
            }
        });
        const newArticle = await db.collection("articles").findOne({name: articleName});
        res.status(200).json(newArticle);
    }, res);
});

app.get('/api/articles/:name', async (req, res) => {
    const articleName = req.params.name;

    await withDB(async (db) => {
        const articleInfo = await db.collection("articles").findOne({name: articleName});
        res.status(200).json(articleInfo);
    }, res);
})

app.get('/hello', (req, res) => res.send("Hello!!!"));

app.get('/hello/:name', (req, res) => res.send(`Hey ${req.params.name}`))

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})

app.listen(8000, () => console.log("Listening on port 8000"));