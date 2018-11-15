package config

type Server struct {
	Name        string
	Description string
	HostName    string
	UserName    string
	Port        string
	Password    string
}

type Servers struct {
	Server []Server
}
