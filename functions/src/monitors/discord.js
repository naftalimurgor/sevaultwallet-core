/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const functions = require('firebase-functions')

const { Client, GatewayIntentBits, TextChannel } = require('discord.js')

const CHANNEL_ID = functions.config().sevault.channelid

const discordToken = functions.config().sevault.discordtoken

async function postDiscordMessage(message) {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  })
  client.once('ready', async () => {
    try {
      const channel = await client.channels.fetch(CHANNEL_ID)
      if (!channel) {
        return
      }
      await channel.send(message)
    } catch (error) {
      console.error('Failed to post exception trace to Discord:', error)
    }
  })

  client.login(discordToken)
}

module.exports = postDiscordMessage
