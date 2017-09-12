// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var request = require("request");
var cheerio = require("cheerio");

//Exported developed modules

var Note = require("./models/Note.js");
var Story = require("./models/Story.js");

var app = express();
var port = process.env.PORT || 8080;
app.use(express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json"}));

app.engine("handlebars", exphbs({ defaultLayout: "main"}));
app.set("view engine", "handlebars");

mongoose.Promise = Promise;
var databaseUri = "mongodb://localhost/mongonews";
    if(process.env.MONGODB_URI){
        mongoose.connect(process.env.MONGODB_URI);
    }else{
        mongoose.connect(databaseUri)
    };
var db = mongoose.connection;
db.on("error", function(error){
    console.log("Mongoose Error: ", error);
});
db.once("open", function(){
    console.log("Mongoose connection successful!")
});

//URI routing for application
app.get("/", function(req, res){
    var query = Story.find({}).sort({$natural: -1}).limit(10);
    query.exec(function(err, docs){
        if(err){
            throw error;
        }
        res.render("index", {story: docs});
    });
});

app.get("/stories", function(req, res){
    Story.find({}, function(error, doc){
        if (error){
            console.log(error);
        
        }else{
            res.json(doc);
        }
    });
});

app.get("/scrape", function (req, res){
    request("https://www.nytimes.com/section/technology", function(error, response, html){
        var $ = cheerio.load(html);

        $("article.story").each(function(i, element){
            var result = {};

            result.title = $(this).find("div.story-body").find("h2.headline").find("a").text();
            result.link = $(this).find("a").attr("href");
            result.image = $(this).find("a").find("img").attr("src");
            var entry = new Story (result);
            entry.save(function(err, doc){
                if (err) {
                    console.log(err);
                }else{
                    console.log(doc);
                }
            });
        });
    });
    res.redirect("/");
})

app.get("/saved", function(req, res){
    Story.find({ saved: true }, function(error, doc){
        if(error){
            console.log(error);
        }
        else{
            res.render("saved", { story: doc});
        }
    });
});

app.get("/stories/:id", function(req, res){
    Story.findOne({ "_id": req.params.id })
    .populate("note")
    .exec(function(error, doc){
        if(error){
            console.log(error);
        }
        else{
            res.json(doc);
        }
    });
});

app.post("/updates/:id", function(req, res){
    Story.where({ _id: req.params.id }).update({ $set:{ saved: true }})

    .exec(function(error, doc){
        if (error){
            console.log(error)
        }else{
            res.json(doc)
        }
    });
});

app.post("/notes/:id", function(req, res){
    var newNote = new Note(req.body);
    newNote.save(function(error, doc){
        if (error){
            console.log(error);
        }
        else{
            Story.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
            // execute the query
            .exec(function(err, doc){
                if(err){
                    console.log(err)
                }
                else{
                    res.send(doc);
                }
            });
        }
    });
});

app.post("/updates/:id/:saved", function(req, res){
    Story.where({ _id: req.params.id, saved: true })
    .update({ $set: { saved: false}
})
.exec(function(error, doc){
    if(error){
        console.log(error);
    }
    else{
        res.json(doc)
        }
    });
});


app.get("/notes/:id", function(req, res){
    Story.findOne({ "_id": req.params.id })
    .populate("note")
    .exec(function(error, doc){
        if(error){
            console.log(error)
        }else{
            res.json(doc);
        }
    });
});

app.listen(port, function(){
    console.log("App listening on port " + port);
});