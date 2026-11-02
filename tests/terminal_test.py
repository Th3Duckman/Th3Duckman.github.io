"""Focused terminal audit; can run against localhost or the published site."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('PORTFOLIO_URL', 'http://127.0.0.1:3000')
OUT = Path('/tmp/portfolio-checks')
OUT.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    results = []
    for width in [1440, 390]:
        context = browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion='reduce')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until='networkidle')
        opener = page.get_by_role('button', name='Terminal >_', exact=True)

        def command(value):
            field = page.locator('#terminal-input')
            field.fill(value)
            field.press('Enter')

        opener.click()
        field = page.locator('#terminal-input')
        expect(field).to_be_focused()
        commands = {
            'help': 'Commands: about, skills, projects, guardian, contact, github, clear, exit',
            'about': 'Achilleas Botsidis',
            'skills': 'C# / .NET · Java',
            'projects': 'Basic Converter',
            'contact': 'axilleasgrachilles@gmail.com',
            'github': 'github.com/Th3Duckman',
            '  HELP  ': 'Commands:',
            'whoami': 'Welcome.',
            'sudo': 'Permission granted to keep learning.',
            'does-not-exist': 'Unknown command: does-not-exist',
        }
        for value, expected in commands.items():
            command(value)
            expect(page.locator('#terminal-output > p').last).to_contain_text(expected)
            expect(field).to_be_focused()

        # Whitespace is harmless; shell-looking and HTML input stays literal text.
        before = page.locator('#terminal-output > p').count()
        command('   ')
        assert page.locator('#terminal-output > p').count() == before
        for value in ['<img src=x onerror=alert(1)>', '__proto__', 'constructor', '$(whoami); rm -rf /']:
            command(value)
            expect(page.locator('#terminal-output > p').last).to_contain_text('Unknown command:')
        assert page.locator('#terminal-output img, #terminal-output script').count() == 0

        # History stops at its boundaries and supports going back to a blank prompt.
        command('about')
        command('skills')
        field.press('ArrowUp')
        expect(field).to_have_value('skills')
        field.press('ArrowUp')
        expect(field).to_have_value('about')
        field.press('ArrowDown')
        expect(field).to_have_value('skills')
        field.press('ArrowDown')
        expect(field).to_have_value('')
        field.press('ArrowDown')
        expect(field).to_have_value('')

        # Long sessions remain bounded, scrollable, and keep the prompt on-screen.
        for i in range(35):
            command(f'unknown-{i}')
        assert page.locator('#terminal-output > p').count() == 30
        assert page.locator('#terminal-output').evaluate('(el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2')
        rect = field.bounding_box()
        assert rect and rect['y'] >= 0 and rect['y'] + rect['height'] <= 900
        assert page.locator('#detail-dialog').evaluate('(el) => el.scrollWidth <= el.clientWidth + 1')
        command('clear')
        expect(page.locator('#terminal-output')).to_be_empty()
        command('help')
        page.screenshot(path=str(OUT / f'terminal-{width}.png'))

        # Command transition to Guardian and Escape restore the original trigger.
        command('guardian')
        expect(page.locator('#detail-title')).to_have_text('Guardian.')
        expect(page.locator('#guardian-interval')).to_be_focused()
        page.locator('#guardian-interval').fill('1')
        page.get_by_role('button', name='Run preview').click()
        expect(page.locator('#demo-rounds')).to_have_text('1', timeout=7000)
        page.keyboard.press('Escape')
        expect(opener).to_be_focused()
        opener.click()
        command('exit')
        expect(page.locator('#detail-dialog')).not_to_be_visible()
        expect(opener).to_be_focused()

        # All three launch routes work, and the native modal traps keyboard focus.
        page.get_by_role('button', name="Open the portfolio's interactive terminal", exact=True).click()
        expect(page.locator('#terminal-input')).to_be_focused()
        page.keyboard.press('Tab')
        assert page.evaluate("document.querySelector('#detail-dialog').contains(document.activeElement)")
        page.keyboard.press('Escape')
        page.keyboard.press('Control+k')
        page.locator('#command-input').fill('terminal')
        page.keyboard.press('Enter')
        expect(page.locator('#terminal-input')).to_be_focused()
        command('help')
        expect(page.locator('#terminal-output')).to_contain_text('Commands:')
        page.keyboard.press('Escape')
        assert not errors, errors
        results.append({'width': width, 'commands': len(commands), 'history': 'passed', 'guardian_transition': 'passed', 'errors': errors})
        context.close()
    browser.close()
    print(json.dumps({'result': 'PASS', 'url': BASE, 'terminal_checks': results}, indent=2))
