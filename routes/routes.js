const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs");

//image upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "" + Date.now() + "" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
}).single("image");

//Insert an user into db route
router.post("/add", upload, async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: req.file.filename,
    });

    await user.save();

    req.session.message = {
      type: "success",
      message: "User added successfully!",
    };
    res.redirect("/");
  } catch (error) {
    res.json({ message: error.message, type: "danger" });
  }
});

router.get("/", async (req, res) => {
  try {
    // Fetch users from the database
    const users = await User.find();

    // Convert the users array to a plain object before rendering
    const usersData = users.map((user) => user.toObject());

    // Render the index.ejs file with the users array
    res.render("index", { title: "Home Page", users: users });
  } catch (error) {
    res.json({ message: error.message, type: "danger" });
  }
});

router.get("/add", (req, res) => {
  res.render("add_users", { title: "Add users" });
});

//edit am user route
router.get("/edit/:id", async (req, res) => {
  try {
    let id = req.params.id;
    const user = await User.findById(id);

    if (!user) {
      return res.redirect("/");
    }

    res.render("edit_users", {
      title: "Edit users",
      user: user,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

// Update user route
router.post("/update/:id", upload, async (req, res) => {
  try {
    let id = req.params.id;
    let new_image = "";

    if (req.file) {
      new_image = req.file.filename;
      try {
        fs.unlinkSync("./uploads/" + req.body.old_image);
      } catch (err) {
        console.log(err);
      }
    } else {
      new_image = req.body.old_image;
    }

    // Update the user using findByIdAndUpdate
    await User.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    });

    req.session.message = {
      type: "success",
      message: "User updated successfully!",
    };
    res.redirect("/");
  } catch (error) {
    res.json({ message: error.message, type: "danger" });
  }
});

// Delete user route
router.get("/delete/:id", async (req, res) => {
  try {
    let id = req.params.id;
    const result = await User.findOneAndDelete({ _id: id });

    if (result && result.image !== "") {
      try {
        await fs.unlinkSync("./uploads/" + result.image);
      } catch (err) {
        console.log(err);
      }
    }

    req.session.message = {
      type: "info",
      message: "User deleted successfully!",
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message });
  }
});

module.exports = router;