var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var User = require("../models/user");

// =======================================
// USER PROFILES ROUTE
// =======================================
router.get("/:id", function(req, res) {
   User.findById(req.params.id, function(err, foundUser){
       if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/");
       }
       Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds) {
           if(err){
                req.flash("error", "Something went wrong");
                res.redirect("/");
           }  
           res.render("users/show", {user: foundUser, campgrounds: campgrounds});
       });
   }) 
});

module.exports = router;