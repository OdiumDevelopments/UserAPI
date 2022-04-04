//Depedencies
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var app = express();
const port = 80;
app.set('trust proxy', true);
const ValidAPIKeys = [
    'Pr9iUSmdIaK6QVTgliCbrxGm65DWH0iK'
];


//Function to get current date and time
function getDateTime() {
    //Setting up the date and time
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec = date.getSeconds().toFixed(0);
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + "-" + month + "-" + day + "T" + hour + ":" + min + ":" + sec+"Z";
}

//Connect to Database
mongoose.connect('mongodb+srv://dburl');

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    admin: Boolean,
    banned: Boolean,
    created_at: Date,
    updated_at: Date,
    banned_on: Date,
    unbanned_on: Date,
    banned_reason: String,
    unbanned_reason: String,
    last_login: Date,
    last_ip: String,
    last_browser: String,
    last_os: String,
    last_hwid: String,
    last_location: String
});
//User Model
var User = mongoose.model('User', userSchema);
//Routes
app.use(bodyParser.json());
//Create
app.post('/api/v1/users', function(req, res) {
    var user = new User({
        username: req.body.username,
        password: req.body.password,
        admin: false,
        banned: false,
        created_at: getDateTime(),
        updated_at: getDateTime(),
        banned_on: req.body.banned_on,
        unbanned_on: req.body.unbanned_on,
        banned_reason: req.body.banned_reason,
        unbanned_reason: req.body.unbanned_reason,
        last_login: req.body.last_login,
        last_ip: req.ip,
        last_browser: req.body.last_browser,
        last_os: req.body.last_os,
        last_hwid: req.body.last_hwid, //Optional
        last_location: req.body.last_location
    });
    user.save(function(err, user) {
        if (err) {
            res.send(err);
        }
        res.json(user);
    });
});
//Read
app.get('/api/v1/users', function(req, res) {
    User.find(function(err, users) {
        if (err) {
            res.send(err);
        }
        //return username of all users.
        
        res.json(users);
    });
});

//return full user model for a single user.
app.get('/api/v1/users/username/:username', function(req, res) {
    User.findOne({ username: req.params.username }, function(err, user) {
        if (err) {
            res.send(err);
        }
        res.json(user);
    });
});

//Read Single
app.get('/api/v1/users/id/:user_id', function(req, res) {
    User.findById(req.params.user_id, function(err, user) {
        if (err) {
            res.send(err);
        }
        res.json(user);
    });
});
//Update
app.put('/api/v1/users/id/:user_id/apikey/:apikey', function(req, res) {
    User.findById(req.params.user_id, function(err, user) {
        if (err) {
            res.send(err);
        }
        if(!ValidAPIKeys.includes(req.params.apikey)){
            res.json({message: "Invalid API Key"});
        }
        user.username = req.body.username;
        user.password = req.body.password;
        user.admin = req.body.admin;
        user.banned = req.body.banned;
        user.updated_at = getDateTime();
        user.banned_on = req.body.banned_on;
        user.unbanned_on = req.body.unbanned_on;
        user.banned_reason = req.body.banned_reason;
        user.unbanned_reason = req.body.unbanned_reason;
        user.last_login = req.body.last_login;
        user.last_ip = req.ip;
        user.last_browser = req.body.last_browser;
        user.last_os = req.body.last_os;
        user.last_hwid = req.body.last_hwid;
        user.last_location = req.body.last_location;
        user.save(function(err, user) {
            if (err) {
                res.send(err);
            }
            res.json(user);
        });
    });
});

//Delete
app.delete('/api/v1/users/id/:user_id/apikey/:apikey', function(req, res) {
    if(!ValidAPIKeys.includes(req.params.apikey)){
        res.json({message: "Invalid API Key"});
    }
    else
    {
        User.remove({
            _id: req.params.user_id
        }, function(err, user) {
            if (err) {
                res.send(err);
            }
            res.json({
                message: 'User successfully deleted'
            });
        });
    }
});
//Ban
app.put('/api/v1/users/id/:user_id/ban/apikey/:apikey', function(req, res) {
    //check if admin first
    if(!ValidAPIKeys.includes(req.params.apikey)){
        res.json({message: "Invalid API Key"});
    }
    else
    {
        User.findById(req.params.user_id, function(err, user) {
            if (err) {
                res.send(err);
            }
            user.banned = true;
            user.banned_on = getDateTime();
            user.banned_reason = req.body.banned_reason;
            user.save(function(err, user) {
                if (err) {
                    res.send(err);
                }
                res.json(user);
            });
        });
    }
});
//Unban
app.put('/api/v1/users/id/:user_id/unban/apikey/:apikey', function(req, res) {
    if(!ValidAPIKeys.includes(req.params.apikey)){
        res.json({message: "Invalid API Key"});
    }
    else
    {
        User.findById(req.params.user_id, function(err, user) {
            if (err) {
                res.send(err);
            }
            if(user.admin != true){
                res.json({message: "You are not authorized to unban this user."});
            }
            user.banned = false;
            user.unbanned_on = req.body.unbanned_on;
            user.unbanned_reason = req.body.unbanned_reason;
            user.save(function(err, user) {
                if (err) {
                    res.send(err);
                }
                res.json(user);
            });
        });
    }
});
//List Banned
app.get('/api/v1/users/banned/apikey/:apikey', function(req, res) {
    if(!ValidAPIKeys.includes(req.params.apikey)){
        res.json({message: "Invalid API Key"});
    }
    else
    {
        User.find({
            banned: true
        }, function(err, users) {
            if (err) {
                res.send(err);
            }
            res.json(users);
        });
    }
});
//List Unbanned
app.get('/api/v1/users/unbanned/apikey/:apikey', function(req, res) {
    if(!ValidAPIKeys.includes(req.params.apikey)){
        res.json({message: "Invalid API Key"});
    }
    else
    {
        User.find({
            banned: false
        }, function(err, users) {
            if (err) {
                res.send(err);
            }
            res.json(users);
        });
    }
});

//Start Server
app.listen(port, () => {
    console.log(`USER API listening on https://localhost:${port}/`)
});