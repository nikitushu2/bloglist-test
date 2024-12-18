const loginWith = async (page, username, password) => {
    await page.getByRole('button', { name: 'login' }).click()
    await page.getByTestId('username').fill(username)
    await page.getByTestId('password').fill(password)
    await page.getByRole('button', { name: 'login' }).click()
    await page.waitForFunction(() => localStorage.getItem('loggedBlogappUser') !== null)
}

const createBlog = async (page, title, author) => {
    await page.getByRole('button', { name: 'create' }).click()
    await page.getByTestId('title').fill(title)
    await page.getByTestId('author').fill(author)
    await page.getByRole('button', { name: 'save' }).click()
    await page.getByText(title).waitFor();
}

export { loginWith, createBlog }