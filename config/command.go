package config

type Command struct {
	ShortCmd    string
	Description string
	RealCmd     string
}

type Commands struct {
	Command []Command
}
