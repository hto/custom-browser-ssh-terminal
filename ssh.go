package main

import (
	"mobile-terminal/config"

	"golang.org/x/crypto/ssh"
)

func sshCmd(server config.Server, command config.Command) string {

	client, session, err := connectToHost(server.UserName, server.HostName+":"+server.Port, server.Password)
	if err != nil {
		return "Connection is refused"
	}

	out, err := session.CombinedOutput(command.RealCmd)
	if err != nil {
		return "Command runtime error."
	}

	client.Close()
	return string(out)
}

func connectToHost(user, host string, pass string) (*ssh.Client, *ssh.Session, error) {

	sshConfig := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{ssh.Password(pass)},
	}

	sshConfig.HostKeyCallback = ssh.InsecureIgnoreHostKey()

	client, err := ssh.Dial("tcp", host, sshConfig)
	if err != nil {
		return nil, nil, err
	}

	session, err := client.NewSession()
	if err != nil {
		client.Close()
		return nil, nil, err
	}

	return client, session, nil
}
