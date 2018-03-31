# embedBot
 [![Discord Bots](https://discordbots.org/api/widget/servers/301179263233556480.svg)](https://discordbots.org/bot/301179263233556480)
  [![Discord Bots](https://discordbots.org/api/widget/status/301179263233556480.svg)](https://discordbots.org/bot/301179263233556480)

Takes video file from discord, uploads to Streamable, and posts link back in discord. This prevents having users download the video themselves.

DUE TO DISCORD UPDATE, THIS BOT IS NOW DEPRECIATED. Thank you to all that utilized at as well as helped me figure out what I was doing.

## How to Use
Simpily click the "invite to server" button above and select which discord server you'd like it to join.

**COMMANDS:**<br>
```sudo toggle on``` 		= 	Bot will upload all videos from the server. This is the default.<br>
```sudo toggle request```	=	Bot will only upload videos where it is mentioned in the description (@ShuiiBot#9991).<br>
```sudo toggle off``` 	=	Bot will not upload any videos.<br>

## Hosting Locally
Feel free to use all code for any purpose denoted under the ISC license. I do however urge you to not duplicate the bot, but rather use it as an reference.

To get this running locally, you will need to add two JSON files to the project with the listed format:

**config.json:**
```json
{  
   "dbtoken":"Your discordbots.org API token here",
   "token":"Your discord bot API token here",
   "email":"Your streamable.com email address here",
   "password":"Your streamable.com password here"
}
```

**serverSettings.json:**
```json
{  
   "enable":[],
   "disable":[],
   "req":[]
}
```
Once you have these you can simply 'npm start'

## Issues/Questions
Please do not hesitate to report any bugs in the issues section of this project. For any questions, please join my support server (2nd button at the top of this document) and I will be happy to help
