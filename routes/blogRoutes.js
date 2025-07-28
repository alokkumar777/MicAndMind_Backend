const express = require("express");
const Blog = require("../models/Blog");
const auth = require("../middleware/auth");
const router = express.Router();

// Create blog
router.post("/", auth, async (req, res) => {
  try {
    const blog = new Blog({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author || "Anonymous",
      user: req.user.id,
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single blog
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put("/:id", auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    blog.title = req.body.title;
    blog.content = req.body.content;
    await blog.save();

    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete("/:id", auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await blog.deleteOne();
    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = {
      text: req.body.text,
      author: req.body.author || "Anonymous",
      user: req.user.id,
    };

    blog.comments.push(comment);
    await blog.save();

    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete comment
router.delete("/:id/comments/:commentId", auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = blog.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Use pull instead of remove
    blog.comments.pull({ _id: req.params.commentId });
    await blog.save();

    res.json({ message: "Comment deleted successfully", blog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like or Unlike blog
router.post("/:id/like", auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const userId = req.user.id;
    const hasLiked = blog.likes.includes(userId);

    if (hasLiked) {
      // Unlike
      blog.likes.pull(userId);
    } else {
      // Like
      blog.likes.push(userId);
    }

    await blog.save();
    res.json({
      message: hasLiked ? "Unliked" : "Liked",
      likesCount: blog.likes.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get blogs created by logged-in user
router.get("/user/myblogs", auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ user: req.user.id });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get blogs liked by user
router.get("/user/liked", auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ likes: req.user.id });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
