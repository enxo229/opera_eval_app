/**
 * Terminal Sandbox Command Engine
 * Simulates a Linux filesystem and common commands for evaluation purposes.
 */

// Virtual filesystem
const FILESYSTEM: Record<string, string> = {
    '/home/candidate': '',
    '/home/candidate/README.md': '# Proyecto de Observabilidad\nEste es un proyecto demo para evaluar habilidades técnicas.\n',
    '/home/candidate/app.py': '#!/usr/bin/env python3\nimport sys\nimport os\n\ndef check_disk_usage(path="/"):\n    """Check disk usage and alert if above threshold"""\n    usage = os.statvfs(path)\n    total = usage.f_blocks * usage.f_frsize\n    free = usage.f_bfree * usage.f_frsize\n    used_pct = ((total - free) / total) * 100\n    if used_pct > 90:\n        print(f"ALERTA: Uso de disco en {path}: {used_pct:.1f}%")\n        sys.exit(1)\n    print(f"OK: Uso de disco en {path}: {used_pct:.1f}%")\n\nif __name__ == "__main__":\n    check_disk_usage()\n',
    '/home/candidate/monitor.sh': '#!/bin/bash\n# Script de monitoreo básico\nHOST="srv-prod-01"\nTHRESHOLD=90\n\nCPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk \'{print $2}\')\n\nif (( $(echo "$CPU_USAGE > $THRESHOLD" | bc -l) )); then\n    echo "[ALERTA] CPU en $HOST: ${CPU_USAGE}%"\n    logger -t monitor "Alto CPU detectado: ${CPU_USAGE}%"\nelse\n    echo "[OK] CPU en $HOST: ${CPU_USAGE}%"\nfi\n',
    '/home/candidate/.gitconfig': '[user]\n    name = Candidato\n    email = candidato@seti.com.co\n[core]\n    editor = vim\n',
    '/scripts': '',
    '/scripts/backup.sh': '#!/bin/bash\n# Script de respaldo de logs\nDEST="/mnt/backup"\nDATE=$(date +%Y%m%d)\n\necho "Iniciando respaldo en $DEST..."\nif [ ! -d "$DEST" ]; then\n  echo "Error: Directorio de destino no existe."\n  exit 1\nfi\n\ntar -czf "$DEST/logs_$DATE.tar.gz" /var/log/*.log\necho "Respaldo completado satisfactoriamente."\n',
    '/scripts/monitor.py': '#!/usr/bin/env python3\nimport os\nimport shutil\n\ndef check_service_health():\n    """Simula chequeo de salud de servicios críticos"""\n    services = ["nginx", "postgresql", "redis"]\n    print("--- Salud del Sistema ---")\n    for service in services:\n        # Simulación: Nginx está fallando en este escenario\n        status = "CRITICAL" if service == "nginx" else "OK"\n        print(f"Service: {service:12} Status: {status}")\n\n    # Revisión de espacio en disco\n    total, used, free = shutil.disk_usage("/")\n    pct = (used / total) * 100\n    print(f"Disk Usage: {pct:.1f}%")\n\nif __name__ == "__main__":\n    check_service_health()\n',
    '/var/log/syslog': 'Mar  7 02:47:12 srv-prod-01 kernel: [12345.678] CPU5: Core temperature above threshold\nMar  7 02:47:15 srv-prod-01 java_billing_worker[3421]: OutOfMemoryError: Java heap space\nMar  7 02:47:18 srv-prod-01 java_billing_worker[3421]: OutOfMemoryError: Java heap space\nMar  7 02:47:21 srv-prod-01 java_billing_worker[3421]: OutOfMemoryError: Java heap space\nMar  7 02:48:00 srv-prod-01 systemd[1]: Started Daily apt activities.\nMar  7 02:50:33 srv-prod-01 nginx[1024]: 502 Bad Gateway - upstream timeout\nMar  7 03:15:00 srv-prod-01 deploy[5678]: Rollback completed for java_billing_worker\nMar  7 03:15:05 srv-prod-01 kernel: [14567.890] CPU usage normalized\n',
    '/var/log/auth.log': 'Mar  7 01:00:00 srv-prod-01 sshd[2345]: Accepted publickey for admin from 10.0.1.5\nMar  7 02:30:00 srv-prod-01 sudo[3456]: candidato : TTY=pts/0 ; PWD=/home/candidato ; COMMAND=/bin/systemctl restart nginx\nMar  7 03:00:00 srv-prod-01 sshd[4567]: Failed password for root from 192.168.1.100\n',
    '/etc/hosts': '127.0.0.1       localhost\n10.0.1.10       srv-prod-01\n10.0.1.11       srv-prod-db-01\n10.0.1.12       srv-staging-01\n',
    '/etc/nginx/nginx.conf': 'worker_processes auto;\nevents {\n    worker_connections 1024;\n}\nhttp {\n    upstream backend {\n        server 127.0.0.1:8080;\n    }\n    server {\n        listen 80;\n        location / {\n            proxy_pass http://backend;\n        }\n    }\n}\n',
}

const DIRECTORIES: Record<string, string[]> = {
    '/': ['home', 'var', 'etc', 'tmp', 'usr', 'scripts'],
    '/home': ['candidate'],
    '/home/candidate': ['README.md', 'app.py', 'monitor.sh', '.gitconfig'],
    '/scripts': ['backup.sh', 'monitor.py'],
    '/var': ['log'],
    '/var/log': ['syslog', 'auth.log'],
    '/etc': ['hosts', 'nginx'],
    '/etc/nginx': ['nginx.conf'],
}

// Git simulation state
const GIT_LOG = `commit a1b2c3d (HEAD -> main)
Author: DevOps Team <devops@seti.com.co>
Date:   Thu Mar 6 18:30:00 2026 -0500

    fix: rollback billing worker deployment

commit e4f5g6h
Author: Backend Team <backend@seti.com.co>
Date:   Thu Mar 6 16:00:00 2026 -0500

    feat: update billing worker heap config

commit i7j8k9l
Author: SRE Team <sre@seti.com.co>
Date:   Wed Mar 5 10:00:00 2026 -0500

    chore: add monitoring alerts for CPU threshold
`

const GIT_BRANCH = `* main
  develop
  feature/billing-hotfix
`

const GIT_STATUS = `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
`

// Process simulation
const PS_OUTPUT = `  PID TTY          TIME CMD
    1 ?        00:00:03 systemd
  512 ?        00:00:01 sshd
 1024 ?        00:00:15 nginx: master
 1025 ?        00:02:30 nginx: worker
 3421 ?        01:45:22 java_billing_worker
 3500 ?        00:00:05 node_exporter
 3600 ?        00:00:12 grafana-server
 4001 pts/0    00:00:00 bash
`

const TOP_OUTPUT = `top - 02:47:15 up 45 days, 3:22, 2 users, load average: 4.52, 3.81, 2.10
Tasks: 125 total,   3 running, 122 sleeping
%Cpu(s): 94.2 us,  2.1 sy,  0.0 ni,  3.1 id,  0.0 wa,  0.0 hi,  0.6 si
MiB Mem :  16384.0 total,   1024.0 free,  14336.0 used,   1024.0 buff
MiB Swap:   4096.0 total,   3072.0 free,   1024.0 used.    896.0 avail

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
 3421 app       20   0 12.5g  11.2g   4096 R  89.3 70.0  105:22.15 java_billing_w+
 1025 www-data  20   0  128m   64m   8192 S   3.2  0.4    2:30.45 nginx
 3600 grafana   20   0  256m  128m  16384 S   1.1  0.8    0:12.30 grafana-server
`

// Help texts
const HELP_TEXTS: Record<string, string> = {
    cat: 'Usage: cat [FILE]...\nConcatenate FILE(s) to standard output.\n\nExamples:\n  cat file.txt          Display file contents\n  cat -n file.txt       Number all output lines\n',
    echo: 'Usage: echo [STRING]...\nDisplay a line of text.\n\nExamples:\n  echo "Hello World"    Print text\n  echo $PATH            Print environment variable\n',
    tail: 'Usage: tail [OPTION]... [FILE]...\nPrint the last 10 lines of each FILE.\n\n  -n NUM    output the last NUM lines\n  -f        follow file changes in real-time\n\nExamples:\n  tail -n 5 /var/log/syslog    Show last 5 lines\n  tail -f /var/log/syslog      Follow log in real-time\n',
    head: 'Usage: head [OPTION]... [FILE]...\nPrint the first 10 lines of each FILE.\n\n  -n NUM    output the first NUM lines\n',
    ls: 'Usage: ls [OPTION]... [FILE]...\nList directory contents.\n\n  -l    use a long listing format\n  -a    do not ignore entries starting with .\n  -h    human-readable sizes\n',
    grep: 'Usage: grep [OPTION]... PATTERN [FILE]...\nSearch for PATTERN in each FILE.\n\n  -i    ignore case\n  -r    recursive\n  -n    print line number\n\nExamples:\n  grep "error" /var/log/syslog\n  grep -i "cpu" /var/log/syslog\n',
    chmod: 'Usage: chmod [MODE] FILE...\nChange file mode bits.\n\nExamples:\n  chmod 755 script.sh    Make executable\n  chmod +x script.sh     Add execute permission\n',
    ps: 'Usage: ps [OPTIONS]\nReport a snapshot of current processes.\n\n  aux     Show all processes with details\n  -ef     Show all processes in full format\n',
    pwd: 'Usage: pwd\nPrint name of current/working directory.\n',
    cd: 'Usage: cd [DIR]\nChange the shell working directory.\n',
    top: 'Usage: top\nDisplay Linux processes in real-time.\nPress q to exit.\n',
    git: 'Usage: git <command> [<args>]\n\nCommon commands:\n  clone     Clone a repository\n  branch    List, create, or delete branches\n  status    Show the working tree status\n  log       Show commit logs\n  commit    Record changes to the repository\n  push      Update remote refs\n  checkout  Switch branches or restore working tree files.\n  add       Add file contents to the index\n',
    'git clone': 'Usage: git clone <repository>\n\nClones a repository into a new directory.\n\nExample:\n  git clone https://github.com/opera/demo.git\n',
    'git checkout': 'Usage: git checkout <branch>\n\nSwitches to the specified branch.\n\nExample:\n  git checkout develop\n  git checkout -b feature/new-branch\n',
    'git commit': 'Usage: git commit -m <message>\n\nRecord changes to the repository.\n\nExample:\n  git commit -m "feat: add monitoring script"\n',
    systemctl: 'Usage: systemctl [OPTIONS] COMMAND ...\nControl the systemd system and service manager.\n\nCommands:\n  status SERVICE    Show status of service\n  restart SERVICE   Restart a service\n  start SERVICE     Start a service\n  stop SERVICE      Stop a service\n',
}

export type CommandResult = {
    output: string
    isError: boolean
}

export function executeCommand(input: string, cwd: string, mode: 'A1' | 'A3'): { result: CommandResult; newCwd: string } {
    const trimmed = input.trim()
    if (!trimmed) return { result: { output: '', isError: false }, newCwd: cwd }

    const parts = trimmed.split(/\s+/)
    const cmd = parts[0]
    const args = parts.slice(1)

    // Handle --help for any command
    if (args.includes('--help') || args.includes('-h')) {
        const helpText = HELP_TEXTS[cmd]
        if (helpText) return { result: { output: helpText, isError: false }, newCwd: cwd }
        return { result: { output: `${cmd}: --help not available`, isError: true }, newCwd: cwd }
    }

    switch (cmd) {
        case 'pwd':
            return { result: { output: cwd, isError: false }, newCwd: cwd }

        case 'ls': {
            const target = args.filter(a => !a.startsWith('-'))[0] || cwd
            const resolvedPath = resolvePath(cwd, target)
            const entries = DIRECTORIES[resolvedPath]
            if (!entries) return { result: { output: `ls: cannot access '${target}': No such file or directory`, isError: true }, newCwd: cwd }
            const showHidden = args.includes('-a')
            const longFormat = args.includes('-l')
            let items = showHidden ? ['.', '..', ...entries] : entries
            if (longFormat) {
                const lines = items.map(item => {
                    const fullPath = resolvedPath === '/' ? `/${item}` : `${resolvedPath}/${item}`
                    const isDir = DIRECTORIES[fullPath] !== undefined
                    return `${isDir ? 'drwxr-xr-x' : '-rw-r--r--'}  1 candidate candidate  ${isDir ? '4096' : ' 256'} Mar  7 02:47 ${item}`
                })
                return { result: { output: `total ${items.length * 4}\n${lines.join('\n')}`, isError: false }, newCwd: cwd }
            }
            return { result: { output: items.join('  '), isError: false }, newCwd: cwd }
        }

        case 'cd': {
            if (!args[0] || args[0] === '~') return { result: { output: '', isError: false }, newCwd: '/home/candidate' }
            const targetPath = resolvePath(cwd, args[0])
            if (DIRECTORIES[targetPath] !== undefined) return { result: { output: '', isError: false }, newCwd: targetPath }
            return { result: { output: `cd: ${args[0]}: No such file or directory`, isError: true }, newCwd: cwd }
        }

        case 'cat': {
            if (!args[0]) return { result: { output: 'cat: missing operand', isError: true }, newCwd: cwd }
            const filePath = resolvePath(cwd, args[0])
            const content = FILESYSTEM[filePath]
            if (content === undefined) return { result: { output: `cat: ${args[0]}: No such file or directory`, isError: true }, newCwd: cwd }
            if (content === '') return { result: { output: `cat: ${args[0]}: Is a directory`, isError: true }, newCwd: cwd }
            return { result: { output: content, isError: false }, newCwd: cwd }
        }

        case 'head': {
            if (!args.filter(a => !a.startsWith('-'))[0]) return { result: { output: 'head: missing operand', isError: true }, newCwd: cwd }
            const hFile = resolvePath(cwd, args.filter(a => !a.startsWith('-'))[0])
            const hContent = FILESYSTEM[hFile]
            if (!hContent) return { result: { output: `head: ${args[0]}: No such file or directory`, isError: true }, newCwd: cwd }
            const hN = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10
            return { result: { output: hContent.split('\n').slice(0, hN).join('\n'), isError: false }, newCwd: cwd }
        }

        case 'tail': {
            if (!args.filter(a => !a.startsWith('-'))[0]) return { result: { output: 'tail: missing operand', isError: true }, newCwd: cwd }
            const tFile = resolvePath(cwd, args.filter(a => !a.startsWith('-'))[0])
            const tContent = FILESYSTEM[tFile]
            if (!tContent) return { result: { output: `tail: ${args[0]}: No such file or directory`, isError: true }, newCwd: cwd }
            const tN = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10
            const lines = tContent.split('\n').filter(l => l)
            return { result: { output: lines.slice(-tN).join('\n'), isError: false }, newCwd: cwd }
        }

        case 'echo':
            return { result: { output: args.join(' ').replace(/"/g, '').replace(/'/g, ''), isError: false }, newCwd: cwd }

        case 'grep': {
            const nonFlagArgs = args.filter(a => !a.startsWith('-'))
            if (nonFlagArgs.length < 2) return { result: { output: 'grep: missing arguments. Usage: grep PATTERN FILE', isError: true }, newCwd: cwd }
            const pattern = nonFlagArgs[0].replace(/"/g, '').replace(/'/g, '')
            const gFile = resolvePath(cwd, nonFlagArgs[1])
            const gContent = FILESYSTEM[gFile]
            if (!gContent) return { result: { output: `grep: ${nonFlagArgs[1]}: No such file or directory`, isError: true }, newCwd: cwd }
            const caseInsensitive = args.includes('-i')
            const showLineNum = args.includes('-n')
            const matches = gContent.split('\n').map((line, i) => ({ line, num: i + 1 })).filter(({ line }) => {
                return caseInsensitive ? line.toLowerCase().includes(pattern.toLowerCase()) : line.includes(pattern)
            })
            if (matches.length === 0) return { result: { output: '', isError: false }, newCwd: cwd }
            const output = matches.map(m => showLineNum ? `${m.num}:${m.line}` : m.line).join('\n')
            return { result: { output, isError: false }, newCwd: cwd }
        }

        case 'chmod':
            if (args.length < 2) return { result: { output: 'chmod: missing operand', isError: true }, newCwd: cwd }
            return { result: { output: '', isError: false }, newCwd: cwd }

        case 'ps':
            return { result: { output: PS_OUTPUT, isError: false }, newCwd: cwd }

        case 'top':
            return { result: { output: TOP_OUTPUT, isError: false }, newCwd: cwd }

        case 'whoami':
            return { result: { output: 'candidate', isError: false }, newCwd: cwd }

        case 'hostname':
            return { result: { output: 'srv-prod-01', isError: false }, newCwd: cwd }

        case 'uname':
            return { result: { output: 'Linux srv-prod-01 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux', isError: false }, newCwd: cwd }

        case 'systemctl': {
            if (!args[0]) return { result: { output: HELP_TEXTS['systemctl'], isError: false }, newCwd: cwd }
            const service = args[1] || 'unknown'
            if (args[0] === 'status') {
                return { result: { output: `● ${service}.service - ${service}\n   Loaded: loaded\n   Active: active (running) since Thu 2026-03-06 18:30:00 -05; 1 day ago\n   Main PID: 1024\n   CGroup: /system.slice/${service}.service`, isError: false }, newCwd: cwd }
            }
            return { result: { output: `${args[0]}ing ${service}...done.`, isError: false }, newCwd: cwd }
        }

        // Git commands (mode A3)
        case 'git': {
            if (mode !== 'A3' && !args[0]) return { result: { output: HELP_TEXTS['git'], isError: false }, newCwd: cwd }
            const subCmd = args[0]
            const subArgs = args.slice(1)

            // Handle sub-command help
            if (subArgs.includes('--help') || subArgs.includes('-h')) {
                const subHelp = HELP_TEXTS[`git ${subCmd}`]
                if (subHelp) return { result: { output: subHelp, isError: false }, newCwd: cwd }
            }

            switch (subCmd) {
                case 'log':
                    return { result: { output: GIT_LOG, isError: false }, newCwd: cwd }
                case 'branch':
                    return { result: { output: GIT_BRANCH, isError: false }, newCwd: cwd }
                case 'status':
                    return { result: { output: GIT_STATUS, isError: false }, newCwd: cwd }
                case 'checkout': {
                    const targetBranch = subArgs.filter(a => !a.startsWith('-'))[0]
                    if (!targetBranch) return { result: { output: 'fatal: branch name required', isError: true }, newCwd: cwd }
                    if (['main', 'develop', 'feature/billing-hotfix'].includes(targetBranch) || subArgs.includes('-b')) {
                        return { result: { output: `Switched to branch '${targetBranch}'`, isError: false }, newCwd: cwd }
                    }
                    return { result: { output: `error: pathspec '${targetBranch}' did not match any file(s) known to git`, isError: true }, newCwd: cwd }
                }
                case 'clone':
                    return { result: { output: `Cloning into '${subArgs[0] || 'repo'}'...\nremote: Enumerating objects: 42, done.\nremote: Counting objects: 100% (42/42), done.\nReceiving objects: 100% (42/42), 12.5 KiB | 6.25 MiB/s, done.`, isError: false }, newCwd: cwd }
                case 'add':
                    return { result: { output: '', isError: false }, newCwd: cwd }
                case 'commit':
                    return { result: { output: `[main abc1234] ${subArgs.includes('-m') ? subArgs[subArgs.indexOf('-m') + 1]?.replace(/"/g, '') || 'update' : 'update'}\n 1 file changed, 5 insertions(+)`, isError: false }, newCwd: cwd }
                case 'push':
                    return { result: { output: 'Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.\nWriting objects: 100% (3/3), 312 bytes | 312.00 KiB/s, done.\nTo github.com:seti/observability.git\n   a1b2c3d..d4e5f6g  main -> main', isError: false }, newCwd: cwd }
                case 'pull':
                    return { result: { output: 'Already up to date.', isError: false }, newCwd: cwd }
                case 'diff':
                    return { result: { output: '', isError: false }, newCwd: cwd }
                case '--help':
                    return { result: { output: HELP_TEXTS['git'], isError: false }, newCwd: cwd }
                default:
                    return { result: { output: `git: '${subCmd}' is not a git command. See 'git --help'.`, isError: true }, newCwd: cwd }
            }
        }

        case 'clear':
            return { result: { output: '__CLEAR__', isError: false }, newCwd: cwd }

        case 'help':
            if (mode === 'A1') {
                return { result: { output: 'Comandos disponibles: ls, cd, pwd, cat, head, tail, echo, grep, chmod, ps, top, whoami, hostname, uname, systemctl, clear\nUsa [comando] --help para más información.', isError: false }, newCwd: cwd }
            }
            return { result: { output: 'Comandos disponibles: git (clone, branch, status, log, commit, push, pull, add, diff), cat, ls, cd, pwd, clear\nUsa [comando] --help para más información.', isError: false }, newCwd: cwd }

        default:
            return { result: { output: `${cmd}: command not found. Escribe 'help' para ver comandos disponibles.`, isError: true }, newCwd: cwd }
    }
}

function resolvePath(cwd: string, target: string): string {
    if (target.startsWith('/')) return target.replace(/\/+$/, '') || '/'
    if (target === '.') return cwd
    if (target === '..') {
        const parts = cwd.split('/').filter(Boolean)
        parts.pop()
        return '/' + parts.join('/')
    }
    const base = cwd === '/' ? '' : cwd
    return `${base}/${target}`.replace(/\/+$/, '')
}
