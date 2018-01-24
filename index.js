const Discord = require('discord.js');
const request = require('request');
const fs = require('fs');
//const config = require('./config.json');


const bot = new Discord.Client();
bot.login(process.env.token);

const movieFormats = ['mov', 'mp4', 'mpeg4', 'avi', 'wmv', 'flv', '3gp', 'mpegs', 'webm' ];


bot.on('message', function (message) {

    //Ignore other bots
    if (message.author.bot) return;

    //Look for video attachments and download them
    var Attachment = (message.attachments).array();
    Attachment.forEach(function (attachment) {
        var filetype = attachment.filename.split('.').pop().toLowerCase();
        var filename = attachment.filename.substr(0, attachment.filename.indexOf('.'));
        if (movieFormats.includes(filetype)) {

            console.log('Uploading video from ' + message.author.tag + ' in ' + message.guild.name);

            request.get({
                url: 'https://api.streamable.com/import?url=' + attachment.url,
                json: true,
                data: {
                    title: filename
                },
                auth: {
                    username: process.env.email,
                    password: process.env.password
                }
            }, function (error, response, body) {
                if (body.status === 2) {
                    message.channel.send('https://streamable.com/' + body.shortcode);
                }
                else if (body.status === 1) {
                    console.log('video uploading, waiting...');
                    if (getUrlRetry(body.shortcode) === 2) {
                        message.channel.send('https://streamable.com/' + body.shortcode);
                    }
                }
                else {
                    //console.log(body);
                    console.log('unusual status code found: ' + body.status);
                    if (getUrlRetry(body.shortcode) === 2) {
                        message.channel.send('https://streamable.com/' + body.shortcode);
                    }
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
            if (body.status === 2) {
                console.log('video done');
                message.channel.send('https://streamable.com/' + shortcode);
            }
            else if (body.status === 1) {
                console.log('video uploading, waiting...');
                setTimeout(function () {
                    getUrlRetry(shortcode);
                }, 1000);
            }
            else {
                console.log('unusual status code found: ' + body.status);
                setTimeout(function () {
                    getUrlRetry(shortcode);
                }, 1000);
            }
        });
    }

    if(message.author.tag === 'Shuii#9701'){
        if(message == 'list guilds'){
            message.reply('\n' + bot.guilds.map(function (guild) {
                return guild.name;
            }).join('\n'));
        }
    }
});