const config = require("./config.json");
const Discord = require("discord.js");

const bot = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ["TYPING_START"],
});

bot.login(config.token);

bot.on("ready", () => {
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

        if (cmd === "hi") {
            message.reply("Hi");
        } else if (cmd === "vision") {
            // listen for image
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
                        }
                        console.log(collected.first().attachments.first().url);
                        message.channel.send(
                            collected.first().attachments.first().url
                        );
                    });
            }
        } else {
            message.channel.send("I don't know what command that is.");
            return;
        }
    }

    return;
});

process.on("uncaughtException", (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    console.error("Uncaught Exception: ", errorMsg);
});

process.on("unhandledRejection", (err) => {
    console.error("Uncaught Promise Error: ", err);
});
