const Discord = require("discord.js");
const client = new Discord.Client();
const keepAlive = require("./server.js");
const cron = require("node-cron");
const fetch = require("node-fetch");

const job = cron.schedule(
  "0 0 * * *",
  () => {
    fetch("http://quotes.stormconsultancy.co.uk/random.json")
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
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

const sendIntroFormat = () => {
  const channel = client.channels.cache.get(process.env.INTROCHID);

  const embed = new Discord.MessageEmbed()
    .setColor(
      "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0")
    )
    .setTitle("**__Format__**")
    .setDescription(
      `Full Name: Console\nAge: 14\nLikes: Listening to the console\nDislikes: Alternatives to console`
    )
    .setTimestamp();

  channel.send(embed);
};

client.on("ready", () => {
  console.log("Logged in");
  client.user.setPresence({
    activity: { name: "the console", type: "LISTENING" },
    status: "idle",
  });
});

client.on("message", (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.type === "dm") return;
  const chId = msg.channel.id;

  if (chId === process.env.FEATURECHID) {
    client.channels.cache
      .get(process.env.REQUESTADMINCHID)
      .send(
        `@here A new feature has been requested by ${msg.author.username}:\n${msg.content}`
      );
  } else if (chId === process.env.INTROCHID) {
    msg.react("%F0%9F%91%8B");
    sendIntroFormat();
  }
});

keepAlive();
client.login(process.env.TOKEN);
