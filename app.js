require("dotenv").config();

var express         = require("express"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    localStrategy   = require("passport-local"),
    methodOverride  = require("method-override"),
    flash           = require("connect-flash"),
    expressSanitizer= require("express-sanitizer"),
    Campground      = require("./models/campground"),
    Comment         = require("./models/comment"),
    User            = require("./models/user"),
    seedDB          = require("./seeds"),
    app             = express();

//Requiring Routes
var campgroundRoutes    = require("./routes/campgrounds"),
    commentsRoutes      = require("./routes/comments"),
    userRoutes          = require("./routes/user"),
    indexRoutes          = require("./routes/index");
    
var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp"
mongoose.connect(url);

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(expressSanitizer());
app.use(flash());
// seedDB();

app.locals.moment = require('moment');

//*********************************************
//  PASSPORT CONFIGS
//*********************************************

app.use(require("express-session")({
    secret: "Cats are the best!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//Route Files Setup
app.use("/", indexRoutes);
app.use("/users", userRoutes);
app.use("/campgrounds/:id/comments", commentsRoutes);
app.use("/campgrounds",campgroundRoutes);

// =======================================
// SERVER SETUP
// =======================================

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp Server is Working..");
});