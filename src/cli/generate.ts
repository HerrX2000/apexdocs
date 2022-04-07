#!/usr/bin/env node
import * as yargs from 'yargs';

import { generate } from '../Command/Generate';
import FileManager from '../FileManager';
import * as fs from 'fs';
import { exit } from 'process';

let pwd = process.env.PWD+'/';

if(pwd === undefined){
  console.warn('Print working directory not defined. Ensure you pass a value for sourceDir (s).')
  pwd = '/';
}


const argv = yargs.options({
  sourceDir: {
    type: 'string', //Upstream 1.4 supports arrays as input. Our fork will not because, we parse the directories differently.
    alias: 's',
    default: pwd,
    describe: 'The root directory of your salesforce project. The sfdx-project.json determines the class folder.',
  },
  targetDir: {
    type: 'string',
    alias: 't',
    default: pwd+'docs',
    describe: 'The directory location where documentation will be generated to.',
  },
  recursive: {
    type: 'boolean',
    alias: 'r',
    default: true,
    describe: 'Whether .cls classes will be searched for recursively in the directory provided.',
  },
  scope: {
    type: 'array',
    alias: 'p',
    default: ['global', 'public', 'namespaceaccessible'],
    describe: 'A list of scopes to document. Values should be separated by a space, e.g --scope public private.',
  },
  targetGenerator: {
    type: 'string',
    alias: 'g',
    default: 'jekyll',
    choices: ['jekyll', 'docsify', 'jsdoc'],
    describe:
      'Define the static file generator for which the documents will be created. Currently supports jekyll and docsify.',
  },
  configPath: {
    type: 'string',
    alias: 'c',
    describe: 'The path to the JSON configuration file that defines the structure of the documents to generate.',
  },
  group: {
    type: 'boolean',
    alias: 'o',
    default: true,
    describe:
      'Define whether the generated files should be grouped by the @group tag on the top level classes.' +
      'If set to true, a sub directory will be created per group inside of the specified target directory.',
  },
  indexOnly: {
    type: 'boolean',
    default: false,
    describe:
      'Defines whether only the index file should be  generated.',
  },
  //Force should be prompt not cli parameter
  force: {
    type: 'boolean',
    default: true,
    describe: 'If true, the CLI command will run in a non-sfdx project.'
  }
}).argv;

if(argv.sourceDir.slice(-1) != '/'){
  argv.sourceDir = argv.sourceDir+'/';
}

let sfdxJsonPath = argv.sourceDir+'sfdx-project.json';
let classPath='';

//Maybe should be in another class
if (fs.existsSync(sfdxJsonPath)) {
  let sfdxJson = JSON.parse(fs.readFileSync(sfdxJsonPath).toString());
  sfdxJson.packageDirectories.forEach((packageDir:any) => {
    if(packageDir.default === true){
      classPath = packageDir.path+'/main/default/classes/'; //maybe not be the best way to determine class path
      if(fs.existsSync(classPath)){
        console.info('Detected salesforce project and will read classes in: '+classPath);
      }
      else{
        console.warn('Detected salesforce project but found no class folder in: '+classPath);
        exit(0);
      }
    }    
  });
}
else{
  console.warn('The source directory is not a salesforce project or does not contain a sfdx-project.json ('+sfdxJsonPath+').');
  
  if(argv.force !== true){
    console.error('Run command with --force.');
    exit(1);
  }  
}

const generatedClassModels = generate(
  [argv.sourceDir + classPath],
  argv.recursive,
  argv.scope,
  argv.targetDir,
  argv.targetGenerator,
  argv.configPath,
  argv.group,
  argv.indexOnly,
);
new FileManager(generatedClassModels).generate();
