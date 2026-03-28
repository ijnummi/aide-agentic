# Feature: Git Sidebar

## Overview

The git sidebar panel displays the current branch, working tree changes, a commit form, and a log of recent commits. Users can stage files, commit changes, and click commits to view their diffs in a tab.

## Entry points

- **Activity bar:** click the Git icon (branch icon) to open the git sidebar panel
- **Keyboard:** Ctrl+B toggles the sidebar; no dedicated shortcut for the git panel specifically
- **Automatic:** git status and commit log refresh on a polling interval and after every git operation (stage, commit, checkout)

## Behaviors

### Sidebar shows current branch and file changes

Starting from: a workspace with a git repo on branch `master` and one unstaged modified file
When the user: clicks the Git panel in the activity bar
Then:
  - the sidebar header shows "Git"
  - the current branch name is displayed (e.g. "master")
  - the Changes section lists the modified file with its filename and status badge (M)

### Staging files moves them to the staged section

Starting from: the git sidebar is open with at least one unstaged file
When the user: clicks the "Stage All" button in the Changes section header
Then:
  - the file moves from the Changes section to a new Staged section
  - the Staged section header shows the count of staged files
  - the Commit button becomes enabled (showing the staged count)

### Committing clears staged changes

Starting from: the git sidebar has at least one staged file
When the user: types a commit message and clicks the Commit button
Then:
  - the staged files are committed
  - both the Staged and Changes sections disappear
  - "Working tree clean" is displayed
  - the commit log updates to include the new commit

### Sidebar shows recent commits with stats

Starting from: a workspace with a git repo containing at least 3 commits
When the user: opens the git sidebar panel
Then:
  - a "Commits" section appears below the commit form
  - each commit shows its message, short hash, and relative timestamp
  - hovering a commit shows a tooltip with full hash, author, date, and file stats (files changed, insertions, deletions)

### Clicking a commit opens its diff in a tab

Starting from: the commit log is visible with at least one commit
When the user: clicks a commit entry in the log
Then:
  - a diff tab opens in the active pane showing the commit's changes
  - the tab title contains the short hash and commit message (truncated to 40 characters)
  - clicking a different commit replaces the existing commit diff tab (only one at a time)
  - the "All Changes" tab can coexist with the commit diff tab

## Edge cases

### Clean working tree shows no change sections

Starting from: a workspace with a git repo where all changes are committed
When the user: opens the git sidebar panel
Then:
  - "Working tree clean" is displayed
  - no Staged, Changes, or Untracked sections are shown
  - the commit log is still visible

### Repository with no commits

Starting from: a workspace with a newly initialized git repo (git init, no commits)
When the user: opens the git sidebar panel
Then:
  - the branch name is displayed
  - no Commits section is shown (empty log)
  - untracked files are listed if present

## Out of scope

- Commit search or filtering
- Interactive rebase from the commit log
- Viewing commits from branches other than the current one
- Push and pull operations
- Merge conflict resolution UI
- Stash management
