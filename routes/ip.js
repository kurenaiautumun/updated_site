const express = require("express");
const router = express.Router();
const {ipSetTable, socialShare} = require("../models.js");
const { encrypt, decrypt } = require("./encrypt.js");
const jwtVerify = require("./jwt")