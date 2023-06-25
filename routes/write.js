const express = require("express");
const router = express.Router();

// const editor = new EditorJS({
//   holder: "editor",
//   data: jsonData,
//   readOnly: true,
//   onChange: (data) => {
//     console.log(data);
//   },
//   onReady: (editor) => {
//     console.log(editor);
//   },
// });

router.get("/write", (req, res) => {
  res.render("writer", { user: req.user });
  //if (req.isAuthenticated()) {
  //  res.render("writer", { user: req.user });
  //} else {
  //  res.redirect("/login");
  //}
});

router.get("/read", (req, res) => {
  res.render("read");
});

router.post("/write", (req, res) => {
  console.log(req.body);
});

module.exports = router;
