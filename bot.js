const amqp = require("amqplib");
const config = require("./config.json");
const Discord = require("discord.js");
const bot = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ["TYPING_START"],
});

bot.login(config.token);

bot.on("ready", () => {
    consume();
    console.log(
        `Bot is online!\n${bot.users.size} users, in ${bot.guilds.size} servers connected.`
    );
});

bot.on("message", async (message) => {
    if (message.author.bot || message.system) return;

    if (message.content.indexOf(config.prefix) === 0) {
        console.log(message.author.username, ": ", message.content);

        const msg = message.content.slice(config.prefix.length);
        const args = msg.split(" ");
        args.shift();
        const cmd = args[0].toLowerCase();

        if (cmd === "vision") {
            vision(message, args);
        } else if (cmd === "publish") {
            const input = {
                job: args[1],
                channelId: message.channel.id,
            };
            publish(input);
    
        } else {
            message.channel.send("I don't know what command that is.");
            return;
        }
    }

    return;
});

const vision = (message, args) => {
    // TODO: Check if image link or direct image
    if (args.length > 1) {
                const url = args[1];
                message.channel.send(url);
            } else {
                const filter = (m) => m.author.id === message.author.id;
                message.reply("Please send an image.").then((r) => {});
                message.channel
                    .awaitMessages(filter, {
                        max: 1,
                        time: 30000,
                    })
                    .then((collected) => {
                        if (collected.first().content === "cancel") {
                            message.reply("Canceled.");
                        } else if (collected.first().attachments.first()){
                            message.channel.send(
                                collected.first().attachments.first().url
                            );
                        } else {
                            message.reply("Not an image.");
                        }
                        
                    });
            }
}

const publish = async function(msg) {
    try{
        const amqpServer = "amqp://localhost:5672";
        const connection = await amqp.connect(amqpServer);
        const channel = await connection.createChannel();
        await channel.sendToQueue("jobs", Buffer.from(JSON.stringify(msg)));
        console.log(`Job sent successfully ${msg.job}`);
    }
    catch (ex){
        console.error(ex);
    }
};

const consume = async function() {
    try {
        const amqpServer = "amqp://localhost:5672";
        const connection = await amqp.connect(amqpServer);
        const channel = await connection.createChannel();
        channel.consume("jobs", msg => {
            const input = JSON.parse(msg.content.toString());
            console.log(`Recieved job with input ${input.job}`);
            bot.channels.cache.get(input.channelId).send(input.job);
            channel.ack(msg);
        })

    }
    catch (ex){
        console.error(ex);
    }
};

process.on("uncaughtException", (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    console.error("Uncaught Exception: ", errorMsg);
});

process.on("unhandledRejection", (err) => {
    console.error("Uncaught Promise Error: ", err);
});
