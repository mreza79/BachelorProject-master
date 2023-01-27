var GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/user')
const {clientID, clientSecret} = require("../../config/googleData")

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
        clientID, 
        clientSecret,
        callbackURL: "http://localhost:3001/google/callback"
    }, (accessToken, refreshToken, profile, done) => {
        console.log("profile.emails[0].value");

        User.findOne({email: profile.emails[0].value}).then((data) => {
            if (data) {

            } else {
                User({email: profile.emails[0].value, password: "12345678"}).save(function(err, data) {
                    return done(null, data)
                })
            }
        })
    }

    ))

    passport.serializeUser(function(user, done) {
        done(null, user.id)
    })

    passport.deserializeUser(function  (id, done) {
        User.findById(id, function(err, user) {
            done(err, user)
        })
    })
}