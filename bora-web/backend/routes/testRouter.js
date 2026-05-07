const { Router } = require("express");
const blogRouter = Router();
const Blog = require("../models/Blog");

blogRouter.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find();
    console.log(blogs);
    res.json(blogs);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }

});
module.exports = { blogRouter };