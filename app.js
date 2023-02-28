require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const _ = require('lodash');
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/nextWordDB");

const listSchema = {
    listName: String,
    words: [String]
};

const List = mongoose.model("list", listSchema);

const defaultList = List({
    listName: "default",
    words: ["apple", "book", "banana", "animal"]
});

app.get("/", function(req, res) {
    res.render("index", {list: defaultList});
})

app.get("/add/:word", async function(req, res) {
    const word = req.params.word;

    const index = defaultList.words.indexOf(word);
    if(index > -1) {
        defaultList.words.splice(index, 1);
        const foundList = await List.findOne({listName: defaultList.listName}).exec();
        foundList.words.push(word);
        await foundList.save();
    }
    
    res.redirect("/");
})

app.get("/remove/:word", function(req, res) {
    const word = req.params.word;
    const index = defaultList.words.indexOf(word);
    if(index > -1) {
        defaultList.words.splice(index, 1);
    }

    res.redirect("/");
})

function removeDone(wordsRaw, existingWords) {
    // console.log(existingWords);
    return wordsRaw.filter(word =>
        existingWords.indexOf(word) === -1);
}

app.post("/page", function(req, res) {
    
    const apiEndpoint = process.env.API_END_URL;
    const apiKey = process.env.API_KEY;
    const base64img = req.body.base64page;

    const options = {
        'method': 'POST',
        'url': apiEndpoint,
        'headers': {
            'apikey': apiKey
        },
        formData: {
            'base64Image': base64img
        }
    };

    request(options, async function(err, response) {
        if(err) {
            console.log(err);
        } else {
            const parsedRes = JSON.parse(response.body);
            const parsedText = parsedRes.ParsedResults[0].ParsedText;
            const lowerText = _.lowerCase(parsedText);
            const wordsRaw = (_.uniq(_.words(lowerText))).slice(0, 20);
            
            const foundList = await List.findOne({listName: req.body.listName}).exec();

            // console.log(foundList);

            if(foundList) {
                defaultList.words = removeDone(wordsRaw, foundList.words);
            } else {
                const newList = new List({
                    listName: req.body.listName,
                    words: []
                });
                await List.create(newList);
                defaultList.words = wordsRaw;
            }
            
            defaultList.listName = req.body.listName;
        }
        res.redirect("/");
    })
})

app.listen(3000, function () {
    console.log("server started on port 3000.");
})