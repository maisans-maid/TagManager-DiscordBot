/**
 * BOT FOR CREATING TAGS ON SUPPORT SERVERS
 * CAN ONLY SUPPORT 1 SERVER ATM
 */

require('dotenv').config();
const { Client, APIMessage, Structures, MessageEmbed, Collection } = require('discord.js');
const mongoose = require('mongoose');
const client = new Client();

const database = mongoose.model('guildtags', mongoose.Schema({
	_id: String,
	tags: { type: Array, default: []}
}, { versionKey: false }));

class GuildTag{
	constructor(data = {}){
		this.name = data.name;
		this.description = data.description;
		this.ephemeral = data.ephemeral;
		this.response_type = data.response_type;
		this.response_content = data.response_content;
		this.response_author = data.response_author;
	};
};

mongoose.connect(process.env.MONGO_URI, {
	useUnifiedTopology: true,
    connectTimeoutMS: 10000,
    useNewUrlParser: true,
    autoIndex: false,
    poolSize: 5,
    family: 4
});

mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
mongoose.connection.once('connected', () => console.log('DB Connected!'));

async function syncCommand(){
	const document = await database.findById(process.env.GUILD_ID) || new database({ _id: process.env.GUILD_ID });
	return client.api.applications(client.user.id).guilds(process.env.GUILD_ID).commands.put({ data : document.tags }).then(() => {
		client.commands = new Collection();
		return reloadCommand();
	});
};

function reloadCommand(){
	return client.api.applications(client.user.id).guilds(process.env.GUILD_ID).commands.get()
	.then(async commands => {
		const document = await database.findById(process.env.GUILD_ID) || new database({ _id: process.env.GUILD_ID });
		for (const command of commands){
			client.commands.set(command.name, Object.assign(document.tags.find(x => x.name === command.name), { id: command.id }));
		};
		return Promise.resolve();
	});
};

client.once('ready', async () => {
	console.log(`${client.user.tag} is online and ready!`);
	reloadCommand().catch((err) => console.log(`An error occured while loading the guild commands: ${err.message}`));
});

client.commands = new Collection();

Structures.extend('Message', DJSMessage => class Message extends DJSMessage{
	async reply(content, options = {}){
		const mentionRepliedUser = typeof ((options || content || {}).allowedMentions || {}).repliedUser === "undefined" ? true : ((options || content).allowedMentions).repliedUser;
		delete ((options || content || {}).allowedMentions || {}).repliedUser;

        const apiMessage = content instanceof APIMessage ? content.resolveData() : APIMessage.create(this.channel, content, options).resolveData();
        Object.assign(apiMessage.data, { message_reference: { message_id: this.id } });

        if (!apiMessage.data.allowed_mentions || Object.keys(apiMessage.data.allowed_mentions).length === 0){
			apiMessage.data.allowed_mentions = { parse: ["users", "roles", "everyone"] };
        };

        if (typeof apiMessage.data.allowed_mentions.replied_user === "undefined"){
            Object.assign(apiMessage.data.allowed_mentions, { replied_user: mentionRepliedUser });
        };

        if (Array.isArray(apiMessage.data.content)) {
            return Promise.all(apiMessage.split().map(x => {
                x.data.allowed_mentions = apiMessage.data.allowed_mentions;
                return x;
            }).map(this.inlineReply.bind(this)));
        };

        const { data, files } = await apiMessage.resolveFiles();
        return this.client.api.channels[this.channel.id].messages
            .post({ data, files })
            .then(d => this.client.actions.MessageCreate.handle(d).message);
    }
})

client.on('message', async(message) => {
	if (message.author.bot || message.type === 'dm' || !message.member.roles.cache.has(process.env.AUTHORIZED_ROLE) || message.guild.id !== process.env.GUILD_ID){
		return;
	};
	
	const [ command = '', subcommand = '', tagname = '', ...parameter] = message.content.split(/ +/);
	
	if (command.toLowerCase() === 'tag'){
		if (subcommand.toLowerCase() === 'add'){
			if (client.commands.size === 100){
				return message.reply('The Tags list is full, please delete some of the tags before you can add one.');
			} else if (!tagname){
				return message.reply('Please specify the tagname to add')
			} else if (client.commands.has(tagname.toLowerCase())){
				return message.reply('This tag already exists. You can edit this tag through \`tag edit ${tagname} [parameters]\` command.')
			} else if (!parameter[0]){
				return message.reply(`Please specify the response for tag \`${tagname}\``);
			} else {
				const response = parameter.join(' ');
				const document = await database.findById(message.guild.id) || new database({ _id: message.guild.id });
				const TAG_INST = new GuildTag({ name: tagname.toLowerCase() });
				try {
					const parsed = JSON.parse(JSON.stringify(parameter.join(' ')));
					TAG_INST.response_content = new MessageEmbed(parsed.embed || parsed);
				} catch (err){
					TAG_INST.response_content = parameter.join(' ');
				};
				TAG_INST.response_type = typeof TAG_INST.response_content === 'object' ? 'embed' : 'text';
				TAG_INST.response_author = message.author.tag;
				TAG_INST.ephemeral = false;
				TAG_INST.description = `Tag Helper for ${tagname}, authored by ${message.author.tag}`;
				document.tags.push(TAG_INST);
				return document.save().then(() => {
					return client.api.applications(client.user.id).guilds(process.env.GUILD_ID).commands.post({data: TAG_INST }).then(async () => {
						await reloadCommand();
					    return message.reply(`Successfully added tag ${tagname}!`);
				    });
				}).catch(error => message.reply(`Unable to add tag ${tagname}: ${error.message}`));
			};
		} else if (subcommand.toLowerCase() === 'edit'){
			if (!tagname){
				return message.reply('Please specify the tagname to edit');
			} else if (!client.commands.has(tagname.toLowerCase())){
				return message.reply('This tag doesn\'t exist. You can add this tag instead through \`tag add ${tagname} [response]\`')
			} else if (!['response', 'description', 'ephemeral'].includes((parameter[0]||'').toLowerCase())){
				return message.reply(`Please specify which part of this tag to edit. Can either be \`response\` , \`ephemeral\`, or \`description\`.`);
			} else if (!parameter[1]){
				return message.reply(`Please specify the content of this edit. \`${command} ${subcommand} ${tagname} ${parameter[0]} [content]\``);
			} else{
				const document = await database.findById(message.guild.id) || new database({ _id: message.guild.id });
				const element = document.tags.splice(document.tags.findIndex(x => x.name === tagname.toLowerCase()),1)[0];
				const TAG_INST = new GuildTag(element);
				if (parameter[0] === 'response'){
					try {
					    const parsed = JSON.parse(parameter.slice(1).join(' '));
					    TAG_INST['response_content'] = new MessageEmbed(parsed.embed || parsed);
					} catch (err) {
						TAG_INST['response_content'] = parameter.slice(1).join(' ');
					};
					TAG_INST.response_type = typeof TAG_INST.response_content === 'object' ? 'embed' : 'text';
				} else if (parameter[0] === 'description'){
					TAG_INST[parameter[0]] = String(parameter.slice(1).join(' ')).substr(0,100);
				} else if (parameter[0] === 'ephemeral'){
					TAG_INST[parameter[0]] = parameter[1] === 'true' ? true : false;
				};
				TAG_INST.description = TAG_INST.description ? String(TAG_INST.description).substr(0,100) : TAG_INST.description;
				document.tags.push(TAG_INST);
				return document.save().then(() => {
					return client.api.applications(client.user.id).guilds(process.env.GUILD_ID).commands.post({data: TAG_INST }).then(async () => {
						await reloadCommand();
					    return message.reply(`Successfully edited tag ${tagname}!`);
				    });
				}).catch(error => message.reply(`Unable to edit tag ${tagname}: ${error.message}`))
			};
		} else if (subcommand.toLowerCase() === 'delete'){
			if (!tagname){
				return message.reply('Please specify the tagname to delete');
			} else if (!client.commands.has(tagname.toLowerCase())){
				return message.reply('This tag doesn\'t exist. You can add this tag instead through \`tag add [tagname] [response]\`');
			} else {
				const document = await database.findById(message.guild.id) || new database({ _id: message.guild.id });
				document.tags.splice(document.tags.findIndex(x => x.name === tagname.toLowerCase()), 1);
				document.save().then(() => {
					return client.api.applications(client.user.id).guilds(process.env.GUILD_ID).commands(client.commands.get(tagname.toLowerCase()).id).delete()
					.then(() => {
					    client.commands.delete(tagname.toLowerCase());
					    reloadCommand();
					    message.reply(`Successfully deleted tag \`${tagname}\``);
				    })
				}).catch((error) => {
					message.reply(`Unable to delete tag \`${tagname}\`: ${error.message}`);
				});
			};
		} else if (subcommand.toLowerCase() === 'sync'){
			syncCommand()
		    .then(() => message.reply('SYNCED COMMANDS FROM DATABASE~!'))
		    .catch(error => message.reply(`Unable to Sync Commands: ${error.message}`));
	    } else {
			return message.reply('INVALID SUBCOMMAND: Subcommand must be one of the following: `add`, `delete`, or `edit`');
		};
	};
});

client.ws.on('INTERACTION_CREATE', async interaction => {
	async function send(content, ephemeral){
		let data = { content };
		
		if (typeof content === 'object'){
			const channel = client.channels.resolve(interaction.channel_id);
			const { data: messageData, files } = await APIMessage.create(channel, { embed: content }).resolveData().resolveFiles();
			data = { ...messageData, files };
		};
		if (ephemeral === true && data.content){
          data.flags = 1 << 6;
        };
		return client.api.interactions(interaction.id, interaction.token).callback.post({ data: { type: 4, data }});
	};
	const command = client.commands.get(interaction.data.name);
	return send(client.commands.get(interaction.data.name).response_content, client.commands.get(interaction.data.name).ephemeral);
});

client.login();
