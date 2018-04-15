var express = require("express");
var router  = express.Router();
var passport = require("passport");
var Campground = require("../models/campground");
var User = require("../models/user");