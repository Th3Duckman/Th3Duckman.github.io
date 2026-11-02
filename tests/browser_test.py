"""Functional browser checks. Requires a running development server and Playwright."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect

OUTPUT = Path('/tmp/portfolio-checks')
OUTPUT.mkdir(exist_ok=True)
BASE = 'http://127.0.0.1:3000'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
    context.grant_permissions(['clipboard-read', 'clipboard-write'])
    page = context.new_page()
    errors, failed_responses = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: failed_responses.append(f'{response.status} {response.url}') if response.url.startswith(BASE) and response.status >= 400 else None)
    page.goto(BASE, wait_until='networkidle')
    expect(page.get_by_role('heading', level=1)).to_contain_text('Thoughtful code.')
    expect(page.locator('.intro-line')).to_contain_text('JAVA')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUTPUT / 'desktop.png'), full_page=True)

    # Shape controls change the renderer, including while paused.
    initial = page.locator('#core-canvas').evaluate('(c) => c.toDataURL()')
    page.get_by_role('button', name='Pause animations', exact=True).click()
    page.get_by_role('button', name='CUBE', exact=True).click()
    expect(page.get_by_role('button', name='CUBE', exact=True)).to_have_attribute('aria-pressed', 'true')
    assert initial != page.locator('#core-canvas').evaluate('(c) => c.toDataURL()')
    page.get_by_role('button', name='Resume animations', exact=True).click()

    # Command search, no-results state, keyboard selection and modal focus.
    page.keyboard.press('Control+k')
    expect(page.locator('#command-dialog')).to_be_visible()
    expect(page.locator('#command-input')).to_be_focused()
    page.locator('#command-input').fill('no such command')
    expect(page.locator('#command-empty')).to_be_visible()
    page.locator('#command-input').fill('terminal')
    page.keyboard.press('Enter')
    expect(page.locator('#detail-title')).to_have_text('Behind the interface.')
    expect(page.locator('#command-dialog')).not_to_be_visible()
    expect(page.locator('#terminal-input')).to_be_focused()
    page.locator('#terminal-input').fill('skills')
    page.locator('#terminal-input').press('Enter')
    expect(page.locator('#terminal-output')).to_contain_text('C# / .NET · Java')
    page.locator('#terminal-input').press('ArrowUp')
    expect(page.locator('#terminal-input')).to_have_value('skills')
    page.locator('#terminal-input').fill('<img src=x onerror=alert(1)>')
    page.locator('#terminal-input').press('Enter')
    assert page.locator('#terminal-output img').count() == 0
    page.locator('#terminal-input').fill('clear')
    page.locator('#terminal-input').press('Enter')
    expect(page.locator('#terminal-output')).to_be_empty()
    page.locator('#terminal-input').fill('exit')
    page.locator('#terminal-input').press('Enter')
    expect(page.locator('#detail-dialog')).not_to_be_visible()

    # Guardian's invalid-input path, completion, persistence and reset.
    page.get_by_role('button', name='Explore the project').click()
    interval = page.locator('#guardian-interval')
    interval.fill('-5')
    page.get_by_role('button', name='Run preview').click()
    expect(interval).to_have_attribute('aria-invalid', 'true')
    expect(page.locator('#guardian-output')).to_contain_text('positive whole number')
    page.get_by_role('button', name='Reset demo', exact=True).click()
    interval.fill('25')
    page.get_by_role('button', name='Run preview').click()
    expect(page.get_by_role('button', name='Run preview')).to_be_disabled()
    expect(page.locator('#demo-rounds')).to_have_text('1', timeout=7000)
    expect(page.locator('#guardian-output')).to_contain_text('Round complete')
    page.keyboard.press('Escape')
    expect(page.get_by_role('button', name='Explore the project')).to_be_focused()
    page.reload(wait_until='networkidle')
    page.get_by_role('button', name='Explore the project').click()
    expect(page.locator('#demo-rounds')).to_have_text('1')
    page.get_by_role('button', name='Reset demo', exact=True).click()
    expect(page.locator('#demo-rounds')).to_have_text('0')
    page.keyboard.press('Escape')

    # Real copy/download flows rather than decorative buttons.
    page.get_by_role('button', name='Copy email address', exact=True).click()
    expect(page.locator('.toast')).to_contain_text('copied')
    assert page.evaluate('navigator.clipboard.readText()') == 'axilleasgrachilles@gmail.com'
    with page.expect_download() as download_info:
        page.get_by_role('link', name='Download CV', exact=False).first.click()
    download = download_info.value
    assert download.suggested_filename == 'Achilleas_Botsidis_CV.pdf'
    assert Path(download.path()).read_bytes().startswith(b'%PDF')
    page.screenshot(path=str(OUTPUT / 'desktop-after-interactions.png'), full_page=True)

    # Mobile menu and layout at narrow and typical phone widths.
    for width in [360, 390, 768, 1024]:
        page.set_viewport_size({'width': width, 'height': 844})
        page.goto(BASE, wait_until='networkidle')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'overflow at {width}px'
        if width < 761:
            toggle = page.get_by_role('button', name='Open navigation', exact=True)
            toggle.click()
            expect(page.locator('#mobile-nav')).to_be_visible()
            page.locator('#mobile-nav a[href="#about"]').click()
            expect(page.locator('#mobile-nav')).not_to_be_visible()
            page.get_by_role('button', name='Open command menu', exact=True).click()
            page.locator('#command-input').fill('guardian')
            page.keyboard.press('Enter')
            expect(page.locator('#guardian-interval')).to_be_visible()
            page.keyboard.press('Escape')
        if width == 390:
            page.goto(BASE, wait_until='networkidle')
            page.screenshot(path=str(OUTPUT / 'mobile.png'), full_page=True)

    # Motion preference and storage failure do not break the content or demos.
    page.emulate_media(reduced_motion='reduce')
    page.reload(wait_until='networkidle')
    expect(page.get_by_role('button', name='Resume animations', exact=True)).to_be_visible()
    page.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });")
    page.reload(wait_until='networkidle')
    page.get_by_role('button', name='Explore the project').click()
    expect(page.locator('#demo-rounds')).to_have_text('0')
    page.get_by_role('button', name='Reset demo', exact=True).click()
    page.keyboard.press('Escape')

    assert not errors, errors
    assert not failed_responses, failed_responses
    context.close()

    # The actual portfolio content remains readable without JavaScript.
    no_js = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
    fallback = no_js.new_page()
    fallback.goto(BASE)
    expect(fallback.get_by_role('heading', level=1)).to_be_visible()
    expect(fallback.get_by_role('link', name='Download CV', exact=False).first).to_be_visible()
    expect(fallback.get_by_role('link', name='View Guardian source on GitHub')).to_be_visible()
    no_js.close()
    browser.close()
    print(json.dumps({'result': 'PASS', 'viewports': [1440, 1024, 768, 390, 360], 'page_errors': errors, 'failed_assets': failed_responses, 'screenshots': str(OUTPUT)}, indent=2))
