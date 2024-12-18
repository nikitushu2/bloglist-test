const { test, expect, describe, beforeEach } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

describe('Blog app', () => {
    beforeEach(async ({ page, request }) => {
        await request.post('/api/testing/reset')
        await request.post('/api/users', {
            data: {
                name: 'Superuser',
                username: 'root',
                password: 'salainen'
            }
        })
        await page.goto('')
    })

    test('login form is shown', async ({ page }) => {

        await page.getByRole('button', { name: 'login' }).click();

        const locator = await page.getByText('Login', { exact: true })
        await expect(locator).toBeVisible()
    })

    describe('Login', () => {
        test('succeeds with correct credentials', async ({ page }) => {
            await loginWith(page, 'root', 'salainen')
            await expect(page.getByText('root logged-in')).toBeVisible()
        })

        test('fails with wrong credentials', async ({ page }) => {
            await page.getByRole('button', { name: 'login' }).click();

            await page.getByTestId('username').fill('test')
            await page.getByTestId('password').fill('test')
            await page.getByRole('button', { name: 'login' }).click()

            page.on('response', async (response) => {
                expect(response.status()).toBe(404)
            })
        })
    })

    describe('when logged in', () => {
        beforeEach(async ({ page }) => {
            await loginWith(page, 'root', 'salainen')
        })

        test('a new blog can be created', async ({ page }) => {
            await createBlog(page, 'test', 'test')
            await expect(page.getByText('test')).toBeVisible()
        })

        describe('and a blog exists', () => {
            beforeEach(async ({ page }) => {
                await createBlog(page, 'unique author', 'unique title')
                await createBlog(page, 'test', 'test')
            })

            test('likes can be increased', async ({ page }) => {
                const likes = await page.getByRole('button', { name: 'Like' }).all()
                await likes[likes.length - 1].click()
                const views = await page.getByRole('button', { name: 'View' }).all()
                await views[views.length - 1].click()
                await expect(page.getByText('1 likes')).toBeVisible()
            })

            test('blog can be deleted', async ({ page }) => {

                const views = await page.getByRole('button', { name: 'View' }).all()
                await views[views.length - 1].click()

                const remove = await page.getByRole('button', { name: 'Delete' })
                await remove.click()

                await expect(page.getByText('unique author')).toHaveCount(0)
            })

            test('blogs are ordered based on likes', async ({ page }) => {
                const likes = await page.getByRole('button', { name: 'Like' }).all()
                await likes[likes.length - 1].click()
                const views = await page.getByRole('button', { name: 'View' }).all()
                await views[views.length - 1].click()

                await page.reload()

                await views[0].click()

                const fullText1 = await page.getByText(/(\d+)\s+likes/).textContent()
                const likesHighest = Number(fullText1.match(/\d+\s+likes/)[0].match(/\d+/)[0])

                const hide1 = await page.getByRole('button', { name: 'Hide' })
                await hide1.click()

                await views[views.length - 1].click()
                const fullText2 = await page.getByText(/(\d+)\s+likes/).textContent()
                const likesLowest = Number(fullText2.match(/\d+\s+likes/)[0].match(/\d+/)[0])

                console.log(await page.content())

                expect(likesHighest).toBeGreaterThan(likesLowest)


            })

            describe('second user logs ins', () => {
                beforeEach(async ({ page, request }) => {
                    const logout = await page.getByRole('button', { name: 'Log out' })
                    await logout.click()

                    await request.post('/api/users', {
                        data: {
                            name: 'Superuser2',
                            username: 'root2',
                            password: 'salainen2'
                        }
                    })
                    await page.goto('')
                    await loginWith(page, 'root2', 'salainen2')
                })

                test('blog can not be deleted', async ({ page }) => {
                    /*const htmlContent = await page.content();
                    console.log(htmlContent);*/

                    const views = await page.getByRole('button', { name: 'View' }).all()
                    await views[views.length - 1].click()

                    await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0)
                })
            })
        })
    })
})