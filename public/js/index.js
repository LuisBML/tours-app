import { displayMap } from './mapbox.js';
import { login, logout } from './login.js';
import { register } from './register.js';
import { updateSettings } from './updateUserData.js';
import { bookTour } from './stripePayment.js';

// DOM ELEMENTS
const myMap = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const registerForm = document.querySelector('.form--register');
const logOutBtn = document.querySelector('a.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if (myMap) {
    const allLocations = JSON.parse(myMap.dataset.locations);
    displayMap(allLocations);
}

if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const userEmail = document.getElementById('email').value;
        const userPassword = document.getElementById('password').value;

        login(userEmail, userPassword);
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', e => {
        e.preventDefault();
        const userName = document.getElementById('name').value;
        const userEmail = document.getElementById('email').value;
        const userPassword = document.getElementById('password').value;
        const userPasswordConfirm = document.getElementById('passwordConfirm').value;

        register(userName, userEmail, userPassword, userPasswordConfirm);
    });
}

if (logOutBtn) {
    logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
    userDataForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save').textContent = 'Updating...';

        // when using multipart/form-data and an API
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);

        await updateSettings(form, 'data');

        document.querySelector('.btn--save').textContent = 'Save settings';

    });
}

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Updating...';

        const currentUserPassword = document.getElementById('password-current').value;
        const newUserPassword = document.getElementById('password').value;
        const confirmUserPassword = document.getElementById('password-confirm').value;

        await updateSettings({ currentPassword: currentUserPassword, newPassword: newUserPassword, passwordConfirm: confirmUserPassword }, 'password');

        document.querySelector('.btn--save-password').textContent = 'Save password';
    });
}

if (bookBtn) {
    bookBtn.addEventListener('click', async (e) => {
        try {
            e.target.textContent = 'Processing...';
            const id = e.target.dataset.tourId
            await bookTour(id);
            e.target.textContent = 'Booked';
        } catch (error) {
            e.target.textContent = 'Book tour now';
        }

    });
}

