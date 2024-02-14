import { expect } from '@playwright/test'

import { sidebarExplorer, sidebarSignin } from './common'
import { test } from './helpers'

test('editing messages in the chat input', async ({ page, sidebar }) => {
    await sidebarSignin(page, sidebar)

    await page.getByRole('button', { name: 'New Chat', exact: true }).click()

    const chatFrame = page.frameLocator('iframe.webview').last().frameLocator('iframe')
    const chatInput = chatFrame.getByRole('textbox', { name: 'Chat message' })

    // Test that Ctrl+Arrow jumps by a word.
    await chatInput.clear()
    await chatInput.type('One')
    await chatInput.press('Control+ArrowLeft')
    await chatInput.type('Two')
    await expect(chatInput).toHaveValue('TwoOne')

    // Test that Ctrl+Shift+Arrow highlights a word by trying to delete it.
    await chatInput.clear()
    await chatInput.type('One')
    await chatInput.press('Control+Shift+ArrowLeft')
    await chatInput.press('Delete')
    await expect(chatInput).toHaveValue('')

    // Chat input should have focused after sending a message.
    await expect(chatInput).toBeFocused()
})

test('chat input focus', async ({ page, sidebar }) => {
    await sidebarSignin(page, sidebar)
    // Open the buzz.ts file from the tree view,
    // and then submit a chat question from the command menu.
    await sidebarExplorer(page).click()
    await page.getByRole('treeitem', { name: 'buzz.ts' }).locator('a').dblclick()
    await page.getByRole('tab', { name: 'buzz.ts' }).hover()

    // Open a new chat panel before opening the file to make sure
    // the chat panel is right next to the document. This helps to save loading time
    // when we submit a question later as the question will be streamed to this panel
    // directly instead of opening a new one.
    await page.click('.badge[aria-label="Cody"]')
    await page.getByRole('button', { name: 'New Chat', exact: true }).hover()
    await page.getByRole('button', { name: 'New Chat', exact: true }).click()
    await page.click('.badge[aria-label="Cody"]')
    await page.getByRole('tab', { name: 'buzz.ts' }).dblclick()

    // Submit a new chat question from the command menu.
    await page.getByLabel(/Commands \(/).hover()
    await page.getByLabel(/Commands \(/).click()
    await page.getByRole('option', { name: 'New Chat' }).hover()
    // The 'delay' command is used to make sure the response is streamed 400ms after
    // the command is sent. This provides us with a small window to move the cursor
    // from the new opened chat window back to the editor, before the chat has finished
    // streaming its response.
    await page.keyboard.type('delay')
    await page.keyboard.press('Enter')

    // Make sure the chat input box does not steal focus from the editor when editor
    // is focused.
    const panel = page.frameLocator('iframe.webview').last().frameLocator('iframe')
    const chatInput = panel.getByRole('textbox', { name: 'Chat message' })
    await page.getByText("fizzbuzz.push('Buzz')").click()
    await expect(panel.getByText('Done')).not.toBeVisible()
    await chatInput.hover()
    // once the response is 'Done', check the input focus
    await expect(panel.getByText('Done')).toBeVisible()
    await expect(chatInput).not.toBeFocused()

    // Click on the chat input box to make sure it now has the focus, before submitting
    // a new chat question. The original focus area which is the chat input should still
    // have the focus after the response is received.
    await chatInput.click()
    await expect(chatInput).toBeFocused()
    await chatInput.type('Regular chat message', { delay: 10 })
    await chatInput.press('Enter')
    await expect(panel.getByText('hello from the assistant')).toBeVisible()
    await expect(chatInput).toBeFocused()
})
