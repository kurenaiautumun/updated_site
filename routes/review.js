const express = require('express');
const router = express.Router();
const { Review, User, Blog } = require('../models.js');
const jwtVerify = require("./jwt");

// Rendering full blog posts
router.get("/blogs/:id/body", async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).send('Blog not found');
    }

    const bodyText = blog.body.blocks[0].data.text;
    const meta = blog.meta;

    res.render("blogDetail", { blog, meta, bodyText });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Search Functionality and Review Details
router.get('/reviews', async (req, res) => {
  try {
    var search = '';
    if (req.query.search) {
      search = req.query.search;
    }

    const reviews = await Blog.find({
      status: "in-review",
      $or: [
        { body: { $regex: '.*' + search + '.*', $options: 'i' } },
        { title: { $regex: '.*' + search + '.*', $options: 'i' } },
        { author: { $regex: '.*' + search + '.*', $options: 'i' } },
      ]
    });

    res.status(200).json({ message: "Review details", search, reviews });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Review by Blog ID
router.get("/review/:blogId", (req, res) => {
  const blogId = req.params.blogId;
  Review.find({ blogId }, (err, review) => {
    res.status(201).json({ message: "Review details", blogId, review });
  });
});

// Add New Review
router.post("/newReview", (req, res) => {
  const { userId, blogId, body, score } = req.body;
  const review = new Review({
    userId, blogId, body, score, date: new Date()
  });

  review.save();
  res.status(201).json({ message: "Review is saved", review });
});

// Get All Reviews
router.post("/allReview", async (req, res) => {
  let userId = req.query.userId;
  let sortBy = req.query.sortBy || "title"; 

  try {
      let user = jwtVerify(req).user._id;
      userObj = await User.findOne({ _id: user });

      if (userObj.role !== "admin" && userObj.role !== "reviewer") {
          res.status(400).json("You are not allowed to access this page");
      } else {
          
          let blogs = await Blog.find({
              status: "in-review",
              reviewer: { $exists: true },
              "reviewer.0": { $exists: false }
          }).sort({ [sortBy]: 1 }); 

          res.status(200).json(blogs);
      }
  } catch (err) {
      res.status(404).json(`Please Log-In first - ${err}`);
  }
});

// Get Reviews with Filters
router.get('/review', async (req, res) => {
  try {
    const filters = req.query;
    const query = {};

    for (const key in filters) {
      query[key] = filters[key];
    }

    const sortOptions = {};

    if (filters.sortBy) {
      if (filters.sortBy === 'title' || filters.sortBy === 'author') {
        sortOptions[filters.sortBy] = 1;
      }
    }

    const blogs = await Blog.find(query).sort(sortOptions);
    res.status(200).json({ message: "Review details", filters, blogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Set Review Status
router.post("/setReview", async (req, res) => {
  let token = jwtVerify(req);
  let blogId = req.body.blogId;

  try {
    let user = token.user._id;
    console.log("User ID:", user);

    userObj = await User.findOne({ _id: user });
    console.log("User Object:", userObj);

    if (userObj && (userObj.role === "admin" || userObj.role === "reviewer")) {
      let blog = await Blog.findOne({ "_id": blogId });

      if (blog) {
        console.log("Blog Object:", blog);
        blog.status = "published";
        blog.reviewer = [user];
        blog.save();

        console.log("Blog after update:", blog);
        console.log("Blog meta tag", blog.meta);
        res.status(200).json(blog);
      } else {
        res.status(404).json("Blog not found");
      }
    } else {
      res.status(400).json("You are not allowed to access this page");
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json("Internal Server Error");
  }
});

// Render All Reviews Page
router.get("/allReview", (req, res) => {
  res.render("review");
});

module.exports = router;
