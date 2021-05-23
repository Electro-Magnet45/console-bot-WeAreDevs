require("dotenv").config();
const Discord = require("discord.js");
const client = new Discord.Client();
const keepAlive = require("./server.js");
const fs = require("fs");
const cron = require("node-cron");

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
  if (msg.channel.type === "dm") return;
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
    if (!msg.content.startsWith("f!")) return;
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
  }
});

client.on("guildMemberAdd", (member) => {
  updateChnl(member.guild);
});

client.on("guildMemberRemove", (member) => {
  updateChnl(member.guild);
});

keepAlive();
client.login(process.env.TOKEN);
