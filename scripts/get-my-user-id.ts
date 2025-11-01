import { TwitterApi } from 'twitter-api-v2';

async function getMyUserId() {
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });

  try {
    // Method 1: Get your own user ID using /users/me
    console.log('Fetching your user information...\n');
    const me = await client.v2.me();

    console.log('✅ Success!');
    console.log('─────────────────────────');
    console.log(`Username: @${me.data.username}`);
    console.log(`Name: ${me.data.name}`);
    console.log(`User ID: ${me.data.id}`);
    console.log('─────────────────────────');
    console.log(`\nYou can now run the workflow with:\n`);
    console.log(`npm run test-x-mcp -- ${me.data.id}`);

  } catch (error: any) {
    console.error('❌ Error fetching user ID:');
    console.error(error.message);

    if (error.code === 403) {
      console.log('\n💡 Make sure your .env has all OAuth 1.0a credentials:');
      console.log('   X_API_KEY');
      console.log('   X_API_SECRET');
      console.log('   X_ACCESS_TOKEN');
      console.log('   X_ACCESS_SECRET');
    }
  }
}

getMyUserId();
