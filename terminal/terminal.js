// <<<<< START OF FULL terminal.js >>>>>
document.addEventListener('DOMContentLoaded', function () {
    // --- DOM Element References ---
    const terminal = document.getElementById('terminal');
    const editor = document.getElementById('editor');
    const editorTextarea = document.getElementById('editor-textarea');

    // --- State Variables ---
    let currentPath = ['/'];
    let filesystem = {};
    let commandHistory = [];
    let historyIndex = -1;
    let currentInput = '';
    let editingFile = null;
    let cursorPosition = 0;
    let scriptState = null; // For 'read' command state
    let nanoOriginalContent = null; // For nano modification check
    let isTailFollowing = false; // State for tail -f simulation
    // --- Nano Input States ---
    let isNanoSearching = false;
    let nanoSearchTerm = '';
    let nanoLastSearchIndex = -1;
    let isNanoGoingToLine = false;
    let nanoGoToLineInput = '';
    let isPromptingNanoFilename = false;
    let nanoFilenameInputString = '';
    let closeNanoAfterSave = false;

    // --- Constants ---
    const fakePath = "/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games"; // Simulated PATH

    // --- Man Page Data (Simulation Specific) ---
    const manPages = {
        ls: `
NAME
       ls - list directory contents (simulation)

SYNOPSIS
       ls [-l] [FILE_OR_DIRECTORY]...

DESCRIPTION
       List information about the FILEs (the current directory by default).

OPTIONS
       -l     use a long listing format (simulated details)

       This simulation only lists names or provides a simulated long format.
       Other flags like -a, -h, sorting options etc. are NOT supported.

EXAMPLES
       ls
              List files in the current directory.

       ls -l
              List files in the current directory with simulated details.

       ls /home/linux/documents
              List files in the specified directory.

       ls -l non_existent_file
              Reports an error for non-existent files/directories.
`,
        cd: `
NAME
       cd - change the shell working directory (simulation)

SYNOPSIS
       cd [DIRECTORY]

DESCRIPTION
       Change the current directory to DIRECTORY. The argument '~' is
       expanded to the user's home directory (/home/linux). If DIRECTORY
       is omitted, it defaults to the home directory.

       Special cases:
              cd     Changes to the home directory (/home/linux).
              cd ~   Changes to the home directory (/home/linux).
              cd ..  Changes to the parent directory.

EXAMPLES
       cd documents
              Change into the 'documents' subdirectory.

       cd /etc
              Change to the absolute path '/etc'.

       cd ..
              Move up one directory level.

       cd
              Return to the home directory (/home/linux).
`,
        cat: `
NAME
       cat - concatenate files and print on the standard output (simulation)

SYNOPSIS
       cat [FILE]...

DESCRIPTION
       Display the contents of one or more FILEs.

EXAMPLES
       cat readme.txt
              Display the content of 'readme.txt'.

       cat file1.txt file2.txt
              Display content of 'file1.txt' followed by 'file2.txt'.
`,
        pwd: `
NAME
       pwd - print name of current/working directory (simulation)

SYNOPSIS
       pwd

DESCRIPTION
       Print the full filename of the current working directory.
`,
        echo: `
NAME
       echo - display a line of text (simulation)

SYNOPSIS
       echo [STRING]...
       echo $PATH

DESCRIPTION
       Writes the specified STRINGs to the terminal, separated by spaces,
       followed by a newline. Surrounding quotes (' or ") are typically
       removed from the output. The -e flag is recognized but does not
       process escape sequences in this simulation.
       If the argument is exactly '$PATH', displays the simulated search path.

EXAMPLES
       echo Hello World
       echo "Quoted string"
       echo $PATH
`,
        touch: `
NAME
       touch - change file timestamps (simulation: create empty file)

SYNOPSIS
       touch FILE...

DESCRIPTION
       Creates FILE if it does not exist. If FILE exists, this simulation
       does nothing (unlike the real command which updates timestamps).

EXAMPLES
       touch newfile.txt
              Creates an empty file named 'newfile.txt'.
`,
        mkdir: `
NAME
       mkdir - make directories (simulation)

SYNOPSIS
       mkdir DIRECTORY...

DESCRIPTION
       Create the DIRECTORY(ies), if they do not already exist.
       Does not support creating parent directories automatically (-p flag).

EXAMPLES
       mkdir my_new_directory
              Creates a directory named 'my_new_directory'.
`,
        rm: `
NAME
       rm - remove files (simulation)

SYNOPSIS
       rm FILE...

DESCRIPTION
       Removes the specified FILE(s).

       WARNING: This simulation does NOT support removing directories. Use rmdir
                for empty directories. The -r (recursive) flag is NOT supported.

EXAMPLES
       rm oldfile.txt
              Deletes the file 'oldfile.txt'.
`,
        rmdir: `
NAME
       rmdir - remove empty directories (simulation)

SYNOPSIS
       rmdir DIRECTORY...

DESCRIPTION
       Removes the DIRECTORY, if it is empty.

EXAMPLES
       rmdir empty_folder
              Removes the directory 'empty_folder' if it contains no files or
              subdirectories.
`,
        cp: `
NAME
       cp - copy files (simulation)

SYNOPSIS
       cp SOURCE DEST

DESCRIPTION
       Copy SOURCE file to DEST file, or copy SOURCE file into DEST directory.

       This simulation does NOT support copying directories (the -r flag).

EXAMPLES
       cp file1.txt file1_copy.txt
              Copies 'file1.txt' to 'file1_copy.txt'.

       cp notes.txt documents/
              Copies 'notes.txt' into the 'documents' directory
              (as 'documents/notes.txt').
`,
        mv: `
NAME
       mv - move (rename) files (simulation)

SYNOPSIS
       mv SOURCE DEST

DESCRIPTION
       Rename SOURCE to DEST, or move SOURCE file/directory into DEST directory.

EXAMPLES
       mv oldname.txt newname.txt
              Renames 'oldname.txt' to 'newname.txt'.

       mv script.sh scripts/
              Moves 'script.sh' into the 'scripts' directory (if 'scripts' exists).

       mv mydir new_dir_name
              Renames the directory 'mydir' to 'new_dir_name'.
`,
        grep: `
NAME
       grep - print lines matching a pattern (simulation)

SYNOPSIS
       grep [-i] PATTERN [FILE]...

DESCRIPTION
       Searches the named input FILEs for lines containing a match to the given
       PATTERN. Matching lines are printed to the terminal, with the match
       highlighted.

OPTIONS
       -i     Perform case-insensitive matching.

       Other grep options are NOT supported in this simulation.

EXAMPLES
       grep "hello" readme.txt
              Find lines containing "hello" in 'readme.txt'.

       grep -i "error" logfile.log
              Find lines containing "error" (case-insensitive) in 'logfile.log'.
`,
        head: `
NAME
       head - output the first part of files (simulation)

SYNOPSIS
       head [-n NUMLINES] [FILE]...

DESCRIPTION
       Print the first NUMLINES lines (default 10) of each FILE to the terminal.
       If multiple files are given, adds a header before each file's output.

OPTIONS
       -n NUMLINES
              Print the first NUMLINES lines instead of the default 10.

EXAMPLES
       head data.txt
              Show the first 10 lines of 'data.txt'.

       head -n 5 script.sh
              Show the first 5 lines of 'script.sh'.
`,
        tail: `
NAME
       tail - output the last part of files (simulation)

SYNOPSIS
       tail [-n NUMLINES] [-f] [FILE]...

DESCRIPTION
       Print the last NUMLINES lines (default 10) of each FILE to the terminal.
       With -f, simulates 'following' the file (prints last lines then waits).

OPTIONS
       -n NUMLINES
              Output the last NUMLINES lines, instead of the last 10.
       -f     Simulates following the file. After outputting the last lines,
              it waits. Press Ctrl+C to exit the follow mode. Cannot be used
              with multiple files in this simulation.

EXAMPLES
       tail data.txt
              Show the last 10 lines of 'data.txt'.

       tail -n 5 script.sh
              Show the last 5 lines of 'script.sh'.

       tail -f system.log
              Show the last 10 lines of 'system.log' and simulate waiting
              for new content (Press Ctrl+C to stop).
`,
        nano: `
NAME
       nano - Nano's Another editor (simulation)

SYNOPSIS
       nano [FILE]

DESCRIPTION
       A simple terminal-based text editor.

KEYBINDINGS (Simulation)
       Ctrl+O Save the current buffer (prompts for filename if needed).
       Ctrl+X Exit nano (prompts to save if buffer is modified).
       Ctrl+W Where Is (Search): Prompts for text and finds the next occurrence.
       Ctrl+_ Go To Line: Prompts for a line number and moves the cursor.
              (May require Ctrl+Shift+- depending on terminal/browser)

       Other nano keybindings are NOT implemented.
`,
        clear: `
NAME
       clear - clear the terminal screen (simulation)

SYNOPSIS
       clear

DESCRIPTION
       Clears the terminal screen, removing previous commands and output.
`,
        history: `
NAME
       history - display command history (simulation)

SYNOPSIS
       history

DESCRIPTION
       Displays the list of previously executed commands, numbered starting from 1
       for the most recent command.
`,
        whoami: `
NAME
       whoami - print effective userid (simulation)

SYNOPSIS
       whoami

DESCRIPTION
       Prints the username associated with the current user (always 'linux'
       in this simulation).
`,
        hostname: `
NAME
       hostname - show or set the system's host name (simulation: show only)

SYNOPSIS
       hostname

DESCRIPTION
       Prints the simulated system's network name ('linux-simulator').
`,
        help: `
NAME
       help - display list of available commands (simulation)

SYNOPSIS
       help

DESCRIPTION
       Displays a formatted list of commands implemented in this terminal
       simulation. Use 'man [COMMAND]' for details on a specific command.
`,
        man: `
NAME
       man - an interface to the system reference manuals (simulation)

SYNOPSIS
       man [COMMAND]

DESCRIPTION
       Displays the manual page for the specified COMMAND, describing only the
       features available in this simulation.

EXAMPLES
       man ls
              Show the manual page for the simulated 'ls' command.
`
    };

    // --- Filesystem Simulation ---
    function initFilesystem() {
        // Use full file content here if desired, truncated for brevity
        filesystem = {
            bin: { 'ls': 'binary', 'cd': 'binary', 'cat': 'binary', 'grep': 'binary', 'echo': 'binary', 'touch': 'binary', 'mkdir': 'binary', 'rm': 'binary', 'cp': 'binary', 'mv': 'binary', 'nano': 'binary', 'head': 'binary', 'tail': 'binary', 'man': 'binary' }, // Added man, tail
            home: {
                linux: {
                    documents: { 'notes.txt': 'This is a training file.\nYou can edit this file using the nano command.\nTry using grep to search this file!\nLine four.\nLast line of notes.' },
                    downloads: {},
                    'readme.txt': 'Welcome to your home directory!\n\nThis is a simple text file.\nYou can view its content using the `cat readme.txt` command.\nYou can edit it using `nano readme.txt`.\n\nExplore the filesystem using `ls` and `cd`. Try `cd documents`.\n',
                    'example_script.sh': '#!/bin/bash\n# This is a simulated shell script.\n# In a real Linux terminal, you would make it executable (chmod +x)\n# and run it with ./example_script.sh\n\necho "Hello from the example script!"\necho "Current simulated directory: $(pwd)"\n\n# End of script',
                    'bluebear.txt': 'BlueBEAR\n\nBlueBEAR provides a High Performance Computing (HPC) service that, like the other BEAR services, is free at the point of use to \nall researchers at the University.Following significant investment both in terms of hardware and staff time this year, we are \npleased to announce that the latest generation of BlueBEAR HPC is now live and fully operational. All users and their work have \nbeen migrated.\n\nWhats New?\n\nThe new BlueBEAR employs some of the latest technology to deliver fast and efficient processing capacity for researchers while \nminimizing energy consumption by using direct, on-chip, water cooling. Built on Lenovos NeXtScale servers, the new cluster has a \nnumber of other notable features, including more cores and memory per node, larger memory nodes and a new automated workload \nmanager, SLURM.  There have also been a few tweaks to the way the resource is shared but the underlying principles remain the \nsame, including the free at the point of use policy for University research groups.BlueBEAR is powered by approx. 2000 cores with \n100Gb EDR Infiniband interconnect; all tightly coupled with the wider BEAR including the Research Data Store (RDS). Go to current \nBlueBEAR configuration for further detail. We are already seeing the benefits of this regeneration, particularly to the throughput \nof the high volume of short running or single core jobs made possible by the removal of the limitation that only a single user \ncould have access to a node.\n\nWhats Next?\n\nIn parallel with the upgrade to the processing capacity of BlueBEAR, we have also been planning the replacement of the \nclosely-coupled storage (dedicated to active processing on the cluster). The new storage has a number of upgraded or additional \nfeatures, all designed to boost efficiency and throughput. Follow this link to find out more about the new storage and its \ncapabilities. The storage infrastructure is installed and tested. Implementation/user cut-over will follow shortly.\n\nInformation and Help\n\nPlease use the right hand navigation panel for lots of useful information to support your use of BlueBEAR, including details of \nthe applications we provide and help submitting jobs. All users must register in order to use the service. The Registration link \nexplains the process and provides guidance to get you started.\n\nContinuing Investment and Growing BlueBEAR\n\nFinally, we would like to ask for your support in continuing to justify the investment in HPC by acknowledging use of BlueBEAR in \nyour publications (A possible form of words can be found here along with a form to notify us of publication which will allow us to \nfurther publicize your research in conjunction with the BlueBEAR service).\n\nIf you still have questions or are struggling, see Contact Us for the best routes to support.\n\nLast modified: 5 September 2017\n',
                    'name.sh': "#!/bin/bash\n\nread -p 'Enter Your Name: ' name\necho \"Hello $name, Welcome to the Introduction to Linux workshop\"\n",
                    'input2.sh': "#!/bin/bash\n\necho \"What do you think of Bash?\"\nread reply\necho \"You said $reply\"\necho\n",
                    'README.txt': '\n\nWelcome to the Introduction to Linux course!\n\nThis course is designed to give you the basic Linux knowledge to use BlueBEAR and prepare you for the Bear Necessities training course.\nI hope you will find the course useful. Please log a call with the ServiceDesk if you have any queries.\n\nDebbie\nBEAR Team\n',
                    'simple_script.sh': "#! /bin/bash\n\necho \"Hello Linux World, my name is Tux!\"\n",
                    'storage.txt': 'BEAR offers and is developing a set of storage and archiving services to meet the needs of the Universitys research community. \nThese services are underpinned by the institutional commitment to provide mechanisms and services for storage, backup, \nregistration, deposit and retention of research data assets in support of current and future access, during and after completion \nof research projects. (See the University Research Data Management Policy .)\n\nThe Research Data Archive (RDA) provides an integrated, secure and resilient service, available to researchers from all \ndisciplines exclusively for the long term storage of data associated with published research and which is recorded in the Campus \nResearch Information Store (PURE). Together, these systems provide the foundations for meeting the open-access requirements of \nfunders as well as safe-guarding the data. A default allocation of 1TB per project for 10 years will be provided to the Principle \nInvestigator with an option to purchase additional space for exceptional requirements. For more information and how to register \nplease see here RDA. (Search for Article: KB12529 within the Service Desk)\n\nThe University has also invested in a central Research Data Store (RDS) which provides an integrated and secure service, available \nto researchers from all disciplines to store working data cost-effectively.  On request, a default allocation of up to 3TB of \nspace per project for 5 years will be allocated to the Principle Investigator, funded by the University for the duration of the \nproject (whichever is the shorter). Capacity in excess of the default may be purchased by Research Groups, funded from research \ngrants or other income. Search for Article: KB12866 within the Service Desk Knowledge Base for more information about the RDS.\n\nThe Research Data Storage Costs and Guidance for Research Grant Applications page has more information about the costing model for \nthe RDA and the RDS, which is particularly relevant for inclusion in funding bids.\n\nGovernance policies for the research data store and archive are available here.\n'
                }
            },
            etc: { 'passwd': 'root:x:0:0:root:/root:/bin/bash\nlinux:x:1000:1000:Linux User:/home/linux:/bin/bash\n', 'hostname': 'linux-simulator\n', 'hosts': '127.0.0.1 localhost\n::1 localhost\n' },
            var: { log: { 'syslog': 'Simulated system log entries.\n' + new Date().toString() + ' systemd[1]: System startup finished.\n' } },
            tmp: {},
            root: { 'secret.txt': 'Top secret root-only file.\nAccess requires simulation of root privileges (not implemented).\n' }
        };
    }

    // --- Helper Functions ---
    function pathToString(pathArr) { if (!pathArr || pathArr.length === 0) return '/'; if (pathArr.length === 1 && pathArr[0] === '/') return '/'; return pathArr.join('/').replace('//', '/'); }
    function getCurrentDir() { let dir = filesystem; const parts = currentPath.slice(1); for (const part of parts) { if (!dir || typeof dir !== 'object' || !dir[part]) { console.error("Invalid current path:", currentPath); return filesystem; } dir = dir[part]; } return dir; }
    function resolvePath(p) { if (!p) return [...currentPath]; const parts = p.split('/').filter(Boolean); let newPath = p.startsWith('/') ? ['/'] : [...currentPath]; for (const part of parts) { if (part === '.') continue; if (part === '..') { if (newPath.length > 1) newPath.pop(); } else { newPath.push(part); } } if (newPath.length > 1 && newPath[0] === '/' && !newPath[1]) return ['/']; return newPath; }
    function getDirFromPath(pathArr) { if (!pathArr || pathArr.length <= 1) return filesystem; let dir = filesystem; const dirPathParts = pathArr[0] === '/' ? pathArr.slice(1, -1) : pathArr.slice(0, -1); for (const part of dirPathParts) { if (!dir || typeof dir !== 'object' || !dir[part] || typeof dir[part] === 'string') { return null; } dir = dir[part]; } return dir; }
    function isFile(pathArr) { if (!pathArr || pathArr.length <= 1) return false; const parentDir = getDirFromPath(pathArr); const fileName = pathArr[pathArr.length - 1]; return parentDir && typeof parentDir[fileName] === 'string'; }
    function findLongestCommonPrefix(strings) { if (!strings || strings.length === 0) return ''; if (strings.length === 1) return strings[0]; let prefix = strings[0]; for (let i = 1; i < strings.length; i++) { while (strings[i].indexOf(prefix) !== 0) { prefix = prefix.substring(0, prefix.length - 1); if (prefix === '') return ''; } } return prefix; }
    function getObjectFromPath(pathArr) { let current = filesystem; const parts = pathArr[0] === '/' ? pathArr.slice(1) : pathArr; for (const part of parts) { if (!part) continue; if (!current || typeof current !== 'object' || current[part] === undefined) return null; current = current[part]; } return current; }


    // --- Terminal Output ---
    function print(text = '', noNewline = false) { const existingCursor = terminal.querySelector('.cursor'); if (existingCursor) existingCursor.remove(); const textNode = document.createTextNode(String(text) + (noNewline ? '' : '\n')); terminal.appendChild(textNode); terminal.scrollTop = terminal.scrollHeight; }
    function printHTML(htmlContent = '', noNewline = false) { const existingCursor = terminal.querySelector('.cursor'); if (existingCursor) existingCursor.remove(); if (String(htmlContent).toLowerCase().includes('<script')) { console.warn("Blocked script tag in printHTML"); print("[Blocked potentially unsafe HTML]"); return; } terminal.innerHTML += htmlContent + (noNewline ? '' : '\n'); terminal.scrollTop = terminal.scrollHeight; }
    function printReadPrompt(promptText) { const existingCursor = terminal.querySelector('.cursor'); if (existingCursor) existingCursor.remove(); const escapedPrompt = String(promptText).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>'); terminal.innerHTML += escapedPrompt; terminal.innerHTML += `<span class="input"><span class="cursor"></span></span>`; terminal.scrollTop = terminal.scrollHeight; currentInput = ''; cursorPosition = 0; updateCursorPosition(); }
    function prompt() { if (scriptState || isTailFollowing) { return; } let displayPath = pathToString(currentPath); if (displayPath.startsWith('/home/linux')) { displayPath = '~' + displayPath.substring('/home/linux'.length); } if (displayPath === '') displayPath = '~'; const escapedDisplayPath = displayPath.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>'); printHTML(`<span class="prompt">linux@linux-simulator:${escapedDisplayPath}$ </span><span class="input"><span class="cursor"></span></span>`, true); cursorPosition = 0; updateCursorPosition(); }

    // --- Script Runner (Corrected to Execute Commands) ---
        // --- Script Runner (Corrected to Execute Commands with Substitution) ---
        function executeScriptLines(lines, variables) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmedLine = line.trim();
    
                if (trimmedLine.startsWith('#') || trimmedLine === '') {
                    continue; // Skip comments and empty lines
                }
    
                // --- Handle 'read' command specifically for pausing ---
                if (trimmedLine.startsWith('read ')) {
                    let promptText = '';
                    let varName = '';
    
                    if (trimmedLine.startsWith('read -p ')) {
                        const match = trimmedLine.match(/^read -p\s*(['"])(.*?)\1\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                        if (match) { promptText = match[2]; varName = match[3]; }
                        else { print(`(Skipping malformed 'read -p': ${trimmedLine})`); continue; }
                    } else {
                        const match = trimmedLine.match(/^read\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                        if (match) { promptText = ''; varName = match[1]; }
                        else { print(`(Skipping malformed 'read': ${trimmedLine})`); continue; }
                    }
    
                    // Substitute variables *in the prompt text* before displaying
                    if (variables['name'] !== undefined) { promptText = promptText.replace('$name', variables['name']); }
                    if (variables['reply'] !== undefined) { promptText = promptText.replace('$reply', variables['reply']); }
                    // Add more variable substitutions for prompts if needed
    
                    scriptState = {
                        variableName: varName,
                        promptText: promptText,
                        remainingLines: lines.slice(i + 1),
                        variables: { ...variables } // Pass copy
                    };
                    printReadPrompt(promptText);
                    return true; // Indicate script paused
                }
    
                // --- Process other lines as commands ---
                else {
                    let lineToExecute = trimmedLine;
    
                    // === Perform substitutions BEFORE calling handleCommand ===
                    // Variable substitution
                    if (variables['name'] !== undefined) { lineToExecute = lineToExecute.replace('$name', variables['name']); }
                    if (variables['reply'] !== undefined) { lineToExecute = lineToExecute.replace('$reply', variables['reply']); }
                    // Add other $var substitutions here if needed
    
                    // Command substitution (basic $(pwd))
                    // Use replaceAll in case $(pwd) appears multiple times
                    lineToExecute = lineToExecute.replaceAll('$(pwd)', pathToString(currentPath));
                    // === End of substitutions ===
    
                    // Call the main command handler for the processed line
                    handleCommand(lineToExecute, true); // Pass true for isFromScript
    
                    // Check if a command paused execution (tail -f or nested read)
                    if (scriptState || isTailFollowing) {
                        return true; // Paused by a nested command/read
                    }
                }
            } // End of loop through lines
    
            return false; // Script finished without pausing
        }

    // --- Command Handling ---
    function handleCommand(input, isFromScript = false) {
        const trimmedInput = input.trim();
        if (trimmedInput && !isFromScript) { // Only add direct commands to history for now
             commandHistory.unshift(trimmedInput);
             if (commandHistory.length > 100) commandHistory.pop();
        }
        if(!isFromScript) historyIndex = -1; // Reset history index only for direct commands

        const inputSpans = terminal.querySelectorAll('.input');
        if (inputSpans.length > 0 && !isFromScript) { // Echo command only if not from script (script echoes itself)
             const lastInputSpan = inputSpans[inputSpans.length - 1];
             const textNode = document.createTextNode(input);
             lastInputSpan.parentNode.replaceChild(textNode, lastInputSpan);
             terminal.appendChild(document.createTextNode('\n'));
             terminal.scrollTop = terminal.scrollHeight;
         }

        const parts = trimmedInput.split(/\s+/).filter(Boolean); const cmd = parts[0]; const args = parts.slice(1);
        if (!cmd && !isFromScript) { prompt(); return; } if (!cmd && isFromScript) { return; }

        if (cmd.startsWith('./') || cmd.startsWith('/')) { const scriptPath = resolvePath(cmd); const scriptName = scriptPath[scriptPath.length - 1]; const parentDir = getDirFromPath(scriptPath); let scriptContent = null; if (parentDir && typeof parentDir === 'object' && parentDir[scriptName] !== undefined) { if (typeof parentDir[scriptName] === 'string') { scriptContent = parentDir[scriptName]; } else { print(`bash: ${cmd}: Is a directory`); if (!isFromScript) prompt(); return; } } else { print(`bash: ${cmd}: No such file or directory`); if (!isFromScript) prompt(); return; } if (scriptContent) { const lines = scriptContent.split('\n'); const finished = executeScriptLines(lines, {}); if (!finished && !isTailFollowing && !isFromScript) { prompt(); } } else { print(`bash: ${cmd}: Cannot execute`); if (!isFromScript) prompt(); } return; }

        switch (cmd) {
            case 'man': { const pageName = args[0]; if (!pageName) { print('man: What manual page do you want?'); } else if (manPages[pageName]) { print(manPages[pageName]); } else { print(`man: No manual entry for ${pageName}`); } break; }
            case 'help': printHTML(`Welcome to the Linux Training Terminal!\nHere are the commands you can use:\n\n<span style="color: #88c0d0;">--- Navigating ---</span>\n  pwd      - Print Working Directory\n  cd [DIR] - Change Directory (~ for home, .. for parent)\n  ls [-l] [DIR] - List directory contents (long format with -l)\n\n<span style="color: #88c0d0;">--- Viewing Files ---</span>\n  cat FILE ...    - Display file content\n  head [-n #] FILE - Display first lines of file\n  tail [-n #] [-f] FILE - Display last lines (or 'follow' with -f)\n  grep [-i] PATTERN FILE... - Search for PATTERN in file(s)\n\n<span style="color: #88c0d0;">--- Managing Files/Dirs ---</span>\n  touch FILE ...  - Create empty file\n  mkdir DIR ...   - Create directory\n  cp SOURCE DEST  - Copy file\n  mv SOURCE DEST  - Move/Rename file or directory\n  rm FILE ...     - Remove file\n  rmdir DIR ...   - Remove *empty* directory\n\n<span style="color: #88c0d0;">--- Editing Files ---</span>\n  nano [FILE]   - Edit file (^O Save, ^X Exit, ^W Find, ^_ Go Line)\n\n<span style="color: #88c0d0;">--- Output & Info ---</span>\n  echo [TEXT|$PATH] - Display text or simulated PATH\n  whoami        - Display current user\n  hostname      - Display hostname\n\n<span style="color: #88c0d0;">--- Other ---</span>\n  ./script.sh   - Execute simple scripts (basic echo, read)\n  man [COMMAND] - Display help page for a command\n  clear         - Clear terminal screen\n  history       - Show command history\n  help          - Display this help`); break;
            case 'echo': { let outputStr = args.join(' '); if (outputStr === '$PATH') { outputStr = fakePath; } else { if ((outputStr.startsWith('"') && outputStr.endsWith('"')) || (outputStr.startsWith("'") && outputStr.endsWith("'"))) { outputStr = outputStr.substring(1, outputStr.length - 1); } } print(outputStr); break; }
            case 'tail': { let lineCount = 10; let follow = false; let filenames = []; for (const arg of args) { if (arg === '-f') { follow = true; } else if (arg === '-n' && args[args.indexOf(arg) + 1]) { const num = parseInt(args[args.indexOf(arg) + 1]); if (!isNaN(num) && num > 0) { lineCount = num; } else { print(`tail: invalid number of lines: ‘${args[args.indexOf(arg) + 1]}’`); return; } } else if (arg.startsWith('-') && arg !== '-f' && arg !== '-n') { print(`tail: invalid option -- '${arg.split('')[1]}'`); } else if (args[args.indexOf(arg) - 1] !== '-n') { filenames.push(arg); } } if (filenames.length === 0) { print('tail: missing file operand'); break; } if (filenames.length > 1 && follow) { print("tail: cannot follow multiple files"); break; } const multipleFiles = filenames.length > 1; let firstHeader = true; for (const filename of filenames) { const filePath = resolvePath(filename); const actualFilename = filePath[filePath.length - 1]; const parentDir = getDirFromPath(filePath); if (!parentDir || typeof parentDir !== 'object' || parentDir[actualFilename] === undefined) { print(`tail: cannot open '${filename}' for reading: No such file or directory`); continue; } const target = parentDir[actualFilename]; if (typeof target !== 'string') { print(`tail: error reading '${filename}': Is a directory or not a file`); continue; } if (multipleFiles) { printHTML(`${firstHeader ? '' : '\n'}<span style="color:#a3be8c">==> ${filename.replace(/</g,'<')} <==</span>`); firstHeader = false; } const lines = target.split('\n'); const relevantLines = lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines; const outputLines = relevantLines.slice(-lineCount); print(outputLines.join('\n')); if (follow) { isTailFollowing = true; print(`(tail -f simulation: monitoring ${filename}. Press Ctrl+C to stop)`); return; } } break; } // End tail case
            case 'ls': { /* ls -l logic */ let longFormat = false; let targetPaths = []; for (const arg of args) { if (arg === '-l') { longFormat = true; } else if (arg.startsWith('-')) { print(`ls: invalid option -- '${arg.split('')[1]}' (sim only supports -l)`); } else { targetPaths.push(arg); } } if (targetPaths.length === 0) { targetPaths.push('.'); } const formatLongEntry = (name, item) => { const isDir = typeof item === 'object'; const permissions = isDir ? 'drwxr-xr-x' : '-rw-r--r--'; const links = '1'; const owner = 'linux'; const group = 'linux'; const size = isDir ? '4096' : String(item ? item.length : 0).padStart(5); const date = 'Jan 01 12:00'; const coloredName = isDir ? `<span style="color:#88c0d0">${name}</span>` : name.replace(/</g,'<'); return `${permissions} ${links.padStart(2)} ${owner.padEnd(8)} ${group.padEnd(8)} ${size.padStart(6)} ${date} ${coloredName}`; }; let firstTarget = true; for (const targetPathStr of targetPaths) { if (targetPaths.length > 1 && !firstTarget) { print(''); } if(targetPaths.length > 1) { printHTML(`<span style="text-decoration:underline">${targetPathStr.replace(/</g,'<')}:</span>`); } firstTarget = false; const targetPath = resolvePath(targetPathStr); const parentDir = getDirFromPath(targetPath); const targetName = targetPath[targetPath.length - 1] || (targetPath.length === 1 && targetPath[0] === '/' ? '/' : '.'); if (!parentDir && !(targetPath.length === 1 && targetPath[0] === '/')) { print(`ls: cannot access '${targetPathStr}': No such file or directory`); continue; } const currentDirObj = getCurrentDir(); const targetItem = (targetPathStr === '.') ? currentDirObj : (targetPath.length === 1 && targetPath[0] === '/' ? filesystem : parentDir[targetName]); if (targetItem === undefined && targetPathStr !== '.') { print(`ls: cannot access '${targetPathStr}': No such file or directory`); continue; } if (typeof targetItem === 'string') { if (longFormat) { printHTML(formatLongEntry(targetName, targetItem)); } else { print(targetName); } } else if (typeof targetItem === 'object') { const entries = Object.entries(targetItem); if (longFormat) { entries.sort((a, b) => a[0].localeCompare(b[0])); for (const [name, item] of entries) { printHTML(formatLongEntry(name, item)); } } else { const names = Object.keys(targetItem).sort(); if (names.length > 0) { let outputHTML = names.map(name => typeof targetItem[name] === 'object' ? `<span style="color:#88c0d0">${name}</span>` : name.replace(/</g,'<')).join('  '); printHTML(outputHTML); } } } else { print(`ls: error accessing '${targetPathStr}'`); } } break; }
            // Other command cases condensed...
            case 'pwd': print(pathToString(currentPath)); break;
            case 'cd': { /* cd logic */ const target = args[0] || '~'; let newPath; if (target === '~') { newPath = resolvePath('/home/linux'); } else { newPath = resolvePath(target); } let tempDir = filesystem; let valid = true; const partsToNavigate = newPath[0] === '/' ? newPath.slice(1) : newPath; for (const part of partsToNavigate) { if (!part) continue; if (!tempDir || typeof tempDir !== 'object' || !tempDir[part]) { print(`cd: ${target}: No such file or directory`); valid = false; break; } if (typeof tempDir[part] === 'string') { print(`cd: ${target}: Not a directory`); valid = false; break; } if (part === 'root' && pathToString(newPath).startsWith('/root') && pathToString(currentPath) !== '/root') { print(`cd: Permission denied: ${pathToString(newPath)}`); valid = false; break; } tempDir = tempDir[part]; } if (valid) { currentPath = newPath; } break; }
            case 'touch': { /* touch logic */ if (args.length === 0) { print('touch: missing file operand'); break; } for (const filename of args) { const filePath = resolvePath(filename); const actualFilename = filePath[filePath.length - 1]; const parentDir = getDirFromPath(filePath); if (!parentDir || typeof parentDir !== 'object') { print(`touch: cannot touch '${filename}': Invalid path`); continue; } if (parentDir[actualFilename] === undefined) { parentDir[actualFilename] = ''; } } break; }
            case 'mkdir': { /* mkdir logic */ if (args.length === 0) { print('mkdir: missing operand'); break; } for (const dirname of args) { const dirPath = resolvePath(dirname); const actualDirname = dirPath[dirPath.length - 1]; const parentDir = getDirFromPath(dirPath); if (!parentDir || typeof parentDir !== 'object') { print(`mkdir: cannot create directory '${dirname}': Invalid path`); continue; } if (parentDir[actualDirname] !== undefined) { print(`mkdir: cannot create directory '${dirname}': File exists`); } else { parentDir[actualDirname] = {}; } } break; }
            case 'rmdir': { /* rmdir logic */ if (args.length === 0) { print('rmdir: missing operand'); break; } for (const dirname of args) { const dirPath = resolvePath(dirname); const actualDirname = dirPath[dirPath.length - 1]; const parentDir = getDirFromPath(dirPath); if (!parentDir || typeof parentDir !== 'object') { print(`rmdir: failed to remove '${dirname}': No such file or directory`); continue; } const target = parentDir[actualDirname]; if (target === undefined) { print(`rmdir: failed to remove '${dirname}': No such file or directory`); } else if (typeof target === 'string') { print(`rmdir: failed to remove '${dirname}': Not a directory`); } else if (Object.keys(target).length > 0) { print(`rmdir: failed to remove '${dirname}': Directory not empty`); } else { delete parentDir[actualDirname]; } } break; }
            case 'rm': { /* rm logic */ if (args.length === 0) { print('rm: missing operand'); break; } for (const targetName of args) { const targetPath = resolvePath(targetName); const actualName = targetPath[targetPath.length - 1]; const parentDir = getDirFromPath(targetPath); if (!parentDir || typeof parentDir !== 'object') { print(`rm: cannot remove '${targetName}': No such file or directory`); continue; } const target = parentDir[actualName]; if (target === undefined) { print(`rm: cannot remove '${targetName}': No such file or directory`); } else if (typeof target === 'object') { print(`rm: cannot remove '${targetName}': Is a directory`); } else { delete parentDir[actualName]; } } break; }
            case 'cat': { /* cat logic */ if (args.length === 0) { print('cat: missing file operand'); break; } let firstFile = true; for (const filename of args) { const filePath = resolvePath(filename); const actualFilename = filePath[filePath.length - 1]; const parentDir = getDirFromPath(filePath); if (!parentDir || typeof parentDir !== 'object') { print(`cat: ${filename}: No such file or directory`); continue; } const target = parentDir[actualFilename]; if (target === undefined) { print(`cat: ${filename}: No such file or directory`); } else if (typeof target === 'object') { print(`cat: ${filename}: Is a directory`); } else { if (!firstFile) print(''); print(target); firstFile = false; } } break; }
            case 'cp': { /* cp logic */ if (args.length < 2) { print(`cp: missing ${args.length === 1 ? 'destination' : 'file'} operand`); break; } const sourceName = args[0]; const destName = args[1]; const sourcePath = resolvePath(sourceName); const sourceFilename = sourcePath[sourcePath.length - 1]; const sourceParentDir = getDirFromPath(sourcePath); if (!sourceParentDir || sourceParentDir[sourceFilename] === undefined) { print(`cp: cannot stat '${sourceName}': No such file or directory`); break; } const sourceContent = sourceParentDir[sourceFilename]; if (typeof sourceContent === 'object') { print(`cp: -r not specified; omitting directory '${sourceName}'`); break; } const destPath = resolvePath(destName); let destFilename = destPath[destPath.length - 1]; let destParentDir = getDirFromPath(destPath); if (!destParentDir) { print(`cp: cannot create regular file '${destName}': Parent directory missing`); break; } if (destParentDir[destFilename] !== undefined && typeof destParentDir[destFilename] === 'object') { destParentDir = destParentDir[destFilename]; destFilename = sourceFilename; } if (typeof destParentDir !== 'object') { print(`cp: failed to access '${destName}': Intermediate path conflict`); break; } destParentDir[destFilename] = sourceContent; break; }
            case 'mv': { /* mv logic */ if (args.length < 2) { print(`mv: missing ${args.length === 1 ? 'destination' : 'file'} operand`); break; } const sourceName = args[0]; const destName = args[1]; const sourcePath = resolvePath(sourceName); const sourceFilename = sourcePath[sourcePath.length - 1]; const sourceParentDir = getDirFromPath(sourcePath); if (!sourceParentDir || sourceParentDir[sourceFilename] === undefined) { print(`mv: cannot stat '${sourceName}': No such file or directory`); break; } const sourceContent = sourceParentDir[sourceFilename]; const destPath = resolvePath(destName); let destFilename = destPath[destPath.length - 1]; let destParentDir = getDirFromPath(destPath); if (!destParentDir) { print(`mv: cannot move '${sourceName}' to '${destName}': Parent directory missing`); break; } const destExists = destParentDir[destFilename] !== undefined; const destIsDir = destExists && typeof destParentDir[destFilename] === 'object'; const sourceIsDir = typeof sourceContent === 'object'; if (sourceIsDir && destExists && !destIsDir) { print(`mv: cannot overwrite non-directory '${destName}' with directory '${sourceName}'`); break; } if (!destParentDir || typeof destParentDir !== 'object') { print(`mv: failed to access '${destName}': Intermediate path conflict`); break; } if (destIsDir) { if (pathToString(sourcePath) === pathToString(destPath)) { print(`mv: cannot move '${sourceName}' to a subdirectory of itself, '${destName}/${sourceFilename}'`); break; } if (destParentDir[destFilename][sourceFilename] !== undefined) { print(`mv: cannot move '${sourceName}' to '${destName}/${sourceFilename}': Destination exists`); break; } destParentDir[destFilename][sourceFilename] = sourceContent; delete sourceParentDir[sourceFilename]; } else { if (pathToString(sourcePath) === pathToString(destPath)) { break; } if (destExists && typeof destParentDir[destFilename] === 'object' && !sourceIsDir) { print(`mv: cannot overwrite directory '${destName}' with non-directory '${sourceName}'`); break; } destParentDir[destFilename] = sourceContent; if (pathToString(sourcePath) !== pathToString(destPath)) { delete sourceParentDir[sourceFilename]; } } break; }
            case 'head': { /* head logic */ let lineCount = 10; let filenames = []; let i = 0; while (i < args.length) { if (args[i] === '-n' && i + 1 < args.length) { const num = parseInt(args[i + 1]); if (!isNaN(num) && num > 0) { lineCount = num; } else { print(`head: invalid number of lines: ‘${args[i+1]}’`); return; } i += 2; } else { filenames.push(args[i]); i++; } } if (filenames.length === 0) { print('head: missing file operand'); break; } const multipleFiles = filenames.length > 1; let firstHeader = true; for (const filename of filenames) { const filePath = resolvePath(filename); const actualFilename = filePath[filePath.length - 1]; const parentDir = getDirFromPath(filePath); if (!parentDir || typeof parentDir !== 'object') { print(`head: cannot open '${filename}': No such file or directory`); continue; } const target = parentDir[actualFilename]; if (target === undefined) { print(`head: cannot open '${filename}': No such file or directory`); } else if (typeof target === 'object') { print(`head: error reading '${filename}': Is a directory`); } else { if (multipleFiles) { printHTML(`${firstHeader ? '' : '\n'}<span style="color:#a3be8c">==> ${filename.replace(/</g,'<')} <==</span>`); firstHeader = false; } const lines = target.split('\n'); const outputLines = lines.slice(0, lineCount); print(outputLines.join('\n')); } } break; }
            case 'grep': { /* grep logic */ let pattern = null; let filenames = []; let caseInsensitive = false; let argsCopy = [...args]; let patternFound = false; for (let i = 0; i < argsCopy.length; i++) { if (argsCopy[i] === '-i') { caseInsensitive = true; } else if (!patternFound) { pattern = argsCopy[i]; patternFound = true; } else { filenames.push(argsCopy[i]); } } filenames = filenames.filter(f => f !== '-i'); if (!pattern) { print('grep: usage: grep [-i] pattern [file ...]'); break; } if (filenames.length === 0) { print('grep: (Reading from stdin not supported)'); break; } const multipleFiles = filenames.length > 1; const searchPattern = caseInsensitive ? new RegExp(pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') : new RegExp(pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')); for (const filename of filenames) { const filePath = resolvePath(filename); const actualFilename = filePath[filePath.length - 1]; const parentDir = getDirFromPath(filePath); if (!parentDir || typeof parentDir !== 'object') { print(`grep: ${filename}: No such file or directory`); continue; } const target = parentDir[actualFilename]; if (target === undefined) { print(`grep: ${filename}: No such file or directory`); continue; } else if (typeof target === 'object') { print(`grep: ${filename}: Is a directory`); continue; } const lines = target.split('\n'); for (const line of lines) { if (line === '' && lines.indexOf(line) === lines.length - 1) continue; if (searchPattern.test(line)) { let outputHTML = ''; if (multipleFiles) { outputHTML += `<span style="color:#a3be8c">${filename.replace(/</g,'<')}</span>:`; } outputHTML += line.replace(/</g,'<').replace(searchPattern, `<span style="background-color:#bf616a; color:#2e3440">$&</span>`); printHTML(outputHTML); } } } break; }
            case 'nano': { const name = args[0]; if (name) { editingFile = resolvePath(name); openEditor(editingFile); } else { editingFile = null; openEditor(null); } return; }
            case 'clear': terminal.innerHTML = ''; break;
            case 'whoami': print('linux'); break;
            case 'hostname': print('linux-simulator'); break;
            case 'history': { if (commandHistory.length === 0) { print('No commands in history'); } else { commandHistory.slice().reverse().forEach((cmd, index) => { print(`${index + 1}  ${cmd}`); }); } break; }

            default: print(`${cmd}: command not found`);
        }
        if (!scriptState && !isTailFollowing && !isFromScript) { prompt(); } // Prompt only if direct command and nothing pending
    }


    // --- Editor (Nano Simulation) Functions ---
    function updateNanoStatus(message = '', timeout = 0) { const nanoMessageDiv = document.getElementById('nano-message'); if (!nanoMessageDiv) return; nanoMessageDiv.textContent = message; if (timeout > 0) { setTimeout(() => { if (nanoMessageDiv.textContent === message) { nanoMessageDiv.textContent = ''; } }, timeout); } }
    function updateNanoSearchInput() { const nanoMessageDiv = document.getElementById('nano-message'); if (!nanoMessageDiv) return; const cursorHTML = `<span class="cursor" style="background-color:#d8dee9;"> </span>`; const safeInput = nanoSearchTerm.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">"); nanoMessageDiv.innerHTML = `Search: ${safeInput}${cursorHTML}`; }
    function updateNanoGoToLineInput() { const nanoMessageDiv = document.getElementById('nano-message'); if (!nanoMessageDiv) return; const cursorHTML = `<span class="cursor" style="background-color:#d8dee9;"> </span>`; const safeInput = nanoGoToLineInput.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">"); nanoMessageDiv.innerHTML = `Go to line: ${safeInput}${cursorHTML}`; }
    function updateNanoMessageInput(promptText) { const nanoMessageDiv = document.getElementById('nano-message'); if (!nanoMessageDiv) return; const cursorHTML = `<span class="cursor" style="background-color:#d8dee9;"> </span>`; const safeInput = nanoFilenameInputString.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">"); nanoMessageDiv.innerHTML = promptText + safeInput + cursorHTML; }
    function performNanoSearch(forward = true) { if (!nanoSearchTerm) return; const content = editorTextarea.value; let startIndex = editorTextarea.selectionEnd; let foundIndex = content.indexOf(nanoSearchTerm, startIndex); if (foundIndex === -1) { startIndex = 0; foundIndex = content.indexOf(nanoSearchTerm, startIndex); } if (foundIndex !== -1) { editorTextarea.focus(); editorTextarea.setSelectionRange(foundIndex, foundIndex + nanoSearchTerm.length); const linesUpToMatch = content.substring(0, foundIndex).split('\n').length; const totalLines = content.split('\n').length; editorTextarea.scrollTop = Math.max(0, (linesUpToMatch - 5) / totalLines) * editorTextarea.scrollHeight; updateNanoStatus(`[ Found "${nanoSearchTerm}" ]`, 1500); nanoLastSearchIndex = foundIndex; } else { updateNanoStatus(`[ "${nanoSearchTerm}" not found ]`, 2000); nanoLastSearchIndex = -1; } isNanoSearching = false; /* Keep search term? nanoSearchTerm = ''; */ editorTextarea.focus(); }
    function performNanoGoToLine() { const lineNum = parseInt(nanoGoToLineInput); if (isNaN(lineNum) || lineNum <= 0) { updateNanoStatus(`[ Invalid line number ]`, 2000); } else { const lines = editorTextarea.value.split('\n'); if (lineNum > lines.length) { updateNanoStatus(`[ Line ${lineNum}/${lines.length}: End of file ]`, 2000); } else { let charIndex = 0; for(let i = 0; i < lineNum - 1; i++) { charIndex += lines[i].length + 1; } editorTextarea.focus(); editorTextarea.setSelectionRange(charIndex, charIndex); const totalLines = lines.length; editorTextarea.scrollTop = Math.max(0, (lineNum - 5) / totalLines) * editorTextarea.scrollHeight; updateNanoStatus(`[ Moved to line ${lineNum} ]`, 1500); } } isNanoGoingToLine = false; nanoGoToLineInput = ''; editorTextarea.focus();}
    function openEditor(pathArr) { let fileName = "New Buffer"; let initialContent = ""; const nanoFilenameSpan = document.getElementById('nano-filename'); const nanoMessageDiv = document.getElementById('nano-message'); if (pathArr) { if (pathArr.length === 1 && pathArr[0] === '/') { print('nano: /: Is a directory'); prompt(); return; } fileName = pathArr[pathArr.length - 1]; let parentDir = getDirFromPath(pathArr); let error = false; if (!parentDir) { print(`nano: Directory '${pathToString(pathArr.slice(0,-1))}' does not exist`); error = true; } else { const target = parentDir[fileName]; if (typeof target === 'string') { initialContent = target; } else if (target !== undefined) { print(`nano: '${fileName}' is a directory`); error = true; } else { initialContent = ''; } } if (error) { prompt(); return; } } nanoOriginalContent = initialContent; if (nanoFilenameSpan) nanoFilenameSpan.textContent = fileName; if (nanoMessageDiv) nanoMessageDiv.textContent = ''; editorTextarea.value = initialContent; editor.classList.remove('hidden'); editorTextarea.focus(); }
    function closeEditor() { console.log("closeEditor function called"); editor.classList.add('hidden'); editorTextarea.value = ''; editingFile = null; nanoOriginalContent = null; isPromptingNanoFilename = false; nanoFilenameInputString = ''; isNanoSearching = false; nanoSearchTerm = ''; isNanoGoingToLine = false; nanoGoToLineInput = ''; closeNanoAfterSave = false; prompt(); }

    // --- Input Handling & Event Listeners ---
    function updateTerminalInput() { const inputSpans = terminal.querySelectorAll('.input'); if (inputSpans.length === 0) return; const lastInput = inputSpans[inputSpans.length - 1]; const beforeNode = document.createTextNode(currentInput.substring(0, cursorPosition)); const afterNode = document.createTextNode(currentInput.substring(cursorPosition)); const cursorSpan = document.createElement('span'); cursorSpan.className = 'cursor'; lastInput.innerHTML = ''; lastInput.appendChild(beforeNode); lastInput.appendChild(cursorSpan); lastInput.appendChild(afterNode); lastInput.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    function updateCursorPosition() { updateTerminalInput(); }

    // Nano Editor Key Listener
    if (editorTextarea) { editorTextarea.addEventListener('keydown', function (e) {
        const nanoMessageDiv = document.getElementById('nano-message');
        let handleExitPromptKey; // Declare here for scoping

        // Define nano helpers needed by shortcuts (locally scoped)
        const performSave = (savePathArr, isNewFile = false) => { try { if (!savePathArr || !Array.isArray(savePathArr) || savePathArr.length < 1 || !savePathArr[savePathArr.length - 1]) { if (savePathArr && savePathArr.length === 1 && savePathArr[0] === '/') throw new Error("Cannot save root '/'"); else throw new Error("Invalid path"); } if (savePathArr.length === 1 && savePathArr[0] === '/') throw new Error("Cannot save root '/'"); const fileName = savePathArr[savePathArr.length - 1]; const parentDir = getDirFromPath(savePathArr); if (!parentDir) throw new Error(`Dir '${pathToString(savePathArr.slice(0,-1))}' not found`); if (parentDir[fileName] !== undefined && typeof parentDir[fileName] === 'object') throw new Error(`'${fileName}' is a directory`); const contentToSave = editorTextarea.value; parentDir[fileName] = contentToSave; editingFile = savePathArr; nanoOriginalContent = contentToSave; const nanoFilenameSpan = document.getElementById('nano-filename'); if (nanoFilenameSpan) nanoFilenameSpan.textContent = fileName; updateNanoStatus(`[ ${isNewFile ? "Wrote" : "Modified"} ${contentToSave.split('\n').length} lines ]`, 2500); editorTextarea.focus(); return true; } catch (error) { updateNanoStatus(`[ Save Error: ${error.message} ]`, 3500); editorTextarea.focus(); return false; } };
        const doCloseEditor = () => { console.log("doCloseEditor called"); isPromptingNanoFilename = false; nanoFilenameInputString = ''; isNanoSearching = false; nanoSearchTerm = ''; isNanoGoingToLine = false; nanoGoToLineInput = ''; closeNanoAfterSave = false; editorTextarea.removeEventListener('keydown', handleExitPromptKey); updateNanoStatus(''); closeEditor(); };
        const triggerSaveAndClose = () => { if (!editingFile) { if (nanoMessageDiv) { isPromptingNanoFilename = true; nanoFilenameInputString = ''; closeNanoAfterSave = true; updateNanoMessageInput("File Name to Write: "); editorTextarea.focus(); } else { console.error("No message div"); doCloseEditor(); } } else { if (performSave(editingFile, false)) doCloseEditor(); else editorTextarea.focus(); } };
        handleExitPromptKey = (promptEvent) => { if (promptEvent.ctrlKey || promptEvent.altKey || promptEvent.metaKey || promptEvent.key.length > 1 && promptEvent.key !== 'Escape') return; promptEvent.preventDefault(); const key = promptEvent.key.toLowerCase(); editorTextarea.removeEventListener('keydown', handleExitPromptKey); updateNanoStatus(''); if (key === 'y') { triggerSaveAndClose(); } else if (key === 'n') { doCloseEditor(); } else if (key === 'c' || promptEvent.key === 'Escape') { updateNanoStatus('[ Cancelled ]', 1500); editorTextarea.focus(); } else { updateNanoStatus('Save modified buffer? (Answer Y=Yes, N=No, C=Cancel)'); editorTextarea.addEventListener('keydown', handleExitPromptKey); } };


        // Input handlers for nano modes (check these first)
        if (isNanoSearching) { e.preventDefault(); if (e.key === 'Enter') { performNanoSearch(); } else if (e.key === 'Backspace') { if (nanoSearchTerm.length > 0) { nanoSearchTerm = nanoSearchTerm.slice(0, -1); updateNanoSearchInput(); } } else if (e.key === 'Escape' || (e.ctrlKey && e.key.toLowerCase() === 'c')) { isNanoSearching = false; nanoSearchTerm = ''; updateNanoStatus('[ Search cancelled ]', 1500); editorTextarea.focus(); } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { nanoSearchTerm += e.key; updateNanoSearchInput(); } return; }
        if (isNanoGoingToLine) { e.preventDefault(); if (e.key === 'Enter') { performNanoGoToLine(); } else if (e.key === 'Backspace') { if (nanoGoToLineInput.length > 0) { nanoGoToLineInput = nanoGoToLineInput.slice(0, -1); updateNanoGoToLineInput(); } } else if (e.key === 'Escape' || (e.ctrlKey && e.key.toLowerCase() === 'c')) { isNanoGoingToLine = false; nanoGoToLineInput = ''; updateNanoStatus('[ Go to Line cancelled ]', 1500); editorTextarea.focus(); } else if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) { nanoGoToLineInput += e.key; updateNanoGoToLineInput(); } return; }
        if (isPromptingNanoFilename) {
            e.preventDefault(); const promptText = "File Name to Write: ";
            if (e.key === 'Enter') {
                 const filename = nanoFilenameInputString.trim(); const closeAfter = closeNanoAfterSave;
                 isPromptingNanoFilename = false; nanoFilenameInputString = ''; closeNanoAfterSave = false; // Reset state FIRST
                 updateNanoStatus(''); // Clear prompt
                 if (filename) { const newPath = resolvePath(filename); const saveSuccess = performSave(newPath, true); if (saveSuccess && closeAfter) { doCloseEditor(); return; } else { editorTextarea.focus(); } }
                 else { updateNanoStatus('[ Save cancelled - No filename ]', 2000); editorTextarea.focus(); }
            } else if (e.key === 'Backspace') { if (nanoFilenameInputString.length > 0) { nanoFilenameInputString = nanoFilenameInputString.slice(0, -1); updateNanoMessageInput(promptText); } }
            else if (e.key === 'Escape' || (e.ctrlKey && e.key.toLowerCase() === 'c')) { isPromptingNanoFilename = false; nanoFilenameInputString = ''; closeNanoAfterSave = false; updateNanoStatus('[ Save cancelled ]', 2000); editorTextarea.focus(); }
            else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { nanoFilenameInputString += e.key; updateNanoMessageInput(promptText); }
            return;
        }

        // Nano command handlers
        if (e.ctrlKey && e.key.toLowerCase() === 'w') { e.preventDefault(); isNanoSearching = true; nanoSearchTerm = ''; updateNanoSearchInput(); editorTextarea.focus(); return; }
        if (e.ctrlKey && (e.key === '_' || e.key === '/')) { // Common bindings for Go To Line (Ctrl+_ or Ctrl+/)
             e.preventDefault();
             // Simple check to avoid triggering on Ctrl+Shift without '-' resulting in '_'
             if (e.key === '_' && !e.shiftKey) { /* Potentially ignore if not Ctrl+Shift+- */ }
             else {
                  isNanoGoingToLine = true; nanoGoToLineInput = ''; updateNanoGoToLineInput(); editorTextarea.focus();
             }
             return;
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'x') { e.preventDefault(); const isModified = (editorTextarea.value !== nanoOriginalContent); if (isModified) { if (nanoMessageDiv) { updateNanoStatus(''); nanoMessageDiv.appendChild(document.createTextNode("Save modified buffer? (Y/N/C) ")); editorTextarea.removeEventListener('keydown', handleExitPromptKey); editorTextarea.addEventListener('keydown', handleExitPromptKey); } else { doCloseEditor(); } } else { doCloseEditor(); } return; }
        if (e.ctrlKey && (e.key.toLowerCase() === 'o' || e.key === 'Ω')) { e.preventDefault(); if (!editingFile) { if (nanoMessageDiv) { isPromptingNanoFilename = true; nanoFilenameInputString = ''; closeNanoAfterSave = false; updateNanoMessageInput("File Name to Write: "); editorTextarea.focus(); } else { console.error("No message div!"); } } else { performSave(editingFile, false); } return; }
        if (e.ctrlKey && e.key.toLowerCase() === 'g') { e.preventDefault(); if (isPromptingNanoFilename || isNanoSearching || isNanoGoingToLine) { isPromptingNanoFilename=false; isNanoSearching=false; isNanoGoingToLine=false; nanoFilenameInputString=''; nanoSearchTerm=''; nanoGoToLineInput=''; closeNanoAfterSave=false; updateNanoStatus('[ Action Cancelled ]', 1500); editorTextarea.focus(); return; } updateNanoStatus("[ Help: ^O Save | ^X Exit | ^W Find | ^_ Go Line ]", 3000); return; }
        if (e.ctrlKey && ['r', 'y', 'k', 'j', 'v', 'u', 't'].includes(e.key.toLowerCase())) { e.preventDefault(); if (isPromptingNanoFilename || isNanoSearching || isNanoGoingToLine) { isPromptingNanoFilename=false; isNanoSearching=false; isNanoGoingToLine=false; nanoFilenameInputString=''; nanoSearchTerm=''; nanoGoToLineInput=''; closeNanoAfterSave=false; updateNanoStatus('[ Action Cancelled ]', 1500); editorTextarea.focus(); return; } updateNanoStatus(`[ ^${e.key.toUpperCase()} not implemented ]`, 2000); }

    }); } else { console.error("Editor textarea element not found..."); }

    // Main Terminal Key Listener
    document.addEventListener('keydown', (e) => {
        const isNanoModeActive = !editor.classList.contains('hidden');
        const isNanoPromptMode = isPromptingNanoFilename || isNanoSearching || isNanoGoingToLine;

        // If nano is active AND we are in a prompt mode, let the NANO listener handle it COMPLETELY
        if (isNanoModeActive && isNanoPromptMode) {
             return;
        }
        // If nano is active but NOT in a prompt mode, also let the nano listener handle it
        if (isNanoModeActive && document.activeElement === editorTextarea) {
             return;
        }
        // If nano is HIDDEN, or focus is elsewhere, handle terminal input
        if (!isNanoModeActive) {
            // Handle terminal input...
            if (e.key === 'Enter') { e.preventDefault(); const enteredInput = currentInput; currentInput = ''; cursorPosition = 0; if (scriptState) { const stateToResume = scriptState; scriptState = null; const inputSpans = terminal.querySelectorAll('.input'); if (inputSpans.length > 0) { const lastInputSpan = inputSpans[inputSpans.length - 1]; const textNode = document.createTextNode(enteredInput); lastInputSpan.parentNode.replaceChild(textNode, lastInputSpan); terminal.appendChild(document.createTextNode('\n')); terminal.scrollTop = terminal.scrollHeight; } stateToResume.variables[stateToResume.variableName] = enteredInput; const finished = executeScriptLines(stateToResume.remainingLines, stateToResume.variables); if (!finished && !isTailFollowing) { prompt(); } } else { handleCommand(enteredInput); } return; }
            if (e.key === 'Backspace') { e.preventDefault(); if (cursorPosition > 0) { currentInput = currentInput.substring(0, cursorPosition - 1) + currentInput.substring(cursorPosition); cursorPosition--; updateTerminalInput(); } return; }
            if (e.key === 'Tab') {
                e.preventDefault();
                const textBeforeCursor = currentInput.substring(0, cursorPosition);
                const wordsBeforeCursor = textBeforeCursor.split(/\s+/);
                const currentWordFragment = wordsBeforeCursor.pop() || '';
                const isFirstWord = wordsBeforeCursor.length === 0 && textBeforeCursor.indexOf(' ') === -1;
                let potentialMatches = [];
                let completionType = 'file';
                // Removed isScriptExec as it's handled implicitly now

                if (isFirstWord) { // Command completion logic (remains the same)
                    completionType = 'command';
                    const commandList = Object.keys(filesystem.bin || {}).concat(['help', 'pwd', 'ls', 'cd', 'touch', 'mkdir', 'echo', 'rmdir', 'rm', 'cat', 'cp', 'mv', 'head', 'grep', 'nano', 'clear', 'whoami', 'hostname', 'history', 'man', 'tail']);
                    const uniqueCommandList = [...new Set(commandList)];
                    potentialMatches = uniqueCommandList.filter(cmd => cmd.startsWith(currentWordFragment));
                } else { // Refined file/path completion logic
                    completionType = 'file';
                    let fullPathPrefix = ''; // The directory part user typed, e.g., "./", "documents/", "/etc/"
                    let partialName = currentWordFragment; // The part of the name after the last slash

                    const lastSlashIndex = currentWordFragment.lastIndexOf('/');

                    if (lastSlashIndex !== -1) {
                        // Path contains slashes (e.g., "documents/no", "/etc/ho", "./ex")
                        fullPathPrefix = currentWordFragment.substring(0, lastSlashIndex + 1);
                        partialName = currentWordFragment.substring(lastSlashIndex + 1);
                    } else {
                        // No slashes, the whole fragment is the partial name relative to CWD
                        // Keep fullPathPrefix empty ('')
                    }

                    // Determine the directory path string to resolve based on the prefix
                    // If prefix is empty or './', resolve '.', otherwise resolve the prefix
                    const dirToResolve = (fullPathPrefix === '' || fullPathPrefix === './') ? '.' : fullPathPrefix;
                    const targetDirPathArray = resolvePath(dirToResolve); // Array like ['/', 'home', 'linux'] or ['/', 'etc']
                    const dirObject = getObjectFromPath(targetDirPathArray); // Get the actual directory object

                    // console.log("Tab File Comp:", { currentWordFragment, fullPathPrefix, partialName, dirToResolve, targetDirPathArray, dirObject }); // Debug Log

                    if (dirObject && typeof dirObject === 'object') {
                        // Find entries in that directory starting with the partial name
                        potentialMatches = Object.keys(dirObject)
                            .filter(entry => entry.startsWith(partialName))
                            .map(match => fullPathPrefix + match); // Reconstruct the full potential match path
                    } else {
                        potentialMatches = [];
                    }
                } // End of refined file/path completion block

                // Handling matches logic (remains the same)
                if (potentialMatches.length === 1) {
                    let completion = potentialMatches[0];
                    let trailingSpace = ' ';
                    if (completionType === 'file') {
                        const completedPath = resolvePath(completion);
                        const completedObject = getObjectFromPath(completedPath);
                        if (completedObject && typeof completedObject === 'object') {
                            completion += '/';
                            trailingSpace = '';
                        } else {
                            trailingSpace = ' ';
                        }
                    }
                    const textAfterCursor = currentInput.substring(cursorPosition);
                    const startOfWordIndex = textBeforeCursor.length - currentWordFragment.length;
                    currentInput = textBeforeCursor.substring(0, startOfWordIndex) + completion + trailingSpace + textAfterCursor;
                    cursorPosition = startOfWordIndex + completion.length + trailingSpace.length;
                    updateTerminalInput();
                } else if (potentialMatches.length > 1) {
                    const commonPrefix = findLongestCommonPrefix(potentialMatches);
                    if (commonPrefix.length > currentWordFragment.length) {
                        const textAfterCursor = currentInput.substring(cursorPosition);
                        const startOfWordIndex = textBeforeCursor.length - currentWordFragment.length;
                        currentInput = textBeforeCursor.substring(0, startOfWordIndex) + commonPrefix + textAfterCursor;
                        cursorPosition = startOfWordIndex + commonPrefix.length;
                        updateTerminalInput();
                    }
                }
                return; // Handled Tab
            } // End of Tab handler block
            if (e.key === 'Delete') { e.preventDefault(); if (cursorPosition < currentInput.length) { currentInput = currentInput.substring(0, cursorPosition) + currentInput.substring(cursorPosition + 1); updateTerminalInput(); } return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); if (!scriptState && commandHistory.length > 0) { if (historyIndex < commandHistory.length - 1) { historyIndex++; currentInput = commandHistory[historyIndex]; cursorPosition = currentInput.length; updateTerminalInput(); } } return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); if (!scriptState && historyIndex >= 0) { historyIndex--; currentInput = (historyIndex === -1) ? '' : commandHistory[historyIndex]; cursorPosition = currentInput.length; updateTerminalInput(); } return; }
            if (e.key === 'ArrowLeft') { e.preventDefault(); if (cursorPosition > 0) { cursorPosition--; updateCursorPosition(); } return; }
            if (e.key === 'ArrowRight') { e.preventDefault(); if (cursorPosition < currentInput.length) { cursorPosition++; updateCursorPosition(); } return; }
            if (e.key === 'Home') { e.preventDefault(); cursorPosition = 0; updateCursorPosition(); return; }
            if (e.key === 'End') { e.preventDefault(); cursorPosition = currentInput.length; updateCursorPosition(); return; }
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); currentInput = currentInput.substring(0, cursorPosition) + e.key + currentInput.substring(cursorPosition); cursorPosition++; updateTerminalInput(); }
            else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                if (isTailFollowing) { isTailFollowing = false; print('^C'); prompt(); }
                else if (scriptState) { print('^C'); scriptState = null; currentInput = ''; cursorPosition = 0; prompt(); }
                else { const inputSpans = terminal.querySelectorAll('.input'); if (inputSpans.length > 0) { const lastInputSpan = inputSpans[inputSpans.length - 1]; const textNode = document.createTextNode(currentInput + '^C'); lastInputSpan.parentNode.replaceChild(textNode, lastInputSpan); terminal.appendChild(document.createTextNode('\n')); terminal.scrollTop = terminal.scrollHeight; } currentInput = ''; cursorPosition = 0; prompt(); }
                 return;
            }
        } // End of terminal input handling block
    }); // End of main keydown listener


    // --- Mobile Support ---
    function setupMobileSupport() { if (!isMobileDevice()) return; const virtualKeyboardBtn = document.createElement('button'); virtualKeyboardBtn.id = 'virtual-keyboard-btn'; virtualKeyboardBtn.className = 'virtual-keyboard-btn'; virtualKeyboardBtn.textContent = '⌨️'; document.body.appendChild(virtualKeyboardBtn); const virtualKeyboard = document.createElement('div'); virtualKeyboard.id = 'virtual-keyboard'; virtualKeyboard.className = 'virtual-keyboard hidden'; document.body.appendChild(virtualKeyboard); const commonKeys = ['Tab', 'Ctrl', 'Alt', 'Esc', '↑', '↓', '←', '→', '|', '/', '.', '-', '_', '$']; commonKeys.forEach(key => { const keyButton = document.createElement('button'); keyButton.className = 'virtual-key'; keyButton.textContent = key; keyButton.setAttribute('data-key', key); virtualKeyboard.appendChild(keyButton); keyButton.addEventListener('click', (e) => { e.preventDefault(); handleVirtualKeyPress(key); if (isMobileDevice()) showMobileInput(); }); }); virtualKeyboardBtn.addEventListener('click', () => { virtualKeyboard.classList.toggle('hidden'); }); const mobileInput = document.createElement('input'); mobileInput.type = 'text'; mobileInput.id = 'mobile-input'; mobileInput.className = 'mobile-input'; mobileInput.setAttribute('autocorrect', 'off'); mobileInput.setAttribute('autocapitalize', 'none'); mobileInput.setAttribute('spellcheck', 'false'); document.body.appendChild(mobileInput); terminal.addEventListener('click', (e) => { if (editor.classList.contains('hidden')) { if (e.target.closest('.prompt') || e.target.closest('.input')) { if (isMobileDevice()) showMobileInput(); } else { if (isMobileDevice()) showMobileInput(); } } }); mobileInput.addEventListener('input', (e) => { const value = e.target.value; if (value) { currentInput = currentInput.substring(0, cursorPosition) + value + currentInput.substring(cursorPosition); cursorPosition += value.length; updateTerminalInput(); e.target.value = ''; } }); mobileInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const enteredInput = currentInput; currentInput = ''; cursorPosition = 0; if (scriptState) { const stateToResume = scriptState; scriptState = null; const inputSpans = terminal.querySelectorAll('.input'); if (inputSpans.length > 0) { const lastInputSpan = inputSpans[inputSpans.length - 1]; const textNode = document.createTextNode(enteredInput); lastInputSpan.parentNode.replaceChild(textNode, lastInputSpan); terminal.appendChild(document.createTextNode('\n')); terminal.scrollTop = terminal.scrollHeight; } stateToResume.variables[stateToResume.variableName] = enteredInput; const finished = executeScriptLines(stateToResume.remainingLines, stateToResume.variables); if (!finished && !isTailFollowing) prompt(); } else { handleCommand(enteredInput); } } else if (e.key === 'Backspace') { if (cursorPosition > 0) { if (mobileInput.value === '') { e.preventDefault(); currentInput = currentInput.substring(0, cursorPosition - 1) + currentInput.substring(cursorPosition); cursorPosition--; updateTerminalInput(); } } else { e.preventDefault(); } } }); }
    function showMobileInput() { const mobileInput = document.getElementById('mobile-input'); if (mobileInput) mobileInput.focus(); }
    function handleVirtualKeyPress(key) { const eventData = { key: key, ctrlKey: false, altKey: false, metaKey: false, preventDefault: () => {} }; switch(key) { case 'Tab': case 'Esc': case '↑': eventData.key = 'ArrowUp'; break; case '↓': eventData.key = 'ArrowDown'; break; case '←': eventData.key = 'ArrowLeft'; break; case '→': eventData.key = 'ArrowRight'; break; case 'Ctrl': return; case 'Alt': return; default: currentInput = currentInput.substring(0, cursorPosition) + key + currentInput.substring(cursorPosition); cursorPosition++; updateTerminalInput(); return; } if (eventData.key === 'ArrowUp') { if (!scriptState && commandHistory.length > 0 && historyIndex < commandHistory.length - 1) { historyIndex++; currentInput = commandHistory[historyIndex]; cursorPosition = currentInput.length; updateTerminalInput(); } } else if (eventData.key === 'ArrowDown') { if (!scriptState && historyIndex >= 0) { historyIndex--; currentInput = (historyIndex === -1) ? '' : commandHistory[historyIndex]; cursorPosition = currentInput.length; updateTerminalInput(); } } else if (eventData.key === 'ArrowLeft') { if (cursorPosition > 0) { cursorPosition--; updateCursorPosition(); } } else if (eventData.key === 'ArrowRight') { if (cursorPosition < currentInput.length) { cursorPosition++; updateCursorPosition(); } } else if (eventData.key === 'Tab') { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })); } else if (eventData.key === 'Esc') { currentInput = ''; cursorPosition = 0; updateTerminalInput(); } }
    function isMobileDevice() { return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0); }

    // --- Initialization ---
    function initTerminal() {
        initFilesystem();
        currentPath = ['/', 'home', 'linux'];
        print('Welcome to the Linux Training Terminal');
        print(`Type "help" for available commands.`);
        print('Version 1.4');
        print('');
        setupMobileSupport();
        prompt();
    }
    initTerminal();

}); // End of DOMContentLoaded listener
// <<<<< END OF FULL terminal.js >>>>>