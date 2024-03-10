const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

main().catch((err) => console.log(err));
async function main() {

  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to DB");
  
}
const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to your todo list!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "check the box to delete an item.",
});
var defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Successfully saved default items to DB");
          })
          .catch((err) => {
            console.error(err);
          });
        res.redirect("/");
      } else {
        res.render("index", { listTitle: date(), item: foundItems });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});
app.get("/:customLink", function (req, res) {
  var customLink = _.capitalize(req.params.customLink);

  List.findOne({ name: customLink })
    .then((customList) => {
      console.log(customList);
      if (!customList) {
        let list = new List({
          name: customLink,
          items: defaultItems,
        });
        list.save();
        console.log("New list created");
        res.redirect("/" + customLink);
      } else {
        console.log(customList.items);
        res.render("index", {
          listTitle: customList.name,
          item: customList.items,
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

app.post("/", (req, res) => {
  if (req.body.button === date()) {
    const item = new Item({
      name: req.body.newItem,
    });
    item.save();
    res.redirect("/");
  } else {
    const listName = req.body.button;
    const item = new Item({
      name: req.body.newItem,
    });
    const pushItem = new List({
      name: listName,
      items: item,
    });
    List.findOne({ name: listName }).then((foundList) => {
      if (!foundList) {
        pushItem.save();
        res.redirect("/" + listName);
      } else {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === date()) {
    Item.deleteOne({ _id: checkedItemId })
      .then(() => {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
