const express = require("express");
const router = express.Router();
const { Competition , Ranking, User, Blog} = require("../models.js");
const jwtVerify = require("./jwt");





router.get("/competition/:name", async(req, res) => {
  const competition_name = req.params.name;

  try{
    const found_competition = await Competition.findOne({competitionName: competition_name});

    if (!found_competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    const ranking_users = await Ranking.find({competitionId: found_competition._id}).sort({viewCount: -1}); 

    // found_user.sort((a,b) => a.rank - b.rank);
  
    // res.status(201).json(ranking_users);
    
    // var user_s = []

    // for(let i=0;i<ranking_users.length ;i++){
    //   const a = await Blog.findOne({_id : ranking_users[i].blogId});
    //   user_s.push({name : a.author , rank : ranking_users[i].rank , blogId : ranking_users[i].blogId});
    // }

    
    res.status(201).render("comparison" , {ranking_users : ranking_users ,competition : found_competition});
    // res.json(user_s);
  }
  catch(err){
    console.log(err);
    res.status(500).json({ message: 'Server error' })
  }
  

  // res.status(201).render("comparison");
});



router.get("/competitionUsers/:name", async(req, res) => {
    const competition_name = req.params.name;

    try{
      const found_competition = await Competition.findOne({competitionName: competition_name});

      if (!found_competition) {
        return res.status(404).json({ message: 'Competition not found' });
      }

      const ranking_users = await Ranking.find({competitionId: found_competition._id}).sort({viewCount: -1}); 

      
      
      var user_s = []

      for(let i=0;i<ranking_users.length ;i++){
        const a = await Blog.findOne({_id : ranking_users[i].blogId});
        const updatedRanking = await Ranking.findOneAndUpdate(
          { userId: a.userId, blogId: ranking_users[i].blogId, competitionId: found_competition._id },
          { rank: i + 1 },
          { new: true } 
      );
        user_s.push({name : a.author , rank : updatedRanking.rank , blogId : ranking_users[i].blogId});
      }

      
      // res.status(201).render("comparison" , {user_s : user_s ,competition : found_competition});
      console.log(user_s);
      res.json(user_s);
    }
    catch(err){
      console.log(err);
      res.status(500).json({ message: 'Server error' })
    }
    

    // res.status(201).render("comparison");
});



router.get("/competitionList", async(req,res) => {
  try{
    const currentDate = new Date();

    const comp = await Competition.find();

    // const comp = await Competition.find({
    //   startDate: { $lte : currentDate },
    //   endDate: { $gte : currentDate },
    // });

    console.log(comp);
    res.json(comp);
  }
  catch(err){
    console.log(err);
    res.status(500).json({ message: 'Server error' })
  }

})




router.post('/competitionRegister', async (req, res) => {
  const { competitionId , blogId} = req.body;
  console.log(competitionId);

  let user = jwtVerify(req);
  console.log("user = ", user.user)
  let userId = user.user._id;

  console.log(blogId);

  try {
      const competition = await Competition.findOne({ _id: competitionId });

      if (!competition) {
        return res.status(404).json({ error: 'Competition not found' });
      }


      const blog = await Ranking.findOne({blogId: blogId});
      const userInCompetition = await Ranking.findOne({userId : userId, competitionId : competitionId});

      if(blog){
        console.log("Blog is already present in competition"); 
        res.status(500).json({ message : 'Blog is already present in competition' });
      }
      if(userInCompetition){
        console.log("User is already registered for this competition"); 
        res.status(500).json('User is already registered for this competition' );
      }
      

      // if(competition.blogId.includes(blogId)){
      //   console.log("Blog is already registerd");
      // }
      // else{
      //   competition.blogId.push(blogId);
      //   await competition.save();
      if(!blog && !userInCompetition){

        const ranking = new Ranking({
          userId : userId,
          blogId : blogId,
          viewCount: 0,
          competitionId : competitionId,
        })
  
        ranking.save((err, ranking) => {
          if (err) throw err;
          res.status(201).json({ message: "ranking saved", ranking });
        });
  
        
        console.log(`User ${userId} registered for competition: ${competitionId}`);
  
        res.json("You are registered for competition " + competition.competitionName);
      }
      

  } catch (error) {
      console.error('Error registering for competition:', error);
      res.status(500).json({ error: 'Internal server error' });
  }

})



router.put("/competition/update" , async(req, res) => {
  try{
    const currentDate = new Date();
    const competition = await Competition.findOne({endDate: { $gt : currentDate }});

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    const ranking = await Ranking.find({competitionId : competition._id});

    for(let i=0;i<ranking.length();i++){
      const updatedBlog = await Blog.findByIdAndUpdate(ranking[i].blogId , {status : "published"});
    }
    
    // const updatedBlog = await Blog.findByIdAndUpdate(req.query.blogId , {status : "in-competition"});
    res.status(200).json(updatedBlog);
  }
  catch(err){
    console.log(err);
    res.status(500).json({ message: 'Server error' })
  }

})



router.get("/games", (req, res) => {
  res.status(200).render("game")
})

router.post("/competition", (req, res) => {
  const {
    competitionName,
    blogId,
    threshold,
    prize,
    status,
    startDate,
    endDate,
  } = req.body;

  const competition = new Competition({
    competitionName,
    blogId,
    threshold,
    prize,
    status,
    startDate,
    endDate,
  });
  competition.save((err, competition) => {
    if (err) throw err;
    res.status(201).json({ message: "competition saved", competition });
  });
});

module.exports = router;
