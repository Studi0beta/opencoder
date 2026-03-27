# OpenCode Web Setup Guide

## What this page expects

OpenCode Web must already be running on the target machine before you add the server here. Start OpenCode Web, make it reachable, then paste its URL into Add Server.

This app is best used as a local-first frontend for your OpenCode Web servers. For remote access, prefer WireGuard or Tailscale rather than exposing the frontend directly to the public internet.

Your Opencoder servers and theme state are saved on the app host, so the same setup appears when you switch browsers. Full-state import/export can move servers, selection, and theme settings between machines.

## Start OpenCode Web

Recommended password-protected start:

```bash
export OPENCODE_SERVER_PASSWORD='change-me'
opencode web --hostname 0.0.0.0 --port 4096
```

One-line version:

```bash
OPENCODE_SERVER_PASSWORD='change-me' opencode web --hostname 0.0.0.0 --port 4096
```

- Default HTTP basic auth username: `opencode`
- Password protection is the recommended default for any non-local server
- Passwordless remote exposure is not recommended
- Use a strong password

## What URL to enter

Examples:

```text
http://SERVER_IP:4096
https://your-domain.example.com
```

- Use `http://SERVER_IP:4096` for LAN, VM, or internal host access.
- Use `https://your-domain.example.com` when a reverse proxy or TLS endpoint is in front of OpenCode Web.

## Optional config file

If you prefer config over CLI flags, use `opencode.json`:

```json
{
	"hostname": "0.0.0.0",
	"port": 4096,
	"cors": ["http://localhost:5173", "http://127.0.0.1:5173"]
}
```

## Linux service setup

`systemd` example:

```ini
[Unit]
Description=OpenCode Web
After=network.target

[Service]
Environment=OPENCODE_SERVER_PASSWORD=change-me
ExecStart=/usr/bin/env opencode web --hostname 0.0.0.0 --port 4096
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Commands:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now opencode-web
sudo systemctl status opencode-web
```

## macOS service setup

Save this LaunchAgent to `~/Library/LaunchAgents/com.user.opencode-web.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key><string>com.user.opencode-web</string>
    <key>ProgramArguments</key>
    <array>
      <string>/bin/sh</string>
      <string>-lc</string>
      <string>OPENCODE_SERVER_PASSWORD='change-me' opencode web --hostname 0.0.0.0 --port 4096</string>
    </array>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><true/>
    <key>StandardOutPath</key><string>/tmp/opencode-web.log</string>
    <key>StandardErrorPath</key><string>/tmp/opencode-web.err</string>
  </dict>
</plist>
```

Commands:

```bash
launchctl load ~/Library/LaunchAgents/com.user.opencode-web.plist
launchctl start com.user.opencode-web
launchctl stop com.user.opencode-web
launchctl status com.user.opencode-web
```

Manual start:

```bash
OPENCODE_SERVER_PASSWORD='change-me' opencode web --hostname 0.0.0.0 --port 4096
```

## Firewall and network setup

UFW:

```bash
sudo ufw allow 4096/tcp
sudo ufw allow from YOUR_CLIENT_IP to any port 4096 proto tcp
```

iptables:

```bash
sudo iptables -A INPUT -p tcp --dport 4096 -j ACCEPT
sudo iptables -A INPUT -p tcp -s YOUR_CLIENT_IP --dport 4096 -j ACCEPT
```

- `YOUR_CLIENT_IP` is the IP of the machine running this app.
- iptables rules may need to be saved separately to persist after reboot.
- On macOS, the process must be allowed to accept inbound connections and any external firewall/router must also permit the port.

## Final checklist

- OpenCode Web is running.
- Password protection is enabled.
- It is listening on a reachable interface.
- The port is open.
- The URL is reachable from this app.
