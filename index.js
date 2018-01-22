const Discord = require('discord.js');
const request = require('request');
const https = require('https');
const fs = require('fs');
const config = require("./config.json");

const bot = new Discord.Client();

bot.login(config.token);

bot.on('message', function (message) {
    //Ignore other bots
    if(message.author.bot) return;

    //Look for video attachments and download them
    var Attachment = (message.attachments).array();
    Attachment.forEach(function(attachment) {
        var filetype = attachment.filename.split('.').pop();
        var filename = attachment.filename.substr(0, attachment.filename.indexOf('.'));
        if (filetype.toLowerCase() === 'mov' || 'mp4' || 'mpeg4' || 'avi' || 'wmv' || 'flv' || '3gp' || 'mpegs' || 'webm') {

            request.get({
                url: 'https://api.streamable.com/import?url=' + attachment.url,
                json: true,
                title: filename,
                auth:{
                    username: config.email,
                    password: config.password
                }
            }, function (error, response, body) {
                if(body.status === 2){
                    message.channel.send ('https://streamable.com/' + body.shortcode);
                }
                else if(body.status === 1){
                    console.log('video uploading, waiting...');
                    if(getUrlRetry(body.shortcode) === 2){
                        message.channel.send ('https://streamable.com/' + body.shortcode);
                    }
                }
                else{
                    console.log(body);
                    console.log('error uploading video');
                }
            });
        }
    });

    //Check every second to see if video has uploaded
    function getUrlRetry(shortcode) {
        request.get({
            url: 'https://api.streamable.com/videos/' + shortcode,
            json: true
        }, function (error, response, body) {
            if(body.status === 2){
                console.log('video done');
                message.channel.send ('https://streamable.com/' + shortcode);
            }
            else if(body.status === 1){
                console.log('video uploading, waiting...');
                setTimeout(function(){getUrlRetry(shortcode);}, 1000);
            }
            else {
                console.log('error uploading video');
                console.log(body);
                setTimeout(function(){getUrlRetry(shortcode);}, 1000);
            }
        });
    }
});