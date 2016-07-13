﻿#!/usr/bin/env node

'use strict';
const http = require('http');
const net = require('net');

const _util = require('./util.js');
const config = require('./config.json');

// HTTP Response Headers
const http200 = 'HTTP/1.1 200 OK\r\n\r\n';
const http101 = 'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
                'Upgrade: WebSocket\r\n' +
                'Connection: Upgrade\r\n' +
                '\r\n';
const http400 = 'HTTP/1.1 400 Bad Request\r\n\r\n';
const http500 = 'HTTP/1.1 500 Internal Server Error\r\n\r\n';

// Open a Tunnel between sockets
function openProxyStream(target, clientSocket, reply101) {
    // Log?
    try {
        var serverSocket = net.connect(target.port, target.hostname, () => {
            var reply = reply101 ? http101 : http200;
            clientSocket.write(reply);
            serverSocket.pipe(clientSocket);
            clientSocket.pipe(serverSocket);
        });
        serverSocket.on('error', (e) => {
            console.error(e);
            clientSocket.write(http500);
        });
        clientSocket.on('error', (e) => {
            console.error(e);
        });
    } catch (e) {
        console.error(e);
        clientSocket.write(http500);
    }
}

// Create Server
var proxy = http.createServer();

// Handle CONNECT Request
if (_util.isFeatureEnabled('connect')) {
    proxy.on('connect', (req, cltskt, head) => {
        var target = _util.getRealTarget(req);
        if (target)
            openProxyStream(target, cltskt, false);
        else
            cltskt.end(http400);
    });
}

// Handle WebSocket Upgrade
if (_util.isFeatureEnabled('websocket')) {
    proxy.on('upgrade', (req, cltskt, head) => {
        var target = _util.getRealTarget(req);
        if (target)
            openProxyStream(target, cltskt, true);
        else
            cltskt.end(http400);
    });
}

// Handle Common Request
if (_util.isFeatureEnabled('common') && config.target != 'default') {
    proxy.on('request', (req, res) => {
        var target = _util.getRealTarget(req);
        if (target)
            openProxyStream(target, req.socket, false);
        else
            cltskt.end(http400);
    });
} else {
    // Output Dummy Response
    proxy.on('request', (req, res) => {
        res.writeHead(403);
        res.end();
    });
}

proxy.on('error', (e) => {
    console.error(e);
});

proxy.listen(config.port, '0.0.0.0', () => {
    console.log(`running on 0.0.0.0:${config.port}, read our wiki before use.`);
});