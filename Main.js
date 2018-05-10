const fs = require('fs');
const path = require('path');
const cluster = require('cluster');
const net = require('net');
const numCpus = require('os').cpus().length;

global.globalRootDirectory = path.resolve(__dirname);
global.requireFromRoot = (path) => {
    return require(global.globalRootDirectory + '/' + path);
}

const FileImportJob = requireFromRoot('src/parse_job/FileImportJob.js');

const configuration = JSON.parse(fs.readFileSync(global.globalRootDirectory + '/configuration.json'));

if (cluster.isMaster) {
    for (var i = 0; i < numCpus; ++i) {
        cluster.fork();
    }
} else {
    const tcpServer = net.createServer((socket) => {
        new FileImportJob(socket);
    });

    tcpServer.on('error', (err) => {
        console.log(err);
    });

    tcpServer.listen(configuration.port);

    console.log('Parser Service Started');
}