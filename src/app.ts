import * as moment from 'moment';

import * as io from 'socket.io';
import { Namespace, Socket } from 'socket.io';

class SocketError extends Error {
}

class Message {
    constructor(public date: number, public userId: string, public content?: string|object) {}
}

class User {
    nick: string;
    face: string;
    socket: Socket;
    messages: Message[] = [];

    get id() {
        return this.socket.id;
    }

    profile() {
        return {
            nick: this.nick,
            face: this.face,
            id: this.id
        };
    }
}

interface Group {
    users: User[];
    messages: Message[];
}

const stack = new Map<string, Group>();

const server = io(3000);

// middleware
server.use((socket, next) => {
    const name = socket.handshake.query.nick;
    const face = socket.handshake.query.face;
    if (name && face) {
        return next();
    } else {
        const err = new SocketError('Authentication error, missing nick or face (url to your face picture :))');
        return next(err);
    }

});

stack.set('/', {
    users: [],
    messages: []
});
const general: Namespace = server.of('/').on('connection', (client) => {
    const user = new User();
    user.socket = client;
    user.nick = client.handshake.query.nick;
    user.face = client.handshake.query.face;
    chat(user, general, stack.get('/'));
});

/**
 * Room for already payed room
 * Cheats: top, run, faster, whereIs
 */
// stack.set('/game', []);
// const game: Namespace = server.of('/game').on('connection', (client) => {
//     chat(client, game, stack.get('/game'))
// });

function chat(user: User, root: Namespace, group: Group) {
    const joinMessage = new Message(moment.now(), user.id, user.profile());
    user.socket.emit('users', group.users.map((item) => item.profile()));

    user.socket.broadcast.emit('join', joinMessage);
    group.users.push(user);

    for (const pastMessage of group.messages) {
        user.socket.emit('message', pastMessage);
    }

    user.socket.on('send', (data: string) => {
        const message = new Message(moment.now(), user.id, data);
        user.messages.push(message);
        group.messages.push(message);
        root.emit('message', message);
    });

    user.socket.on('disconnect', (data: any) => {
        const message = new Message(moment.now(), user.id);
        root.emit('leave', message);
        // group.users.splice(group.users.indexOf(user), 1);
    });
}
