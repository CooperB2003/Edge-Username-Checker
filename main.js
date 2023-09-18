import { addEdgeCorePlugins, lockEdgeCorePlugins, makeEdgeContext } from 'edge-core-js'
import exchangePlugins from 'edge-exchange-plugins'
import fs from 'fs'

addEdgeCorePlugins(exchangePlugins, makeEdgeContext)
lockEdgeCorePlugins()

const context = await makeEdgeContext({
    apiKey: '',
    appId: 'com.your-app',
    plugins: {
          'bitcoin': true
    }
})

console.log(context);
const filename = 'pwds.txt';

const usernames = fs.readFileSync(filename, 'utf-8').replace(/\r\n/g, '\n').split('\n');

// Limit the number of concurrent checks to avoid overwhelming the server
const CONCURRENT_CHECKS = 2500;

// Specify which chunk to start from
let START_CHUNK = 39;

// Split the usernames into chunks
const chunks = [];
for (let i = 0; i < usernames.length; i += CONCURRENT_CHECKS) {
  chunks.push(usernames.slice(i, i + CONCURRENT_CHECKS));
}

// Function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Read the unavailable usernames from the JSON file, or use an empty array if the file doesn't exist
let unavailableUsernames;
try {
  unavailableUsernames = JSON.parse(fs.readFileSync('unavailable_usernames.json', 'utf-8'));
} catch (error) {
  unavailableUsernames = [];
}

for (let j = START_CHUNK; j < chunks.length; j++) {
  const chunk = chunks[j];
  try {
    // Start all the checks in the chunk
    const promises = chunk.map(username => context.usernameAvailable(username));

    // Wait for all the checks in the chunk to complete
    const results = await Promise.all(promises);

    // Log the results and store unavailable usernames
    for (let i = 0; i < chunk.length; i++) {
      if (!results[i]) {
        console.log(`The username ${chunk[i]} is not available.`);
        unavailableUsernames.push(chunk[i]);
      }
    }

    console.log(`Finished checking chunk ${j + 1} of ${chunks.length}`);

    // Save unavailable usernames to a JSON file
    fs.writeFileSync('unavailable_usernames.json', JSON.stringify(unavailableUsernames));

    // Increment START_CHUNK
    START_CHUNK++;

    if (j < chunks.length - 1) {
        await delay(1000);
      }
    } catch (error) {
      console.error('An error occurred:', error);
  
      // If an error occurs, wait for 5 seconds and then retry the current chunk
      await delay(5000);
      j--;
    }
  }
