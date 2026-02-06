# Linear CLI Commands (from `linear completions bash`)

## Global options

- `-h`, `--help`: show help
- `-V`, `--version`: show version

## Top-level commands

- `auth`: manage authentication
- `issue` (alias `i`): manage issues
- `team` (alias `t`): manage teams
- `project` (alias `p`): manage projects
- `completions`: generate shell completions
- `config`: interactively generate `.linear.toml`
- `schema`: print the GraphQL schema

## auth

- `linear auth token`: print configured API token
- `linear auth whoami`: print authenticated user info

## issue

- `linear issue id`: show the issue ID for the current branch
- `linear issue list`: list issues
- `linear issue title`: show the title for the current branch
- `linear issue start`: start work on an issue
- `linear issue view`: view issue details
- `linear issue url`: print issue URL
- `linear issue describe`: describe issue references
- `linear issue commits`: list commits for issue
- `linear issue pull-request`: create or open a pull request for the issue
- `linear issue delete`: delete an issue
- `linear issue create`: create an issue
- `linear issue update`: update an issue
- `linear issue comment`: manage comments

## issue list flags

- `linear issue list`: `-s --state`, `--all-states`, `--assignee`, `-A --all-assignees`, `-U --unassigned`, `--sort`, `--team`, `--limit`, `-w --web`, `-a --app`, `--no-pager`

## issue start flags

- `linear issue start`: `-A --all-assignees`, `-U --unassigned`, `-f --from-ref`, `-b --branch`

## issue view flags

- `linear issue view`: `-w --web`, `-a --app`, `--no-comments`, `--no-pager`, `-j --json`, `--no-download`

## issue describe flags

- `linear issue describe`: `-r --references --ref`

## issue pull-request flags

- `linear issue pull-request`: `--base`, `--draft`, `-t --title`, `--web`, `--head`

## issue delete flags

- `linear issue delete`: `-y --confirm`

## issue create flags

- `linear issue create`: `--start`, `-a --assignee`, `--due-date`, `-p --parent`, `--priority`, `--estimate`, `-d --description`, `-l --label`, `--team`, `--project`, `-s --state`, `--no-use-default-template`, `--no-color`, `--no-interactive`, `-t --title`

## issue update flags

- `linear issue update`: `-a --assignee`, `--due-date`, `-p --parent`, `--priority`, `--estimate`, `-d --description`, `-l --label`, `--team`, `--project`, `-s --state`, `--no-color`, `-t --title`

## issue comment

- `linear issue comment add`: `-b --body`, `-p --parent`
- `linear issue comment update`: `-b --body`
- `linear issue comment list`: `-j --json`

## team

- `linear team create`: `-n --name`, `-d --description`, `-k --key`, `--private`, `--no-color`, `--no-interactive`
- `linear team list`: `-w --web`, `-a --app`
- `linear team id`: show team ID
- `linear team autolinks`: show team autolinks
- `linear team members`: `-a --all`

## project

- `linear project list`: `--team`, `--all-teams`, `--status`, `-w --web`, `-a --app`
- `linear project view`: `-w --web`, `-a --app`

## completions

- `linear completions bash`: `-n --name`
- `linear completions fish`: `-n --name`
- `linear completions zsh`: `-n --name`

## schema

- `linear schema`: `--json`, `-o --output`
