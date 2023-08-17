#! /usr/bin/env node
import { program } from 'commander';
import { fetchLicense } from './src/scraper.js';
import fs from 'fs';
import chalk from 'chalk';

program
    .name('genlicenses')
    .description('GenLicenses is an opensource CLI that helps developers managing their JavaScript projects by generating open source licenses from their projects\'s dependencies.')
    .version('1.0.0');

program
    .option('--devonly', 'Only generates licences for the devDependencies of the project')
    .option('--prodonly', 'Only generates licences for the dependencies of the project')

program.parse();

const options = program.opts();
let prod = !!options.prodonly;
let dev = !!options.devonly;

if(!options.prodonly && !options.devonly) {
    prod = true;
    dev = true;
}

const fetchLicenses = async (depsToProcess) => {
    let licenses = []
    await Promise.all(depsToProcess.map(async (dep) => {
        const lic = await fetchLicense(dep);
        licenses.push(lic);
    }));
    return licenses;
}

const generateLicenses = async () => {
    const wd = process.cwd();
    let packageJSON;
    try {
        packageJSON = JSON.parse(fs.readFileSync(wd + "\\package.json"));
    } catch {
        console.error(chalk.redBright('File "package.json" not found, make sure you are running this command at the root of a node project.'));
        return;
    }

    var twirlTimer = (function() {
        var P = ["\\", "|", "/", "-"];
        var x = 0;
        return setInterval(function() {
          process.stdout.write("\r" + P[x++]);
          process.stdout.write(chalk.cyan("  Generating open source licenses, this process might take longer for larger projects."))
          x &= 3;
        }, 250);
    })();

    const name = packageJSON.name;
    const deps = packageJSON.dependencies == undefined ? [] : packageJSON.dependencies;
    const devDeps = packageJSON.devDependencies == undefined ? [] : packageJSON.devDependencies;
    let depsToProcess = {};
    if(prod) depsToProcess = deps;
    if(dev) depsToProcess = {...depsToProcess, ...devDeps};
    
    let data = `${name} uses the following open source projects:\n\n`
    
    let licenses = await fetchLicenses(Object.keys(depsToProcess)); 
    
    licenses.sort(function (a, b) {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });

    licenses.forEach(license => {
        data += `# [${license.name}](${license.url})\n\n`;
        data += `\`\`\`\n${license.text}\n\`\`\`\n\n`;
    });
    
    if(!fs.existsSync(wd + "\\docs")) {
        fs.mkdirSync(wd + "\\docs");
    }
    
    const licenses_path = wd + "\\docs\\LICENSES.md";
    fs.writeFileSync(licenses_path, data);
    clearInterval(twirlTimer);
    console.log(
        chalk.greenBright(
            `\rGenerated open source licenses for ${
                (prod ? Object.keys(deps).length : 0) + (dev ? Object.keys(devDeps).length : 0)
            } dependencies at ${licenses_path}`
        )
    );
}

generateLicenses();