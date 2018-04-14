var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
 
var options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX ROUTE - Lists all campgrounds
router.get("/", function(req, res){
    //Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        }else{
            res.render("campgrounds/index", {campgrounds:allCampgrounds, page: "campgrounds"});
        }
    })
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    geocoder.geocode(req.body.campground.location, function(err, data){
        if(err || !data.length) {
            req.flash("error", "Invalid address or location");
            console.log(err)
            return res.redirect("back");
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        req.body.campground.description = req.sanitize(req.body.campground.description);
        req.body.campground.author = { id: req.user._id, username: req.user.username};
        //Create a new Campground and save to DB
        Campground.create(req.body.campground, function(err, newlyCreated){
            if(err){
                req.flash("error", err.message);
                console.log(err);
            } else {
                req.flash("success", "Successfully added campground!");
                console.log(newlyCreated);
                res.redirect("/campgrounds");
            }
        });    
    });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("campgrounds/new")
})

//SHOW - shows info about one campground
router.get("/:id", function(req, res) {
    //Find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found!");
            res.redirect("/campgrounds");
        } else {
             //Render show template with that campground details
            res.render("campgrounds/show", {campground: foundCampground}); 
        }
    });

});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});


//UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    geocoder.geocode(req.body.campground.location, function(err, data){
        if(err || !data.length) {
                req.flash("error", "Invalid address or location");
                return res.redirect("back");
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        req.body.campground.description = req.sanitize(req.body.campground.description);
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
            if(err){
                req.flash("error", err.message);
                res.redirect("/campgrounds");
            } else {
                req.flash("success", "Successfully updated campground!");
                res.redirect("/campgrounds/" + req.params.id);
            }
        });
    });
});

//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    });
});

module.exports = router;
