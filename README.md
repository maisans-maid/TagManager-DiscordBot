# How to use this bot
In windows operating system, you need to download the windows build tools to be able to host this bot. Open a command prompt / powershell with Administrator privileges and run the following command:
```
npm install --global --production windows-build-tools
```

## Preparing the bot
1. Create an empty .env file on the directory
2. Go to [Mongo DB Atlas](https://cloud.mongodb.com) and create a free account. Create a free tier sandbox/database and get your connection URI. Make sure you whitelist the IP address from where your bot tries to connect. Paste the generated connection uri to your .env file under the key "MONGO_URI". 
3. Go to [Discord Developer Portal](https://discord.com/developers/applications) and create a bot. Select new Application -> Navigate to the Bot section and click generate token. Copy this token to your .env file under the key "DISCORD_TOKEN".
4. Go to your discord server, right click on the icon of your server, and select copy id and paste this id to your .env file under the key "GUILD_ID".
5. Go to your server settings, create a new role. This role will allow the user to create, edit, and delete tags in your server. copy the role id and paste this id on your .env file under the key "AUTHORIZED_ROLE".
6. Overall, your env file should look similar to this: (asterisks indicate sensitive information)
```env
MONGO_URI=mongodb+srv://super_hideous_user:super_secret_password@cluster0.****.mongodb.net/*********?retryWrites=true&w=majority
DISCORD_TOKEN=NTk5Mjc0MzY1NTAyMDk1Mzcw.XSizvg.ecj2ZM5jy68kPWKhY**********
GUILD_ID=59002493**********
AUTHORIZED_ROLE=83276051**********
``` 
7. Invite your bot to your server bearing the `bot` and `application.commands` scopes. Generate the invlite link in the OAuth2 URL Generator under the OAuth2 category.
8. Install the dependencies through `npm install` and launch the bot via the command `node index.js` on terminal.



## What are tags?
Tags are short articles that aims to explain something to a user through a catchphrase/word, which is known as tag. They are useful on support servers who constantly replies the same answer over and over again for different users. Tag aims to reduce the response time from the devs since it allows regular users to use them as well. If devs aren't around, regular users may help point out the answer by using tags generated by the support team themselves.

![](https://media.discordapp.net/attachments/590024931916644376/832781288191557682/unknown.png)

*The image above shows how a tag can be used. Developers created the tag to ease response times to most common questions. Taken from Discord.JS official support server*.

## Adding Tags
To add a tag, use the command `tag add [name of the tag] [response]`.
```
tag add drivequota Follow the following steps to bypass download quota exceeded error:
1. Sign in to Google Drive account after opening the file link.
2. Replace the “uc” with “open” in the file URL.
3. Reload the page and bypass download quota exceeded error.
4. Click the Add to My Drive icon.
5. Select the same option again to confirm.
```
The command above successfully created a new tag. Whenever a user types /drivequota on chat, the bot will respond like that.

![image](https://user-images.githubusercontent.com/56829176/115097270-b4daa380-9f5b-11eb-90f7-b026a723c8f8.png)

You can also add a flavor text with discord-supported markdown, including bold, italics, underline, and hyperlink to name a few. To add hyperlink, use the format [word]\(uri reference). Embeds are supported aswell. If you don't know how to build one, go [here](https://leovoel.github.io/embed-visualizer/).

*Make sure your JSON syntax is correct before setting it on a tag. Check its validity [here](https://jsonformatter.curiousconcept.com/#)*

## Deleting Tags
To delete a tag, simply use the command `tag delete [name of the tag]`.

## Editing Tags
You can edit a tag's `response`, `description`, and if it's `ephemeral`.
### Tag responses are what the bot sends whenever we type the tag. 
To edit it, use the command `tag edit [name of the tag] response [new response]`
### Tag description is what displays at the discord slash command UI before you use a command.
To edit it, use the command `tag edit [name of the tag] description [new description]`

![image](https://user-images.githubusercontent.com/56829176/115098801-a0e76f80-9f64-11eb-89ec-507fc00180f6.png)

*An example of the discord slash command UI displaying the tag description underneath*

Description must not exceed 100 characters in length
### Ephemeral Tag makes the tag viewable only by the executor
To make a tag ephemeral or not, use the command `tag edit [name of the tag] ephemeral [true or false]`

![image](https://user-images.githubusercontent.com/56829176/115098838-eb68ec00-9f64-11eb-9f71-0b3db88838a9.png)


*This does not work with Message Embed responses*

## Limitations
* Number of tags cannot exceed 50.
* Tag Description must not exceed 100 characters.

## Commands list
| Description | Command |
|---|---|
Add a tag | `tag add [tag name] [response]`
Delete a tag | `tag delete [tag name]`
Edit a tag's response | `tag edit [tag name] response [new response]`
Edit a tag's description | `tag edit [tag name] description [new description]`
Make a tag ephemeral | `tag edit [tag name] ephemeral true`
Make a tag not ephemeral | `tag edit [tag name] ephemeral false`
Sync tag to the database | `tag sync` (May cause some tags to be deleted if db is not synced / Use only for debugging)