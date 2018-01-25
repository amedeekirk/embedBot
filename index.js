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
    console.log("joined new guild");
    settings.enable.push(guild.id);
    fs.writeFileSync('./serverSettings.json', JSON.stringify(settings));
});

//When removed from guild, delete settings from json
bot.on('guildDelete', function (guild) {
    var id = guild.id;
    if(settings.enable.includes(id)){
       settings.enable.splice(settings.enable.indexOf(id))
   }
    if(settings.disable.includes(id)){
        settings.disable.splice(settings.disable.indexOf(id))
    }
    if(settings.req.includes(id)){
        settings.req.splice(settings.enable.indexOf(id))
    }
    fs.writeFileSync('./serverSettings.json', JSON.stringify(settings));

});

//When a message is found
bot.on('message', function (message) {
    //Ignore other bots
    if (message.author.bot) return;

    if(message.guild) {var id = message.guild.id;}
    else {var id = null}

    //Toggle feature. message.member can be null sometimes I guess hence second if statement
    //I'm the best coder :^)
    if (message.member && id){
        if(message.member.hasPermission("ADMINISTRATOR") || message.author.tag === 'Shuii#9701') {
            if (message == 'sudo toggle on') {
                if (settings.disable.includes(id)){
                    settings.disable.splice(settings.disable.indexOf(id), 1);
                }
                if (settings.req.includes(id)){
                    settings.req.splice(settings.req.indexOf(id), 1);
                }
                if(!settings.enable.includes(id)) {
                    settings.enable.push(id);
                    fs.writeFileSync('./serverSettings.json', JSON.stringify(settings));
                }
            }
            else if (message == 'sudo toggle off') {
                if (settings.enable.includes(id)){
                    settings.enable.splice(settings.enable.indexOf(id), 1);
                }
                if (settings.req.includes(id)){
                    settings.req.splice(settings.req.indexOf(id), 1);
                }
                if(!settings.disable.includes(id))
                {
                    settings.disable.push(id);
                    fs.writeFileSync('./serverSettings.json', JSON.stringify(settings));
                }
            }

            else if (message == 'sudo toggle request') {
                if (settings.disable.includes(id)){
                    settings.disable.splice(settings.disable.indexOf(id), 1);
                }
                if (settings.enable.includes(id)){
                    settings.enable.splice(settings.enable.indexOf(id), 1);
                }
                if(!settings.req.includes(id)) {
                    settings.req.push(id);
                    fs.writeFileSync('./serverSettings.json', JSON.stringify(settings));
                }
            }
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