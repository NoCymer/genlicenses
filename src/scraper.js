import axios from "axios";

const NPM_REG_URL = 'https://registry.npmjs.org/';
const GITHUB_LICENSE_TAG_ID_REGEX = /<a href="(.+?((LICENSE.*?(?="))|(license.*?(?="))))/;
const GITLAB_LICENSE_TAG_ID_REGEX = /itemprop="license" href="(.+?(?=">))/;
const GITHUB_PROJECT_ROOT = /github\.com\/(.+?(?=\/))\/(.+?(?=\/))/; 
const GITHUBRAW_URL = "https://raw.githubusercontent.com";
const GITLAB_URL = "https://gitlab.com";

const fetchRepositoryUrl = async (npmURL) => {
    let res = (await axios.get(npmURL)).data.repository.url;
    if(res.startsWith("git://")) res = res.substring(6);
    else if(res.startsWith("git+")) res = res.substring(4);
    if(res.endsWith(".git#main")) res = res.substring(0, res.length-9);
    else if(res.endsWith(".git")) res = res.substring(0, res.length-4);
    return res;
}

const fetchLicenseGitHub = async (githubURL) => {
    if(githubURL.slice(-1) != '/') githubURL += '/';
    let urlMatches = ("" + githubURL).match(GITHUB_PROJECT_ROOT) 
    const simplifiedURL = `https://github.com/${urlMatches[1]}/${urlMatches[2]}`;
    const res = await axios.get(simplifiedURL);
    try {
        const matches = ("" + res.data).match(GITHUB_LICENSE_TAG_ID_REGEX);
        return (GITHUBRAW_URL + matches[1]).replace("blob/", "");
    } catch {
        console.log(githubURL);
    }
}

const fetchLicenseGitLab = async (gitlabURL) => {
    const res = await axios.get(gitlabURL);
    try {
        const matches = ("" + res.data).match(GITLAB_LICENSE_TAG_ID_REGEX);
        return (GITLAB_URL + matches[1]).replace("blob", "raw");
    } catch {
        console.log(gitlabURL);
    }
}

const fetchLicenseUrl = async (gitURL) => {
    if(("" + gitURL).includes("gitlab")) {
        return await fetchLicenseGitLab(gitURL);
    } else if (("" + gitURL).includes("github")) {
        return await fetchLicenseGitHub(gitURL);
    }
}

export const fetchLicense = async (npmPackageName) => {
    const url = NPM_REG_URL + npmPackageName;
    const repoURL = await fetchRepositoryUrl(url);
    const res = await axios.get(
        await fetchLicenseUrl(repoURL)
    );
    return {
        name: npmPackageName,
        url: repoURL,
        text: res.data
    };
}