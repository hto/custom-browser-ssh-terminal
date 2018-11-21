
var self = this;
ws = new WebSocket('ws://' + window.location.host + '/ws');
var terminal = {};

terminal.init = function() {
    document.addEventListener('keydown', terminal.event.keydown, false);
    document.getElementById('console').innerHTML += '<p>Last login: ' + (new Date()).toUTCString() + ' on ttys000 - github.com/hto</p>';
    this.newLine();
};
terminal.scrollDown = function() {
    window.scrollTo(0, document.getElementById('console').clientHeight);
};
terminal.newLine = function() {
    if (document.getElementsByClassName('line--active').length)
        document.getElementsByClassName('line--active')[0].classList.remove('line--active');
    document.getElementById('console').innerHTML += '<p class="line line--active" data-user="root" data-host="server" data-path="~"></p>';
};
terminal.addLine = function(content) {
    var self = this;
    document.getElementById('console').innerHTML += '<p>' + content + '</p>';
    self.newLine();
};

terminal.history = {};
terminal.history.idx = null;
terminal.history.data = [];
terminal.history.add = function(cmd) {
    terminal.history.idx = null;
    terminal.history.data.push(cmd);
};
terminal.history.getLast = function(direction) {
    if (terminal.history.idx === null)
        terminal.history.idx = terminal.history.data.length;
    if (direction === '-' && terminal.history.idx > 0)
        terminal.history.idx--;
    else if (direction === '+' && terminal.history.idx <= terminal.history.data.length - 1)
        terminal.history.idx++;
    return terminal.history.data[terminal.history.idx];
};

terminal.event = {};
terminal.event.keydown = function(e) {
    var self = terminal;
    var char = e.key;
    var line = document.getElementsByClassName('line--active')[0];

    if (e.key === 'Backspace') {
        line.innerText = line.innerText.substr(0, line.innerText.length - 1);
        return;
    } else if (e.key === 'Tab') {
        e.preventDefault();
        return;
    } else if (e.key === 'Dead') {
        char = '~';
    } else if (e.key === 'ArrowUp') {
        line.innerHTML = terminal.history.getLast('-') || '';
        e.preventDefault();
        return;
    } else if (e.key === 'ArrowDown') {
        line.innerHTML = terminal.history.getLast('+') || '';
        e.preventDefault();
        return;
    } else if (e.key === 'Space') {
        char = " ";
    } else if (e.key === 'Enter') {
        self.history.add(line.innerText);
        self.command.exec(line.innerText);
        return;
    } else if (e.key.length > 1) {
        return;
    }

    line.innerText += char;
};

terminal.init();

// Commands
terminal.command = {};
terminal.command.exec = function(cmd) {
    if (terminal.command[cmd]) {
        terminal.addLine(terminal.command[cmd]());
    }
    else if (terminal.command[cmd.split(' ')[0]]) {
        var cmdArr = cmd.split(/ (.+)/, 2);
        terminal.addLine(terminal.command[cmdArr[0]](cmdArr[1].split(' ')));
    } else {
        if (cmd == '') {
            terminal.newLine();
        } else {
            ws.send(
                JSON.stringify({
                    message: cmd
                }
            ));
        }
    }
};
terminal.command.echo = function(data) {
    if (data === undefined)
        return "Usage: echo [string...]";
    return data;
};
terminal.command.exit = function() {
    document.body.innerHTML = "Bye..";
    return;
};

ws.addEventListener('message', function(e) {
    var msg = JSON.parse(e.data);
    terminal.addLine(msg.message);
});