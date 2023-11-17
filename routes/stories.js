const express = require("express");
const router = express.Router();
const { Blog, Story, User} = require("../models.js");
const { encrypt } = require("./encrypt.js");
const jwtVerify = require("./jwt")


router.post("/newStory", async (req, res)=>{
    let token = jwtVerify(req);
    let userId = token.user._id

    let title = req.body.title

    let user = await User.findOne({userId}) //find user using UserId

    newStory = new Story({
        name: await user.username,
        user: await user._id,
        title: title,
        blogs: {},
        finished: false,
        tags:[]
    })

    res.status(200).json(`Story with Title - ${newStory} has been created`)
})

router.put("/addChapter", async (req, res)=>{
    let token = jwtVerify(req);
    let userId = token.user._id

    let blog = req.body.blog

    let storyName = req.body.StoryName

    let story = Story.findOne({title: storyName, _id: userId})

    story.blogs[story.blogs.keys().length + 1] = blog

    story.save()

    res.status(200).json("Chapter Added Successfully")
})

router.get("/story/:title", (req,res)=>{
    let title = req.params.title

    let story = Storage.findOne({title: title})

    res.status(200).json(story)
})

router.put("/editStory", (req,res)=>{
    let token = jwtVerify(req);
    let userId = token.user._id

    let {title, finished, tags} = req.body;

    let story = Story.findOne({title: storyName, _id: userId})

    story.title = title,
    story.finished = finished,
    story.tags = tags

    story.save()

    res.status(200).json("Story successfully edited")
})