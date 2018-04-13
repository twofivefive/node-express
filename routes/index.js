var express = require("express");
var router  = express.Router();
var passport = require("passport");
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user")

//Root Route
router.get("/", function(req, res){
    res.render("landing");
});

//Register Form Route
router.get("/register", function(req, res) {
    res.render("register", {page: "register"});
});

//Register Logic
router.post("/register", function(req, res) {
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp, " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

// =======================================
// LOGIN & LOGOUT ROUTES
// =======================================
router.get("/login", function(req, res) {
    res.render("login", {page: "login"});
});

router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds", 
        failureRedirect: "/login"
    }), function(req, res){
});

//Logout Route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out! Bye!");
    res.redirect("/campgrounds")
});

module.exports = router;