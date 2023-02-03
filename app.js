//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express(MONGO_URI);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongo connection

mongoose.connect()
.then(() => {
    console.log("Connected");
})
.catch((err) => {
    console.log(err);
})


// schema declaration
const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model("Item", itemsSchema);

const i1 = new Item({
  name: "Welcome to To-Do list"
})
const i2 = new Item({
  name: "Hit '+' to add new item"
})
const i3 = new Item({
  name: "<-- click checkbox to delete item"
})



const defaultList = [i1, i2, i3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, (err, result) => {
    if(result.length === 0) {
      Item.insertMany([i1,i2,i3], (err)=> {
        if(err) {
          console.log(err);
        }
        else{
          console.log("Saved items successfully");
        }
      })
    }
    else {
      res.render("list", {listTitle:"Today", newListItems:result})
    }
  })
});


app.get("/:title", (req, res) => {
  const listname = _.capitalize(req.params.title);

  List.findOne({name:listname}, (err, result) => {
    if(!err) {
      if(!result) {
        const list = new List({
          name:listname,
          items:defaultList
        })
        list.save();
        res.redirect("/" + listname);
      }
      else{
        res.render("list", {listTitle:result.name, newListItems:result.items})
      }
    }
    else {
      console.log(err);
    }
  })
}) 

app.get("/about", function(req, res){
  res.render("about");
});

// post routes
app.post("/", function(req, res){
  const item = req.body.newItem;
  const listname = _.capitalize(req.body.list);
  
  const newitem = new Item({
    name: item
  });

  if(listname === "Today") {
    newitem.save();
    res.redirect("/");
  }
  else {
    List.findOne({name:listname}, (err, result) => {
      result.items.push(newitem);
      result.save();
      console.log("added to list");
      res.redirect("/" + result.name);
    })
  }
});

app.post("/delete", (req, res) => {
  const id = req.body.checkbox;
  
  const listname = req.body.listname;

  if(listname === "Today") {
    Item.findByIdAndRemove(id, ()=> {
      console.log("deleted successfully");
    })
    res.redirect("/");
  }
  else {
    List.findOneAndUpdate({name: listname}, {$pull: {items: {_id:id}}}, (err, result) => {
      if(!err) {
        console.log("item deleted successfully from list " + listname);
        res.redirect("/" + listname);
      }
      else {
        console.log(err);
      }
    })
  }


  
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
