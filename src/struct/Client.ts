import { Client, Collection, Intents } from 'discord.js';
import CommandHandler from '../handlers/Command';
import EventHandler from '../handlers/Event';
import SettingsManager from './managers/Settings';
import Utilities from './Util';
import * as mongoose from 'mongoose';
import 'dotenv/config';

declare module 'discord.js' {
    interface Client {
        commands: CommandHandler;
        events: EventHandler;
        settings: SettingsManager;
        util: Utilities;
        cooldowns: Collection<string, Collection<string, number>>;
        _cachedMails: Set<string>;
    }
}

export default class Maily extends Client {
    constructor() {
        super({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
                Intents.FLAGS.DIRECT_MESSAGE_TYPING,
                Intents.FLAGS.GUILD_MESSAGES,
            ],

            partials: ['MESSAGE', 'CHANNEL'],
        });

        this.commands = new CommandHandler(this);
        this.events = new EventHandler(this);
        this.settings = new SettingsManager();
        this.util = new Utilities(this);

        this._cachedMails = new Set();
        this.cooldowns = new Collection();

        this.once('ready', () => console.log('Yoo this is ready!'));

        this.on('interactionCreate', (interaction) => {
            if (!interaction.isCommand()) return;

            const command = this.commands.modules.get(interaction.commandName);

            if (command) {
                try {
                    command.execute(interaction);
                } catch (error) {
                    console.log(error);
                }
            }
        });
    }

    public async start() {
        await mongoose.connect(process.env.MONGODB_URI as string);
        return super.login(process.env.DISCORD_TOKEN as string);
    }
}
