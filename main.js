require("dotenv").config();
const Discord = require("discord.js");
const client = new Discord.Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});
const keepAlive = require("./server.js");
const fs = require("fs");
const cron = require("node-cron");
const mongoose = require("mongoose");
const Questiondata = require("./QuestionData.js");
const Canvas = require("canvas");

String.prototype.encodeDecode = function () {
  var nstr = "";

  for (var i = 0; i < this.length; i++) {
    nstr += String.fromCharCode(
      this.charCodeAt(i) ^ Number(process.env.ENCODENUM)
    );
  }

  return nstr;
};

String.prototype.hexConv = function () {
  if (this.toString() === "success") {
    return "#1ab27c";
  } else {
    return "#ed4245";
  }
};

const applyText = (canvas, text) => {
  const context = canvas.getContext("2d");
  let fontSize = 70;

  do {
    context.font = `${(fontSize -= 10)}px sans-serif`;
  } while (context.measureText(text).width > canvas.width - 300);

  return context.font;
};

const sendEmbed = (title, data, dest, colour, isChnl, isArray) => {
  var content;
  if (!isArray) {
    content = data;
  }

  const embed = new Discord.MessageEmbed()
    .setColor(colour)
    .setTitle(`**__${title}__**`)
    .setDescription(content)
    .setTimestamp();

  if (isChnl) {
    dest.send(embed);
  } else {
    dest.reply(embed);
  }
};

const sendUserEmbed = (author, author2, thumbnail, colour, description) => {
  const chnl = client.channels.cache.get(process.env.HUBADMINCHID);
  const embed = new Discord.MessageEmbed()
    .setAuthor(author, author2)
    .setThumbnail(thumbnail)
    .setColor(colour)
    .setDescription(description)
    .setTimestamp();

  chnl.send(embed);
};

const updateChnl = (guild) => {
  guild.channels.cache
    .get(process.env.MEMBERCOUNTCHID)
    .setName(`member-count: ${guild.memberCount.toLocaleString()}`);
};

client.on("ready", () => {
  console.log("Logged in");
  client.user.setPresence({
    activity: { name: "the console", type: "LISTENING" },
    status: "idle",
  });

  const connection_url = process.env.DB_URL;
  mongoose
    .connect(connection_url, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .catch((err) => {
      console.log(err);
    });

  const job0 = cron.schedule(
    "0 0 * * *",
    () => {
      const data = fs.readFileSync("birthday.json");
      const birthdays = JSON.parse(data);
      const bthChnl = client.channels.cache.get(process.env.BIRTHDAYSCHID);
      const d = new Date();
      const mNow = d.getMonth();
      const dNow = d.getDate();

      birthdays.map((birthday) => {
        const bDay = birthday.bDay.encodeDecode().split("-");
        if (Number(bDay[0]) === mNow) {
          if (Number(bDay[1]) == dNow) {
            bthChnl.send(
              `<@${birthday.userId.encodeDecode()}> Happy Birthday 🎂🎂🎂!!`
            );
          }
        }
      });
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  job0.start();
});

client.on("message", (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.type === "dm") {
    Questiondata.findOne({
      userId: msg.author.id,
    })
      .sort({ date: "descending" })
      .exec((err, data) => {
        if (!err && data) {
          const chnl = client.channels.cache.get(process.env.HELPCHID);
          chnl.messages.fetch(data.questionId).then((message) => {
            const messageEmb = message.embeds[0];
            const embed = new Discord.MessageEmbed()
              .setAuthor(messageEmb.author.name, messageEmb.author.iconURL)
              .setColor("#ffea00")
              .setDescription(messageEmb.description)
              .addFields(
                {
                  name: "**Tags:**",
                  value: `${msg.content}\n`,
                  inline: true,
                },
                {
                  name: "**Status:**",
                  value: "⏳Waiting for Answers",
                }
              );
            message.edit(embed);
            Questiondata.deleteOne(
              {
                userId: msg.author.id,
              },
              (err, data) => {
                msg.reply(
                  "Make sure you react with ✅ if your answer is solved in the #help channnel!"
                );
              }
            );
          });
        }
      });
  }
  const chId = msg.channel.id;
  const msgContentCase = msg.content.toLocaleLowerCase();

  if (chId === process.env.SUGGESTIONCHATCHID) {
    const embed = new Discord.MessageEmbed()
      .setAuthor(msg.author.username, msg.author.displayAvatarURL())
      .setColor("#ffea00")
      .setDescription(`${msg.content}\n`)
      .addFields({
        name: "**Status:**",
        value: "⏳Waiting for Feedbacks from users.",
      });
    client.channels.cache
      .get(process.env.SUGGESTIONCHID)
      .send(embed)
      .then((msg) => {
        msg.react("👍");
        msg.react("👎");
      });
  } else if (chId === process.env.INTROCHID) {
    msg.react("%F0%9F%91%8B");
    sendEmbed(
      "Format",
      `Full Name: Console\nAge: 14\nLikes: Listening to the console\nDislikes: Alternatives to console`,
      client.channels.cache.get(process.env.INTROCHID),
      "success".hexConv(),
      true,
      false
    );
  } else if (chId === process.env.DISCUSSADMINCHID) {
    if (msg.content.startsWith("f!")) {
      const msgContentCase = msg.content.substring(2).toLocaleLowerCase();

      if (msgContentCase.substring(0, 3) === "set") {
        const msgId = msgContentCase.substring(3).split(" ")[1];
        const status = msgContentCase
          .substring(3)
          .toLocaleLowerCase()
          .split(" ")[2];
        const chnl = client.channels.cache.get(process.env.SUGGESTIONCHID);

        if (msgId && status) {
          chnl.messages.fetch(msgId).then((message) => {
            const messageEmb = message.embeds[0];
            const embed = new Discord.MessageEmbed()
              .setAuthor(messageEmb.author.name, messageEmb.author.iconURL)
              .setColor(
                status === "accept" ? "success".hexConv() : "error".hexConv()
              )
              .setDescription(messageEmb.description)
              .addFields({
                name: "**Status:**",
                value:
                  status === "accept"
                    ? "✅ Accepted! This feature will be released soon!"
                    : "❌ Rejected! Thanks for the suggestion, but we are not inerested in this feature..",
              });
            message.edit(embed);

            msg.channel.send(
              `The ${msgId} request has been ${
                status === "accept" ? status + "ed" : status + "d"
              } by \<@${msg.author.id}>`
            );
          });
        } else {
          msg.reply("This message or your commands does not exist!");
        }
      }
    } else if (msg.content.startsWith("$m-")) {
      if (msgContentCase.substring(3, 6) === "ban") {
        if (!msg.member.hasPermission("BAN_MEMBERS")) return;
        const userId = msgContentCase.split(" ")[1];
        const user = msg.guild.members.cache.get(userId);
        const days = Number(msgContentCase.split(" ")[2]);
        const reason = msg.content.split(" ").slice(3).join(" ");
        if (!user || !days || !reason) return;

        user.ban({ days: days, reason: reason }).then(() => {
          const author = `Banned by ${msg.author.username}#${msg.author.discriminator}`;
          sendUserEmbed(
            author,
            msg.author.displayAvatarURL(),
            user.user.avatarURL(),
            "error".hexConv(),
            `**Action**: Ban\n**User**: ${user.user.username}#${user.user.discriminator}\n**Days**: ${days}\n**Reason**: ${reason}`
          );
        });
      } else if (msgContentCase.substring(3, 8) === "unban") {
        if (!msg.member.hasPermission("BAN_MEMBERS")) return;
        const userId = msgContentCase.split(" ")[1];
        const reason = msg.content.split(" ").slice(2).join(" ");
        if (!userId || !reason) return;

        msg.guild.members.unban(userId).then(() => {
          const user = msg.guild.members.cache.get(userId);
          const author = `UnBanned by ${msg.author.username}#${msg.author.discriminator}`;
          sendUserEmbed(
            author,
            msg.author.displayAvatarURL(),
            user.user.displayAvatarURL(),
            "success".hexConv(),
            `**Action**: UnBan\n**User**: ${user.user.username}#${user.user.discriminator}\n**Reason**: ${reason}`
          );
        });
      } else if (msgContentCase.substring(3, 7) === "kick") {
        if (!msg.member.hasPermission("KICK_MEMBERS")) return;
        const userId = msgContentCase.split(" ")[1];
        const user = msg.guild.members.cache.get(userId);
        const reason = msg.content.split(" ").slice(2).join(" ");
        if (!user || !reason) return;

        user.kick({ reason: reason }).then(() => {
          const author = `Kicked by ${msg.author.username}#${msg.author.discriminator}`;
          sendUserEmbed(
            author,
            msg.author.displayAvatarURL(),
            user.user.avatarURL(),
            "error".hexConv(),
            `**Action**: Kick\n**User**: ${user.user.username}#${user.user.discriminator}\n**Reason**: ${reason}`
          );
        });
      }
    }
  } else if (chId === process.env.BOTCHATCHID) {
    if (!msgContentCase.startsWith("$")) return;

    if (msgContentCase.startsWith("$b-")) {
      if (msgContentCase.substring(3, 6) === "set") {
        const bday = msgContentCase.substring(7);
        if (
          bday.includes("-") &&
          bday.split("-")[0].length > 0 &&
          bday.split("-")[1].length > 0
        ) {
          const day = bday.split("-")[1].replace(/^0+/, "");
          const mnth = bday.split("-")[0].replace(/^0+/, "");
          const month = mnth - 1;
          const birthDay = `${month}-${day}`;

          const data = fs.readFileSync("birthday.json");
          const oldData = JSON.parse(data);

          if (oldData.some((e) => e.userId === msg.author.id.encodeDecode())) {
            sendEmbed(
              "Birthday",
              "You have already set your birthday!\nIf you want to delete it, use `$b-delete` command",
              msg,
              "error".hexConv(),
              false,
              false
            );
            return;
          }
          const data2 = {
            userId: msg.author.id.encodeDecode(),
            bDay: birthDay.encodeDecode(),
          };
          oldData.push(data2);
          const newData = JSON.stringify(oldData, null, 2);

          fs.writeFileSync("birthday.json", newData);
          sendEmbed(
            "Birthday",
            `Set your birthday!\nYour next birthday is on ${mnth.padStart(
              2,
              "0"
            )}-${day.padStart(
              2,
              "0"
            )}\n\nIf this is wrong delete your birthday by ${"`$b-delete`"} command`,
            msg,
            "success".hexConv(),
            false,
            false
          );
        } else {
          sendEmbed(
            "Birthday",
            "Send a valid date format\n`MM-DD`",
            msg,
            "success".hexConv(),
            false,
            false
          );
        }
      } else if (msgContentCase.substring(3) === "delete") {
        const data = fs.readFileSync("birthday.json");
        const oldData = JSON.parse(data);
        const data2 = oldData.filter((e) => {
          return e.userId !== msg.author.id.encodeDecode();
        });
        const newData = JSON.stringify(data2, null, 2);

        fs.writeFileSync("birthday.json", newData);
        sendEmbed(
          "Birthday",
          "You have deleted your birthday!",
          msg,
          "success".hexConv(),
          false,
          false
        );
      } else if (msgContentCase.substring(3) === "info") {
        const data1 = fs.readFileSync("birthday.json");
        const data = JSON.parse(data1);
        if (!data.some((e) => e.userId === msg.author.id.encodeDecode())) {
          sendEmbed(
            "Birthday",
            "You haven't set your birthday yet!\nSet it by `$b-set MM-DD` command",
            msg,
            "error".hexConv(),
            false,
            false
          );
          return;
        }

        data.map((e) => {
          if (e.userId === msg.author.id.encodeDecode()) {
            const data = e.bDay.encodeDecode();
            const day = data.split("-")[1];
            const mnth = data.split("-")[0];
            const month = Number(mnth) + 1;
            const birthDay = `${String(month).padStart(2, "0")}-${day.padStart(
              2,
              "0"
            )}`;
            sendEmbed(
              "Birthday",
              `Your Birthday is on ${birthDay}`,
              msg,
              "success".hexConv(),
              false,
              false
            );
          }
        });
      } else
        sendEmbed(
          "Console Bot",
          "Send a valid command",
          msg,
          "error".hexConv(),
          false,
          false
        );
    }
  } else if (chId === process.env.HELPCHATCHID) {
    if (!msg.mentions.roles.first()) return;
    if (msg.mentions.roles.first().id !== process.env.QUESTIONROLEID) return;
    const chnl = client.channels.cache.get(process.env.HELPCHID);
    const embed = new Discord.MessageEmbed()
      .setAuthor(msg.author.username, msg.author.displayAvatarURL())
      .setColor("#ffea00")
      .setDescription(`${msg.content}\n`)
      .addFields({
        name: "**Status:**",
        value: "⏳Waiting for Answers",
      });
    chnl.send(embed).then((sendMsg) => {
      sendMsg.react("✅");
      Questiondata.create(
        {
          userId: msg.author.id,
          questionId: sendMsg.id,
        },
        (err, data) => {
          msg.member.send(
            `Heyyy! Please provide the suitable tags for this question\n${sendMsg.url}\nSeperate the tags with a comma(,). Eg: nodejs, python, java`
          );
        }
      );
    });
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  if (reaction.message.channel.id === process.env.HELPCHID) {
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        return;
      }
    }

    const authorId = reaction.message.embeds[0].author.iconURL.split("/")[4];
    if (user.id !== authorId) {
      reaction.remove();
    } else {
      const field1 = reaction.message.embeds[0].fields[0];
      const messageEmb = reaction.message.embeds[0];
      const embed = new Discord.MessageEmbed()
        .setAuthor(messageEmb.author.name, messageEmb.author.iconURL)
        .setColor("success".hexConv())
        .setDescription(messageEmb.description)
        .addFields(field1, {
          name: "**Status:**",
          value: "✅This question is answered",
        });
      reaction.message.edit(embed);
    }
  }
});

client.on("guildMemberAdd", async (member) => {
  updateChnl(member.guild);
  const channel = member.guild.channels.cache.find(
    (ch) => ch.id === process.env.WELCOMECHID
  );

  const canvas = Canvas.createCanvas(700, 250);
  const context = canvas.getContext("2d");

  const background = await Canvas.loadImage("./background.png");
  context.drawImage(background, 0, 0, canvas.width, canvas.height);

  context.strokeStyle = "#74037b";
  context.strokeRect(0, 0, canvas.width, canvas.height);

  context.font = "28px sans-serif";
  context.fillStyle = "#ffffff";
  context.fillText(
    "Welcoming To The Server,",
    canvas.width / 2.5,
    canvas.height / 3.5
  );

  context.font = applyText(canvas, `${member.displayName}!`);
  context.fillStyle = "#ffffff";
  context.fillText(
    `${member.displayName}!`,
    canvas.width / 2.5,
    canvas.height / 1.8
  );

  context.beginPath();
  context.arc(125, 125, 100, 0, Math.PI * 2, true);
  context.closePath();
  context.clip();

  const avatar = await Canvas.loadImage(
    member.user.displayAvatarURL({ format: "jpg" })
  );
  context.drawImage(avatar, 25, 25, 200, 200);

  const attachment = new Discord.MessageAttachment(
    canvas.toBuffer(),
    "welcome-image.png"
  );

  channel.send("", attachment);
});

client.on("guildMemberRemove", (member) => {
  updateChnl(member.guild);
});

keepAlive();
client.login(process.env.TOKEN);
