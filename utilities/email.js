// Uses: https://mailtrap.io/
// 'mailtrap.io' is a Email Delivery Platform. 

// You can use their Email Sandbox to inspect and debug emails 
// in staging, dev, and QA environments before sending them 
// to recipients in production.

const nodemailer = require('nodemailer');
const pug = require('pug');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Rust <${process.env.EMAIL_FROM}>`
    }

    createMailTransport() {
        if (process.env.NODE_ENV === 'production') {
            // sendgrid.com
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
        }

        // Create a transporter
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    // Send the actual email
    async send(template, subject) {
        // 1. Render HTML based on a pug template
        // __dirname: location of the script in execution
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`,
            {
                firstName: this.firstName,
                url: this.url,
                subject: subject,
            })

        // 2. Email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html: html,
        }

        // 3. Create a transporter and Send email
        await this.createMailTransport().sendMail(mailOptions);

    }

    async sendWelcome() {
        // welcome is a .pug template
        await this.send('welcome', 'Welcome to Tours')
    }

    async sendPasswordReset() {
        // passwordReset is a .pug template
        await this.send('passwordReset', 'Your password reset token (valid for 10 minutes)')
    }
}