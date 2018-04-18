var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
 
//IMAGE UPLOAD CONFIG
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'twofivefive', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//GOOGLE MAPS CONFIG
var options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX ROUTE - Lists all campgrounds
router.get("/", function(req, res){
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, function(err, foundCampground){
            if(err){
                console.log(err);
            }else{
                if(foundCampground.length < 1) {
                    req.flash("error", "No campgrounds found with that name, please try again.");
                    return res.redirect("back");
                }
                res.render("campgrounds/index", {campgrounds: foundCampground, page: "campgrounds"});
            }
        });
    } else {
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            }else{
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds"});
            }
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single("image"), function(req, res){
    geocoder.geocode(req.body.campground.location, function(err, data){
        if(err || !data.length) {
            req.flash("error", "Invalid address or location");
            console.log(err);
            return res.redirect("back");
        }
        
        cloudinary.uploader.upload(req.file.path, function(result) {
            
            req.body.campground.image = result.secure_url;
            req.body.campground.lat = data[0].latitude;
            req.body.campground.lng = data[0].longitude;
            req.body.campground.location = data[0].formattedAddress;
            req.body.campground.description = req.sanitize(req.body.campground.description);
            req.body.campground.author = { id: req.user._id, username: req.user.username };
            
            //Create a new Campground and save to DB
            Campground.create(req.body.campground, function(err, newlyCreated){
                if(err){
                    req.flash("error", err.message);
                    console.log(err);
                    return res.redirect("back");
                } else {
                    req.flash("success", "Successfully added campground!");
                    res.redirect("/campgrounds/" + newlyCreated.id);
                }
            });    
        })
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

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
