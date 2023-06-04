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
  if (req.isAuthenticated()) {
    res.render("write", { user: req.user });
  } else {
    res.redirect("/login");
  }
});

router.post("/write", (req, res) => {
  console.log(req.body);
});

module.exports = router;
