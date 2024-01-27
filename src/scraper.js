import axios from "axios";
import fs from "fs";

const NPM_REG_URL = 'https://registry.npmjs.org/';
const GITHUB_LICENSE_TAG_REGEX = /<a href="(.+?((LICENSE.*?(?="))|(license.*?(?="))))/;
const HYPERLINK_TAG_REGEX = /(<a(.|\n)+?>)/g;
const GITLAB_LICENSE_TAG_ID_REGEX = /itemprop="license" href="(.+?(?=">))/;
const GITHUB_PROJECT_ROOT = /github\.com\/(.+?(?=\/))\/(.+?(?=\/))/; 
const GITHUBRAW_URL = "https://raw.githubusercontent.com";
const GITLAB_URL = "https://gitlab.com";

/**
 * Fetches the URL of the npm package's repository
 * @param {*} npmURL URL of the npm package
 * @returns URL of the npm package's git repository 
 */
export const fetchRepositoryUrl = async (npmURL) => {
    let res = (await axios.get(npmURL)).data.repository.url;
    if(res.startsWith("git://")) res = res.substring(6);
    else if(res.startsWith("git+")) res = res.substring(4);
    if(res.endsWith(".git#main")) res = res.substring(0, res.length-9);
    else if(res.endsWith(".git")) res = res.substring(0, res.length-4);
    return res;
}


/**
 * Fetches the package's license URL from its github repository
 * @param {*} githubURL GitHub URL of the npm package's repository
 * @returns Gitraw URL of the license
 */
export const fetchLicenseGitHub = async (githubURL) => {
    if(githubURL.slice(-1) != '/') githubURL += '/';
    let urlMatches = ("" + githubURL).match(GITHUB_PROJECT_ROOT) 
    const simplifiedURL = `https://api.github.com/repos/${urlMatches[1]}/${urlMatches[2]}/license`;
    const res = await axios.get(simplifiedURL);
    try {
        return res.data["download_url"];
    } catch {
        console.error("Error while parsing :", githubURL);
    }
}

/**
 * Fetches the package's license URL from its gitlab repository
 * @param {*} gitlabURL Gitlab url of the npm package's repository
 * @returns Gitraw URL of the license
 */
export const fetchLicenseGitLab = async (gitlabURL) => {
    const res = await axios.get(gitlabURL);
    try {
        const matches = ("" + res.data).match(GITLAB_LICENSE_TAG_ID_REGEX);
        return (GITLAB_URL + matches[1]).replace("blob", "raw");
    } catch {
        console.error("Error while parsing :", gitlabURL);
    }
}

/**
 * Fetches the package's license URL from its git repository
 * @param {*} gitURL Gitlab or Github url of the npm package
 * @returns Gitraw URL of the license
 */
export const fetchLicenseUrl = async (gitURL) => {
    if(("" + gitURL).includes("gitlab")) {
        return await fetchLicenseGitLab(gitURL);
    } else if (("" + gitURL).includes("github")) {
        return await fetchLicenseGitHub(gitURL);
    }
}

export const getNpmUrl = (packageName) => {
    return NPM_REG_URL + packageName;
}

/**
 * Fetches the license from the repository of the given npm package name
 * @param {*} npmPackageName Name of the npm package
 * @returns Object containing the name of the package,
 * the url of the package's repository as well as its license
 */
export const fetchLicense = async (npmPackageName) => {
    const url = getNpmUrl(npmPackageName);
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