new Vue({
    el: '#app',

    data: {
        ws: null, 
        newMsg: '',
        chatContent: '', 
    },

    created: function() {
        var self = this;
        this.ws = new WebSocket('ws://' + window.location.host + '/ws');
        this.ws.addEventListener('message', function(e) {
            var msg = JSON.parse(e.data);
            msg.message = msg.message.replace(/\n/g, "<br />")
            self.chatContent += '<p> > ' + msg.message + '</p>';
            var element = document.getElementById('chat-messages');
            element.scrollTop = element.scrollHeight; 
        });
    },

    methods: {
        send: function () {
            if (this.newMsg != '') {
                this.ws.send(
                    JSON.stringify({
                        message: this.newMsg 
                    }
                ));
                this.newMsg = ''; 
            }
        }
    }
});