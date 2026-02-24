# Linear CLI Commands (from `linear completions bash`)

> Version: linear v1.9.1-inj.2

## Global options

- `-h`, `--help`: show help
- `-V`, `--version`: show version
- `-w`, `--workspace`: specify workspace
- `-j`, `--json`: output JSON

## Top-level commands

- `auth`: manage authentication
- `issue` (alias `i`): manage issues
- `team` (alias `t`): manage teams
- `project` (alias `p`): manage projects
- `project-update`: manage project updates
- `milestone`: manage milestones
- `initiative`: manage initiatives
- `initiative-update`: manage initiative updates
- `label`: manage labels
- `document`: manage documents
- `completions`: generate shell completions
- `config`: interactively generate `.linear.toml`
- `schema`: print the GraphQL schema

---

## auth

### Commands
- `linear auth login`: login to Linear (`-k --key`)
- `linear auth logout`: logout from Linear (`-f --force`)
- `linear auth list`: list authenticated workspaces
- `linear auth default`: set default workspace
- `linear auth token`: print configured API token
- `linear auth whoami`: print authenticated user info

---

## issue

### Commands
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
- `linear issue attach`: attach a file to an issue
- `linear issue relation`: manage issue relations

### issue list flags
- `-s --state`: filter by state
- `--all-states`: show all states
- `--assignee`: filter by assignee
- `-A --all-assignees`: show all assignees
- `-U --unassigned`: show unassigned only
- `--sort`: sort order
- `--team`: filter by team
- `--project`: filter by project
- `--limit`: limit results
- `-w --web`: open in web
- `-a --app`: open in app
- `--no-pager`: disable pager

### issue start flags
- `-A --all-assignees`: show all assignees
- `-U --unassigned`: show unassigned only
- `-f --from-ref`: start from reference
- `-b --branch`: specify branch name

### issue view flags
- `-w --web`: open in web
- `-a --app`: open in app
- `--no-comments`: hide comments
- `--no-pager`: disable pager
- `-j --json`: output JSON
- `--no-download`: don't download content

### issue describe flags
- `-r --references --ref`: show references

### issue pull-request flags
- `--base`: base branch
- `--draft`: create as draft
- `-t --title`: PR title
- `--web`: open in web
- `--head`: head branch

### issue delete flags
- `-y --confirm`: confirm deletion
- `--bulk`: bulk delete
- `--bulk-file`: bulk delete from file
- `--bulk-stdin`: bulk delete from stdin

### issue create flags
- `--start`: start work immediately
- `-a --assignee`: assignee
- `--due-date`: due date
- `-p --parent`: parent issue
- `--priority`: priority level
- `--estimate`: estimate
- `-d --description`: description
- `-l --label`: label
- `--team`: team
- `--project`: project
- `-s --state`: state
- `--no-use-default-template`: don't use default template
- `--no-interactive`: non-interactive mode
- `-t --title`: title

### issue update flags
- `-a --assignee`: assignee
- `-u --unassign`: unassign
- `--due-date`: due date
- `-p --parent`: parent issue
- `--priority`: priority level
- `--estimate`: estimate
- `-d --description`: description
- `-l --label`: label
- `--team`: team
- `--project`: project
- `-s --state`: state
- `-t --title`: title

### issue comment commands
- `linear issue comment add`: add comment (`-b --body`, `-p --parent`, `-a --attach`)
- `linear issue comment update`: update comment (`-b --body`)
- `linear issue comment list`: list comments (`-j --json`)

### issue attach flags
- `-t --title`: attachment title
- `-c --comment`: comment ID to attach to

### issue relation commands
- `linear issue relation add`: add relation
- `linear issue relation delete`: delete relation
- `linear issue relation list`: list relations

---

## team

### Commands
- `linear team create`: create a team
- `linear team delete`: delete a team
- `linear team list`: list teams
- `linear team id`: show team ID
- `linear team autolinks`: show team autolinks
- `linear team members`: list team members

### team create flags
- `-n --name`: team name
- `-d --description`: description
- `-k --key`: team key
- `--private`: make private
- `--no-interactive`: non-interactive mode

### team delete flags
- `--move-issues`: move issues to team
- `-y --force`: force deletion

### team list flags
- `-w --web`: open in web
- `-a --app`: open in app

### team members flags
- `-a --all`: show all members
- `-o --organization`: show organization members

---

## project

### Commands
- `linear project list`: list projects
- `linear project view`: view project
- `linear project create`: create a project

### project list flags
- `--team`: filter by team
- `--all-teams`: show all teams
- `--status`: filter by status
- `-w --web`: open in web
- `-a --app`: open in app

### project view flags
- `-w --web`: open in web
- `-a --app`: open in app

### project create flags
- `-n --name`: project name
- `-d --description`: description
- `-t --team`: team
- `-l --lead`: project lead
- `-s --status`: status
- `--start-date`: start date
- `--target-date`: target date
- `--initiative`: initiative
- `-i --interactive`: interactive mode

---

## project-update

### Commands
- `linear project-update create`: create project update
- `linear project-update list`: list project updates

### project-update create flags
- `--body`: update body
- `--body-file`: body from file
- `--health`: health status
- `-i --interactive`: interactive mode

### project-update list flags
- `--json`: output JSON
- `--limit`: limit results

---

## milestone

### Commands
- `linear milestone list`: list milestones
- `linear milestone view`: view milestone
- `linear milestone create`: create milestone
- `linear milestone update`: update milestone
- `linear milestone delete`: delete milestone

### milestone list flags
- `--project`: filter by project

### milestone create flags
- `--project`: project
- `--name`: milestone name
- `--description`: description
- `--target-date`: target date

### milestone update flags
- `--name`: new name
- `--description`: new description
- `--target-date`: new target date
- `--sort-order`: sort order
- `--project`: project

### milestone delete flags
- `-f --force`: force deletion

---

## initiative

### Commands
- `linear initiative list`: list initiatives
- `linear initiative view`: view initiative
- `linear initiative create`: create initiative
- `linear initiative archive`: archive initiative
- `linear initiative update`: update initiative
- `linear initiative unarchive`: unarchive initiative
- `linear initiative delete`: delete initiative
- `linear initiative add-project`: add project to initiative
- `linear initiative remove-project`: remove project from initiative

### initiative list flags
- `-s --status`: filter by status
- `--all-statuses`: show all statuses
- `-o --owner`: filter by owner
- `-w --web`: open in web
- `-a --app`: open in app
- `-j --json`: output JSON
- `--archived`: show archived

### initiative view flags
- `-w --web`: open in web
- `-a --app`: open in app
- `-j --json`: output JSON

### initiative create flags
- `-n --name`: initiative name
- `-d --description`: description
- `-s --status`: status
- `-o --owner`: owner
- `--target-date`: target date
- `-c --color`: color
- `--icon`: icon
- `-i --interactive`: interactive mode

### initiative archive flags
- `-y --force`: force archive
- `--bulk`: bulk archive
- `--bulk-file`: bulk from file
- `--bulk-stdin`: bulk from stdin

### initiative update flags
- `-n --name`: new name
- `-d --description`: new description
- `--status`: new status
- `--owner`: new owner
- `--target-date`: new target date
- `--color`: new color
- `--icon`: new icon
- `-i --interactive`: interactive mode

### initiative unarchive flags
- `-y --force`: force unarchive

### initiative delete flags
- `-y --force`: force deletion
- `--bulk`: bulk delete
- `--bulk-file`: bulk from file
- `--bulk-stdin`: bulk from stdin

### initiative add-project flags
- `--sort-order`: sort order

### initiative remove-project flags
- `-y --force`: force removal

---

## initiative-update

### Commands
- `linear initiative-update create`: create initiative update
- `linear initiative-update list`: list initiative updates

### initiative-update create flags
- `--body`: update body
- `--body-file`: body from file
- `--health`: health status
- `-i --interactive`: interactive mode

### initiative-update list flags
- `-j --json`: output JSON
- `--limit`: limit results

---

## label

### Commands
- `linear label list`: list labels
- `linear label create`: create label
- `linear label delete`: delete label

### label list flags
- `--team`: filter by team
- `--workspace`: show workspace labels
- `--all`: show all labels
- `-j --json`: output JSON

### label create flags
- `-n --name`: label name
- `-c --color`: label color
- `-d --description`: description
- `-t --team`: team
- `-i --interactive`: interactive mode

### label delete flags
- `-t --team`: team
- `-f --force`: force deletion

---

## document

### Commands
- `linear document list`: list documents
- `linear document view`: view document
- `linear document create`: create document
- `linear document update`: update document
- `linear document delete`: delete document

### document list flags
- `--project`: filter by project
- `--issue`: filter by issue
- `--json`: output JSON
- `--limit`: limit results

### document view flags
- `--raw`: show raw content
- `-w --web`: open in web
- `--json`: output JSON

### document create flags
- `-t --title`: document title
- `-c --content`: content
- `-f --content-file`: content from file
- `--project`: project
- `--issue`: issue
- `--icon`: icon
- `-i --interactive`: interactive mode

### document update flags
- `-t --title`: new title
- `-c --content`: new content
- `-f --content-file`: content from file
- `--icon`: new icon
- `-e --edit`: open in editor

### document delete flags
- `-y --yes`: confirm deletion
- `--bulk`: bulk delete
- `--bulk-file`: bulk from file
- `--bulk-stdin`: bulk from stdin

---

## completions

- `linear completions bash`: generate bash completions (`-n --name`)
- `linear completions fish`: generate fish completions (`-n --name`)
- `linear completions zsh`: generate zsh completions (`-n --name`)

---

## schema

- `linear schema`: print GraphQL schema
  - `--json`: output JSON
  - `-o --output`: output file

---

## config

- `linear config`: interactively generate `.linear.toml`
