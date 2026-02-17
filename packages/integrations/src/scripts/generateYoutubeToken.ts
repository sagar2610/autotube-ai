import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { google } from 'googleapis';

async function main() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI ?? 'http://localhost:3000/oauth2callback';
  if (!clientId || !clientSecret) throw new Error('Set YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET');

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent',
  });

  console.log('Open this URL in browser:\n', authUrl);
  const rl = readline.createInterface({ input, output });
  const code = await rl.question('Paste authorization code: ');
  rl.close();

  const { tokens } = await oauth2Client.getToken(code);
  console.log('Refresh token (store in .env as YOUTUBE_REFRESH_TOKEN):\n', tokens.refresh_token);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
