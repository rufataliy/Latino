const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
mongoose.connect(process.env.DBSTRING, {
    useNewUrlParser: true
});

const fileUpload = require('express-fileupload');
const session = require("express-session")

const Style = mongoose.model("Style", {
    name: String,
    description: String
})
const Site = mongoose.model("Site", {
    title: String,
    logo: String,
    footer: String
})
const Post = mongoose.model("Post", {
    title: String,
    body: String,
    type: String,
    page: String,
    image: String
})
const NavLink = mongoose.model("NavLink", {
    name: String,
    Path: String,
    type: String
})
const User = mongoose.model('User', {
    username: String,
    password: String,
});

var myApp = express();

myApp.use(bodyParser.urlencoded({ extended: false }));

myApp.use(bodyParser.json())
myApp.use(fileUpload())
myApp.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');


//---------------- Routes ------------------

const appState = {
    loggedIn: false
}

myApp.get('/', function(req, res) {
    Site.findOne({}).exec((err, site) => {
        Style.find({}).exec((err, links) => {
            Post.find({ type: 'home' }).exec(function(err, posts) {
                res.render('index', { posts: posts, appState: appState, links: links, site: site });
            })
        })
    })
});
myApp.get('/admin', function(req, res) {
    if (appState.loggedIn) {
        Site.findOne({}).exec((err, site) => {
            Style.find({}).exec((err, links) => {
                Post.find({}).exec(function(err, posts) {
                    res.render('admin', { posts: posts, appState: appState, links: links, site: site });
                })
            })
        })
    } else {
        res.redirect('/login')
    }
});
myApp.get('/contact', function(req, res) {
    Site.findOne({}).exec((err, site) => {
        Style.find({}).exec((err, links) => {
            res.render('contact', { appState: appState, links: links, site: site });
        })
    })
});
myApp.get('/site', function(req, res) {
    if (appState.loggedIn) {
        Site.findOne({}).exec((err, site) => {
            Style.find({}).exec((err, links) => {
                res.render('site', { appState: appState, links: links, site: site });
            })
        })
    } else {
        res.redirect('/login')
    }
});
myApp.post('/site', function(req, res) {
    var title = req.body.title
    var footer = req.body.footer
    var imageName, imageFile, imagePath
    if (req.files) {
        imageName = req.files.logo.name
        imageFile = req.files.logo
        imagePath = 'public/img/' + imageName
        imageFile.mv(imagePath, (err) => {
            console.log(err)
        })
    }
    Site.findOne({}).exec((err, site) => {
        site.title = title ? title : site.logo
        site.logo = imageName ? imageName : site.logo
        site.footer = footer ? footer : site.footer
        site.save().then(
            res.redirect('/admin')
        )
    })

});

myApp.get('/styles/:style', function(req, res) {
    var style = req.params.style
    Site.findOne({}).exec((err, site) => {
        Style.find({}).exec((err, links) => {
            Post.find({ type: style }).exec(function(err, posts) {
                res.render('styles', { posts: posts, appState: appState, links: links, site: site });
            })
        })
    })


});

myApp.get('/classes', function(req, res) {
    Site.findOne({}).exec((err, site) => {
        Style.find({}).exec((err, links) => {
            res.render('classes', { appState: appState, links: links, site: site });
        })
    })
});
myApp.get('/newPost', function(req, res) {
    if (appState.loggedIn) {
        Site.findOne({}).exec((err, site) => {
            Style.find({}).exec((err, links) => {
                res.render('newPost', { site: site, appState: appState, links: links });
            })
        })

    } else {
        res.redirect('/login')
    }
});
myApp.get('/newStyle', function(req, res) {
    if (appState.loggedIn) {
        Site.findOne({}).exec((err, site) => {
            Style.find({}).exec(function(err, styles) {
                res.render('newStyle', { site: site, styles: styles, appState: appState, links: styles });
            })
        })
    } else {
        res.redirect('/login')
    }
});
myApp.post('/newStyle', function(req, res) {
    var styleName = req.body.name.toLowerCase()
    var description = req.body.description
    Site.findOne({}).exec((err, site) => {
        Style.findOne({ name: styleName }).exec(function(err, style) {
            if (style != null)
                Style.find({}).exec(function(err, styles) {
                    res.render('newStyle', { site: site, styles: styles, appState: appState, links: styles, msg: "Style already exists" });
                })
            else {
                const newStyle = new Style({
                    name: styleName,
                    description: description
                })
                newStyle.save().then(
                    res.redirect('/newStyle')
                )
            }
        })
    })
});
myApp.get('/editStyle/:id', function(req, res) {
    if (appState.loggedIn) {
        var id = req.params.id
        Site.findOne({}).exec((err, site) => {
            Style.findOne({ _id: id }).exec(function(err, style) {
                Style.find({}).exec(function(err, styles) {
                    res.render('editStyle', { site: site, styles: styles, appState: appState, editStyle: style, links: styles });
                })
            })
        })
    } else {
        res.redirect('/login')
    }
});
myApp.post('/editStyle/:id', function(req, res) {
    if (appState.loggedIn) {
        var id = req.params.id
        var name = req.body.name
        var description = req.body.description
        Style.findOne({ _id: id }).exec(function(err, style) {
            style.name = name;
            style.description = description;
            style.save().then(
                Style.find({}).exec(function(err, styles) {
                    res.redirect('/newStyle')
                })
            )
        })
    } else {
        res.redirect('/login')
    }
});
myApp.get('/deleteStyle/:id', function(req, res) {
    if (appState.loggedIn) {
        var id = req.params.id
        Style.findByIdAndDelete({ _id: id }).exec(function(err, post) {
            res.redirect('/newStyle')
        })
    }
});
myApp.post('/newPost', function(req, res) {
    var title = req.body.title;
    var body = req.body.body;
    var type = req.body.type;
    var imageName, imageFile, imagePath
    if (req.files) {
        imageName = req.files.image.name
        imageFile = req.files.image
        imagePath = 'public/img/' + imageName
        imageFile.mv(imagePath, (err) => {
            console.log(err)
        })
    }
    const post = new Post({
        title: title,
        body: body,
        type: type ? type : 'generic',
        image: imageName
    })
    post.save().then(
        res.redirect('/admin')
    )
});
// ------------ New Routes ---------------------

myApp.get('/login', function(req, res) {
    Site.findOne({}).exec((err, site) => {
        Style.find({}).exec(function(err, links) {
            res.render('login', { site: site, appState: appState, links: links });
        })
    })
});

myApp.post('/login', function(req, res) {
    const username = req.body.username
    const password = req.body.password
    User.findOne({ username: username, password: password }).exec(function(err, user) {
        req.session.username = user.username
        req.session.userLoggedIn = true
        appState.loggedIn = true
        res.redirect('/admin')
    })
});
myApp.get('/logout', function(req, res) {
    req.session.userLoggedIn = false
    appState.loggedIn = false
    res.redirect('/');
});

myApp.get('/editPost/:id', function(req, res) {
    var id = req.params.id
    Site.findOne({}).exec((err, site) => {
        Style.find({}).exec(function(err, links) {
            Post.findOne({ _id: id }).exec(function(err, post) {
                res.render('editPost', { site: site, post: post, appState: appState, links: links })
            })
        })
    })
});
myApp.post('/editPost/:id', function(req, res) {
    var id = req.params.id
    var title = req.body.title;
    var body = req.body.body;
    var type = req.body.type;
    var imageName, imageFile, imagePath
    if (req.files) {
        imageName = req.files.image.name
        imageFile = req.files.image
        imagePath = 'public/img/' + imageName
        imageFile.mv(imagePath, (err) => {
            console.log(err)
        })
    }
    Post.findOne({ _id: id }).exec(function(err, post) {
        post.title = title;
        post.body = body;
        post.type = type;
        post.image = imageName;
        post.save().then(
            res.redirect(`/singlePost/${post._id}`)
        )
    })
});
myApp.get('/newPost', function(req, res) {
    if (appState.loggedIn) {
        Site.findOne({}).exec((err, site) => {
            Style.find({}).exec(function(err, styles) {
                res.render('newPost', { site: site, appState: appState, links: links });
            })
        })
    } else {
        res.redirect('/login')
    }
});

myApp.get('/singlePost/:id', function(req, res) {
    var id = req.params.id
    Site.findOne({}).exec((err, site) => {
        Style.find({}).exec(function(err, links) {
            Post.findOne({ _id: id }).exec(function(err, post) {
                res.render('singlePost', { site: site, post: post, appState: appState, links: links })
            })
        })
    })
});

myApp.get('/delete/:id', function(req, res) {
    if (appState.loggedIn) {
        var id = req.params.id
        Post.findByIdAndDelete({ _id: id }).exec(function(err, post) {
            res.redirect('/admin')
        })
    }
});


//----------- Start the server -------------------

myApp.listen(process.env.PORT);