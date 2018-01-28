const Discord = require('discord.js');
const request = require('request');
const fs = require('fs');
const settings = require('./serverSettings.json');
const config = require('./config.json');

const bot = new Discord.Client();
bot.login(config.token);

const movieFormats = ['mov', 'mp4', 'mpeg4', 'avi', 'wmv', 'flv', '3gp', 'mpegs', 'webm' ];

//When added to guild, default to allow auto enabled bot
bot.on('guildCreate', function (guild) {
    console.log("joined new guild: " + guild.id);
    console.log("alpha");
    settings.enable.push(guild.id);
    console.log("bravo");
    fs.writeFileSync('./serverSettings.json', JSON.stringify(settings));
    console.log("charlie")
});

//When removed from guild, delete settings from json
bot.on('guildDelete', function (guild) {
    updateSettings(4, guild.id);
});

//When a message is found
bot.on('message', function (message) {
    //Ignore other bots
    if (message.author.bot) return;

    //Check if message is from guild or DM
    if(message.guild) {var id = message.guild.id;}
    else {var id = null}

    //Toggle feature. message.member can be null sometimes I guess hence second if statement
    if (message.member && id){
        if(message.member.hasPermission("ADMINISTRATOR") || message.author.tag === 'Shuii#9701') {
            if (message == 'sudo toggle on'){updateSettings(0, id)}
            if (message == 'sudo toggle off'){updateSettings(1, id)}
            if (message == 'sudo toggle request'){updateSettings(2,id)}
        }
    }

    //If video upload is not disabled keep running
    if(!settings.disable.includes(id) || !id) {

        //If request is active, only continue if bot is mentioned
        if(id && settings.req.includes(id)){
            if(!message.isMentioned(bot.user)){return;}
        }
        //Look for video attachments and download them
        var Attachment = (message.attachments).array();
        Attachment.forEach(function (attachment) {
            var filetype = attachment.filename.split('.').pop().toLowerCase();
            var filename = attachment.filename.substr(0, attachment.filename.indexOf('.'));
            if (movieFormats.includes(filetype)) {

                if(message.guild){console.log('Uploading video from ' + message.author.tag + ' in ' + message.guild.name);}
                else{console.log('Uploading video from ' + message.author.tag);}

                request.get({
                    url: 'https://api.streamable.com/import?url=' + attachment.url,
                    json: true,
                    data: {
                        title: filename
                    },
                    auth: {
                        username: config.email,
                        password: config.password
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
    }

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

    //Allow me to check which guilds the bot is in
    if(message.author.tag === 'Shuii#9701'){
        if(message == 'list guilds'){
            message.reply('\n' + bot.guilds.map(function (guild) {
                return guild.name;
            }).join('\n'));
        }
    }
});

function updateSettings(setting, id) {
    console.log('updating settings for ' + id);
    var arrays = [settings.enable, settings.disable, settings.req];

    //delete server from other settings
    for(var i=0; i<arrays.length; i++){
        if(arrays[i].includes(id)){
            arrays[i].splice(arrays[i].indexOf(id), 1);
        }
    }
    //add server to new setting
    if(setting <= 3){arrays[setting].push(id);}
    fs.writeFileSync('./serverSettings.json', JSON.stringify(settings));
}