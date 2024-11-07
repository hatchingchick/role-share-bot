
const { Client, Intents } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const bot = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS]
});

const token = process.env.DISCORD_BOT_TOKEN;
const rolesConfig = require('./config.json').roles;
const defaultRoleId = require('./config.json').defaultRoleId;

bot.on('debug', console.log);
bot.on('rateLimited', (...args) => console.log(args));

bot.on('ready', () => {
    console.log(`[Client] ${bot.user.tag} is working`);
});


const assignTargetRole = async (member) => {
    for (const { checkServerId, checkRoleId, targetServerId, targetRoleId } of rolesConfig) {
        const checkGuild = bot.guilds.cache.get(checkServerId);
        if (!checkGuild) {
            console.error(`[Error] チェックサーバーが見つかりません: ${checkServerId}`);
            continue;
        }

        const checkMember = await checkGuild.members.fetch(member.id).catch(error => {
            console.error(`[Error] チェックサーバー内のメンバー取得エラー: ${error}`);
            return null;
        });

        const targetGuild = bot.guilds.cache.get(targetServerId);
        const targetMember = await targetGuild.members.fetch(member.id).catch(() => null);

        if (checkMember && checkMember.roles.cache.has(checkRoleId)) {
     
            if (targetMember && !targetMember.roles.cache.has(targetRoleId)) {
                await targetMember.roles.add(targetRoleId).catch(console.error);
                console.log(`ロールを付与しました: ${targetMember.user.tag} に ${targetRoleId}`);
            }
        }
    }
};


bot.on('guildMemberAdd', async (member) => {
    const targetGuild = bot.guilds.cache.get(member.guild.id);
    if (targetGuild) {
        const targetMember = await targetGuild.members.fetch(member.id);
        const hasTargetRole = rolesConfig.some(roleConfig => targetMember.roles.cache.has(roleConfig.targetRoleId));

        if (!hasTargetRole) {
            await targetMember.roles.add(defaultRoleId).catch(console.error);
            console.log(`デフォルトロールを付与しました: ${targetMember.user.tag} に ${defaultRoleId}`);
        }
    }
    await assignTargetRole(member);
});


bot.on('guildMemberUpdate', async (oldMember, newMember) => {
    console.log(`guildMemberUpdate triggered for ${newMember.user.tag}`);

    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    if (addedRoles.size > 0) {
        if (newMember.guild.id === rolesConfig[0].checkServerId) {
            await assignTargetRole(newMember);
        }
    }
});


bot.on('guildMemberRemove', async (member) => {
    if (member.guild.id === rolesConfig[0].checkServerId) {
        console.log(`guildMemberRemove triggered for ${member.user.tag}`);
 
        await assignOrRemoveTargetRole(member, 'remove');
    }
});


bot.on('guildMemberUpdate', async (oldMember, newMember) => {
    console.log(`guildMemberUpdate triggered for ${newMember.user.tag}`);

    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    if (addedRoles.size > 0) {
        if (newMember.guild.id === rolesConfig[0].checkServerId) {
            await assignTargetRole(newMember);
        }
    }


    if (removedRoles.size > 0) {
        for (const { checkRoleId } of rolesConfig) {
            if (removedRoles.has(checkRoleId)) {
                await assignOrRemoveTargetRole(newMember, 'remove');
                console.log(`チェックロールが外されました: ${newMember.user.tag}`);
                break;
            }
        }
    }
});

const assignOrRemoveTargetRole = async (member, action) => {
    for (const { checkServerId, checkRoleId, targetServerId, targetRoleId } of rolesConfig) {
        const checkGuild = bot.guilds.cache.get(checkServerId);
        if (!checkGuild) {
            console.error(`[Error] チェックサーバーが見つかりません: ${checkServerId}`);
            continue;
        }

        const checkMember = await checkGuild.members.fetch(member.id).catch(error => {
            console.error(`[Error] チェックサーバー内のメンバー取得エラー: ${error}`);
            return null;
        });

        const targetGuild = bot.guilds.cache.get(targetServerId);
        const targetMember = await targetGuild.members.fetch(member.id).catch(() => null);

        if (checkMember && checkMember.roles.cache.has(checkRoleId)) {
         
            if (targetMember && !targetMember.roles.cache.has(targetRoleId)) {
                await targetMember.roles.add(targetRoleId).catch(console.error);
                console.log(`ロールを付与しました: ${targetMember.user.tag} に ${targetRoleId}`);
            }
        } else {
     
            if (targetMember && targetMember.roles.cache.has(targetRoleId)) {
                await targetMember.roles.remove(targetRoleId).catch(console.error);
                console.log(`ターゲットロールを外しました: ${targetMember.user.tag} から ${targetRoleId}`);
            }
        }
    }
};

bot.login(token);
