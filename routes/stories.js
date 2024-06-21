const { render } = require("ejs");
const express = require("express");
const router = express.Router();
const { Blog, Story, User} = require("../models.js");
const { encrypt } = require("./encrypt.js");
const jwtVerify = require("./jwt")


router.post("/adjacentBlogs", async (req, res)=>{
    let blogId = req.body.blogId;
    
    let blog = await Blog.findOne({_id: blogId})
  
    let story = await Story.findOne({_id: blog.story})
  
    let prev = null
    let next = null
    let flag = false
  
    for (let key in story.chapters){
      if (flag==true){
        next = story.chapters[key]["blog"]
        break
      }
      if (story.chapters[key]["_id"]==blogId){
        flag==true
      }
      prev = story.chapters[key]["blog"]
    }

    console.log("next = ", next)
    console.log("prev = ", prev)

    if (next==null){
        let sample = await Blog.aggregate(
            [ { $sample: { size: 1 } } ]
         )
         console.log("sample = ", sample)
        next = sample[0]
    }

    if (prev==null){
        let sample = Blog.aggregate(
            [ { $sample: { size: 1 } } ]
         )
        prev = sample[0]
    }

    // Fill any null values if existing

    let context = {
        "blog": [prev, next]
      }

    res.json(context).status(200);
  })


router.post("/newStory", async (req, res)=>{
    let token = jwtVerify(req);
    let userId = token.user._id

    console.log("userId = ", userId)

    if (userId==null){
        res.render("login")
        return null
    }

    let title = req.body.title

    console.log("title = ", title)

    let user = await User.findOne({_id:userId}) //find user using UserId

    console.log("user = ", user)

    newStory = new Story({
        name: await user.username,
        user: await user._id,
        title: title,
        titleImage: "https://kurenai-image-testing.s3.ap-south-1.amazonaws.com/logo-removebg-preview.png",
        chapters: {},
        finished: false,
        author: user.username,
        description: "",
        tags:["story"],
        rating: 0,
        Likes: 0,
        Views: 0
    })

    newStory.save();

    res.status(200).json({"msg": `Story with Title - ${newStory} has been created`, "title": newStory.title})
})

router.put("/addChapter", async (req, res)=>{
    let token = jwtVerify(req);
    let userId = token.user._id

    let blogId = req.body.blog

    console.log("blogId = ", blogId);

    let blogObj = await Blog.findOne({_id: blogId})

    let blog = {
        "title": await blogObj.title,
        "_id": await blogObj._id,
        "titleImage": await blogObj.titleImage
    }

    console.log("blog = ", blog)

    let storyName = req.body.storyName

    let story = await Story.findOne({title: storyName})

    console.log("old story = ", await story)

    chapters = story.chapters

    if (await chapters==undefined){
        chapters = {}
        chapters[blog._id] = {
                "blog": blog,
                "number": 1
            }
    }
    else{
        chapters[blog._id] = {
            "blog": blog,
            "number": Object.keys(story.chapters).length + 1
        }
    }

    console.log("chapters = ", chapters)

    let doc = await Story.findOneAndUpdate({title: storyName}, {chapters: chapters}, {new: true});

    console.log("doc = ", doc)

    story.save()

    let data = chapters[blog._id] 

    blogObj.story = story._id
    blogObj.save()

    res.status(200).json({"msg": "Chapter Added Successfully", "data": data})
})

router.get("/story/:title", async (req,res)=>{
    let title = req.params.title
    let story = await Story.findOne({title: title})
    //story = story.toObject()

    //for (let key in story.chapters){
    //    story.chapters[key]["title"] = await Blog.findOne({_id: key}).title
    //    console.log('key = ', key, await Blog.findOne({_id: key}).title, await Blog.findOne({_id: key}))
    //}
//
    //console.log("story = ", story)

    res.render("story", story)
})

router.post("/story/:title", async (req,res)=>{
    let title = req.params.title

    let story = await Story.findOne({title: title})
    story = story.toObject();

    console.log("user = ", await story["user"], story);

    story["user"] = encrypt(story["user"]);

    for (let key in story.chapters){
        let blog = await Blog.findOne({_id: key})
        story.chapters[key]["blog"]["title"] = await blog.title
        story.chapters[key]["blog"]["titleImage"] = await blog.titleImage
        story.chapters[key]["blog"]["status"] = await blog.status
        console.log('key = ', key, blog.title)
    }

    console.log("story in post = ", story)

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


router.get("/stories", async (req,res)=>{
    res.render("stories")
})


router.post("/stories", async (req,res)=>{
    let story = await Story.find()

    res.status(200).json(story)
})

module.exports = router;