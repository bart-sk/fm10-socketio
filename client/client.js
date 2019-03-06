(function() {
    const names = ['pista', 'stano', 'mato', 'rasto', 'tomas', 'peto', 'miriama', 'monika', 'mirka', 'katka', 'maria'];

    const nick = `${names[Math.floor(Math.random() * names.length)]} ${(+new Date()).toString().substring(11)}`;

    const socket = io('http://localhost:3000', { query: { nick: nick } });
    socket.on('connect', () => {
        printMessage(`Prihlaseny ako: ${nick}`);
    });
    document.querySelector('form').addEventListener('submit', function(event) {
        event.preventDefault();
        const input = document.getElementById('m');
        const msg = input.value;
        socket.emit('send', msg);
        input.value = '';
    });

    let users = [];

    socket.on('users', function(msg) {
        users = msg;
    });

    socket.on('messages', function(msg) {
        for (const message of msg) {
            messageReceive(message);
        }
    });

    socket.on('join', function(msg) {
        users.push({
            id: msg.userId,
            nick: msg.nick
        });
        printMessage('Niekto prisol: ' + msg.nick);
    });

    socket.on('leave', function(msg) {
        users.splice(users.findIndex((user) => user.id === msg.userId), 1);
        printMessage('Niekto odisol: ' + msg.nick);
    });

    socket.on('message', function(msg) {
        messageReceive(msg);
    });

    function messageReceive(msg) {
        let who = msg.nick;

        if (msg.userId === socket.id) {
            who = 'Me';
        }

        printMessage(`${who}: ${msg.content}`);
    }

    function printMessage(text) {
        document.getElementById('messages').appendChild(document.createElement('li')).textContent = text;
        window.scrollTo(0, document.body.scrollHeight);
    }
})();
