# Claude Code Notification Sounds

This directory contains hooks for playing notification sounds when Claude Code events occur.

## Current Configuration

The notification sound hook is configured to play sounds for:
- **Permission prompts** - When Claude needs your approval to execute a tool
- **Idle prompts** - When Claude is waiting for your input

## Files

- `notification-sound.cmd` - Windows script that plays notification sounds
- `sounds/` - Directory for custom sound files (optional)

## Customization

### Using Custom Sound Files

1. Add your custom `.wav` sound files to the `sounds/` directory:
   ```
   .claude/hooks/sounds/
   ├── notification.wav
   ├── success.wav
   └── error.wav
   ```

2. Edit `notification-sound.cmd` and uncomment the custom sound line:
   ```batch
   powershell -Command "Add-Type -AssemblyName System.Media; (New-Object System.Media.SoundPlayer '%~dp0sounds\notification.wav').PlaySync()"
   ```

3. You can create different scripts for different notification types:
   - `permission-alert.cmd` - For permission prompts
   - `idle-alert.cmd` - For idle notifications
   - `success-alert.cmd` - For successful operations

### Available Notification Types

You can configure sounds for these notification matchers:
- `permission_prompt` - When tool permission is needed
- `idle_prompt` - When waiting for user input
- `auth_success` - When authentication succeeds
- `elicitation_dialog` - For other dialogs

### Example: Different Sounds for Different Events

Edit `.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/permission-alert.cmd",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "idle_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/idle-alert.cmd",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

## Managing Hooks

Use the `/hooks` command in Claude Code to:
- View all configured hooks
- Enable/disable hooks
- Test hooks
- Add new hooks interactively

## Free Sound Resources

Download notification sounds from:
- [Mixkit](https://mixkit.co/free-sound-effects/notification/) - Free notification sounds
- [Freesound](https://freesound.org/) - Creative Commons sounds
- [Zapsplat](https://www.zapsplat.com/) - Free sound effects

## Troubleshooting

- **Sound not playing?** Check that the script has proper permissions
- **Script timing out?** Increase the `timeout` value in settings.json
- **Want to disable?** Use `/hooks` command or remove from settings.json

## Windows System Sounds

The default configuration uses Windows system beep. Other system sounds you can use:

```batch
[System.Media.SystemSounds]::Asterisk.Play()
[System.Media.SystemSounds]::Beep.Play()
[System.Media.SystemSounds]::Exclamation.Play()
[System.Media.SystemSounds]::Hand.Play()
[System.Media.SystemSounds]::Question.Play()
```
