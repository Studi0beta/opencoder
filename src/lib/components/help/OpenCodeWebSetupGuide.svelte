<script lang="ts">
	import CopyableCodeBlock from '$lib/components/help/CopyableCodeBlock.svelte';
	import ThemedSurface from '$lib/components/ui/ThemedSurface.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	const startCommand = `export OPENCODE_SERVER_PASSWORD='change-me'\nopencode web --hostname 0.0.0.0 --port 4096`;
	const startCommandOneLine = `OPENCODE_SERVER_PASSWORD='change-me' opencode web --hostname 0.0.0.0 --port 4096`;
	const configExample = `{\n  "hostname": "0.0.0.0",\n  "port": 4096,\n  "cors": ["http://localhost:5173", "http://127.0.0.1:5173"]\n}`;
	const systemdExample = `[Unit]\nDescription=OpenCode Web\nAfter=network.target\n\n[Service]\nEnvironment=OPENCODE_SERVER_PASSWORD=change-me\nExecStart=/usr/bin/env opencode web --hostname 0.0.0.0 --port 4096\nRestart=always\nRestartSec=3\n\n[Install]\nWantedBy=multi-user.target`;
	const systemdCommands = `sudo systemctl daemon-reload\nsudo systemctl enable --now opencode-web\nsudo systemctl status opencode-web`;
	const launchdExample = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n  <dict>\n    <key>Label</key><string>com.user.opencode-web</string>\n    <key>ProgramArguments</key>\n    <array>\n      <string>/bin/sh</string>\n      <string>-lc</string>\n      <string>OPENCODE_SERVER_PASSWORD='change-me' opencode web --hostname 0.0.0.0 --port 4096</string>\n    </array>\n    <key>RunAtLoad</key><true/>\n    <key>KeepAlive</key><true/>\n    <key>StandardOutPath</key><string>/tmp/opencode-web.log</string>\n    <key>StandardErrorPath</key><string>/tmp/opencode-web.err</string>\n  </dict>\n</plist>`;
	const launchctlCommands = `launchctl load ~/Library/LaunchAgents/com.user.opencode-web.plist\nlaunchctl start com.user.opencode-web\nlaunchctl stop com.user.opencode-web\nlaunchctl status com.user.opencode-web`;
	const manualMacStart = `OPENCODE_SERVER_PASSWORD='change-me' opencode web --hostname 0.0.0.0 --port 4096`;
	const ufwCommands = `sudo ufw allow 4096/tcp\nsudo ufw allow from YOUR_CLIENT_IP to any port 4096 proto tcp`;
	const iptablesCommands = `sudo iptables -A INPUT -p tcp --dport 4096 -j ACCEPT\nsudo iptables -A INPUT -p tcp -s YOUR_CLIENT_IP --dport 4096 -j ACCEPT`;

	const sections = [
		{ id: 'guide-start', label: 'Start' },
		{ id: 'guide-url', label: 'URL' },
		{ id: 'guide-config', label: 'Config' },
		{ id: 'guide-security', label: 'Security' },
		{ id: 'guide-linux', label: 'Linux' },
		{ id: 'guide-macos', label: 'macOS' },
		{ id: 'guide-network', label: 'Network' },
		{ id: 'guide-checklist', label: 'Checklist' }
	] as const;

	function scrollToSection(id: string): void {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

{#if open}
	<ThemedSurface
		{open}
		variant="modal"
		eyebrow="OpenCode Web setup"
		title="View OpenCode Web setup instructions"
		description="Start OpenCode Web on the target machine first, make it reachable, then paste the URL into Add Server."
		{onClose}
	>
		<div class="space-y-4">
			<div class="flex flex-wrap gap-2">
				{#each sections as section (section.id)}
					<button
						type="button"
						onclick={() => scrollToSection(section.id)}
						class="rounded-full border px-3 py-1.5 text-xs font-medium transition hover:opacity-90"
						style="border-color: var(--hub-border); color: var(--hub-text); background: var(--hub-surface);"
					>
						{section.label}
					</button>
				{/each}
			</div>

			<section class="space-y-4">
				<div
					class="rounded-2xl border p-4"
					style="border-color: var(--hub-border); background: var(--hub-surface);"
				>
					<h3
						id="guide-start"
						class="scroll-mt-6 text-sm font-semibold"
						style="color: var(--hub-text);"
					>
						What this page expects
					</h3>
					<p class="mt-2 text-sm" style="color: var(--hub-muted);">
						OpenCode Web must already be running on the target machine before you add it here. Start
						OpenCode Web, make it reachable, then paste its URL into Add Server.
					</p>
					<p class="mt-2 text-sm" style="color: var(--hub-muted);">
						Best used as a local-first frontend for your OpenCode Web servers. For remote access,
						use WireGuard or Tailscale rather than exposing the app directly to the public internet.
					</p>
					<p class="mt-2 text-sm" style="color: var(--hub-muted);">
						Password protection is the recommended default for any non-local server. Passwordless
						remote exposure is not recommended.
					</p>
				</div>

				<CopyableCodeBlock label="Start OpenCode Web" language="bash" code={startCommand} />
				<CopyableCodeBlock label="One-line version" language="bash" code={startCommandOneLine} />

				<div
					class="rounded-2xl border p-4"
					style="border-color: var(--hub-border); background: var(--hub-surface);"
				>
					<h3
						id="guide-url"
						class="scroll-mt-6 text-sm font-semibold"
						style="color: var(--hub-text);"
					>
						What URL to enter
					</h3>
					<div class="mt-3 space-y-3">
						<div
							class="rounded-xl border p-3"
							style="border-color: var(--hub-border); background: var(--hub-surface-2);"
						>
							<p class="font-mono text-sm" style="color: var(--hub-text);">http://SERVER_IP:4096</p>
							<p class="mt-1 text-sm" style="color: var(--hub-muted);">
								Use this when OpenCode Web is on the same LAN, VM, or internal host.
							</p>
						</div>
						<div
							class="rounded-xl border p-3"
							style="border-color: var(--hub-border); background: var(--hub-surface-2);"
						>
							<p class="font-mono text-sm" style="color: var(--hub-text);">
								https://your-domain.example.com
							</p>
							<p class="mt-1 text-sm" style="color: var(--hub-muted);">
								Use this when you have a reverse proxy or public TLS endpoint in front of OpenCode
								Web.
							</p>
						</div>
					</div>
				</div>

				<div
					class="rounded-2xl border p-4"
					style="border-color: var(--hub-border); background: var(--hub-surface);"
				>
					<h3
						id="guide-config"
						class="scroll-mt-6 text-sm font-semibold"
						style="color: var(--hub-text);"
					>
						Optional config file
					</h3>
					<p class="mt-2 text-sm" style="color: var(--hub-muted);">
						Use `opencode.json` if you prefer config over CLI flags.
					</p>
					<CopyableCodeBlock label="opencode.json" language="json" code={configExample} />
				</div>
			</section>

			<section class="space-y-4">
				<div
					class="rounded-2xl border p-4"
					style="border-color: var(--hub-border); background: var(--hub-surface);"
				>
					<h3
						id="guide-security"
						class="scroll-mt-6 text-sm font-semibold"
						style="color: var(--hub-text);"
					>
						Security notes
					</h3>
					<ul class="mt-2 space-y-2 text-sm" style="color: var(--hub-muted);">
						<li>
							<strong style="color: var(--hub-text);">OPENCODE_SERVER_PASSWORD</strong> is configured
							on the remote machine running OpenCode Web, not in this app.
						</li>
						<li>
							Use trusted-IP restrictions where possible, and prefer HTTPS or a reverse proxy for
							wider exposure.
						</li>
						<li>robots.txt is not a security control.</li>
					</ul>
					<p class="mt-3 text-sm" style="color: var(--hub-muted);">
						The default HTTP basic auth username is <strong style="color: var(--hub-text);"
							>opencode</strong
						>.
					</p>
					<p class="mt-2 text-sm" style="color: var(--hub-muted);">
						Choose a strong password and avoid exposing a passwordless server to untrusted networks.
					</p>
				</div>

				<div
					class="rounded-2xl border p-4"
					style="border-color: var(--hub-border); background: var(--hub-surface);"
				>
					<h3
						id="guide-linux"
						class="scroll-mt-6 text-sm font-semibold"
						style="color: var(--hub-text);"
					>
						Linux service setup
					</h3>
					<CopyableCodeBlock label="systemd unit" language="ini" code={systemdExample} />
					<div class="mt-3 space-y-2 text-sm" style="color: var(--hub-muted);">
						<CopyableCodeBlock label="Enable service" language="bash" code={systemdCommands} />
					</div>
				</div>

				<div
					class="rounded-2xl border p-4"
					style="border-color: var(--hub-border); background: var(--hub-surface);"
				>
					<h3
						id="guide-macos"
						class="scroll-mt-6 text-sm font-semibold"
						style="color: var(--hub-text);"
					>
						macOS service setup
					</h3>
					<p class="mt-2 text-sm" style="color: var(--hub-muted);">
						Save the LaunchAgent to <code>~/Library/LaunchAgents/com.user.opencode-web.plist</code>.
					</p>
					<CopyableCodeBlock label="LaunchAgent plist" language="xml" code={launchdExample} />
					<CopyableCodeBlock label="launchctl commands" language="bash" code={launchctlCommands} />
					<CopyableCodeBlock label="Manual start" language="bash" code={manualMacStart} />
					<p class="mt-2 text-sm" style="color: var(--hub-muted);">
						Example log paths: <code>/tmp/opencode-web.log</code> and
						<code>/tmp/opencode-web.err</code>.
					</p>
				</div>

				<div
					class="rounded-2xl border p-4"
					style="border-color: var(--hub-border); background: var(--hub-surface);"
				>
					<h3
						id="guide-network"
						class="scroll-mt-6 text-sm font-semibold"
						style="color: var(--hub-text);"
					>
						Firewall and network
					</h3>
					<CopyableCodeBlock label="UFW" language="bash" code={ufwCommands} />
					<CopyableCodeBlock label="iptables" language="bash" code={iptablesCommands} />
					<p class="mt-2 text-sm" style="color: var(--hub-muted);">
						`YOUR_CLIENT_IP` is the IP of the machine running this app. iptables rules may need to
						be saved separately to persist after reboot.
					</p>
					<p class="mt-2 text-sm" style="color: var(--hub-muted);">
						On macOS, allow the process to accept inbound connections and ensure any external
						firewall/router also permits the port.
					</p>
				</div>

				<div
					class="rounded-2xl border p-4"
					style="border-color: var(--hub-border); background: var(--hub-surface);"
				>
					<h3
						id="guide-checklist"
						class="scroll-mt-6 text-sm font-semibold"
						style="color: var(--hub-text);"
					>
						Final checklist
					</h3>
					<ul class="mt-2 space-y-2 text-sm" style="color: var(--hub-muted);">
						<li>OpenCode Web is running.</li>
						<li>Password protection is enabled.</li>
						<li>It is listening on a reachable interface.</li>
						<li>The port is open.</li>
						<li>The URL is reachable from this app.</li>
					</ul>
				</div>
			</section>
		</div>
	</ThemedSurface>
{/if}
