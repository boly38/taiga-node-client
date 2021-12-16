import queryString from 'query-string';
import fetch from 'node-fetch';
import HttpsProxyAgent from 'https-proxy-agent';

/**
 **/
class TaigaClient {

  static DEBUG = process.env.TAIGA_DEBUG && process.env.TAIGA_DEBUG === '1';

  constructor(options) {
    if (!options) {
      options = {};
    }
    this.apiUrl = "apiUrl" in options ? options.apiUrl : (process.env.TAIGA_API_ENDPOINT || null);
    this._assumeApiUrl();
    this.apiUsername = "apiUsername" in options ? options.apiUsername : process.env.TAIGA_API_USERNAME;
    this.apiPassword = "apiPassword" in options ? options.apiPassword : process.env.TAIGA_API_PASSWORD;
    this._assumeApiCreds();
    this.lastLogin = null;
    TaigaClient.DEBUG && console.debug(`TaigaClient - apiUrl:${this.apiUrl}`);
  }

  login() {
    const client = this;
    const loginUrl = `${client.apiUrl}/api/v1/auth`;
    const username = client.apiUsername;
    const password = client.apiPassword;
    const type = 'normal';
    const loginBody = {username, password, type};
    const loginOptions = {
        method: 'POST',
        body: JSON.stringify(loginBody),
        headers: { 'Content-Type': 'application/json' }
    };
    client._enrichWithProxy(loginOptions);
    TaigaClient.DEBUG && console.debug(`login - loginUrl:${loginUrl} - options:${JSON.stringify(loginOptions)}`);
    return fetch(loginUrl, loginOptions).then(res => res.json())
      .then(json => {
        // console.log(JSON.stringify(json));
        if (json._error_message) {
          throw json._error_message;
        }
        client.lastLogin = json;
        client.token = json.auth_token
        console.log(`login ${json.full_name_display} OK`);
      })
      .catch(err => {
        console.log(`login failed: ${err}`);
      });
  }

  listProjects() {
    const client = this;
    client._assumeLogged();
    const listProjectUrl = `${client.apiUrl}/api/v1/projects`;
    const listProjectOptions = {
        headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.token}`
        }
    };
    client._enrichWithProxy(listProjectOptions);

    return fetch(listProjectUrl, listProjectOptions).then(res => res.json())
          .then(json => {
            // console.log(JSON.stringify(json));
            if (json._error_message) {
              throw json._error_message;
            }
            client.projects = json;

            console.log("projects:");
            client.projects.map( p => console.log(" * " + p.name + " : " + p.description) );
          })
          .catch(err => {
            console.log(`list projects failed: ${err}`);
          });
  }

  selectProject(projectName) {
    if (!this.projects) {
      throw `no projects, did you list them ?`;
    }
    const project = this.projects.find( p => p.name === projectName );
    if (!project) {
      throw `project ${projectName} not found`;
    }
    this.selectedProject = project;
  }

  listUserStoryStatus() {
    const client = this;
    client._assumeLogged();
    let listUserStoryStatusUrl = `${client.apiUrl}/api/v1/userstory-statuses`;
    if (client.selectedProject) {
        listUserStoryStatusUrl += `?project=${client.selectedProject.id}`;
    }
    const listUserStoryStatusOptions = {
        headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.token}`
        }
    };
    client._enrichWithProxy(listUserStoryStatusOptions);

    return fetch(listUserStoryStatusUrl, listUserStoryStatusOptions).then(res => res.json())
          .then(json => {
            // console.log(JSON.stringify(json));
            if (json._error_message) {
              throw json._error_message;
            }
            client.userStoryStatus = json;

            console.log("user story status " + (client.selectedProject ? "for " + client.selectedProject.name : "") + " :");
            client.userStoryStatus.map( uss => console.log(" * #" + uss.id + " | " + uss.name) );
          })
          .catch(err => {
            console.log(`list user story status failed: ${err}`);
          });
  }

  selectStoryStatus(storyStatusName) {
    if (!this.userStoryStatus) {
      throw `no user story status, did you list them ?`;
    }
    const oneStatus = this.userStoryStatus.find( uss => uss.name === storyStatusName );
    if (!oneStatus) {
      throw `user story status ${storyStatusName} not found`;
    }
    this.selectedStoryStatus = oneStatus;
  }

  listUserStories(filterByStatus = true) {
    const client = this;
    client._assumeLogged();
    let listUserStoriesUrl = `${client.apiUrl}/api/v1/userstories`;
    let queryParams = {};
    if (client.selectedProject) {
        queryParams.project = client.selectedProject.id;
    }
    if (filterByStatus && !client.selectedStoryStatus) {
      throw "there is no selected story status";
    }
    if (filterByStatus && client.selectedStoryStatus) {
        queryParams.status = client.selectedStoryStatus.id;
    }
    listUserStoriesUrl = `${listUserStoriesUrl}?${queryString.stringify(queryParams)}`;
    const listUserStoriesOptions = {
        headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.token}`
        }
    };
    client._enrichWithProxy(listUserStoriesOptions);

    return fetch(listUserStoriesUrl, listUserStoriesOptions).then(res => res.json())
          .then(json => {
            // console.log(JSON.stringify(json));
            if (json._error_message) {
              throw json._error_message;
            }
            client.stories = json;

            console.log("user stories" +
                (client.selectedProject ? " for " + client.selectedProject.name : "") +
                (client.selectedStoryStatus ? " status=" + client.selectedStoryStatus.name : "") +
                " :");
            client.stories.map( us => console.log(" * #" + us.id + " | " + us.subject ) ) // JSON.stringify(us)
          })
          .catch(err => {
            console.log(`list user stories status failed: ${err}`);
          });
  }

  deleteStoryById(storyId = null) {
    if (storyId === null || !Number.isInteger(storyId)) {
      throw "storyId (number) needed";
    }
    const client = this;
    client._assumeLogged();
    let deleteStoryUrl = `${client.apiUrl}/api/v1/userstories/${storyId}`;
    const deleteStoryOptions = {
        method: 'DELETE',
        headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.token}`
        }
    };
    client._enrichWithProxy(deleteStoryOptions);

    return fetch(deleteStoryUrl, deleteStoryOptions)
          .then(res => {
            if (res.status !== 204) {
              throw `api response : status ${res.status} - body: ${JSON.stringify(res)}`;
            }
            console.log(`user story #${storyId} removed`);
          })
          .catch(err => {
            console.log(`delete user story failed: ${err}`);
          });
  }

  async deleteStoryByStatus(dryRemove = true) {
    const client = this;
    await client.listUserStories();
    const currentStatus = client.selectedStoryStatus.name;
    if (dryRemove === true) {
      client.stories.forEach( us => {
        console.log(`DRY remove ${currentStatus} - user story ${us.id} - ${us.subject}`)
      });
      return;
    }
    client.stories.forEach( async function(us) {
      console.log(`remove ${currentStatus} - user story ${us.id} - ${us.subject}`)
      await client.deleteStoryById(us.id);
    });
  }

  _assumeApiUrl() {
    if (!this.apiUrl) { throw "apiUrl is required. ie. set TAIGA_API_ENDPOINT environment variable.";  }
  }
  _assumeApiCreds() {
    if (!this.apiUsername) { throw "apiUsername is required. ie. set TAIGA_API_USERNAME environment variable.";  }
    if (!this.apiPassword) { throw "apiPassword is required. ie. set TAIGA_API_PASSWORD environment variable.";  }
  }
  _assumeLogged() {
    if (!this.token) { throw "please login"; }
  }

  _enrichWithProxy(fetchOptions) {
    const httpProxy = process.env.HTTPS_PROXY
    if (httpProxy && httpProxy !== null && httpProxy !== '') {
      fetchOptions.agent = new HttpsProxyAgent(httpProxy);
    }
  }
}
export default TaigaClient;