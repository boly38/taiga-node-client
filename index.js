import TaigaClient from "./src/TaigaClient.js"

const client = new TaigaClient();

await client.login();
await client.listProjects();
await client.selectProject('MyProject');
await client.listUserStoryStatus();
await client.selectStoryStatus('2020_05_Terminé');
await client.listUserStories();
const dryRemove = true; // true is recommended the first time and only print stories to remove
// const dryRemove = false; //  /!\ warning  /!\ warning // false will do real delete !
await client.deleteStoryByStatus(dryRemove);