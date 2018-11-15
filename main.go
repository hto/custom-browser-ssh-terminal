package main

import (
	"custom-browser-ssh-terminal/config"
	"log"
	"net/http"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/gorilla/websocket"
)

var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan Message)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Message struct {
	Message string `json:"message"`
}

var (
	configServer  *config.Servers
	configCommand *config.Commands
)

func main() {

	if _, err := toml.DecodeFile("./servers.toml", &configServer); err != nil {
		log.Println(err)
		return
	}

	if _, err := toml.DecodeFile("./commands.toml", &configCommand); err != nil {
		log.Println(err)
		return
	}

	fs := http.FileServer(http.Dir("public"))
	http.Handle("/", fs)

	http.HandleFunc("/ws", handleConnections)

	go handleMessages()

	log.Println("http server started on :8000")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	clients[ws] = true

	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			delete(clients, ws)
			break
		}
		broadcast <- msg
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		for client := range clients {
			msg.Message = cmdExec(msg.Message)
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func cmdExec(cmd string) string {
	s := strings.Split(cmd, " ")
	if len(s) > 1 {
		server := findServer(s[0])
		if server.Name == "unknown" {
			return "Server not found!"
		}

		command := findCmd(s[1])
		if command.ShortCmd == "unknown" {
			return "Command Invalid!"
		}
		return sshCmd(server, command)
	}
	return "err"
}

func findServer(server string) config.Server {
	for _, s := range configServer.Server {
		if s.Name == server {
			return s
		}
	}
	var s config.Server
	s.Name = "unknown"
	return s
}

func findCmd(command string) config.Command {
	for _, c := range configCommand.Command {
		if c.ShortCmd == command {
			return c
		}
	}
	var c config.Command
	c.ShortCmd = "unknown"
	return c
}

func helpResponse() string {
	response := "server command"

	return response
}
