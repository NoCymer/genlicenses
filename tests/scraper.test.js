import * as scraper from '../src/scraper.js';

test('Getting npm url from package name', () => { 
    expect(scraper.getNpmUrl("genlicenses")).toBe('https://registry.npmjs.org/genlicenses');
});

test('Getting repository URL from npm URL', async () => { 
    expect(await scraper.fetchRepositoryUrl("https://registry.npmjs.org/genlicenses"))
    .toBe('https://github.com/NoCymer/genlicenses');
});

test('Getting license URL from GitHub', async () => { 
    expect(await scraper.fetchLicenseGitHub("https://github.com/NoCymer/genlicenses"))
    .toBe('https://raw.githubusercontent.com/NoCymer/genlicenses/master/LICENSE');

    expect(await scraper.fetchLicenseUrl("https://github.com/NoCymer/genlicenses"))
    .toBe('https://raw.githubusercontent.com/NoCymer/genlicenses/master/LICENSE');
});

test('Getting license URL from GitLab', async () => { 
    expect(await scraper.fetchLicenseGitLab("https://gitlab.com/gitlab-org/gitlab-foss"))
    .toBe('https://gitlab.com/gitlab-org/gitlab-foss/-/raw/master/LICENSE');

    expect(await scraper.fetchLicenseUrl("https://gitlab.com/gitlab-org/gitlab-foss"))
    .toBe('https://gitlab.com/gitlab-org/gitlab-foss/-/raw/master/LICENSE');
});

test('Getting license from npm package name', async () => { 
    let license = await scraper.fetchLicense("genlicenses");

    expect(license.name).toMatch("genlicenses");
    expect(license.url).toMatch("https://github.com/NoCymer/genlicenses");
    expect(license.text.length).toBe(1064);
});