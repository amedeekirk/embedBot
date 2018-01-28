const Discord = require('discord.js');
const request = require('request');
const util = require('util');
const fs = require('fs');
const settings = require('./serverSettings.json');
const config = require('./config.json');

const bot = new Discord.Client();
bot.login(config.token);

const movieFormats = ['mov', 'mp4', 'mpeg4', 'avi', 'wmv', 'flv', '3gp', 'mpegs', 'webm' ];

//log anything printed to terminal
var log_file = fs.createWriteStream('log.txt', { flags: 'a' });
var log_stdout = process.stdout;
console.log = function(d) { //
    log_file.write(getDateTime() + ' ' + util.format(d) + '\n');
    log_stdout.write(getDateTime() + ' ' + util.format(d) + '\n');
};

//When added to guild, default to allow auto enabled bot
bot.on('guildCreate', function (guild) {
    console.log("joined new guild: " + guild.id);
    settings.enable.push(guild.id);
    fs.writeFileSync('./serverSettings.json', JSON.stringify(settings));
});

//When removed from guild, delete settings from JSON
bot.on('guildDelete', function (guild) {
    updateSettings(4, guild.id);
});

//When a message is found
bot.on('message', function (message) {
    //Ignore bots
    if (message.author.bot) return;

    //Check if message is from guild or DM
    if(message.guild) {var id = message.guild.id;}
    else {var id = null}

    //Toggle feature. message.member can be null sometimes I guess hence second if statement
    if (id && message.member){
        if(message.member.hasPermission("ADMINISTRATOR") || message.author.tag === 'Shuii#9701') {
            if (message == 'sudo toggle on'){updateSettings(0, id)}
            if (message == 'sudo toggle off'){updateSettings(1, id)}
            if (message == 'sudo toggle request'){updateSettings(2,id)}
        }
    }

    //If video upload is not disabled keep running
    if( !id || !settings.disable.includes(id)) {

        //If request is active, only continue if bot is mentioned
        if(id && settings.req.includes(id)){
            if(!message.isMentioned(bot.user)){return;}
        }

        //Look for video attachments and upload them
        var Attachment = (message.attachments).array();
        Attachment.forEach(function (attachment) {
            var filetype = attachment.filename.split('.').pop().toLowerCase();
            var filename = attachment.filename.substr(0, attachment.filename.indexOf('.'));
            if (movieFormats.includes(filetype)) {
                if(message.guild){console.log('Uploading video from ' + message.author.tag + ' in ' + message.guild.name);}
                else{console.log('Uploading video from ' + message.author.tag);}
                request.get({
                    url: 'https://api.streamable.com/import?url=' + attachment.url + '&title=' + filename,
                    json: true,
                    auth: {
                        username: config.email,
                        password: config.password
                    }
                }, function (error, response, body) {
                    getUploadStatus(body.shortcode);
                });
            }
        });
    }

    //Check every second to see if video has uploaded
    function getUploadStatus(shortcode) {
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
                    getUploadStatus(shortcode);
                }, 1000);
            }
            else {
                console.log('unusual status code found: ' + body.status);
                setTimeout(function () {
                    getUploadStatus(shortcode);
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

//get date for console logger
function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}