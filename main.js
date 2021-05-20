require("dotenv").config();
const Discord = require("discord.js");
const client = new Discord.Client();
const keepAlive = require("./server.js");
const cron = require("node-cron");
const fetch = require("node-fetch");
const fs = require("fs");

const job = cron.schedule(
  "0 0 * * *",
  () => {
    fetch("http://quotes.stormconsultancy.co.uk/random.json")
      .then((res) => res.json())
      .then((json) => {
        client.channels.cache
          .get(process.env.QUOTECHID)
          .send(
            `@everyone\n_"${json.quote}"_ -${json.author}\nGood Morning ! :sun_with_face: :sun_with_face: `
          );
      });
  },
  {
    timezone: "Asia/Kolkata",
  }
);

job.start();

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
  var nstr = "";
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

  "sdfsdf".hexConv();
});

client.on("message", (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.type === "dm") return;
  const chId = msg.channel.id;
  const msgContentCase = msg.content.toLocaleLowerCase();

  if (chId === process.env.FEATURECHID) {
    client.channels.cache
      .get(process.env.REQUESTADMINCHID)
      .send(
        `@here A new feature has been requested by ${msg.author.username}:`,
        {
          embed: {
            description: msg.content,
            color: "success".hexConv(),
          },
        }
      );
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
  } else if (chId === process.env.BOTCHATCHID) {
    if (!msgContentCase.startsWith("$")) return;

    if (msgContentCase.startsWith("$b-")) {
      if (msgContentCase.substring(3, 6) === "set") {
        const bday = msgContentCase.substring(6);
        if (bday.includes("-") && bday.replace("-", "").length === 5) {
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
            bDay: bday.encodeDecode(),
          };
          oldData.push(data2);
          const newData = JSON.stringify(oldData, null, 2);

          fs.writeFileSync("birthday.json", newData);
          sendEmbed(
            "Birthday",
            `Set your birthday!\nYour next birthday is on ${bday}\n\nIf this is wrong delete your birthday by ${"`$b-delete`"} command`,
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

        sendEmbed(
          "Birthday",
          `Your Birthday is on ${data.bDay}`,
          msg,
          "success".hexConv(),
          false,
          false
        );
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
