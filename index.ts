const request = require("request");
//const Discord = require("discord.js");
const { Client, Intents, MessageEmbed } = require('discord.js');


const options = {
  url: 'https://api.github.com/repos/skyrim-multiplayer/skymp/commits',
  headers: {
    'User-Agent': 'request'
  }
};
class Commit {
  type: string;
  text: string;

  constructor(type: string, text: string) {
    this.type = type;
    this.text = text;
  }
}

class DateMessage {
  date: number;
  message: string;

  constructor(date: number, message: string) {
    this.date = date;
    this.message = message;
  }
}

function parseMessage(message:string) : Commit  {
  let ind1:number = message.indexOf(':');
  let ind3:number = message.indexOf('(');
  let ind2:number = message.indexOf('\n');
  if(ind2==-1) ind2 = message.length;
  if(ind1!=-1) {
      if(ind3<ind1 && ind3!=-1)
      return new Commit(message.slice(0,ind3), message.slice(ind1+2,ind2));
      else
     return new Commit(message.slice(0,ind1), message.slice(ind1+2,ind2));
   }
  else return new Commit("","");
}

function parseDate(d : string) : number { //2021-08-02T09:20:05Z
  const date = new Date(d);
  let seconds : number = date.getTime() / 1000;
  return seconds;
}

function createEmbed(size : number,messages : Array<Commit>) {

    let Embeds : Array<any> = [];

    let Embed = new MessageEmbed()
    .setColor('#0099ff');
    //  .setTitle('TEST');
    let currType :string = "";
    let currText :string = "";
    let typeCounter : number = 0;

    for(let i:number = 0;i<size;i++) {
      if(typeCounter%25 == 0 && typeCounter!=0) {
        Embeds.push(Embed);
        Embed.fields = [];
      }
      let comm : Commit = messages[i];
      if(comm!=undefined) {
        if(currType!=comm.type) {
          if(currType!="" && currText!="") {
            typeCounter++;
            Embed.addField(currType,currText);
          }
          currType = comm.type;
          currText = comm.text;
        } else {
          currText+='\n';
          currText+=comm.text;
        }
      }
    }

    if(currType!="" && currText!="") {
      Embed.addField(currType,currText);
    }
    Embeds.push(Embed);
    return Embeds;

}

function customSort(arr:Array<Commit>) : Array<Commit> {

let compArr : Array<string> = [
"feat",
"fix",
"tests",
"perf",
"docs",
"internal"
];
arr.sort((a: Commit, b: Commit) => {
  let ind1 : number = compArr.indexOf(a.type);
  let ind2 : number = compArr.indexOf(b.type);
  if(ind1!=ind2) return ind1-ind2;

  return a.text.localeCompare(b.text);
});
return arr;
}


const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
//const client = new Discord.Client();
const clientId = "";
client.login(clientId);


client.on("ready", () => {
  console.log("bot start");
  client.user.setActivity("SkyMP");
});

client.on("messageCreate", (message) => {

  if(message.channel.type != "GUILD_TEXT") return;
  console.log(message.content);

  if(message.content == "!upd") {

    request(options, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        const info = JSON.parse(body);

        let filteredInfo = info.filter((info1) => {
            let date : string = info1.commit.committer.date;
            let tm : number = parseDate(date);
            let dateNow = new Date();
            return dateNow.getTime() / 1000 - tm < 7*24*60*60;
            return 1;
        });

        let size: number = filteredInfo.length;

        let messages: Array<string> = filteredInfo.map((info1) : string  => {
          return info1.commit.message;
        });
        console.log(messages);
        messages.sort();

        let parsedMessages : Array<Commit> = messages.map((msg) : Commit  => {
          let comm : Commit = parseMessage(msg);
          return comm;
        });

        let sortedMessages = customSort(parsedMessages);



        let Embeds = createEmbed(size,sortedMessages);

        for(let i =0;i<Embeds.length;i++) {
            message.channel.send({ embeds: [Embeds[i]] });
        }
      }
    });
  }

});